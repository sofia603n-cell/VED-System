/* ============================================================
   10. DATOS DE PRUEBA
   ============================================================ */


/* ------------------------------------------------------------
   CIUDADES
   ------------------------------------------------------------ */

INSERT INTO ciudad (nombre)
VALUES
    ('Bogotá'),
    ('Medellín'),
    ('Cali'),
    ('Barranquilla'),
    ('Cartagena');


/* ------------------------------------------------------------
   COLORES
   ------------------------------------------------------------ */

INSERT INTO color (nombre)
VALUES
    ('Blanco'),
    ('Rojo'),
    ('Azul'),
    ('Verde'),
    ('Amarillo'),
    ('Morado');


/* ------------------------------------------------------------
   REFERENCIAS
   ------------------------------------------------------------ */

INSERT INTO referencia (nombre_referencia)
VALUES
    ('Clásica'),
    ('Aromática'),
    ('Decorativa'),
    ('Premium'),
    ('Navideña'),
    ('Religiosa');


/* ------------------------------------------------------------
   USUARIOS
   ------------------------------------------------------------ */

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
SELECT
    'Super',
    'Administrador',
    'superadmin',
    'TEST-SA-001',
    'HASH_FICTICIO_SUPER_ADMIN',
    'Activo',
    TRUE,
    'super_admin',
    'superadmin@test.ved',
    '3000000001',
    'Dirección de prueba 1',
    id_ciudad
FROM ciudad
WHERE nombre = 'Bogotá';


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
SELECT
    'Administrador',
    'Principal',
    'admin01',
    'TEST-AD-001',
    'HASH_FICTICIO_ADMIN',
    'Activo',
    TRUE,
    'admin',
    'admin01@test.ved',
    '3000000002',
    'Dirección de prueba 2',
    id_ciudad
FROM ciudad
WHERE nombre = 'Medellín';


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
SELECT
    'Laura',
    'Gómez',
    'cliente01',
    'TEST-CL-001',
    'HASH_FICTICIO_CLIENTE_01',
    'Activo',
    TRUE,
    'cliente',
    'cliente01@test.ved',
    '3000000003',
    'Dirección de prueba 3',
    id_ciudad
FROM ciudad
WHERE nombre = 'Cali';


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
SELECT
    'Carlos',
    'Rodríguez',
    'cliente02',
    'TEST-CL-002',
    'HASH_FICTICIO_CLIENTE_02',
    'Activo',
    TRUE,
    'cliente',
    'cliente02@test.ved',
    '3000000004',
    'Dirección de prueba 4',
    id_ciudad
FROM ciudad
WHERE nombre = 'Barranquilla';


/* ------------------------------------------------------------
   PRODUCTOS
   ------------------------------------------------------------ */

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
SELECT
    'Veladora blanca clásica',
    c.id_color,
    'unidad',
    5000.00,
    30,
    10,
    r.id_referencia,
    'Veladora Blanca Clásica'
FROM color c
CROSS JOIN referencia r
WHERE c.nombre = 'Blanco'
  AND r.nombre_referencia = 'Clásica';


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
SELECT
    'Veladora roja aromática',
    c.id_color,
    'unidad',
    6500.00,
    25,
    8,
    r.id_referencia,
    'Veladora Roja Aromática'
FROM color c
CROSS JOIN referencia r
WHERE c.nombre = 'Rojo'
  AND r.nombre_referencia = 'Aromática';


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
SELECT
    'Veladora azul decorativa',
    c.id_color,
    'paquete_x12',
    48000.00,
    40,
    10,
    r.id_referencia,
    'Veladora Azul Decorativa x12'
FROM color c
CROSS JOIN referencia r
WHERE c.nombre = 'Azul'
  AND r.nombre_referencia = 'Decorativa';


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
SELECT
    'Veladora verde premium',
    c.id_color,
    'unidad',
    8500.00,
    20,
    5,
    r.id_referencia,
    'Veladora Verde Premium'
FROM color c
CROSS JOIN referencia r
WHERE c.nombre = 'Verde'
  AND r.nombre_referencia = 'Premium';


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
SELECT
    'Veladora amarilla decorativa',
    c.id_color,
    'paquete_x24',
    90000.00,
    35,
    8,
    r.id_referencia,
    'Veladora Amarilla Decorativa x24'
FROM color c
CROSS JOIN referencia r
WHERE c.nombre = 'Amarillo'
  AND r.nombre_referencia = 'Decorativa';


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
SELECT
    'Veladora morada religiosa',
    c.id_color,
    'unidad',
    7000.00,
    15,
    5,
    r.id_referencia,
    'Veladora Morada Religiosa'
FROM color c
CROSS JOIN referencia r
WHERE c.nombre = 'Morado'
  AND r.nombre_referencia = 'Religiosa';


