from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError
from decimal import Decimal
from typing import List
from app.models.pedido import Pedido, DetallePedido
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.models.enums import RolUsuario, EstadoPedido
from app.schemas.pedido import PedidoCreate, PedidoResponse, DetallePedidoResponse, PedidoStatusUpdate, PedidoPagoUpdate
from app.core.exceptions import NotFoundException, BadRequestException

def format_pedido_response(pedido: Pedido) -> PedidoResponse:
    detalles_resp: List[DetallePedidoResponse] = []
    subtotal_acumulado = Decimal("0.00")

    for d in pedido.detalles:
        sub_item = Decimal(str(d.cantidad)) * Decimal(str(d.precio_acordado))
        subtotal_acumulado += sub_item
        detalles_resp.append(
            DetallePedidoResponse(
                id_pedido=d.id_pedido,
                id_producto=d.id_producto,
                nombre_producto=d.producto.nombre if d.producto else None,
                cantidad=d.cantidad,
                alistamiento=d.alistamiento,
                precio_acordado=d.precio_acordado,
                subtotal=round(sub_item, 2)
            )
        )

    porcentaje_val = Decimal(str(pedido.porcentaje))
    descuento_val = round(subtotal_acumulado * (porcentaje_val / Decimal("100.0")), 2)
    total_val = round(subtotal_acumulado - descuento_val, 2)

    cliente_nombre = f"{pedido.cliente.nombre_usuario} {pedido.cliente.apellidos_usuario}" if pedido.cliente else None
    vendedor_nombre = f"{pedido.vendedor.nombre_usuario} {pedido.vendedor.apellidos_usuario}" if pedido.vendedor else None

    return PedidoResponse(
        id_pedido=pedido.id_pedido,
        id_cliente=pedido.id_cliente,
        cliente_nombre=cliente_nombre,
        id_vendedor=pedido.id_vendedor,
        vendedor_nombre=vendedor_nombre,
        porcentaje=pedido.porcentaje,
        estado_pedido=pedido.estado_pedido,
        fecha_entrega=pedido.fecha_entrega,
        fecha_registro=pedido.fecha_registro,
        tipo_pago=pedido.tipo_pago,
        estado_pago=pedido.estado_pago,
        canal=pedido.canal,
        detalles=detalles_resp,
        subtotal=round(subtotal_acumulado, 2),
        descuento=descuento_val,
        total=total_val
    )

def create_pedido_service(db: Session, data: PedidoCreate, default_vendedor_id: int) -> PedidoResponse:
    cliente = db.query(Usuario).filter(Usuario.id_usuario == data.id_cliente).first()
    if not cliente:
        raise NotFoundException(f"El cliente con id {data.id_cliente} no existe")
    
    rol_cliente = cliente.rol.value if hasattr(cliente.rol, "value") else str(cliente.rol)
    if rol_cliente != RolUsuario.CLIENTE.value:
        raise BadRequestException(f"El usuario con id {data.id_cliente} no tiene el rol de cliente")

    vendedor_id = data.id_vendedor if data.id_vendedor is not None else default_vendedor_id
    vendedor = db.query(Usuario).filter(Usuario.id_usuario == vendedor_id).first()
    if not vendedor:
        raise NotFoundException(f"El vendedor con id {vendedor_id} no existe")
    
    rol_vendedor = vendedor.rol.value if hasattr(vendedor.rol, "value") else str(vendedor.rol)
    if rol_vendedor not in [RolUsuario.ADMIN.value, RolUsuario.SUPER_ADMIN.value]:
        raise BadRequestException(f"El usuario con id {vendedor_id} no tiene rol administrativo de vendedor")

    for item in data.items:
        prod = db.query(Producto).filter(Producto.id_producto == item.id_producto).first()
        if not prod:
            raise NotFoundException(f"El producto con id {item.id_producto} no existe")

    try:
        nuevo_pedido = Pedido(
            id_cliente=data.id_cliente,
            id_vendedor=vendedor_id,
            porcentaje=data.porcentaje,
            estado_pedido=data.estado_pedido or EstadoPedido.PENDIENTE,
            fecha_entrega=data.fecha_entrega,
            tipo_pago=data.tipo_pago,
            estado_pago=data.estado_pago,
            canal=data.canal
        )
        db.add(nuevo_pedido)
        db.flush()

        for item in data.items:
            det = DetallePedido(
                id_pedido=nuevo_pedido.id_pedido,
                id_producto=item.id_producto,
                cantidad=item.cantidad,
                alistamiento=item.alistamiento or 0,
                precio_acordado=item.precio_acordado
            )
            db.add(det)

        db.commit()
        db.refresh(nuevo_pedido)
        return format_pedido_response(nuevo_pedido)

    except DBAPIError as e:
        db.rollback()
        raise BadRequestException(f"Error en base de datos al registrar pedido: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise BadRequestException(f"No se pudo procesar el pedido: {str(e)}")

def update_pedido_status_service(db: Session, id_pedido: int, data: PedidoStatusUpdate) -> PedidoResponse:
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise NotFoundException(f"Pedido con id {id_pedido} no encontrado")

    try:
        pedido.estado_pedido = data.estado_pedido
        db.commit()
        db.refresh(pedido)
        return format_pedido_response(pedido)
    except DBAPIError as e:
        db.rollback()
        raise BadRequestException(f"Error al cambiar estado del pedido: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise BadRequestException(f"No se pudo actualizar el estado: {str(e)}")

def update_pedido_pago_service(db: Session, id_pedido: int, data: PedidoPagoUpdate) -> PedidoResponse:
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise NotFoundException(f"Pedido con id {id_pedido} no encontrado")

    if data.tipo_pago is not None:
        pedido.tipo_pago = data.tipo_pago
    pedido.estado_pago = data.estado_pago

    try:
        db.commit()
        db.refresh(pedido)
        return format_pedido_response(pedido)
    except Exception as e:
        db.rollback()
        raise BadRequestException(f"No se pudo actualizar el pago: {str(e)}")
