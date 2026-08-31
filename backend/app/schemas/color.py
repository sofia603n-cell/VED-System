from pydantic import BaseModel, ConfigDict, Field

class ColorBase(BaseModel):
    nombre: str = Field(..., max_length=100, description="Nombre del color")

class ColorCreate(ColorBase):
    pass

class ColorUpdate(BaseModel):
    nombre: str = Field(..., max_length=100, description="Nuevo nombre del color")

class ColorResponse(ColorBase):
    id_color: int

    model_config = ConfigDict(from_attributes=True)
