from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database.connection import get_db
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.models.enums import EstadoPedido, TipoPago, EstadoPago, CanalPedido, RolUsuario
from app.schemas.pedido import (
    PedidoCreate,
    PedidoResponse,
    PedidoStatusUpdate,
    PedidoPagoUpdate
)
from app.services.pedido_service import (
    format_pedido_response,
    create_pedido_service,
    update_pedido_status_service,
    update_pedido_pago_service
)
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/pedidos", tags=["Pedidos y Ventas"])

@router.get("", response_model=List[PedidoResponse], summary="Listar pedidos con filtros avanzados")
def listar_pedidos(
    estado_pedido: Optional[EstadoPedido] = None,
    tipo_pago: Optional[TipoPago] = None,
    estado_pago: Optional[EstadoPago] = None,
    canal: Optional[CanalPedido] = None,
    id_cliente: Optional[int] = None,
    id_vendedor: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Pedido)

    if id_cliente:
        query = query.filter(Pedido.id_cliente == id_cliente)
    if id_vendedor:
        query = query.filter(Pedido.id_vendedor == id_vendedor)
    if estado_pedido:
        query = query.filter(Pedido.estado_pedido == estado_pedido)
    if tipo_pago:
        query = query.filter(Pedido.tipo_pago == tipo_pago)
    if estado_pago:
        query = query.filter(Pedido.estado_pago == estado_pago)
    if canal:
        query = query.filter(Pedido.canal == canal)
    if fecha_desde:
        query = query.filter(Pedido.fecha_registro >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Pedido.fecha_registro <= fecha_hasta)

    pedidos = query.order_by(Pedido.id_pedido.desc()).all()
    return [format_pedido_response(p) for p in pedidos]

@router.get("/{id_pedido}", response_model=PedidoResponse, summary="Obtener el detalle completo de un pedido")
def obtener_pedido(
    id_pedido: int,
    db: Session = Depends(get_db)
):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise NotFoundException(f"Pedido con id {id_pedido} no encontrado")

    return format_pedido_response(pedido)

@router.post(
    "",
    response_model=PedidoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo pedido con líneas de detalle"
)
def crear_pedido(
    data: PedidoCreate,
    db: Session = Depends(get_db)
):
    # Usar el primer vendedor/admin disponible si no se especifica
    vendedor_defecto = db.query(Usuario).filter(Usuario.rol.in_([RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN])).first()
    vendedor_id = vendedor_defecto.id_usuario if vendedor_defecto else 2
    return create_pedido_service(db, data, default_vendedor_id=vendedor_id)

@router.patch(
    "/{id_pedido}/estado",
    response_model=PedidoResponse,
    summary="Cambiar estado del pedido (dispara movimientos y descuento de stock)"
)
def actualizar_estado_pedido(
    id_pedido: int,
    data: PedidoStatusUpdate,
    db: Session = Depends(get_db)
):
    return update_pedido_status_service(db, id_pedido, data)

@router.patch(
    "/{id_pedido}/pago",
    response_model=PedidoResponse,
    summary="Actualizar estado o método de pago"
)
def actualizar_pago_pedido(
    id_pedido: int,
    data: PedidoPagoUpdate,
    db: Session = Depends(get_db)
):
    return update_pedido_pago_service(db, id_pedido, data)