/* ------------------------------------------------------------
   PEDIDOS DE PRUEBA
   Todos inicialmente quedan Pendiente para poder demostrar
   posteriormente el cambio a Alistamiento.
   ------------------------------------------------------------ */

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
SELECT
    c.id_usuario,
    5.00,
    'Pendiente',
    CURRENT_DATE + 5,
    v.id_usuario,
    'Efectivo',
    'Pendiente',
    'persona'
FROM usuario c
CROSS JOIN usuario v
WHERE c.usuario_login = 'cliente01'
  AND v.usuario_login = 'admin01';


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
SELECT
    c.id_usuario,
    10.00,
    'Pendiente',
    CURRENT_DATE + 7,
    v.id_usuario,
    'Transferencia',
    'Pagado',
    'facebook'
FROM usuario c
CROSS JOIN usuario v
WHERE c.usuario_login = 'cliente02'
  AND v.usuario_login = 'admin01';


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
SELECT
    c.id_usuario,
    0.00,
    'Pendiente',
    CURRENT_DATE + 10,
    v.id_usuario,
    'Crédito',
    'Parcial',
    'whatsapp'
FROM usuario c
CROSS JOIN usuario v
WHERE c.usuario_login = 'cliente01'
  AND v.usuario_login = 'admin01';


/* ------------------------------------------------------------
   DETALLES DE PEDIDO
   ------------------------------------------------------------ */


/* Pedido cliente01 - producto blanco */
INSERT INTO detalle_pedido (
    id_pedido,
    id_producto,
    cantidad,
    alistamiento,
    precio_acordado
)
SELECT
    p.id_pedido,
    pr.id_producto,
    5.00,
    0,
    5000.00
FROM pedido p
CROSS JOIN producto pr
WHERE p.id_cliente = (
        SELECT id_usuario
        FROM usuario
        WHERE usuario_login = 'cliente01'
      )
  AND p.canal = 'persona'
  AND pr.nombre = 'Veladora Blanca Clásica';


/* Pedido cliente01 - producto rojo */
INSERT INTO detalle_pedido (
    id_pedido,
    id_producto,
    cantidad,
    alistamiento,
    precio_acordado
)
SELECT
    p.id_pedido,
    pr.id_producto,
    3.00,
    0,
    6500.00
FROM pedido p
CROSS JOIN producto pr
WHERE p.id_cliente = (
        SELECT id_usuario
        FROM usuario
        WHERE usuario_login = 'cliente01'
      )
  AND p.canal = 'persona'
  AND pr.nombre = 'Veladora Roja Aromática';


/* Segundo pedido */
INSERT INTO detalle_pedido (
    id_pedido,
    id_producto,
    cantidad,
    alistamiento,
    precio_acordado
)
SELECT
    p.id_pedido,
    pr.id_producto,
    4.00,
    0,
    48000.00
FROM pedido p
CROSS JOIN producto pr
WHERE p.id_cliente = (
        SELECT id_usuario
        FROM usuario
        WHERE usuario_login = 'cliente02'
      )
  AND p.canal = 'facebook'
  AND pr.nombre = 'Veladora Azul Decorativa x12';


/* Tercer pedido */
INSERT INTO detalle_pedido (
    id_pedido,
    id_producto,
    cantidad,
    alistamiento,
    precio_acordado
)
SELECT
    p.id_pedido,
    pr.id_producto,
    2.00,
    0,
    8500.00
FROM pedido p
CROSS JOIN producto pr
WHERE p.id_cliente = (
        SELECT id_usuario
        FROM usuario
        WHERE usuario_login = 'cliente01'
      )
  AND p.canal = 'whatsapp'
  AND pr.nombre = 'Veladora Verde Premium';


/* ============================================================
   11. PRUEBAS DE INVENTARIO
   ============================================================ */


/* ------------------------------------------------------------
   11.1 PRODUCCIÓN
   ------------------------------------------------------------ */

DO $$
DECLARE
    v_movimiento INTEGER;
    v_producto INTEGER;
BEGIN

    SELECT id_producto
    INTO v_producto
    FROM producto
    WHERE nombre = 'Veladora Blanca Clásica';

    INSERT INTO movimiento (
        motivo,
        tipo_movimiento,
        id_usuario,
        id_pedido
    )
    SELECT
        'Producción',
        'entrada',
        id_usuario,
        NULL
    FROM usuario
    WHERE usuario_login = 'admin01'
    RETURNING id_movimiento
    INTO v_movimiento;

    INSERT INTO detalle_movimiento (
        id_movimiento,
        id_producto,
        cantidad
    )
    VALUES (
        v_movimiento,
        v_producto,
        10.00
    );

    RAISE NOTICE
        'Producción registrada. Movimiento: %, Producto: %, Cantidad: 10.',
        v_movimiento,
        v_producto;

