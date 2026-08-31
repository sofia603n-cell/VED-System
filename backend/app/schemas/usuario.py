from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal
from app.models.enums import RolUsuario

class UsuarioBase(BaseModel):
    nombre_usuario: str = Field(..., max_length=100)
    apellidos_usuario: str = Field(..., max_length=150)
    usuario_login: str = Field(..., max_length=100)
    documento: str = Field(..., max_length=30)
    rol: RolUsuario
    correo: EmailStr = Field(..., max_length=150)
    telefono: Optional[str] = Field(None, max_length=30)
    direccion: Optional[str] = Field(None, max_length=255)
    id_ciudad: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=4, max_length=100)
    estado: Optional[Literal["Activo", "Inactivo"]] = "Activo"
    activo: Optional[bool] = True

class UsuarioUpdate(BaseModel):
    nombre_usuario: Optional[str] = Field(None, max_length=100)
    apellidos_usuario: Optional[str] = Field(None, max_length=150)
    usuario_login: Optional[str] = Field(None, max_length=100)
    documento: Optional[str] = Field(None, max_length=30)
    password: Optional[str] = Field(None, min_length=4, max_length=100)
    rol: Optional[RolUsuario] = None
    correo: Optional[EmailStr] = Field(None, max_length=150)
    telefono: Optional[str] = Field(None, max_length=30)
    direccion: Optional[str] = Field(None, max_length=255)
    id_ciudad: Optional[int] = None
    estado: Optional[Literal["Activo", "Inactivo"]] = None
    activo: Optional[bool] = None

class UsuarioEstadoUpdate(BaseModel):
    estado: Literal["Activo", "Inactivo"]
    activo: bool

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    estado: str
    activo: bool
    ciudad_nombre: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
