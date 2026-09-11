from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from collections import defaultdict
from typing import List
from app.models.pedido import Pedido, DetallePedido
from app.models.producto import Producto
from app.models.referencia import Referencia
from app.models.usuario import Usuario
from app.models.movimiento import Movimiento, DetalleMovimiento
from app.models.enums import EstadoPedido, TipoMovimiento, MotivoMovimiento
from app.schemas.reportes import (
    DashboardResumen,
    VentasPorCanal,
    MovimientosPorUsuario,
    InventarioResumen,
    ProductoStockReporte,
    BalancePeriodoFila,
    BalancePeriodoResumen,
)

def get_balance_periodo_service(db: Session, meses: int = 12) -> BalancePeriodoResumen:
    acumulados = defaultdict(lambda: {"valor": Decimal("0.00"), "pedidos": 0, "unidades": Decimal("0.00")})
    pedidos = db.query(Pedido).filter(Pedido.estado_pedido != EstadoPedido.CANCELADO).all()
    for pedido in pedidos:
        if not pedido.fecha_registro:
            continue
        subtotal = sum((detalle.cantidad * detalle.precio_acordado for detalle in pedido.detalles), Decimal("0.00"))
        total = subtotal - subtotal * (Decimal(str(pedido.porcentaje)) / Decimal("100"))
        periodo = pedido.fecha_registro.strftime("%Y-%m")
        acumulados[periodo]["valor"] += total
        acumulados[periodo]["pedidos"] += 1
        acumulados[periodo]["unidades"] += sum((detalle.cantidad for detalle in pedido.detalles), Decimal("0"))
    filas = [BalancePeriodoFila(periodo=periodo, valor_pedidos=round(datos["valor"], 2), cantidad_pedidos=datos["pedidos"], unidades=round(datos["unidades"], 2), ticket_promedio=round(datos["valor"] / max(1, datos["pedidos"]), 2)) for periodo, datos in sorted(acumulados.items())[-max(1, min(meses, 24)):]]
    total_valor = sum((fila.valor_pedidos for fila in filas), Decimal("0.00"))
    total_pedidos = sum(fila.cantidad_pedidos for fila in filas)
    total_unidades = sum((fila.unidades for fila in filas), Decimal("0.00"))
    return BalancePeriodoResumen(periodos=filas, total_valor=round(total_valor, 2), total_pedidos=total_pedidos, total_unidades=round(total_unidades, 2), ticket_promedio=round(total_valor / max(1, total_pedidos), 2), mejor_periodo=max(filas, key=lambda fila: fila.valor_pedidos).periodo if filas else None)

def get_dashboard_summary_service(db: Session) -> DashboardResumen:
    total_pedidos = db.query(Pedido).count()
    pedidos_pendientes = db.query(Pedido).filter(Pedido.estado_pedido == EstadoPedido.PENDIENTE).count()
    pedidos_alistamiento = db.query(Pedido).filter(Pedido.estado_pedido == EstadoPedido.ALISTAMIENTO).count()
    pedidos_entregados = db.query(Pedido).filter(Pedido.estado_pedido == EstadoPedido.ENTREGADO).count()

    total_usuarios = db.query(Usuario).count()
    total_productos = db.query(Producto).count()
    productos_bajo_stock = db.query(Producto).filter(Producto.stock_actual <= Producto.stock_minimo).count()
    productos_sin_stock = db.query(Producto).filter(Producto.stock_actual == 0).count()

    pedidos = db.query(Pedido).all()
    total_ventas_monto = Decimal("0.00")
    ventas_por_mes = defaultdict(Decimal)
    pedidos_por_mes = defaultdict(int)
    unidades_por_mes = defaultdict(Decimal)
    for p in pedidos:
        sub = sum((d.cantidad * d.precio_acordado for d in p.detalles), Decimal("0.00"))
        desc = sub * (Decimal(str(p.porcentaje)) / Decimal("100.0"))
        total_pedido = sub - desc
        total_ventas_monto += total_pedido
        if p.fecha_registro:
            periodo = p.fecha_registro.strftime("%Y-%m")
            ventas_por_mes[periodo] += total_pedido
            pedidos_por_mes[periodo] += 1
            unidades_por_mes[periodo] += sum((d.cantidad for d in p.detalles), Decimal("0"))

    nombres_meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    sales_series = [
        {
            "month": f"{nombres_meses[int(periodo.split('-')[1]) - 1]} {periodo[:4]}",
            "value": round(total, 2),
            "orders": pedidos_por_mes[periodo],
            "units": round(unidades_por_mes[periodo], 2),
        }
        for periodo, total in sorted(ventas_por_mes.items())[-12:]
    ]

    best_seller_rows = (
        db.query(
            Producto.id_producto,
            Producto.nombre,
            Referencia.nombre_referencia,
            func.coalesce(func.sum(DetallePedido.cantidad), 0).label("units"),
            func.coalesce(func.sum(DetallePedido.cantidad * DetallePedido.precio_acordado), 0).label("revenue"),
        )
        .join(DetallePedido, Producto.id_producto == DetallePedido.id_producto)
        .join(Referencia, Producto.id_referencia == Referencia.id_referencia)
        .group_by(Producto.id_producto, Producto.nombre, Referencia.nombre_referencia)
        .order_by(func.sum(DetallePedido.cantidad).desc())
        .limit(5)
        .all()
    )
    best_sellers = [
        {
            "name": row.nombre,
            "sku": f"VEL-{row.id_producto}",
            "category": row.nombre_referencia,
            "units": row.units,
            "revenue": row.revenue,
        }
        for row in best_seller_rows
    ]

    category_rows = (
        db.query(Producto.id_referencia, func.coalesce(func.sum(DetallePedido.cantidad), 0).label("units"))
        .outerjoin(DetallePedido, Producto.id_producto == DetallePedido.id_producto)
        .group_by(Producto.id_referencia)
        .order_by(func.coalesce(func.sum(DetallePedido.cantidad), 0).desc())
        .all()
    )
    category_names = dict(db.query(Referencia.id_referencia, Referencia.nombre_referencia).all())
    total_category_units = sum((row.units for row in category_rows), Decimal("0"))
    category_share = [
        {
            "label": category_names.get(row.id_referencia, "General"),
            "percent": round(float(row.units / total_category_units * 100)) if total_category_units else 0,
            "color": ["#d4af37", "#3a86ff", "#e07a5f", "#4caf50", "#8f7b50"][index % 5],
            "units": row.units,
        }
        for index, row in enumerate(category_rows[:5])
    ]

    return DashboardResumen(
        total_pedidos=total_pedidos,
        pedidos_pendientes=pedidos_pendientes,
        pedidos_alistamiento=pedidos_alistamiento,
        pedidos_entregados=pedidos_entregados,
        total_ventas_monto=round(total_ventas_monto, 2),
        productos_bajo_stock=productos_bajo_stock,
        productos_sin_stock=productos_sin_stock,
        total_usuarios=total_usuarios,
        total_productos=total_productos,
        sales_series=sales_series,
        category_share=category_share,
        best_sellers=best_sellers,
    )