END;
$$;


/* ------------------------------------------------------------
   11.2 REEMBOLSO
   ------------------------------------------------------------ */

DO $$
DECLARE
    v_movimiento INTEGER;
    v_producto INTEGER;
    v_pedido INTEGER;
BEGIN

    SELECT id_producto
    INTO v_producto
    FROM producto
    WHERE nombre = 'Veladora Roja Aromática';

    SELECT id_pedido
    INTO v_pedido
    FROM pedido
    WHERE canal = 'persona'
    LIMIT 1;

    INSERT INTO movimiento (
        motivo,
        tipo_movimiento,
        id_usuario,
        id_pedido
    )
    SELECT
        'Reembolso',
        'entrada',
        id_usuario,
        v_pedido
    FROM usuario
    WHERE usuario_login = 'admin01'
    RETURNING id_movimiento
    INTO v_movimiento;

    INSERT INTO detalle_movimiento (
        id_movimiento,
        id_producto,
        cantidad
    )
    VALUES (
        v_movimiento,
        v_producto,
        2.00
    );

    RAISE NOTICE
        'Reembolso registrado. Movimiento: %, Producto: %, Cantidad: 2.',
        v_movimiento,
        v_producto;

END;
$$;


/* ------------------------------------------------------------
   11.3 DAÑO
   ------------------------------------------------------------ */

DO $$
DECLARE
    v_movimiento INTEGER;
    v_producto INTEGER;
BEGIN

    SELECT id_producto
    INTO v_producto
    FROM producto
    WHERE nombre = 'Veladora Verde Premium';

    INSERT INTO movimiento (
        motivo,
        tipo_movimiento,
        id_usuario,
        id_pedido
    )
    SELECT
        'Daño',
        'salida',
        id_usuario,
        NULL
    FROM usuario
    WHERE usuario_login = 'admin01'
    RETURNING id_movimiento
    INTO v_movimiento;

    INSERT INTO detalle_movimiento (
        id_movimiento,
        id_producto,
        cantidad
    )
    VALUES (
        v_movimiento,
        v_producto,
        1.00
    );

    RAISE NOTICE
        'Daño registrado. Movimiento: %, Producto: %, Cantidad: 1.',
        v_movimiento,
        v_producto;

END;
$$;


/* ------------------------------------------------------------
   11.4 DEFECTO
   ------------------------------------------------------------ */

DO $$
DECLARE
    v_movimiento INTEGER;
    v_producto INTEGER;
BEGIN

    SELECT id_producto
    INTO v_producto
    FROM producto
    WHERE nombre = 'Veladora Morada Religiosa';

    INSERT INTO movimiento (
        motivo,
        tipo_movimiento,
        id_usuario,
        id_pedido
    )
    SELECT
        'Defecto',
        'salida',
        id_usuario,
        NULL
    FROM usuario
    WHERE usuario_login = 'admin01'
    RETURNING id_movimiento
    INTO v_movimiento;

    INSERT INTO detalle_movimiento (
        id_movimiento,
        id_producto,
        cantidad
    )
    VALUES (
        v_movimiento,
        v_producto,
        1.00
    );

    RAISE NOTICE
        'Defecto registrado. Movimiento: %, Producto: %, Cantidad: 1.',
        v_movimiento,
        v_producto;

END;
$$;


/* ============================================================
   12. PRUEBAS DE PEDIDOS
   ============================================================ */


/* ------------------------------------------------------------
   12.1 CONSULTAR STOCK ANTES DE PROCESAR PEDIDO
   ------------------------------------------------------------ */

SELECT
    id_producto,
    nombre,
    stock_actual
FROM producto
WHERE nombre IN (
    'Veladora Blanca Clásica',
    'Veladora Roja Aromática'
)
ORDER BY id_producto;


/* ------------------------------------------------------------
   12.2 CAMBIAR PEDIDO A ALISTAMIENTO
   ------------------------------------------------------------

   El trigger automáticamente:

   PEDIDO
      ↓
   MOVIMIENTO Venta
      ↓
   DETALLE_MOVIMIENTO
      ↓
   descuento de stock
   ------------------------------------------------------------ */

UPDATE pedido
SET estado_pedido = 'Alistamiento'
WHERE id_pedido = (
    SELECT p.id_pedido
    FROM pedido p
    INNER JOIN usuario u
        ON p.id_cliente = u.id_usuario
    WHERE u.usuario_login = 'cliente01'
      AND p.canal = 'persona'
);


/* ------------------------------------------------------------
   12.3 VERIFICAR MOVIMIENTO DE VENTA
   ------------------------------------------------------------ */

SELECT
    m.id_movimiento,
    m.motivo,
    m.tipo_movimiento,
    m.id_usuario,
    m.id_pedido,
    m.fecha_hora
