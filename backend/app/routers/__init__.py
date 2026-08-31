from app.routers.auth import router as auth_router
from app.routers.ciudades import router as ciudades_router
from app.routers.colores import router as colores_router
from app.routers.referencias import router as referencias_router
from app.routers.usuarios import router as usuarios_router
from app.routers.productos import router as productos_router
from app.routers.pedidos import router as pedidos_router
from app.routers.inventario import router as inventario_router
from app.routers.reportes import router as reportes_router

__all__ = [
    "auth_router",
    "ciudades_router",
    "colores_router",
    "referencias_router",
    "usuarios_router",
    "productos_router",
    "pedidos_router",
    "inventario_router",
    "reportes_router",
]
