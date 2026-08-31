from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base
from app.models.enums import tipo_movimiento_enum_db, motivo_movimiento_enum_db

class Movimiento(Base):
    __tablename__ = 'movimiento'

    id_movimiento = Column(Integer, primary_key=True, index=True, autoincrement=True)
    motivo = Column(motivo_movimiento_enum_db, nullable=False)
    fecha_hora = Column(DateTime, nullable=False, server_default=func.current_timestamp(), default=datetime.utcnow, index=True)
    tipo_movimiento = Column(tipo_movimiento_enum_db, nullable=False)
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False, index=True)
    id_pedido = Column(Integer, ForeignKey('pedido.id_pedido', onupdate='CASCADE', ondelete='RESTRICT'), nullable=True, index=True)

    usuario = relationship('Usuario', back_populates='movimientos')
    pedido = relationship('Pedido', back_populates='movimientos')
    detalles = relationship('DetalleMovimiento', back_populates='movimiento', cascade='all, delete-orphan')


class DetalleMovimiento(Base):
    __tablename__ = 'detalle_movimiento'

    id_movimiento = Column(Integer, ForeignKey('movimiento.id_movimiento', onupdate='CASCADE', ondelete='RESTRICT'), primary_key=True)
    id_producto = Column(Integer, ForeignKey('producto.id_producto', onupdate='CASCADE', ondelete='RESTRICT'), primary_key=True, index=True)
    cantidad = Column(Numeric(10, 2), nullable=False)

    __table_args__ = (
        CheckConstraint('cantidad > 0', name='chk_detalle_movimiento_cantidad'),
    )

    movimiento = relationship('Movimiento', back_populates='detalles')
    producto = relationship('Producto', back_populates='detalles_movimiento')
