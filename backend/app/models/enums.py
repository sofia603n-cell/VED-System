import enum
from sqlalchemy.dialects.postgresql import ENUM

class PresentacionProducto(str, enum.Enum):
    UNIDAD = 'unidad'
    PAQUETE_X12 = 'paquete_x12'
    PAQUETE_X24 = 'paquete_x24'

class RolUsuario(str, enum.Enum):
    ADMIN = 'admin'
    SUPER_ADMIN = 'super_admin'
    CLIENTE = 'cliente'

class EstadoPedido(str, enum.Enum):
    PENDIENTE = 'Pendiente'
    ALISTAMIENTO = 'Alistamiento'
    ENTREGADO = 'Entregado'

class TipoPago(str, enum.Enum):
    EFECTIVO = 'Efectivo'
    TRANSFERENCIA = 'Transferencia'
    CREDITO = 'Crédito'

class EstadoPago(str, enum.Enum):
    PENDIENTE = 'Pendiente'
    PAGADO = 'Pagado'
    PARCIAL = 'Parcial'

class CanalPedido(str, enum.Enum):
    PERSONA = 'persona'
    FACEBOOK = 'facebook'
    WHATSAPP = 'whatsapp'

class TipoMovimiento(str, enum.Enum):
    ENTRADA = 'entrada'
    SALIDA = 'salida'

class MotivoMovimiento(str, enum.Enum):
    PRODUCCION = 'Producción'
    REEMBOLSO = 'Reembolso'
    VENTA = 'Venta'
    DANO = 'Daño'
    DEFECTO = 'Defecto'

presentacion_producto_db = ENUM(
    'unidad', 'paquete_x12', 'paquete_x24',
    name='presentacion_producto',
    create_type=False
)

rol_usuario_db = ENUM(
    'admin', 'super_admin', 'cliente',
    name='rol_usuario',
    create_type=False
)

estado_pedido_enum_db = ENUM(
    'Pendiente', 'Alistamiento', 'Entregado',
    name='estado_pedido_enum',
    create_type=False
)

tipo_pago_enum_db = ENUM(
    'Efectivo', 'Transferencia', 'Crédito',
    name='tipo_pago_enum',
    create_type=False
)

estado_pago_enum_db = ENUM(
    'Pendiente', 'Pagado', 'Parcial',
    name='estado_pago_enum',
    create_type=False
)

canal_pedido_enum_db = ENUM(
    'persona', 'facebook', 'whatsapp',
    name='canal_pedido_enum',
    create_type=False
)

tipo_movimiento_enum_db = ENUM(
    'entrada', 'salida',
    name='tipo_movimiento_enum',
    create_type=False
)

motivo_movimiento_enum_db = ENUM(
    'Producción', 'Reembolso', 'Venta', 'Daño', 'Defecto',
    name='motivo_movimiento_enum',
    create_type=False
)
