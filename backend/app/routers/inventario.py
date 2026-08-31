from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database.connection import get_db
from app.models.movimiento import Movimiento
from app.models.usuario import Usuario
from app.models.enums import TipoMovimiento, MotivoMovimiento, RolUsuario
from app.schemas.movimiento import MovimientoCreate, MovimientoResponse
from app.schemas.reportes import InventarioResumen
from app.services.inventario_service import (
    format_movimiento_response,
    create_movimiento_service
)
from app.services.reporte_service import get_inventario_resumen_service
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/inventario", tags=["Inventario y Movimientos"])

@router.get(
    "/movimientos",
    response_model=List[MovimientoResponse],
    summary="Consultar historial de movimientos de inventario"
)
def listar_movimientos(
    tipo_movimiento: Optional[TipoMovimiento] = None,
    motivo: Optional[MotivoMovimiento] = None,
    id_usuario: Optional[int] = None,
    id_pedido: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Movimiento)

    if tipo_movimiento:
        query = query.filter(Movimiento.tipo_movimiento == tipo_movimiento)
    if motivo:
        query = query.filter(Movimiento.motivo == motivo)
    if id_usuario:
        query = query.filter(Movimiento.id_usuario == id_usuario)
    if id_pedido:
        query = query.filter(Movimiento.id_pedido == id_pedido)
    if fecha_desde:
        query = query.filter(Movimiento.fecha_hora >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        query = query.filter(Movimiento.fecha_hora <= datetime.combine(fecha_hasta, datetime.max.time()))

    movimientos = query.order_by(Movimiento.fecha_hora.desc()).all()
    return [format_movimiento_response(m) for m in movimientos]

@router.get(
    "/movimientos/{id_movimiento}",
    response_model=MovimientoResponse,
    summary="Obtener detalle de un movimiento específico"
)
def obtener_movimiento(id_movimiento: int, db: Session = Depends(get_db)):
    movimiento = db.query(Movimiento).filter(Movimiento.id_movimiento == id_movimiento).first()
    if not movimiento:
        raise NotFoundException(f"Movimiento con id {id_movimiento} no encontrado")
    return format_movimiento_response(movimiento)

@router.post(
    "/movimientos",
    response_model=MovimientoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar movimiento manual de inventario (Producción, Reembolso, Daño, Defecto)"
)
def registrar_movimiento(
    data: MovimientoCreate,
    db: Session = Depends(get_db)
):
    # Usar el usuario responsable especificado o un admin por defecto
    usuario_defecto = db.query(Usuario).filter(Usuario.rol.in_([RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN])).first()
    usuario_id = usuario_defecto.id_usuario if usuario_defecto else 1
    return create_movimiento_service(db, data, usuario_id)

@router.get(
    "/resumen",
    response_model=InventarioResumen,
    summary="Obtener balance global de inventario y existencias"
)
def resumen_inventario(db: Session = Depends(get_db)):
    return get_inventario_resumen_service(db)
