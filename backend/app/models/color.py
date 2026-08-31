from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Color(Base):
    __tablename__ = 'color'

    id_color = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), unique=True, nullable=False)

    productos = relationship('Producto', back_populates='color')
