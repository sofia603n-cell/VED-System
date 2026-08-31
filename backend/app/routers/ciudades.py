from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DBAPIError
from typing import List
from app.database.connection import get_db
from app.models.ciudad import Ciudad
from app.schemas.ciudad import CiudadCreate, CiudadUpdate, CiudadResponse
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException

router = APIRouter(prefix="/ciudades", tags=["Ciudades"])

@router.get("", response_model=List[CiudadResponse], summary="Listar todas las ciudades")
def listar_ciudades(db: Session = Depends(get_db)):
    return db.query(Ciudad).order_by(Ciudad.nombre).all()

@router.get("/{id_ciudad}", response_model=CiudadResponse, summary="Obtener una ciudad por ID")
def obtener_ciudad(id_ciudad: int, db: Session = Depends(get_db)):
    ciudad = db.query(Ciudad).filter(Ciudad.id_ciudad == id_ciudad).first()
    if not ciudad:
        raise NotFoundException(f"Ciudad con id {id_ciudad} no encontrada")
    return ciudad

@router.post(
    "",
    response_model=CiudadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una ciudad"
)
def crear_ciudad(data: CiudadCreate, db: Session = Depends(get_db)):
    existente = db.query(Ciudad).filter(Ciudad.nombre.ilike(data.nombre.strip())).first()
    if existente:
        raise ConflictException(f"Ya existe una ciudad con el nombre '{data.nombre}'")
    
    nueva_ciudad = Ciudad(nombre=data.nombre.strip())
    db.add(nueva_ciudad)
    db.commit()
    db.refresh(nueva_ciudad)
    return nueva_ciudad

@router.put(
    "/{id_ciudad}",
    response_model=CiudadResponse,
    summary="Actualizar una ciudad"
)
def actualizar_ciudad(id_ciudad: int, data: CiudadUpdate, db: Session = Depends(get_db)):
    ciudad = db.query(Ciudad).filter(Ciudad.id_ciudad == id_ciudad).first()
    if not ciudad:
        raise NotFoundException(f"Ciudad con id {id_ciudad} no encontrada")
    
    duplicado = db.query(Ciudad).filter(
        Ciudad.nombre.ilike(data.nombre.strip()),
        Ciudad.id_ciudad != id_ciudad
    ).first()
    if duplicado:
        raise ConflictException(f"Ya existe otra ciudad con el nombre '{data.nombre}'")
    
    ciudad.nombre = data.nombre.strip()
    db.commit()
    db.refresh(ciudad)
    return ciudad

@router.delete(
    "/{id_ciudad}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar una ciudad"
)
def eliminar_ciudad(id_ciudad: int, db: Session = Depends(get_db)):
    ciudad = db.query(Ciudad).filter(Ciudad.id_ciudad == id_ciudad).first()
    if not ciudad:
        raise NotFoundException(f"Ciudad con id {id_ciudad} no encontrada")
    
    try:
        nombre_ciudad = ciudad.nombre
        db.delete(ciudad)
        db.commit()
        return {"mensaje": f"Ciudad '{nombre_ciudad}' (ID: {id_ciudad}) eliminada exitosamente de la base de datos"}
    except (IntegrityError, DBAPIError):
        db.rollback()
        raise BadRequestException(
            f"No se puede eliminar la ciudad '{ciudad.nombre}' porque está asignada a uno o más usuarios."
        )
