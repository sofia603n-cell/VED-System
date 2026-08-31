from app.schemas.auth import LoginRequest, TokenResponse, UserTokenInfo
from app.schemas.ciudad import CiudadBase, CiudadCreate, CiudadUpdate, CiudadResponse
from app.schemas.color import ColorBase, ColorCreate, ColorUpdate, ColorResponse
from app.schemas.referencia import ReferenciaBase, ReferenciaCreate, ReferenciaUpdate, ReferenciaResponse
from app.schemas.usuario import UsuarioBase, UsuarioCreate, UsuarioUpdate, UsuarioEstadoUpdate, UsuarioResponse
from app.schemas.producto import ProductoBase, ProductoCreate, ProductoUpdate, ProductoResponse
from app.schemas.pedido import (
    DetallePedidoCreate,
    DetallePedidoResponse,
    PedidoCreate,
    PedidoStatusUpdate,
    PedidoPagoUpdate,
    PedidoResponse,
)
from app.schemas.movimiento import (
    DetalleMovimientoCreate,
    DetalleMovimientoResponse,
    MovimientoCreate,
    MovimientoResponse,
)
from app.schemas.reportes import (
    DashboardResumen,
    VentasPorCanal,
    MovimientosPorUsuario,
    InventarioResumen,
    ProductoStockReporte,
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserTokenInfo",
    "CiudadBase",
    "CiudadCreate",
    "CiudadUpdate",
    "CiudadResponse",
    "ColorBase",
    "ColorCreate",
    "ColorUpdate",
    "ColorResponse",
    "ReferenciaBase",
    "ReferenciaCreate",
    "ReferenciaUpdate",
    "ReferenciaResponse",
    "UsuarioBase",
    "UsuarioCreate",
    "UsuarioUpdate",
    "UsuarioEstadoUpdate",
    "UsuarioResponse",
    "ProductoBase",
    "ProductoCreate",
    "ProductoUpdate",
    "ProductoResponse",
    "DetallePedidoCreate",
    "DetallePedidoResponse",
    "PedidoCreate",
    "PedidoStatusUpdate",
    "PedidoPagoUpdate",
    "PedidoResponse",
    "DetalleMovimientoCreate",
    "DetalleMovimientoResponse",
    "MovimientoCreate",
    "MovimientoResponse",
    "DashboardResumen",
    "VentasPorCanal",
    "MovimientosPorUsuario",
    "InventarioResumen",
    "ProductoStockReporte",
]
