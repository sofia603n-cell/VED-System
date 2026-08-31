from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DBAPIError
from typing import List, Optional
from app.database.connection import get_db
from app.models.producto import Producto
from app.models.color import Color
from app.models.referencia import Referencia
from app.models.enums import PresentacionProducto
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/productos", tags=["Productos"])

def _map_producto_response(p: Producto) -> ProductoResponse:
    return ProductoResponse(
        id_producto=p.id_producto,
        nombre=p.nombre,
        descripcion=p.descripcion,
        id_color=p.id_color,
        presentacion=p.presentacion,
        precio=p.precio,
        stock_actual=p.stock_actual,
        stock_minimo=p.stock_minimo,
        id_referencia=p.id_referencia,
        color_nombre=p.color.nombre if p.color else None,
        referencia_nombre=p.referencia.nombre_referencia if p.referencia else None
    )

@router.get("", response_model=List[ProductoResponse], summary="Listar todos los productos con filtros")
def listar_productos(
    id_color: Optional[int] = None,
    id_referencia: Optional[int] = None,
    presentacion: Optional[PresentacionProducto] = None,
    solo_bajo_stock: Optional[bool] = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Producto)

    if id_color:
        query = query.filter(Producto.id_color == id_color)
    if id_referencia:
        query = query.filter(Producto.id_referencia == id_referencia)
    if presentacion:
        query = query.filter(Producto.presentacion == presentacion)
    if solo_bajo_stock:
        query = query.filter(Producto.stock_actual <= Producto.stock_minimo)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Producto.nombre.ilike(search_pattern)) |
            (Producto.descripcion.ilike(search_pattern))
        )

    productos = query.order_by(Producto.id_producto).all()
    return [_map_producto_response(p) for p in productos]

@router.get("/alertas/bajo-stock", response_model=List[ProductoResponse], summary="Alerta: productos con stock bajo o agotado")
def listar_productos_bajo_stock(db: Session = Depends(get_db)):
    productos = (
        db.query(Producto)
        .filter(Producto.stock_actual <= Producto.stock_minimo)
        .order_by(Producto.stock_actual.asc())
        .all()
    )
    return [_map_producto_response(p) for p in productos]

@router.get("/alertas/sin-stock", response_model=List[ProductoResponse], summary="Alerta: productos totalmente sin stock")
def listar_productos_sin_stock(db: Session = Depends(get_db)):
    productos = (
        db.query(Producto)
        .filter(Producto.stock_actual == 0)
        .order_by(Producto.id_producto)
        .all()
    )
    return [_map_producto_response(p) for p in productos]

@router.get("/{id_producto}", response_model=ProductoResponse, summary="Obtener producto por ID")
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise NotFoundException(f"Producto con id {id_producto} no encontrado")
    return _map_producto_response(producto)

@router.post(
    "",
    response_model=ProductoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo producto"
)
def crear_producto(data: ProductoCreate, db: Session = Depends(get_db)):
    if not db.query(Color).filter(Color.id_color == data.id_color).first():
        raise NotFoundException(f"Color con id {data.id_color} no existe")
    if not db.query(Referencia).filter(Referencia.id_referencia == data.id_referencia).first():
        raise NotFoundException(f"Referencia con id {data.id_referencia} no existe")

    nuevo_producto = Producto(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        id_color=data.id_color,
        presentacion=data.presentacion,
        precio=data.precio,
        stock_actual=data.stock_actual if data.stock_actual is not None else 0,
        stock_minimo=data.stock_minimo if data.stock_minimo is not None else 0,
        id_referencia=data.id_referencia
    )
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return _map_producto_response(nuevo_producto)

@router.put(
    "/{id_producto}",
    response_model=ProductoResponse,
    summary="Actualizar un producto"
)
def actualizar_producto(id_producto: int, data: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise NotFoundException(f"Producto con id {id_producto} no encontrado")

    if data.id_color is not None and data.id_color > 0:
        if not db.query(Color).filter(Color.id_color == data.id_color).first():
            raise NotFoundException(f"Color con id {data.id_color} no existe")
        producto.id_color = data.id_color

    if data.id_referencia is not None and data.id_referencia > 0:
        if not db.query(Referencia).filter(Referencia.id_referencia == data.id_referencia).first():
            raise NotFoundException(f"Referencia con id {data.id_referencia} no existe")
        producto.id_referencia = data.id_referencia

    if data.nombre is not None and data.nombre.strip() != "":
        producto.nombre = data.nombre.strip()
    if data.descripcion is not None:
        producto.descripcion = data.descripcion.strip() if data.descripcion.strip() != "" else None
    if data.presentacion is not None:
        producto.presentacion = data.presentacion
    if data.precio is not None and data.precio >= 0:
        producto.precio = data.precio
    if data.stock_actual is not None and data.stock_actual >= 0:
        producto.stock_actual = data.stock_actual
    if data.stock_minimo is not None and data.stock_minimo >= 0:
        producto.stock_minimo = data.stock_minimo

    db.commit()
    db.refresh(producto)
    return _map_producto_response(producto)

@router.delete(
    "/{id_producto}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar un producto"
)
def eliminar_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise NotFoundException(f"Producto con id {id_producto} no encontrado")

    try:
        nombre_prod = producto.nombre
        db.delete(producto)
        db.commit()
        return {"mensaje": f"Producto '{nombre_prod}' (ID: {id_producto}) eliminado exitosamente de la base de datos"}
    except (IntegrityError, DBAPIError):
        db.rollback()
        raise BadRequestException(
            f"No se puede eliminar el producto '{producto.nombre}' porque tiene pedidos o movimientos históricos en la base de datos."
        )
