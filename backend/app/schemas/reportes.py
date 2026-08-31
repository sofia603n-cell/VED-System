from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from decimal import Decimal

class DashboardResumen(BaseModel):
    total_pedidos: int
    pedidos_pendientes: int
    pedidos_alistamiento: int
    pedidos_entregados: int
    total_ventas_monto: Decimal
    productos_bajo_stock: int
    productos_sin_stock: int
    total_usuarios: int
    total_productos: int

class VentasPorCanal(BaseModel):
    canal: str
    cantidad_pedidos: int
    cantidad_ventas: int
    total_ventas: Decimal

class MovimientosPorUsuario(BaseModel):
    id_usuario: int
    usuario_nombre: str
    cantidad_movimientos: int

class InventarioResumen(BaseModel):
    total_ingresado: Decimal
    total_retirado: Decimal
    total_vendido: Decimal
    stock_total_actual: int

class ProductoStockReporte(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None
    color: Optional[str] = None
    referencia: Optional[str] = None
    presentacion: str
    precio: Decimal
    stock_actual: int
    stock_minimo: int

    model_config = ConfigDict(from_attributes=True)