FROM movimiento m
WHERE m.motivo = 'Venta'
ORDER BY m.id_movimiento;


/* ------------------------------------------------------------
   12.4 VERIFICAR DETALLE DEL MOVIMIENTO DE VENTA
   ------------------------------------------------------------ */

SELECT
    dm.id_movimiento,
    dm.id_producto,
    p.nombre,
    dm.cantidad
FROM detalle_movimiento dm
INNER JOIN producto p
    ON dm.id_producto = p.id_producto
INNER JOIN movimiento m
    ON dm.id_movimiento = m.id_movimiento
WHERE m.motivo = 'Venta'
ORDER BY dm.id_movimiento, dm.id_producto;


/* ------------------------------------------------------------
   12.5 VERIFICAR STOCK DESPUÉS DE LA VENTA
   ------------------------------------------------------------ */

SELECT
    id_producto,
    nombre,
    stock_actual
FROM producto
WHERE nombre IN (
    'Veladora Blanca Clásica',
    'Veladora Roja Aromática'
)
ORDER BY id_producto;


/* ------------------------------------------------------------
   12.6 INTENTAR PROCESAR EL MISMO PEDIDO OTRA VEZ
   ------------------------------------------------------------

   El pedido ya está en Alistamiento, por lo tanto esta
   actualización no genera otro movimiento.

   Además existe el índice UNIQUE parcial.
   ------------------------------------------------------------ */

UPDATE pedido
SET estado_pedido = 'Alistamiento'
WHERE id_pedido = (
    SELECT p.id_pedido
    FROM pedido p
    INNER JOIN usuario u
        ON p.id_cliente = u.id_usuario
    WHERE u.usuario_login = 'cliente01'
      AND p.canal = 'persona'
);


/* ------------------------------------------------------------
   12.7 VERIFICAR QUE SOLO EXISTE UNA VENTA
   ------------------------------------------------------------ */

SELECT
    id_pedido,
    COUNT(*) AS cantidad_movimientos_venta
FROM movimiento
WHERE motivo = 'Venta'
GROUP BY id_pedido;


/* ============================================================
   13. PRUEBA DE STOCK INSUFICIENTE
   ============================================================ */

DO $$
DECLARE
    v_movimiento INTEGER;
    v_producto INTEGER;
    v_stock INTEGER;
BEGIN

    SELECT id_producto, stock_actual
    INTO v_producto, v_stock
    FROM producto
    WHERE nombre = 'Veladora Morada Religiosa';

    BEGIN

        INSERT INTO movimiento (
            motivo,
            tipo_movimiento,
            id_usuario,
            id_pedido
        )
        SELECT
            'Daño',
            'salida',
            id_usuario,
            NULL
        FROM usuario
        WHERE usuario_login = 'admin01'
        RETURNING id_movimiento
        INTO v_movimiento;


        INSERT INTO detalle_movimiento (
            id_movimiento,
            id_producto,
            cantidad
        )
        VALUES (
            v_movimiento,
            v_producto,
            (v_stock + 10)
        );

        RAISE EXCEPTION
            'ERROR: la prueba de stock insuficiente no falló.';

    EXCEPTION
        WHEN OTHERS THEN

            RAISE NOTICE
                'PRUEBA CORRECTA: se impidió una salida que dejaba stock negativo.';

            RAISE NOTICE
                'Mensaje: %',
                SQLERRM;

    END;

END;
$$;


/* ============================================================
   14. PRUEBA DE MOTIVO INCORRECTO
   ============================================================ */


/* Entrada + Daño */
DO $$
BEGIN

    BEGIN

        INSERT INTO movimiento (
            motivo,
            tipo_movimiento,
            id_usuario,
            id_pedido
        )
        SELECT
            'Daño',
            'entrada',
            id_usuario,
            NULL
        FROM usuario
        WHERE usuario_login = 'admin01';

        RAISE EXCEPTION
            'ERROR: entrada + Daño fue aceptado incorrectamente.';

    EXCEPTION
        WHEN OTHERS THEN

            RAISE NOTICE
                'PRUEBA CORRECTA: entrada + Daño fue rechazado.';

    END;

END;
$$;


/* Salida + Producción */
DO $$
BEGIN

    BEGIN

        INSERT INTO movimiento (
            motivo,
            tipo_movimiento,
            id_usuario,
            id_pedido
        )
        SELECT
            'Producción',
            'salida',
            id_usuario,
            NULL
        FROM usuario
        WHERE usuario_login = 'admin01';

        RAISE EXCEPTION
            'ERROR: salida + Producción fue aceptado incorrectamente.';

    EXCEPTION
        WHEN OTHERS THEN

            RAISE NOTICE
                'PRUEBA CORRECTA: salida + Producción fue rechazado.';

    END;

END;
$$;


/* ============================================================
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
