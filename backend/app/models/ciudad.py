from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Ciudad(Base):
    __tablename__ = 'ciudad'

    id_ciudad = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), unique=True, nullable=False)

    usuarios = relationship('Usuario', back_populates='ciudad')
