-- 1. Tabla Rol
CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

-- 2. Tabla Usuario
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    documento VARCHAR(20) UNIQUE NOT NULL,
    nombres_usuario VARCHAR(100) NOT NULL,
    apellidos_usuario VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE: activo, FALSE: inactivo
    id_rol INT NOT NULL
);

-- 3. Tabla Producto
CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre_prodcto VARCHAR(100) NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    stock_minimo INT NOT NULL DEFAULT 0,
    stock_actual INT NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL
);

-- 4. Tabla Inventario
CREATE TABLE inventario (
    id_inventario SERIAL PRIMARY KEY,
    fecha_inventario TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_producto INT NOT NULL
);

-- 5. Tabla Movimiento
CREATE TABLE movimiento (
    id_movimientos SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    id_inventario INT NOT NULL,
    id_usuario INT NOT NULL
);

-- 6. Tabla Pedido
CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    fecha_registro_pe TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATE,
    porsentaje NUMERIC(5, 2), -- Porcentaje de avance o anticipo
    estado_pedido VARCHAR(50) NOT NULL
);

-- 7. Tabla DetallePe (Detalle del Pedido)
CREATE TABLE detalle_pe (
    id_detalle_pe SERIAL PRIMARY KEY,
    cantidad INT NOT NULL,
    precio_acordado NUMERIC(10, 2) NOT NULL,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL
);

-- 8. Tabla Venta
CREATE TABLE venta (
    id_venta SERIAL PRIMARY KEY,
    fecha_venta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL
);

-- 9. Tabla DetalleVenta
CREATE TABLE detalle_venta (
    id_detalle_venta SERIAL PRIMARY KEY,
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL
);