/* ============================================================
   CONSULTAS UTILIZADAS POR LA APLICACIÓN
   ============================================================ */

/* ------------------------------------------------------------
   AUTENTICACIÓN
   ------------------------------------------------------------ */

SELECT id_usuario, nombre_usuario, apellidos_usuario, usuario_login, password, rol, activo
FROM usuario
WHERE usuario_login = :usuario_login OR correo = :usuario_login;

INSERT INTO usuario (
    nombre_usuario,
    apellidos_usuario,
    usuario_login,
    documento,
    password,
    estado,
    activo,
    rol,
    correo,
    telefono,
    direccion,
    id_ciudad
)
VALUES (
    :nombre_usuario,
    :apellidos_usuario,
    :usuario_login,
    :documento,
    :password,
    'Activo',
    TRUE,
    :rol,
    :correo,
    :telefono,
    :direccion,
    :id_ciudad
)
RETURNING *;

/* ------------------------------------------------------------
   USUARIOS
   ------------------------------------------------------------ */

SELECT u.id_usuario, u.nombre_usuario, u.apellidos_usuario, u.usuario_login, u.documento,
       u.estado, u.activo, u.rol, u.correo, u.telefono, u.direccion, c.nombre AS ciudad
FROM usuario u
LEFT JOIN ciudad c ON u.id_ciudad = c.id_ciudad
ORDER BY u.id_usuario;

/* ------------------------------------------------------------
   PRODUCTOS
   ------------------------------------------------------------ */

SELECT p.id_producto, p.nombre, p.descripcion, p.presentacion, p.precio,
       p.stock_actual, p.stock_minimo, p.id_color, p.id_referencia,
       c.nombre AS color_nombre, r.nombre_referencia AS referencia_nombre
FROM producto p
LEFT JOIN color c ON p.id_color = c.id_color
LEFT JOIN referencia r ON p.id_referencia = r.id_referencia
WHERE (:id_color IS NULL OR p.id_color = :id_color)
  AND (:id_referencia IS NULL OR p.id_referencia = :id_referencia)
  AND (:presentacion IS NULL OR p.presentacion = :presentacion)
  AND (:solo_bajo_stock = FALSE OR p.stock_actual <= p.stock_minimo)
  AND (
      :search IS NULL OR :search = '' OR
      p.nombre ILIKE '%' || :search || '%' OR
      p.descripcion ILIKE '%' || :search || '%'
  )
ORDER BY p.id_producto;

SELECT p.id_producto, p.nombre, p.descripcion, p.presentacion, p.precio,
       p.stock_actual, p.stock_minimo, c.nombre AS color, r.nombre_referencia AS referencia
FROM producto p
LEFT JOIN color c ON p.id_color = c.id_color
LEFT JOIN referencia r ON p.id_referencia = r.id_referencia
WHERE p.stock_actual <= p.stock_minimo
ORDER BY p.stock_actual ASC;

SELECT p.id_producto, p.nombre, p.descripcion, p.presentacion, p.precio,
       p.stock_actual, p.stock_minimo, p.id_color, p.id_referencia,
       c.nombre AS color_nombre, r.nombre_referencia AS referencia_nombre
FROM producto p
LEFT JOIN color c ON p.id_color = c.id_color
LEFT JOIN referencia r ON p.id_referencia = r.id_referencia
WHERE p.id_producto = :id_producto;

INSERT INTO producto (
    descripcion,
    id_color,
    presentacion,
    precio,
    stock_actual,
    stock_minimo,
    id_referencia,
    nombre
)
VALUES (
    :descripcion,
    :id_color,
    :presentacion,
    :precio,
    :stock_actual,
    :stock_minimo,
    :id_referencia,
    :nombre
)
RETURNING *;

UPDATE producto
SET nombre = :nombre,
    descripcion = :descripcion,
    id_color = :id_color,
    presentacion = :presentacion,
    precio = :precio,
    stock_actual = :stock_actual,
    stock_minimo = :stock_minimo,
    id_referencia = :id_referencia
