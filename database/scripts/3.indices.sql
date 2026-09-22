* ============================================================
    ÍNDICES
   ============================================================ */


/* Producto */
CREATE INDEX idx_producto_id_color
    ON producto(id_color);

CREATE INDEX idx_producto_id_referencia
    ON producto(id_referencia);


/* Usuario */
CREATE INDEX idx_usuario_id_ciudad
    ON usuario(id_ciudad);


/* Pedido */
CREATE INDEX idx_pedido_id_cliente
    ON pedido(id_cliente);

CREATE INDEX idx_pedido_id_vendedor
    ON pedido(id_vendedor);

CREATE INDEX idx_pedido_estado
    ON pedido(estado_pedido);

CREATE INDEX idx_pedido_canal
    ON pedido(canal);


/* Detalle pedido */
CREATE INDEX idx_detalle_pedido_id_producto
    ON detalle_pedido(id_producto);


/* Movimiento */
CREATE INDEX idx_movimiento_id_usuario
    ON movimiento(id_usuario);

CREATE INDEX idx_movimiento_id_pedido
    ON movimiento(id_pedido);

CREATE INDEX idx_movimiento_fecha_hora
    ON movimiento(fecha_hora);


/* Detalle movimiento */
CREATE INDEX idx_detalle_movimiento_id_producto
    ON detalle_movimiento(id_producto);


/*
   Evita que un pedido tenga más de un movimiento de Venta.
*/
CREATE UNIQUE INDEX uq_movimiento_venta_pedido
    ON movimiento(id_pedido)
    WHERE motivo = 'Venta';
