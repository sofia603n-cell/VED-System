from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from decimal import Decimal
from app.models.enums import PresentacionProducto

class ProductoBase(BaseModel):
    nombre: str = Field(..., max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    id_color: int
    presentacion: PresentacionProducto
    precio: Decimal = Field(..., ge=0)
    stock_actual: int = Field(0, ge=0)
    stock_minimo: int = Field(0, ge=0)
    id_referencia: int

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    id_color: Optional[int] = None
    presentacion: Optional[PresentacionProducto] = None
    precio: Optional[Decimal] = Field(None, ge=0)
    stock_actual: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    id_referencia: Optional[int] = None

class ProductoResponse(ProductoBase):
    id_producto: int
    color_nombre: Optional[str] = None
    referencia_nombre: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
