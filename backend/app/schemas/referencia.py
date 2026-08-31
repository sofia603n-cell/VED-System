from pydantic import BaseModel, ConfigDict, Field

class ReferenciaBase(BaseModel):
    nombre_referencia: str = Field(..., max_length=100, description="Nombre de la referencia")

class ReferenciaCreate(ReferenciaBase):
    pass

class ReferenciaUpdate(BaseModel):
    nombre_referencia: str = Field(..., max_length=100, description="Nuevo nombre de la referencia")

class ReferenciaResponse(ReferenciaBase):
    id_referencia: int

    model_config = ConfigDict(from_attributes=True)
