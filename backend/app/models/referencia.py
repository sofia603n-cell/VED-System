from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Referencia(Base):
    __tablename__ = 'referencia'

    id_referencia = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_referencia = Column(String(100), unique=True, nullable=False)

    productos = relationship('Producto', back_populates='referencia')
