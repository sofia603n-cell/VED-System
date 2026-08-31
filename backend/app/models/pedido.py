from sqlalchemy import Column, Integer, Numeric, Date, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship
from datetime import date
from app.database.connection import Base
from app.models.enums import (
    estado_pedido_enum_db,
    tipo_pago_enum_db,
    estado_pago_enum_db,
    canal_pedido_enum_db
)

class Pedido(Base):
    __tablename__ = 'pedido'

    id_pedido = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey('usuario.id_usuario', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False, index=True)
    porcentaje = Column(Numeric(5, 2), nullable=False, default=0.00)
    estado_pedido = Column(estado_pedido_enum_db, nullable=False, default='Pendiente', index=True)
    fecha_entrega = Column(Date, nullable=False)
    fecha_registro = Column(Date, nullable=False, server_default=func.current_date(), default=date.today)
    id_vendedor = Column(Integer, ForeignKey('usuario.id_usuario', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False, index=True)
    tipo_pago = Column(tipo_pago_enum_db, nullable=False)
    estado_pago = Column(estado_pago_enum_db, nullable=False)
    canal = Column(canal_pedido_enum_db, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint('porcentaje >= 0 AND porcentaje <= 100', name='chk_pedido_porcentaje'),
    )

    cliente = relationship('Usuario', foreign_keys=[id_cliente], back_populates='pedidos_cliente')
    vendedor = relationship('Usuario', foreign_keys=[id_vendedor], back_populates='pedidos_vendedor')
    detalles = relationship('DetallePedido', back_populates='pedido', cascade='all, delete-orphan')
    movimientos = relationship('Movimiento', back_populates='pedido')


class DetallePedido(Base):
    __tablename__ = 'detalle_pedido'

    id_pedido = Column(Integer, ForeignKey('pedido.id_pedido', onupdate='CASCADE', ondelete='RESTRICT'), primary_key=True)
    id_producto = Column(Integer, ForeignKey('producto.id_producto', onupdate='CASCADE', ondelete='RESTRICT'), primary_key=True, index=True)
    cantidad = Column(Numeric(10, 2), nullable=False)
    alistamiento = Column(Integer, nullable=False, default=0)
    precio_acordado = Column(Numeric(12, 2), nullable=False)

    __table_args__ = (
        CheckConstraint('cantidad > 0', name='chk_detalle_pedido_cantidad'),
        CheckConstraint('alistamiento >= 0', name='chk_detalle_pedido_alistamiento'),
        CheckConstraint('precio_acordado >= 0', name='chk_detalle_pedido_precio'),
    )

    pedido = relationship('Pedido', back_populates='detalles')
    producto = relationship('Producto', back_populates='detalles_pedido')
