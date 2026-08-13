-- Claves Foráneas para Usuario
ALTER TABLE usuario
    ADD CONSTRAINT fk_usuario_rol
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Claves Foráneas para Inventario
ALTER TABLE inventario
    ADD CONSTRAINT fk_inventario_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Claves Foráneas para Movimiento
ALTER TABLE movimiento
    ADD CONSTRAINT fk_movimiento_inventario
    FOREIGN KEY (id_inventario) REFERENCES inventario(id_inventario)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_movimiento_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Claves Foráneas para DetallePe
ALTER TABLE detalle_pe
    ADD CONSTRAINT fk_detallepe_pedido
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_detallepe_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Claves Foráneas para Venta
ALTER TABLE venta
    ADD CONSTRAINT fk_venta_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Claves Foráneas para DetalleVenta
ALTER TABLE detalle_venta
    ADD CONSTRAINT fk_detalleventa_venta
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_detalleventa_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON DELETE RESTRICT ON UPDATE CASCADE;