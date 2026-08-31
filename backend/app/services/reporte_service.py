from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import List
from app.models.pedido import Pedido, DetallePedido
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.models.movimiento import Movimiento, DetalleMovimiento
from app.models.enums import EstadoPedido, TipoMovimiento, MotivoMovimiento
from app.schemas.reportes import (
    DashboardResumen,
    VentasPorCanal,
    MovimientosPorUsuario,
    InventarioResumen,
    ProductoStockReporte,
)

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
    for p in pedidos:
        sub = sum((d.cantidad * d.precio_acordado for d in p.detalles), Decimal("0.00"))
        desc = sub * (Decimal(str(p.porcentaje)) / Decimal("100.0"))
        total_ventas_monto += (sub - desc)

    return DashboardResumen(
        total_pedidos=total_pedidos,
        pedidos_pendientes=pedidos_pendientes,
        pedidos_alistamiento=pedidos_alistamiento,
        pedidos_entregados=pedidos_entregados,
        total_ventas_monto=round(total_ventas_monto, 2),
        productos_bajo_stock=productos_bajo_stock,
        productos_sin_stock=productos_sin_stock,
        total_usuarios=total_usuarios,
        total_productos=total_productos
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
