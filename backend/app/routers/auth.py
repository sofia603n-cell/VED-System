from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserTokenInfo
from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.services.auth_service import authenticate_user, create_user_token_response
from app.core.security import get_password_hash
from app.core.exceptions import ConflictException
from app.models.usuario import Usuario
from app.models.enums import RolUsuario

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión (JSON)",
    description="Autentica al usuario usando JSON con su usuario_login (o correo) y password."
)
def login_json(data: LoginRequest, db: Session = Depends(get_db)):
    usuario = authenticate_user(db, data.usuario_login, data.password)
    return create_user_token_response(usuario)

@router.post(
    "/register",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registro público de clientes",
    description="Permite registrar un nuevo usuario directamente."
)
def registrar_publico(data: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.usuario_login == data.usuario_login).first():
        raise ConflictException(f"El usuario_login '{data.usuario_login}' ya está en uso")
    if db.query(Usuario).filter(Usuario.documento == data.documento).first():
        raise ConflictException(f"El documento '{data.documento}' ya está registrado")
    if db.query(Usuario).filter(Usuario.correo == data.correo).first():
        raise ConflictException(f"El correo '{data.correo}' ya está registrado")

    hashed_pw = get_password_hash(data.password)

    nuevo_usuario = Usuario(
        nombre_usuario=data.nombre_usuario,
        apellidos_usuario=data.apellidos_usuario,
        usuario_login=data.usuario_login,
        documento=data.documento,
        password=hashed_pw,
        estado="Activo",
        activo=True,
        rol=data.rol or RolUsuario.CLIENTE,
        correo=data.correo,
        telefono=data.telefono,
        direccion=data.direccion,
        id_ciudad=data.id_ciudad
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return UsuarioResponse(
        id_usuario=nuevo_usuario.id_usuario,
        nombre_usuario=nuevo_usuario.nombre_usuario,
        apellidos_usuario=nuevo_usuario.apellidos_usuario,
        usuario_login=nuevo_usuario.usuario_login,
        documento=nuevo_usuario.documento,
        rol=nuevo_usuario.rol,
        correo=nuevo_usuario.correo,
        telefono=nuevo_usuario.telefono,
        direccion=nuevo_usuario.direccion,
        id_ciudad=nuevo_usuario.id_ciudad,
        estado=nuevo_usuario.estado,
        activo=nuevo_usuario.activo,
        ciudad_nombre=nuevo_usuario.ciudad.nombre if nuevo_usuario.ciudad else None
    )
