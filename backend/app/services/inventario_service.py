from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError
from typing import List
from app.models.movimiento import Movimiento, DetalleMovimiento
from app.models.producto import Producto
from app.models.enums import TipoMovimiento, MotivoMovimiento
from app.schemas.movimiento import MovimientoCreate, MovimientoResponse, DetalleMovimientoResponse
from app.schemas.reportes import InventarioResumen
from app.core.exceptions import NotFoundException, BadRequestException

def format_movimiento_response(movimiento: Movimiento) -> MovimientoResponse:
    detalles_resp: List[DetalleMovimientoResponse] = []
    for d in movimiento.detalles:
        detalles_resp.append(
            DetalleMovimientoResponse(
                id_movimiento=d.id_movimiento,
                id_producto=d.id_producto,
                nombre_producto=d.producto.nombre if d.producto else None,
                cantidad=d.cantidad
            )
        )

    usuario_nombre = (
        f"{movimiento.usuario.nombre_usuario} {movimiento.usuario.apellidos_usuario}"
        if movimiento.usuario else None
    )

    return MovimientoResponse(
        id_movimiento=movimiento.id_movimiento,
        motivo=movimiento.motivo,
        fecha_hora=movimiento.fecha_hora,
        tipo_movimiento=movimiento.tipo_movimiento,
        id_usuario=movimiento.id_usuario,
        usuario_nombre=usuario_nombre,
        id_pedido=movimiento.id_pedido,
        detalles=detalles_resp
    )

def create_movimiento_service(db: Session, data: MovimientoCreate, id_usuario: int) -> MovimientoResponse:
    for item in data.items:
        prod = db.query(Producto).filter(Producto.id_producto == item.id_producto).first()
        if not prod:
            raise NotFoundException(f"El producto con id {item.id_producto} no existe")

    # Reglas de negocio de la base de datos PostgreSQL:
    # 1. Si el motivo es Producción, Reembolso, Daño o Defecto, id_pedido DEBE ser NULL
    # 2. Si el motivo es Venta, debe ser salida y tener id_pedido válido
    motivo_val = data.motivo.value if hasattr(data.motivo, "value") else str(data.motivo)
    
    if motivo_val in ["Producción", "Daño", "Defecto", "Reembolso"] or not data.id_pedido or data.id_pedido <= 0:
        pedido_id_final = None
    else:
        pedido_id_final = data.id_pedido

    # Asignar tipo_movimiento coherente automáticamente
    if motivo_val in ["Producción", "Reembolso"]:
        tipo_mov_final = TipoMovimiento.ENTRADA
    else:
        tipo_mov_final = TipoMovimiento.SALIDA

    try:
        nuevo_movimiento = Movimiento(
            motivo=data.motivo,
            tipo_movimiento=tipo_mov_final,
            id_usuario=id_usuario,
            id_pedido=pedido_id_final
        )
        db.add(nuevo_movimiento)
        db.flush()

        for item in data.items:
            det = DetalleMovimiento(
                id_movimiento=nuevo_movimiento.id_movimiento,
                id_producto=item.id_producto,
                cantidad=item.cantidad
            )
            db.add(det)

        db.commit()
        db.refresh(nuevo_movimiento)
        return format_movimiento_response(nuevo_movimiento)

    except DBAPIError as e:
        db.rollback()
        # Limpiar mensaje de error de Postgres para que sea legible
        msg = str(e.orig) if hasattr(e, "orig") else str(e)
        if "CONTEXT:" in msg:
            msg = msg.split("CONTEXT:")[0].strip()
        raise BadRequestException(f"Error al registrar movimiento: {msg}")
    except Exception as e:
        db.rollback()
        raise BadRequestException(f"No se pudo registrar el movimiento: {str(e)}")
