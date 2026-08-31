from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.models.enums import rol_usuario_db

class Usuario(Base):
    __tablename__ = 'usuario'

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_usuario = Column(String(100), nullable=False)
    apellidos_usuario = Column(String(150), nullable=False)
    usuario_login = Column(String(100), unique=True, nullable=False, index=True)
    documento = Column(String(30), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    estado = Column(String(20), nullable=False, default='Activo')
    activo = Column(Boolean, nullable=False, default=True)
    rol = Column(rol_usuario_db, nullable=False)
    correo = Column(String(150), unique=True, nullable=False, index=True)
    telefono = Column(String(30), nullable=True)
    direccion = Column(String(255), nullable=True)
    id_ciudad = Column(Integer, ForeignKey('ciudad.id_ciudad', onupdate='CASCADE', ondelete='SET NULL'), nullable=True)

    ciudad = relationship('Ciudad', back_populates='usuarios')
    pedidos_cliente = relationship('Pedido', foreign_keys='[Pedido.id_cliente]', back_populates='cliente')
    pedidos_vendedor = relationship('Pedido', foreign_keys='[Pedido.id_vendedor]', back_populates='vendedor')
    movimientos = relationship('Movimiento', back_populates='usuario')
