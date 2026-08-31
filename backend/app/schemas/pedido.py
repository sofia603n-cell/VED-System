from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.models.enums import EstadoPedido, TipoPago, EstadoPago, CanalPedido

class DetallePedidoCreate(BaseModel):
    id_producto: int
    cantidad: Decimal = Field(..., gt=0, description="Cantidad mayor a 0")
    precio_acordado: Decimal = Field(..., ge=0, description="Precio acordado mayor o igual a 0")
    alistamiento: Optional[int] = Field(0, ge=0)

class DetallePedidoResponse(BaseModel):
    id_pedido: int
    id_producto: int
    nombre_producto: Optional[str] = None
    cantidad: Decimal
    alistamiento: int
    precio_acordado: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)

class PedidoCreate(BaseModel):
    id_cliente: int
    id_vendedor: Optional[int] = None
    porcentaje: Decimal = Field(Decimal("0.00"), ge=0, le=100, description="Porcentaje de descuento (0 a 100)")
    estado_pedido: Optional[EstadoPedido] = EstadoPedido.PENDIENTE
    fecha_entrega: date
    tipo_pago: TipoPago
    estado_pago: EstadoPago
    canal: CanalPedido
    items: List[DetallePedidoCreate] = Field(..., min_length=1, description="Lista de productos del pedido")

class PedidoStatusUpdate(BaseModel):
    estado_pedido: EstadoPedido

class PedidoPagoUpdate(BaseModel):
    tipo_pago: Optional[TipoPago] = None
    estado_pago: EstadoPago

class PedidoResponse(BaseModel):
    id_pedido: int
    id_cliente: int
    cliente_nombre: Optional[str] = None
    id_vendedor: int
    vendedor_nombre: Optional[str] = None
    porcentaje: Decimal
    estado_pedido: EstadoPedido
    fecha_entrega: date
    fecha_registro: date
    tipo_pago: TipoPago
    estado_pago: EstadoPago
    canal: CanalPedido
    detalles: List[DetallePedidoResponse] = []
    subtotal: Decimal = Decimal("0.00")
    descuento: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)
