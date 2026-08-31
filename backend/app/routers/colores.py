from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DBAPIError
from typing import List
from app.database.connection import get_db
from app.models.color import Color
from app.schemas.color import ColorCreate, ColorUpdate, ColorResponse
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException

router = APIRouter(prefix="/colores", tags=["Colores"])

@router.get("", response_model=List[ColorResponse], summary="Listar todos los colores")
def listar_colores(db: Session = Depends(get_db)):
    return db.query(Color).order_by(Color.nombre).all()

@router.get("/{id_color}", response_model=ColorResponse, summary="Obtener un color por ID")
def obtener_color(id_color: int, db: Session = Depends(get_db)):
    color = db.query(Color).filter(Color.id_color == id_color).first()
    if not color:
        raise NotFoundException(f"Color con id {id_color} no encontrado")
    return color

@router.post(
    "",
    response_model=ColorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un color"
)
def crear_color(data: ColorCreate, db: Session = Depends(get_db)):
    existente = db.query(Color).filter(Color.nombre.ilike(data.nombre.strip())).first()
    if existente:
        raise ConflictException(f"Ya existe un color con el nombre '{data.nombre}'")
    
    nuevo_color = Color(nombre=data.nombre.strip())
    db.add(nuevo_color)
    db.commit()
    db.refresh(nuevo_color)
    return nuevo_color

@router.put(
    "/{id_color}",
    response_model=ColorResponse,
    summary="Actualizar un color"
)
def actualizar_color(id_color: int, data: ColorUpdate, db: Session = Depends(get_db)):
    color = db.query(Color).filter(Color.id_color == id_color).first()
    if not color:
        raise NotFoundException(f"Color con id {id_color} no encontrado")
    
    duplicado = db.query(Color).filter(
        Color.nombre.ilike(data.nombre.strip()),
        Color.id_color != id_color
    ).first()
    if duplicado:
        raise ConflictException(f"Ya existe otro color con el nombre '{data.nombre}'")
    
    color.nombre = data.nombre.strip()
    db.commit()
    db.refresh(color)
    return color

@router.delete(
    "/{id_color}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar un color"
)
def eliminar_color(id_color: int, db: Session = Depends(get_db)):
    color = db.query(Color).filter(Color.id_color == id_color).first()
    if not color:
        raise NotFoundException(f"Color con id {id_color} no encontrado")
    
    try:
        nombre_color = color.nombre
        db.delete(color)
        db.commit()
        return {"mensaje": f"Color '{nombre_color}' (ID: {id_color}) eliminado exitosamente de la base de datos"}
    except (IntegrityError, DBAPIError):
        db.rollback()
        raise BadRequestException(
            f"No se puede eliminar el color '{color.nombre}' porque está asignado a uno o más productos en el inventario. Debes reasignar o eliminar esos productos primero."
        )