WHERE id_producto = :id_producto;

DELETE FROM producto
WHERE id_producto = :id_producto;

/* ------------------------------------------------------------
   PEDIDOS
   ------------------------------------------------------------ */

SELECT p.id_pedido, p.id_cliente, p.id_vendedor, p.porcentaje, p.estado_pedido,
       p.fecha_entrega, p.fecha_registro, p.tipo_pago, p.estado_pago, p.canal,
       uc.nombre_usuario || ' ' || uc.apellidos_usuario AS cliente,
       uv.nombre_usuario || ' ' || uv.apellidos_usuario AS vendedor
FROM pedido p
INNER JOIN usuario uc ON p.id_cliente = uc.id_usuario
INNER JOIN usuario uv ON p.id_vendedor = uv.id_usuario
WHERE (:estado_pedido IS NULL OR p.estado_pedido = :estado_pedido)
  AND (:tipo_pago IS NULL OR p.tipo_pago = :tipo_pago)
  AND (:estado_pago IS NULL OR p.estado_pago = :estado_pago)
  AND (:canal IS NULL OR p.canal = :canal)
  AND (:id_cliente IS NULL OR p.id_cliente = :id_cliente)
  AND (:id_vendedor IS NULL OR p.id_vendedor = :id_vendedor)
  AND (:fecha_desde IS NULL OR p.fecha_registro >= :fecha_desde)
  AND (:fecha_hasta IS NULL OR p.fecha_registro <= :fecha_hasta)
ORDER BY p.id_pedido DESC;

SELECT p.id_pedido, p.id_cliente, p.id_vendedor, p.porcentaje, p.estado_pedido,
       p.fecha_entrega, p.fecha_registro, p.tipo_pago, p.estado_pago, p.canal,
       uc.nombre_usuario || ' ' || uc.apellidos_usuario AS cliente,
       uv.nombre_usuario || ' ' || uv.apellidos_usuario AS vendedor
FROM pedido p
INNER JOIN usuario uc ON p.id_cliente = uc.id_usuario
INNER JOIN usuario uv ON p.id_vendedor = uv.id_usuario
WHERE p.id_pedido = :id_pedido;

SELECT dp.id_pedido, dp.id_producto, pr.nombre, dp.cantidad, dp.alistamiento, dp.precio_acordado
FROM detalle_pedido dp
INNER JOIN producto pr ON dp.id_producto = pr.id_producto
WHERE dp.id_pedido = :id_pedido
ORDER BY dp.id_producto;

INSERT INTO pedido (
    id_cliente,
    porcentaje,
    estado_pedido,
    fecha_entrega,
    id_vendedor,
    tipo_pago,
    estado_pago,
    canal
)
VALUES (
    :id_cliente,
    :porcentaje,
    :estado_pedido,
    :fecha_entrega,
    :id_vendedor,
    :tipo_pago,
    :estado_pago,
    :canal
)
RETURNING *;

INSERT INTO detalle_pedido (
    id_pedido,
    id_producto,
    cantidad,
    alistamiento,
    precio_acordado
)
VALUES (
    :id_pedido,
    :id_producto,
    :cantidad,
    :alistamiento,
    :precio_acordado
);

UPDATE pedido
SET estado_pedido = :nuevo_estado
WHERE id_pedido = :id_pedido;

UPDATE pedido
SET tipo_pago = :tipo_pago,
    estado_pago = :estado_pago
WHERE id_pedido = :id_pedido;

/* ------------------------------------------------------------
   INVENTARIO Y MOVIMIENTOS
   ------------------------------------------------------------ */

SELECT m.id_movimiento, m.motivo, m.tipo_movimiento, m.fecha_hora, m.id_usuario, m.id_pedido,
       u.nombre_usuario || ' ' || u.apellidos_usuario AS responsable
