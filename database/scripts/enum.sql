/* 
 TIPOS ENUM
 */

/* Presentación del producto */
CREATE TYPE presentacion_producto AS ENUM (
    'unidad',
    'paquete_x12',
    'paquete_x24'
);

/* Roles del sistema */
CREATE TYPE rol_usuario AS ENUM (
    'admin',
    'super_admin',
    'cliente'
);

/* Estados del pedido */
CREATE TYPE estado_pedido_enum AS ENUM (
    'Pendiente',
    'Alistamiento',
    'Entregado'
);

/* Tipo de pago */
CREATE TYPE tipo_pago_enum AS ENUM (
    'Efectivo',
    'Transferencia',
    'Crédito'
);

/* Estado del pago */
CREATE TYPE estado_pago_enum AS ENUM (
    'Pendiente',
    'Pagado',
    'Parcial'
);

/* Canal de recepción del pedido */
CREATE TYPE canal_pedido_enum AS ENUM (
    'persona',
    'facebook',
    'whatsapp'
);

/* Tipo de movimiento */
CREATE TYPE tipo_movimiento_enum AS ENUM (
    'entrada',
    'salida'
);

/* Motivo del movimiento */
CREATE TYPE motivo_movimiento_enum AS ENUM (
    'Producción',
    'Reembolso',
    'Venta',
    'Daño',
    'Defecto'
);