* ============================================================
   15. CONSULTAS DE VERIFICACIÓN
   ============================================================ */


/* ------------------------------------------------------------
   1. Todos los productos
   ------------------------------------------------------------ */

SELECT
    id_producto,
    nombre,
    descripcion,
    presentacion,
    precio,
    stock_actual,
    stock_minimo
FROM producto
ORDER BY id_producto;


/* ------------------------------------------------------------
   2. Productos con color
   ------------------------------------------------------------ */

SELECT
    p.id_producto,
    p.nombre,
    c.nombre AS color
FROM producto p
INNER JOIN color c
    ON p.id_color = c.id_color
ORDER BY p.id_producto;


/* ------------------------------------------------------------
   3. Productos con referencia
   ------------------------------------------------------------ */

SELECT
    p.id_producto,
    p.nombre,
    r.nombre_referencia AS referencia
FROM producto p
INNER JOIN referencia r
    ON p.id_referencia = r.id_referencia
ORDER BY p.id_producto;


/* ------------------------------------------------------------
   4. Productos con stock bajo
   ------------------------------------------------------------ */

SELECT
    id_producto,
    nombre,
    stock_actual,
    stock_minimo
FROM productos_bajo_stock;


/* ------------------------------------------------------------
   5. Productos sin stock
   ------------------------------------------------------------ */

SELECT
    id_producto,
    nombre,
    stock_actual
FROM producto
WHERE stock_actual = 0
ORDER BY id_producto;


/* ------------------------------------------------------------
   6. Usuarios
   ------------------------------------------------------------ */

SELECT
    id_usuario,
    nombre_usuario,
    apellidos_usuario,
    usuario_login,
    documento,
    estado,
    activo,
    rol,
    correo,
    telefono,
    direccion
FROM usuario
ORDER BY id_usuario;


/* ------------------------------------------------------------
   7. Usuarios con ciudad
   ------------------------------------------------------------ */

SELECT
    u.id_usuario,
    u.nombre_usuario,
    u.apellidos_usuario,
    c.nombre AS ciudad
FROM usuario u
LEFT JOIN ciudad c
    ON u.id_ciudad = c.id_ciudad
ORDER BY u.id_usuario;


/* ------------------------------------------------------------
   8. Usuarios por rol
   ------------------------------------------------------------ */

SELECT
    rol,
    COUNT(*) AS cantidad_usuarios
FROM usuario
GROUP BY rol
ORDER BY rol;


/* ------------------------------------------------------------
   9. Pedidos
   ------------------------------------------------------------ */

SELECT
    id_pedido,
    id_cliente,
    id_vendedor,
    porcentaje,
    estado_pedido,
    fecha_entrega,
    fecha_registro,
    tipo_pago,
    estado_pago,
    canal
FROM pedido
ORDER BY id_pedido;


/* ------------------------------------------------------------
   10. Pedidos con cliente
   ------------------------------------------------------------ */

SELECT
    p.id_pedido,
    u.nombre_usuario || ' ' || u.apellidos_usuario AS cliente,
    p.estado_pedido,
    p.canal
FROM pedido p
INNER JOIN usuario u
    ON p.id_cliente = u.id_usuario
ORDER BY p.id_pedido;


/* ------------------------------------------------------------
   11. Pedidos con vendedor
   ------------------------------------------------------------ */

SELECT
    p.id_pedido,
    u.nombre_usuario || ' ' || u.apellidos_usuario AS vendedor,
    p.estado_pedido
FROM pedido p
INNER JOIN usuario u
    ON p.id_vendedor = u.id_usuario
ORDER BY p.id_pedido;


/* ------------------------------------------------------------
   12. Pedidos por canal
   ------------------------------------------------------------ */

SELECT
    canal,
    COUNT(*) AS cantidad_pedidos
FROM pedido
GROUP BY canal
ORDER BY canal;


/* ------------------------------------------------------------
   13. Detalle de pedidos
   ------------------------------------------------------------ */

SELECT
    dp.id_pedido,
    dp.id_producto,
    p.nombre,
    dp.cantidad,
    dp.alistamiento,
    dp.precio_acordado
FROM detalle_pedido dp
INNER JOIN producto p
    ON dp.id_producto = p.id_producto
ORDER BY dp.id_pedido, dp.id_producto;


/* ------------------------------------------------------------
   14. Movimientos
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    motivo,
    tipo_movimiento,
    fecha_hora,
    id_usuario,
    id_pedido
FROM movimiento
ORDER BY id_movimiento;


/* ------------------------------------------------------------
   15. Movimientos con usuario responsable
   ------------------------------------------------------------ */

SELECT
    m.id_movimiento,
    m.motivo,
    m.tipo_movimiento,
    m.fecha_hora,
    u.nombre_usuario || ' ' || u.apellidos_usuario AS responsable
FROM movimiento m
INNER JOIN usuario u
    ON m.id_usuario = u.id_usuario
ORDER BY m.id_movimiento;


/* ------------------------------------------------------------
   16. Movimientos con pedido
   ------------------------------------------------------------ */

SELECT
    m.id_movimiento,
    m.motivo,
    m.tipo_movimiento,
    m.id_pedido,
    p.estado_pedido
FROM movimiento m
LEFT JOIN pedido p
    ON m.id_pedido = p.id_pedido
ORDER BY m.id_movimiento;


