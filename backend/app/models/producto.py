from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.models.enums import presentacion_producto_db

class Producto(Base):
    __tablename__ = 'producto'

    id_producto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    descripcion = Column(String(255), nullable=True)
    id_color = Column(Integer, ForeignKey('color.id_color', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False)
    presentacion = Column(presentacion_producto_db, nullable=False)
    precio = Column(Numeric(12, 2), nullable=False)
    stock_actual = Column(Integer, nullable=False, default=0)
    stock_minimo = Column(Integer, nullable=False, default=0)
    id_referencia = Column(Integer, ForeignKey('referencia.id_referencia', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False)
    nombre = Column(String(150), nullable=False)

    __table_args__ = (
        CheckConstraint('precio >= 0', name='chk_producto_precio'),
        CheckConstraint('stock_actual >= 0', name='chk_producto_stock_actual'),
        CheckConstraint('stock_minimo >= 0', name='chk_producto_stock_minimo'),
    )

    color = relationship('Color', back_populates='productos')
    referencia = relationship('Referencia', back_populates='productos')
    detalles_pedido = relationship('DetallePedido', back_populates='producto')
    detalles_movimiento = relationship('DetalleMovimiento', back_populates='producto')
