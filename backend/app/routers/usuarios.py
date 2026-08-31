from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.models.ciudad import Ciudad
from app.models.enums import RolUsuario
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioEstadoUpdate,
    UsuarioResponse
)
from app.core.security import get_password_hash
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

def _map_usuario_response(u: Usuario) -> UsuarioResponse:
    return UsuarioResponse(
        id_usuario=u.id_usuario,
        nombre_usuario=u.nombre_usuario,
        apellidos_usuario=u.apellidos_usuario,
        usuario_login=u.usuario_login,
        documento=u.documento,
        rol=u.rol,
        correo=u.correo,
        telefono=u.telefono,
        direccion=u.direccion,
        id_ciudad=u.id_ciudad,
        estado=u.estado,
        activo=u.activo,
        ciudad_nombre=u.ciudad.nombre if u.ciudad else None
    )

@router.get(
    "",
    response_model=List[UsuarioResponse],
    summary="Listar usuarios"
)
def listar_usuarios(
    rol: Optional[RolUsuario] = None,
    estado: Optional[str] = None,
    id_ciudad: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Usuario)

    if rol:
        query = query.filter(Usuario.rol == rol)
    if estado:
        query = query.filter(Usuario.estado == estado)
    if id_ciudad:
        query = query.filter(Usuario.id_ciudad == id_ciudad)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Usuario.nombre_usuario.ilike(search_pattern)) |
            (Usuario.apellidos_usuario.ilike(search_pattern)) |
            (Usuario.usuario_login.ilike(search_pattern)) |
            (Usuario.documento.ilike(search_pattern)) |
            (Usuario.correo.ilike(search_pattern))
        )

    usuarios = query.order_by(Usuario.id_usuario).all()
    return [_map_usuario_response(u) for u in usuarios]

@router.get(
    "/{id_usuario}",
    response_model=UsuarioResponse,
    summary="Obtener un usuario por ID"
)
def obtener_usuario(id_usuario: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise NotFoundException(f"Usuario con id {id_usuario} no encontrado")
    return _map_usuario_response(usuario)

@router.post(
    "",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario"
)
def crear_usuario(data: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.usuario_login == data.usuario_login).first():
        raise ConflictException(f"El usuario_login '{data.usuario_login}' ya está en uso")
    if db.query(Usuario).filter(Usuario.documento == data.documento).first():
        raise ConflictException(f"El documento '{data.documento}' ya está registrado")
    if db.query(Usuario).filter(Usuario.correo == data.correo).first():
        raise ConflictException(f"El correo '{data.correo}' ya está registrado")

    if data.id_ciudad and data.id_ciudad > 0:
        if not db.query(Ciudad).filter(Ciudad.id_ciudad == data.id_ciudad).first():
            raise NotFoundException(f"Ciudad con id {data.id_ciudad} no existe")

    hashed_pw = get_password_hash(data.password)

    nuevo_usuario = Usuario(
        nombre_usuario=data.nombre_usuario.strip(),
        apellidos_usuario=data.apellidos_usuario.strip(),
        usuario_login=data.usuario_login.strip(),
        documento=data.documento.strip(),
        password=hashed_pw,
        estado=data.estado or "Activo",
        activo=data.activo if data.activo is not None else True,
        rol=data.rol,
        correo=data.correo.strip(),
        telefono=data.telefono.strip() if data.telefono else None,
        direccion=data.direccion.strip() if data.direccion else None,
        id_ciudad=data.id_ciudad if (data.id_ciudad and data.id_ciudad > 0) else None
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return _map_usuario_response(nuevo_usuario)

@router.put(
    "/{id_usuario}",
    response_model=UsuarioResponse,
    summary="Actualizar información de usuario"
)
def actualizar_usuario(id_usuario: int, data: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise NotFoundException(f"Usuario con id {id_usuario} no encontrado")

    # Validar que no se dupliquen campos únicos con OTROS usuarios
    if data.usuario_login and data.usuario_login.strip() != usuario.usuario_login:
        if db.query(Usuario).filter(Usuario.usuario_login == data.usuario_login.strip(), Usuario.id_usuario != id_usuario).first():
            raise ConflictException(f"El usuario_login '{data.usuario_login}' ya está en uso por otro usuario")
        usuario.usuario_login = data.usuario_login.strip()

    if data.documento and data.documento.strip() != usuario.documento:
        if db.query(Usuario).filter(Usuario.documento == data.documento.strip(), Usuario.id_usuario != id_usuario).first():
            raise ConflictException(f"El documento '{data.documento}' ya está registrado por otro usuario")
        usuario.documento = data.documento.strip()

    if data.correo and data.correo.strip() != usuario.correo:
        if db.query(Usuario).filter(Usuario.correo == data.correo.strip(), Usuario.id_usuario != id_usuario).first():
            raise ConflictException(f"El correo '{data.correo}' ya está registrado por otro usuario")
        usuario.correo = data.correo.strip()

    if data.nombre_usuario is not None and data.nombre_usuario.strip() != "":
        usuario.nombre_usuario = data.nombre_usuario.strip()

    if data.apellidos_usuario is not None and data.apellidos_usuario.strip() != "":
        usuario.apellidos_usuario = data.apellidos_usuario.strip()

    if data.rol is not None:
        usuario.rol = data.rol

    if data.telefono is not None:
        usuario.telefono = data.telefono.strip() if data.telefono.strip() != "" else None

    if data.direccion is not None:
        usuario.direccion = data.direccion.strip() if data.direccion.strip() != "" else None

    if data.id_ciudad is not None:
        if data.id_ciudad <= 0:
            usuario.id_ciudad = None
        else:
            if not db.query(Ciudad).filter(Ciudad.id_ciudad == data.id_ciudad).first():
                raise NotFoundException(f"Ciudad con id {data.id_ciudad} no existe")
            usuario.id_ciudad = data.id_ciudad

    if data.estado is not None:
        usuario.estado = data.estado

    if data.activo is not None:
        usuario.activo = data.activo

    if data.password and data.password.strip() != "" and data.password != "string":
        usuario.password = get_password_hash(data.password.strip())

    db.commit()
    db.refresh(usuario)
    return _map_usuario_response(usuario)

@router.patch(
    "/{id_usuario}/estado",
    response_model=UsuarioResponse,
    summary="Cambiar estado y activación de usuario"
)
def cambiar_estado_usuario(id_usuario: int, data: UsuarioEstadoUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise NotFoundException(f"Usuario con id {id_usuario} no encontrado")

    usuario.estado = data.estado
    usuario.activo = data.activo
    db.commit()
    db.refresh(usuario)
    return _map_usuario_response(usuario)

@router.delete(
    "/{id_usuario}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar usuario de la base de datos"
)
def eliminar_usuario(id_usuario: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise NotFoundException(f"Usuario con id {id_usuario} no encontrado")

    try:
        db.delete(usuario)
        db.commit()
        return {"mensaje": f"Usuario {usuario.usuario_login} (ID: {id_usuario}) eliminado exitosamente de la base de datos"}
    except Exception as e:
        db.rollback()
        raise BadRequestException(
            f"No se puede eliminar el usuario '{usuario.usuario_login}' de la base de datos porque tiene registros históricos asociados (pedidos o movimientos). Para darlo de baja, usa el endpoint PATCH /{id_usuario}/estado con estado='Inactivo' y activo=false."
        )