/* ------------------------------------------------------------
   17. Detalles de movimientos
   ------------------------------------------------------------ */

SELECT
    dm.id_movimiento,
    dm.id_producto,
    p.nombre,
    dm.cantidad
FROM detalle_movimiento dm
INNER JOIN producto p
    ON dm.id_producto = p.id_producto
ORDER BY dm.id_movimiento, dm.id_producto;


/* ------------------------------------------------------------
   18. Entradas
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    motivo,
    fecha_hora,
    id_usuario,
    id_pedido
FROM movimiento
WHERE tipo_movimiento = 'entrada'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   19. Salidas
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    motivo,
    fecha_hora,
    id_usuario,
    id_pedido
FROM movimiento
WHERE tipo_movimiento = 'salida'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   20. Ventas
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    id_pedido,
    id_usuario,
    fecha_hora
FROM movimiento
WHERE motivo = 'Venta'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   21. Producción
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    id_usuario,
    fecha_hora
FROM movimiento
WHERE motivo = 'Producción'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   22. Daños
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    id_usuario,
    fecha_hora
FROM movimiento
WHERE motivo = 'Daño'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   23. Defectos
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    id_usuario,
    fecha_hora
FROM movimiento
WHERE motivo = 'Defecto'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   24. Reembolsos
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    id_usuario,
    id_pedido,
    fecha_hora
FROM movimiento
WHERE motivo = 'Reembolso'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   25. Stock actual
   ------------------------------------------------------------ */

SELECT
    p.id_producto,
    p.nombre,
    p.stock_actual
FROM producto p
ORDER BY p.nombre;


/* ------------------------------------------------------------
   26. Productos con stock bajo
   ------------------------------------------------------------ */

SELECT
    id_producto,
    nombre,
    descripcion,
    stock_actual,
    stock_minimo,
    color,
    referencia
FROM productos_bajo_stock;


/* ------------------------------------------------------------
   27. VALOR TOTAL POR PEDIDO
   ------------------------------------------------------------

   subtotal = cantidad * precio_acordado

   descuento/ajuste por porcentaje:
   total = subtotal - (subtotal * porcentaje / 100)

   Se interpreta "porcentaje" como porcentaje de descuento.
   ------------------------------------------------------------ */

SELECT
    p.id_pedido,
    ROUND(
        SUM(dp.cantidad * dp.precio_acordado),
        2
    ) AS subtotal,
    p.porcentaje,
    ROUND(
        SUM(dp.cantidad * dp.precio_acordado)
        * (1 - p.porcentaje / 100),
        2
    ) AS total
FROM pedido p
INNER JOIN detalle_pedido dp
    ON p.id_pedido = dp.id_pedido
GROUP BY
    p.id_pedido,
    p.porcentaje
ORDER BY p.id_pedido;


/* ------------------------------------------------------------
   28. CANTIDAD TOTAL VENDIDA
   ------------------------------------------------------------ */

SELECT
    SUM(dm.cantidad) AS cantidad_total_vendida
FROM detalle_movimiento dm
INNER JOIN movimiento m
    ON dm.id_movimiento = m.id_movimiento
WHERE m.motivo = 'Venta';


/* ------------------------------------------------------------
   29. INVENTARIO INGRESADO
   ------------------------------------------------------------ */

SELECT
    SUM(dm.cantidad) AS inventario_ingresado
FROM detalle_movimiento dm
INNER JOIN movimiento m
    ON dm.id_movimiento = m.id_movimiento
WHERE m.tipo_movimiento = 'entrada';


/* ------------------------------------------------------------
   30. INVENTARIO RETIRADO
   ------------------------------------------------------------ */

SELECT
    SUM(dm.cantidad) AS inventario_retirado
FROM detalle_movimiento dm
INNER JOIN movimiento m
    ON dm.id_movimiento = m.id_movimiento
WHERE m.tipo_movimiento = 'salida';


/* ------------------------------------------------------------
   31. MOVIMIENTOS POR RANGO DE FECHAS
   ------------------------------------------------------------ */

SELECT
    id_movimiento,
    motivo,
    tipo_movimiento,
    fecha_hora,
    id_usuario,
    id_pedido
FROM movimiento
WHERE fecha_hora >= CURRENT_DATE - INTERVAL '30 days'
  AND fecha_hora < CURRENT_DATE + INTERVAL '1 day'
ORDER BY fecha_hora;


/* ------------------------------------------------------------
   32. CANTIDAD DE MOVIMIENTOS POR USUARIO
   ------------------------------------------------------------ */

SELECT
    u.id_usuario,
    u.nombre_usuario || ' ' || u.apellidos_usuario AS usuario,
    COUNT(m.id_movimiento) AS cantidad_movimientos
FROM usuario u
LEFT JOIN movimiento m
    ON u.id_usuario = m.id_usuario
GROUP BY
    u.id_usuario,
    u.nombre_usuario,
    u.apellidos_usuario
ORDER BY cantidad_movimientos DESC;


/* ------------------------------------------------------------
   33. VENTAS POR CANAL
   ------------------------------------------------------------ */

SELECT
    p.canal,
    COUNT(m.id_movimiento) AS cantidad_ventas
FROM movimiento m
INNER JOIN pedido p
    ON m.id_pedido = p.id_pedido
WHERE m.motivo = 'Venta'
GROUP BY p.canal
ORDER BY p.canal;