def get_ventas_por_canal_service(db: Session) -> List[VentasPorCanal]:
    canales = ["persona", "facebook", "whatsapp"]
    resultados: List[VentasPorCanal] = []

    for canal_nombre in canales:
        pedidos = db.query(Pedido).filter(Pedido.canal == canal_nombre).all()
        cant_pedidos = len(pedidos)
        
        cant_ventas_mov = db.query(Movimiento).join(Pedido, Movimiento.id_pedido == Pedido.id_pedido).filter(
            Pedido.canal == canal_nombre,
            Movimiento.motivo == MotivoMovimiento.VENTA
        ).count()

        total_canal = Decimal("0.00")
        for p in pedidos:
            sub = sum((d.cantidad * d.precio_acordado for d in p.detalles), Decimal("0.00"))
            desc = sub * (Decimal(str(p.porcentaje)) / Decimal("100.0"))
            total_canal += (sub - desc)

        resultados.append(
            VentasPorCanal(
                canal=canal_nombre,
                cantidad_pedidos=cant_pedidos,
                cantidad_ventas=cant_ventas_mov,
                total_ventas=round(total_canal, 2)
            )
        )

    return resultados

def get_movimientos_por_usuario_service(db: Session) -> List[MovimientosPorUsuario]:
    query = (
        db.query(
            Usuario.id_usuario,
            Usuario.nombre_usuario,
            Usuario.apellidos_usuario,
            func.count(Movimiento.id_movimiento).label("cantidad")
        )
        .outerjoin(Movimiento, Usuario.id_usuario == Movimiento.id_usuario)
        .group_by(Usuario.id_usuario, Usuario.nombre_usuario, Usuario.apellidos_usuario)
        .order_by(func.count(Movimiento.id_movimiento).desc())
        .all()
    )

    return [
        MovimientosPorUsuario(
            id_usuario=row[0],
            usuario_nombre=f"{row[1]} {row[2]}",
            cantidad_movimientos=row[3]
        )
        for row in query
    ]

def get_inventario_resumen_service(db: Session) -> InventarioResumen:
    total_ingresado = (
        db.query(func.coalesce(func.sum(DetalleMovimiento.cantidad), Decimal("0.00")))
        .join(Movimiento, DetalleMovimiento.id_movimiento == Movimiento.id_movimiento)
        .filter(Movimiento.tipo_movimiento == TipoMovimiento.ENTRADA)
        .scalar()
    ) or Decimal("0.00")

    total_retirado = (
        db.query(func.coalesce(func.sum(DetalleMovimiento.cantidad), Decimal("0.00")))
        .join(Movimiento, DetalleMovimiento.id_movimiento == Movimiento.id_movimiento)
        .filter(Movimiento.tipo_movimiento == TipoMovimiento.SALIDA)
        .scalar()
    ) or Decimal("0.00")

    total_vendido = (
        db.query(func.coalesce(func.sum(DetalleMovimiento.cantidad), Decimal("0.00")))
        .join(Movimiento, DetalleMovimiento.id_movimiento == Movimiento.id_movimiento)
        .filter(Movimiento.motivo == MotivoMovimiento.VENTA)
        .scalar()
    ) or Decimal("0.00")

    stock_total_actual = (
        db.query(func.coalesce(func.sum(Producto.stock_actual), 0))
        .scalar()
    ) or 0

    return InventarioResumen(
        total_ingresado=round(Decimal(str(total_ingresado)), 2),
        total_retirado=round(Decimal(str(total_retirado)), 2),
        total_vendido=round(Decimal(str(total_vendido)), 2),
        stock_total_actual=int(stock_total_actual)
    )
