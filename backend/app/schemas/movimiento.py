from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.enums import TipoMovimiento, MotivoMovimiento

class DetalleMovimientoCreate(BaseModel):
    id_producto: int
    cantidad: Decimal = Field(..., gt=0, description="Cantidad mayor a 0")

class DetalleMovimientoResponse(BaseModel):
    id_movimiento: int
    id_producto: int
    nombre_producto: Optional[str] = None
    cantidad: Decimal

    model_config = ConfigDict(from_attributes=True)

class MovimientoCreate(BaseModel):
    motivo: MotivoMovimiento
    tipo_movimiento: TipoMovimiento
    id_pedido: Optional[int] = None
    items: List[DetalleMovimientoCreate] = Field(..., min_length=1, description="Lista de productos en el movimiento")

class MovimientoResponse(BaseModel):
    id_movimiento: int
    motivo: MotivoMovimiento
    fecha_hora: datetime
    tipo_movimiento: TipoMovimiento
    id_usuario: int
    usuario_nombre: Optional[str] = None
    id_pedido: Optional[int] = None
    detalles: List[DetalleMovimientoResponse] = []

    model_config = ConfigDict(from_attributes=True)
