from pydantic import BaseModel, Field
from typing import Optional
from app.models.enums import RolUsuario

class LoginRequest(BaseModel):
    usuario_login: str = Field(..., description="Nombre de usuario o login")
    password: str = Field(..., description="Contraseña de acceso")

class UserTokenInfo(BaseModel):
    id_usuario: int
    nombre_completo: str
    usuario_login: str
    correo: str
    rol: RolUsuario

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserTokenInfo
