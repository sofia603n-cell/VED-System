CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);



CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
	CONSTRAINT chk_rol 
    CHECK (rol IN ('ADMIN','SUPER_ADMIN'))
); 




CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    precio NUMERIC(10,2) NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5
);



CREATE TABLE inventario (
    id_inventario SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    stock_actual INT NOT NULL,
    stock_minimo INT NOT NULL,
    ultima_actualizacion DATE DEFAULT CURRENT_DATE,

    FOREIGN KEY (id_producto)
    REFERENCES producto(id_producto)
);





CREATE TABLE venta (
    id_venta SERIAL PRIMARY KEY,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,

    FOREIGN KEY(id_usuario)
    REFERENCES usuario(id_usuario)
);





CREATE TABLE detalle_venta (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_detalle_venta
    FOREIGN KEY(id_venta)
    REFERENCES venta(id_venta),

    CONSTRAINT fk_detalle_producto
    FOREIGN KEY(id_producto)
    REFERENCES producto(id_producto)
);




CREATE TABLE movimientos (
    id_movimiento SERIAL PRIMARY KEY,
    tipo_movimiento VARCHAR(30) NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT,

    CONSTRAINT fk_movimiento_usuario
    FOREIGN KEY(id_usuario)
    REFERENCES usuario(id_usuario)
);


