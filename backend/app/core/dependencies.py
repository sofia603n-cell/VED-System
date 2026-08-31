from typing import List, Union, Callable
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.usuario import Usuario
from app.models.enums import RolUsuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    if not token:
        raise UnauthorizedException("Token de autenticación no proporcionado")
    
    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Token inválido o expirado")
    
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token no contiene información de usuario")
    
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise UnauthorizedException("Identificador de usuario inválido en token")

    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id_int).first()
    if not usuario:
        raise UnauthorizedException("Usuario no encontrado")
    
    if not usuario.activo or usuario.estado != "Activo":
        raise ForbiddenException("Usuario inactivo o suspendido")
    
    return usuario

def require_roles(allowed_roles: List[Union[RolUsuario, str]]) -> Callable:
    allowed_values = [r.value if isinstance(r, RolUsuario) else str(r) for r in allowed_roles]

    def role_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        user_role = current_user.rol.value if hasattr(current_user.rol, "value") else str(current_user.rol)
        if user_role not in allowed_values:
            roles_str = ", ".join(allowed_values)
            raise ForbiddenException(
                f"Acceso denegado. Se requiere uno de los siguientes roles: {roles_str}"
            )
        return current_user

    return role_checker
