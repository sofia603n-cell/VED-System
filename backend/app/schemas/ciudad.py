from pydantic import BaseModel, ConfigDict, Field

class CiudadBase(BaseModel):
    nombre: str = Field(..., max_length=100, description="Nombre de la ciudad")

class CiudadCreate(CiudadBase):
    pass

class CiudadUpdate(BaseModel):
    nombre: str = Field(..., max_length=100, description="Nuevo nombre de la ciudad")

class CiudadResponse(CiudadBase):
    id_ciudad: int

    model_config = ConfigDict(from_attributes=True)
