from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError, OperationalError, DBAPIError
from app.config import settings
from app.routers import (
    auth_router,
    ciudades_router,
    colores_router,
    referencias_router,
    usuarios_router,
    productos_router,
    pedidos_router,
    inventario_router,
    reportes_router,
)

app = FastAPI(
    title="Sistema de Gestión de Inventario y Ventas - Velas Estrella de David",
    description="""
    Backend API para la administración de productos, existencias en inventario, 
    registro de pedidos/ventas, usuarios con control de roles y reportería estratégica 
    para la empresa Velas Estrella de David.
    """,
    version="1.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejadores globales para errores de conexión a la Base de Datos
@app.exception_handler(OperationalError)
@app.exception_handler(DBAPIError)
@app.exception_handler(UnicodeDecodeError)
async def db_connection_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": (
                "Error de conexión con la base de datos PostgreSQL. "
                "Verifica que el servicio de PostgreSQL esté iniciado y que la variable "
                "DATABASE_URL en 'backend/.env' contenga la contraseña y nombre de base de datos correctos."
            ),
            "error_type": type(exc).__name__
        }
    )

# Registro de Rutas
app.include_router(auth_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(ciudades_router, prefix="/api")
app.include_router(colores_router, prefix="/api")
app.include_router(referencias_router, prefix="/api")
app.include_router(productos_router, prefix="/api")
app.include_router(pedidos_router, prefix="/api")
app.include_router(inventario_router, prefix="/api")
app.include_router(reportes_router, prefix="/api")

@app.get("/", tags=["General"], summary="Ruta principal")
def root():
    return {
        "sistema": "Sistema de Gestión de Inventario y Ventas - Velas Estrella de David",
        "version": "1.0.0",
        "estado": "En línea",
        "documentacion": "/docs"
    }

@app.get("/health", tags=["General"], summary="Verificación de salud")
def health_check():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