FROM movimiento m
INNER JOIN usuario u ON m.id_usuario = u.id_usuario
WHERE (:tipo_movimiento IS NULL OR m.tipo_movimiento = :tipo_movimiento)
  AND (:motivo IS NULL OR m.motivo = :motivo)
  AND (:id_usuario IS NULL OR m.id_usuario = :id_usuario)
  AND (:id_pedido IS NULL OR m.id_pedido = :id_pedido)
  AND (:fecha_desde IS NULL OR m.fecha_hora >= :fecha_desde)
  AND (:fecha_hasta IS NULL OR m.fecha_hora <= :fecha_hasta)
ORDER BY m.fecha_hora DESC;

SELECT m.id_movimiento, m.motivo, m.tipo_movimiento, m.fecha_hora, m.id_usuario, m.id_pedido,
       u.nombre_usuario || ' ' || u.apellidos_usuario AS responsable
FROM movimiento m
INNER JOIN usuario u ON m.id_usuario = u.id_usuario
WHERE m.id_movimiento = :id_movimiento;

SELECT dm.id_movimiento, dm.id_producto, p.nombre AS nombre_producto, dm.cantidad
FROM detalle_movimiento dm
INNER JOIN producto p ON dm.id_producto = p.id_producto
WHERE dm.id_movimiento = :id_movimiento
ORDER BY dm.id_producto;

INSERT INTO movimiento (
    motivo,
    tipo_movimiento,
    id_usuario,
    id_pedido
)
VALUES (
    :motivo,
    :tipo_movimiento,
    :id_usuario,
    :id_pedido
)
RETURNING *;

INSERT INTO detalle_movimiento (
    id_movimiento,
    id_producto,
    cantidad
)
VALUES (
    :id_movimiento,
    :id_producto,
    :cantidad
);

/* ------------------------------------------------------------
   REPORTES
   ------------------------------------------------------------ */

SELECT
    (SELECT COUNT(*) FROM producto) AS total_productos,
    (SELECT COUNT(*) FROM pedido) AS total_pedidos,
    (SELECT COUNT(*) FROM usuario WHERE rol = 'cliente') AS total_clientes,
    (SELECT COUNT(*) FROM movimiento) AS total_movimientos,
    (SELECT COALESCE(SUM(precio * stock_actual), 0) FROM producto) AS valor_inventario;

SELECT canal, COUNT(*) AS cantidad_pedidos
FROM pedido
GROUP BY canal
ORDER BY canal;

SELECT u.id_usuario, u.nombre_usuario, u.apellidos_usuario, COUNT(m.id_movimiento) AS movimientos
FROM usuario u
LEFT JOIN movimiento m ON m.id_usuario = u.id_usuario
GROUP BY u.id_usuario, u.nombre_usuario, u.apellidos_usuario
ORDER BY movimientos DESC;

SELECT
    COUNT(*) AS total_productos,
    COALESCE(SUM(stock_actual), 0) AS unidades_disponibles,
    COALESCE(SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END), 0) AS productos_bajo_stock,
    COALESCE(SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END), 0) AS productos_sin_stock
FROM producto;

SELECT id_producto, nombre, descripcion, stock_actual, stock_minimo
FROM producto
WHERE stock_actual <= stock_minimo
ORDER BY stock_actual ASC;

SELECT date_trunc('month', fecha_registro)::date AS mes,
       COUNT(*) AS total_pedidos,
       COALESCE(SUM(CASE WHEN estado_pago = 'Pagado' THEN 1 ELSE 0 END), 0) AS pedidos_pagados,
       COALESCE(SUM(CASE WHEN estado_pago = 'Pendiente' THEN 1 ELSE 0 END), 0) AS pedidos_pendientes
FROM pedido
WHERE fecha_registro >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY date_trunc('month', fecha_registro)
ORDER BY mes;
