from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DBAPIError
from typing import List
from app.database.connection import get_db
from app.models.referencia import Referencia
from app.schemas.referencia import ReferenciaCreate, ReferenciaUpdate, ReferenciaResponse
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException

router = APIRouter(prefix="/referencias", tags=["Referencias"])

@router.get("", response_model=List[ReferenciaResponse], summary="Listar todas las referencias")
def listar_referencias(db: Session = Depends(get_db)):
    return db.query(Referencia).order_by(Referencia.nombre_referencia).all()

@router.get("/{id_referencia}", response_model=ReferenciaResponse, summary="Obtener una referencia por ID")
def obtener_referencia(id_referencia: int, db: Session = Depends(get_db)):
    referencia = db.query(Referencia).filter(Referencia.id_referencia == id_referencia).first()
    if not referencia:
        raise NotFoundException(f"Referencia con id {id_referencia} no encontrada")
    return referencia

@router.post(
    "",
    response_model=ReferenciaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una referencia"
)
def crear_referencia(data: ReferenciaCreate, db: Session = Depends(get_db)):
    existente = db.query(Referencia).filter(Referencia.nombre_referencia.ilike(data.nombre_referencia.strip())).first()
    if existente:
        raise ConflictException(f"Ya existe una referencia con el nombre '{data.nombre_referencia}'")
    
    nueva_referencia = Referencia(nombre_referencia=data.nombre_referencia.strip())
    db.add(nueva_referencia)
    db.commit()
    db.refresh(nueva_referencia)
    return nueva_referencia

@router.put(
    "/{id_referencia}",
    response_model=ReferenciaResponse,
    summary="Actualizar una referencia"
)
def actualizar_referencia(id_referencia: int, data: ReferenciaUpdate, db: Session = Depends(get_db)):
    referencia = db.query(Referencia).filter(Referencia.id_referencia == id_referencia).first()
    if not referencia:
        raise NotFoundException(f"Referencia con id {id_referencia} no encontrada")
    
    duplicado = db.query(Referencia).filter(
        Referencia.nombre_referencia.ilike(data.nombre_referencia.strip()),
        Referencia.id_referencia != id_referencia
    ).first()
    if duplicado:
        raise ConflictException(f"Ya existe otra referencia con el nombre '{data.nombre_referencia}'")
    
    referencia.nombre_referencia = data.nombre_referencia.strip()
    db.commit()
    db.refresh(referencia)
    return referencia

@router.delete(
    "/{id_referencia}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar una referencia"
)
def eliminar_referencia(id_referencia: int, db: Session = Depends(get_db)):
    referencia = db.query(Referencia).filter(Referencia.id_referencia == id_referencia).first()
    if not referencia:
        raise NotFoundException(f"Referencia con id {id_referencia} no encontrada")
    
    try:
        nombre_ref = referencia.nombre_referencia
        db.delete(referencia)
        db.commit()
        return {"mensaje": f"Referencia '{nombre_ref}' (ID: {id_referencia}) eliminada exitosamente de la base de datos"}
    except (IntegrityError, DBAPIError):
        db.rollback()
        raise BadRequestException(
            f"No se puede eliminar la referencia '{referencia.nombre_referencia}' porque está asignada a uno o más productos en el inventario. Debes reasignar o eliminar esos productos primero."
        )
