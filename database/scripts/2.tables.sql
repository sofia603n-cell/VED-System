/* ============================================================
   TABLAS
   ============================================================ */


/* ------------------------------------------------------------
   TABLA CIUDAD
   ------------------------------------------------------------ */

CREATE TABLE ciudad (
    id_ciudad INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(100) NOT NULL,

    CONSTRAINT pk_ciudad
        PRIMARY KEY (id_ciudad),

    CONSTRAINT uq_ciudad_nombre
        UNIQUE (nombre)
);


/* ------------------------------------------------------------
   TABLA COLOR
   ------------------------------------------------------------ */

CREATE TABLE color (
    id_color INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(100) NOT NULL,

    CONSTRAINT pk_color
        PRIMARY KEY (id_color),

    CONSTRAINT uq_color_nombre
        UNIQUE (nombre)
);


/* ------------------------------------------------------------
   TABLA REFERENCIA
   ------------------------------------------------------------ */

CREATE TABLE referencia (
    id_referencia INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre_referencia VARCHAR(100) NOT NULL,

    CONSTRAINT pk_referencia
        PRIMARY KEY (id_referencia),

    CONSTRAINT uq_referencia_nombre
        UNIQUE (nombre_referencia)
);


/* ------------------------------------------------------------
   TABLA PRODUCTO
   ------------------------------------------------------------ */

CREATE TABLE producto (
    id_producto INTEGER GENERATED ALWAYS AS IDENTITY,
    descripcion VARCHAR(255),
    id_color INTEGER NOT NULL,
    presentacion presentacion_producto NOT NULL,
    precio NUMERIC(12,2) NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    id_referencia INTEGER NOT NULL,
    nombre VARCHAR(150) NOT NULL,

    CONSTRAINT pk_producto
        PRIMARY KEY (id_producto),

    CONSTRAINT fk_producto_color
        FOREIGN KEY (id_color)
        REFERENCES color(id_color)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_producto_referencia
        FOREIGN KEY (id_referencia)
        REFERENCES referencia(id_referencia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_producto_precio
        CHECK (precio >= 0),

    CONSTRAINT chk_producto_stock_actual
        CHECK (stock_actual >= 0),

    CONSTRAINT chk_producto_stock_minimo
        CHECK (stock_minimo >= 0)
);


/* ------------------------------------------------------------
   TABLA USUARIO
   ------------------------------------------------------------ */

CREATE TABLE usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre_usuario VARCHAR(100) NOT NULL,
    apellidos_usuario VARCHAR(150) NOT NULL,
    usuario_login VARCHAR(100) NOT NULL,
    documento VARCHAR(30) NOT NULL,
    password VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    rol rol_usuario NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    direccion VARCHAR(255),
    id_ciudad INTEGER,

    CONSTRAINT pk_usuario
        PRIMARY KEY (id_usuario),

    CONSTRAINT uq_usuario_login
        UNIQUE (usuario_login),

    CONSTRAINT uq_usuario_documento
        UNIQUE (documento),

    CONSTRAINT uq_usuario_correo
        UNIQUE (correo),

    CONSTRAINT fk_usuario_ciudad
        FOREIGN KEY (id_ciudad)
        REFERENCES ciudad(id_ciudad)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_usuario_estado
        CHECK (estado IN ('Activo', 'Inactivo'))
);


/* ------------------------------------------------------------
   TABLA PEDIDO
   ------------------------------------------------------------ */

CREATE TABLE pedido (
    id_pedido INTEGER GENERATED ALWAYS AS IDENTITY,
    id_cliente INTEGER NOT NULL,
    porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    estado_pedido estado_pedido_enum NOT NULL DEFAULT 'Pendiente',
    fecha_entrega DATE NOT NULL,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    id_vendedor INTEGER NOT NULL,
    tipo_pago tipo_pago_enum NOT NULL,
    estado_pago estado_pago_enum NOT NULL,
    canal canal_pedido_enum NOT NULL,

    CONSTRAINT pk_pedido
        PRIMARY KEY (id_pedido),

    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_pedido_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_pedido_porcentaje
        CHECK (porcentaje >= 0 AND porcentaje <= 100)
);


/* ------------------------------------------------------------
   TABLA DETALLE_PEDIDO
   ------------------------------------------------------------ */

CREATE TABLE detalle_pedido (
    id_pedido INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,
    alistamiento INTEGER NOT NULL DEFAULT 0,
    precio_acordado NUMERIC(12,2) NOT NULL,

    CONSTRAINT pk_detalle_pedido
        PRIMARY KEY (id_pedido, id_producto),

    CONSTRAINT fk_detalle_pedido_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedido(id_pedido)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_detalle_pedido_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_pedido_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_detalle_pedido_alistamiento
        CHECK (alistamiento >= 0),

    CONSTRAINT chk_detalle_pedido_precio
        CHECK (precio_acordado >= 0)
);


/* ------------------------------------------------------------
   TABLA MOVIMIENTO
   ------------------------------------------------------------ */

CREATE TABLE movimiento (
    id_movimiento INTEGER GENERATED ALWAYS AS IDENTITY,
    motivo motivo_movimiento_enum NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento tipo_movimiento_enum NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_pedido INTEGER,

    CONSTRAINT pk_movimiento
        PRIMARY KEY (id_movimiento),

    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimiento_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedido(id_pedido)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


/* ------------------------------------------------------------
   TABLA DETALLE_MOVIMIENTO
   ------------------------------------------------------------ */

CREATE TABLE detalle_movimiento (
    id_movimiento INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_detalle_movimiento
        PRIMARY KEY (id_movimiento, id_producto),

    CONSTRAINT fk_detalle_movimiento_movimiento
        FOREIGN KEY (id_movimiento)
        REFERENCES movimiento(id_movimiento)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_detalle_movimiento_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_movimiento_cantidad
        CHECK (cantidad > 0)
);