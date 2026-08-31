from sqlalchemy.orm import Session
from typing import Optional
from app.models.usuario import Usuario
from app.schemas.auth import TokenResponse, UserTokenInfo
from app.core.security import verify_password, create_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException

def authenticate_user(db: Session, login: str, password: str) -> Usuario:
    usuario = db.query(Usuario).filter(
        (Usuario.usuario_login == login) | (Usuario.correo == login)
    ).first()
    
    if not usuario:
        raise UnauthorizedException("Usuario o contraseña incorrectos")
    
    if not verify_password(password, usuario.password):
        raise UnauthorizedException("Usuario o contraseña incorrectos")
    
    if not usuario.activo or usuario.estado != "Activo":
        raise ForbiddenException("La cuenta de usuario se encuentra inactiva")
    
    return usuario

def create_user_token_response(usuario: Usuario) -> TokenResponse:
    role_val = usuario.rol.value if hasattr(usuario.rol, "value") else str(usuario.rol)
    access_token = create_access_token(
        subject=usuario.id_usuario,
        role=role_val
    )
    
    user_info = UserTokenInfo(
        id_usuario=usuario.id_usuario,
        nombre_completo=f"{usuario.nombre_usuario} {usuario.apellidos_usuario}",
        usuario_login=usuario.usuario_login,
        correo=usuario.correo,
        rol=usuario.rol
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_info
    )
