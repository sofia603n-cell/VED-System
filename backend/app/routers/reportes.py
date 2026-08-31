from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.producto import Producto
from app.schemas.reportes import (
    DashboardResumen,
    VentasPorCanal,
    MovimientosPorUsuario,
    InventarioResumen,
    ProductoStockReporte,
)
from app.services.reporte_service import (
    get_dashboard_summary_service,
    get_ventas_por_canal_service,
    get_movimientos_por_usuario_service,
    get_inventario_resumen_service,
)

router = APIRouter(prefix="/reportes", tags=["Reportes y Estadísticas"])

@router.get(
    "/dashboard",
    response_model=DashboardResumen,
    summary="Resumen ejecutivo del dashboard"
)
def reporte_dashboard(db: Session = Depends(get_db)):
    return get_dashboard_summary_service(db)

@router.get(
    "/ventas-por-canal",
    response_model=List[VentasPorCanal],
    summary="Reporte de ventas agrupado por canal"
)
def reporte_ventas_por_canal(db: Session = Depends(get_db)):
    return get_ventas_por_canal_service(db)

@router.get(
    "/movimientos-por-usuario",
    response_model=List[MovimientosPorUsuario],
    summary="Reporte de actividad y movimientos por usuario"
)
def reporte_movimientos_por_usuario(db: Session = Depends(get_db)):
    return get_movimientos_por_usuario_service(db)

@router.get(
    "/inventario",
    response_model=InventarioResumen,
    summary="Reporte consolidado de inventario"
)
def reporte_inventario(db: Session = Depends(get_db)):
    return get_inventario_resumen_service(db)

@router.get(
    "/productos-bajo-stock",
    response_model=List[ProductoStockReporte],
    summary="Reporte detallado de productos con bajo stock"
)
def reporte_productos_bajo_stock(db: Session = Depends(get_db)):
    productos = (
        db.query(Producto)
        .filter(Producto.stock_actual <= Producto.stock_minimo)
        .order_by(Producto.stock_actual.asc())
        .all()
    )
    return [
        ProductoStockReporte(
            id_producto=p.id_producto,
            nombre=p.nombre,
            descripcion=p.descripcion,
            color=p.color.nombre if p.color else None,
            referencia=p.referencia.nombre_referencia if p.referencia else None,
            presentacion=p.presentacion.value if hasattr(p.presentacion, "value") else str(p.presentacion),
            precio=p.precio,
            stock_actual=p.stock_actual,
            stock_minimo=p.stock_minimo
        )
        for p in productos
    ]
