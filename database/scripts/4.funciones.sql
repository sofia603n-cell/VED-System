/* ------------------------------------------------------------
   FUNCIÓN 1
   Validar cliente y vendedor del pedido.
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION fn_validar_roles_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    rol_cliente rol_usuario;
    rol_vendedor rol_usuario;
BEGIN

    /* Validar cliente */
    SELECT rol
    INTO rol_cliente
    FROM usuario
    WHERE id_usuario = NEW.id_cliente;

    IF rol_cliente IS NULL THEN
        RAISE EXCEPTION
            'El cliente con id_usuario % no existe.',
            NEW.id_cliente;
    END IF;

    IF rol_cliente <> 'cliente' THEN
        RAISE EXCEPTION
            'El usuario % no puede ser cliente del pedido porque su rol es %.',
            NEW.id_cliente,
            rol_cliente;
    END IF;


    /* Validar vendedor */
    SELECT rol
    INTO rol_vendedor
    FROM usuario
    WHERE id_usuario = NEW.id_vendedor;

    IF rol_vendedor IS NULL THEN
        RAISE EXCEPTION
            'El vendedor con id_usuario % no existe.',
            NEW.id_vendedor;
    END IF;

    IF rol_vendedor NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION
            'El usuario % no puede ser vendedor porque su rol es %.',
            NEW.id_vendedor,
            rol_vendedor;
    END IF;


    RETURN NEW;
END;
$$;


/* ------------------------------------------------------------
   FUNCIÓN 2
   Validar reglas de movimiento.
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION fn_validar_movimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    rol_responsable rol_usuario;
    estado_actual estado_pedido_enum;
BEGIN

    /* -----------------------------------------------
       Validación de responsable
       ----------------------------------------------- */

    SELECT rol
    INTO rol_responsable
    FROM usuario
    WHERE id_usuario = NEW.id_usuario;

    IF rol_responsable IS NULL THEN
        RAISE EXCEPTION
            'El usuario responsable % no existe.',
            NEW.id_usuario;
    END IF;


    /* -----------------------------------------------
       Validación de tipo + motivo
       ----------------------------------------------- */

    IF NEW.tipo_movimiento = 'entrada' THEN

        IF NEW.motivo NOT IN ('Producción', 'Reembolso') THEN
            RAISE EXCEPTION
                'Motivo inválido: % para un movimiento de entrada.',
                NEW.motivo;
        END IF;

    ELSIF NEW.tipo_movimiento = 'salida' THEN

        IF NEW.motivo NOT IN ('Venta', 'Daño', 'Defecto') THEN
            RAISE EXCEPTION
                'Motivo inválido: % para un movimiento de salida.',
                NEW.motivo;
        END IF;

    END IF;


    /* -----------------------------------------------
       Venta obligatoriamente relacionada con pedido
       ----------------------------------------------- */

    IF NEW.motivo = 'Venta' THEN

        IF NEW.tipo_movimiento <> 'salida' THEN
            RAISE EXCEPTION
                'Una Venta solamente puede ser una salida.';
        END IF;

        IF NEW.id_pedido IS NULL THEN
            RAISE EXCEPTION
                'Un movimiento de Venta debe estar relacionado con un pedido.';
        END IF;

        SELECT estado_pedido
        INTO estado_actual
        FROM pedido
        WHERE id_pedido = NEW.id_pedido;

        IF estado_actual IS NULL THEN
            RAISE EXCEPTION
                'El pedido % no existe.',
                NEW.id_pedido;
        END IF;

        IF estado_actual <> 'Alistamiento' THEN
            RAISE EXCEPTION
                'El movimiento de Venta solo puede generarse para un pedido en Alistamiento. Estado actual: %.',
                estado_actual;
        END IF;

    END IF;


    /* -----------------------------------------------
       Producción normalmente no tiene pedido
       ----------------------------------------------- */

    IF NEW.motivo = 'Producción' THEN

        IF NEW.tipo_movimiento <> 'entrada' THEN
            RAISE EXCEPTION
                'Producción solamente puede ser una entrada.';
        END IF;

        IF NEW.id_pedido IS NOT NULL THEN
            RAISE EXCEPTION
                'Una Producción no puede estar asociada a un pedido.';
        END IF;

    END IF;


    /* -----------------------------------------------
       Daño no tiene pedido
       ----------------------------------------------- */

    IF NEW.motivo = 'Daño' THEN

        IF NEW.tipo_movimiento <> 'salida' THEN
            RAISE EXCEPTION
                'Daño solamente puede ser una salida.';
        END IF;

        IF NEW.id_pedido IS NOT NULL THEN
            RAISE EXCEPTION
                'Un Daño no puede estar asociado a un pedido.';
        END IF;

    END IF;


    /* -----------------------------------------------
       Defecto no tiene pedido
       ----------------------------------------------- */

    IF NEW.motivo = 'Defecto' THEN

        IF NEW.tipo_movimiento <> 'salida' THEN
            RAISE EXCEPTION
                'Defecto solamente puede ser una salida.';
        END IF;

        IF NEW.id_pedido IS NOT NULL THEN
            RAISE EXCEPTION
                'Un Defecto no puede estar asociado a un pedido.';
        END IF;

    END IF;


    /* -----------------------------------------------
       Reembolso puede estar o no relacionado
       con un pedido.
       ----------------------------------------------- */

    IF NEW.motivo = 'Reembolso' THEN

        IF NEW.tipo_movimiento <> 'entrada' THEN
            RAISE EXCEPTION
                'Reembolso solamente puede ser una entrada.';
        END IF;

    END IF;


    RETURN NEW;
END;
$$;


/* ------------------------------------------------------------
   FUNCIÓN 3
   Aplicar el efecto de un detalle de movimiento al stock.
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION fn_aplicar_stock_detalle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    tipo tipo_movimiento_enum;
    stock_disponible INTEGER;
BEGIN

    SELECT tipo_movimiento
    INTO tipo
    FROM movimiento
    WHERE id_movimiento = NEW.id_movimiento
    FOR UPDATE;

    IF tipo IS NULL THEN
        RAISE EXCEPTION
            'No existe el movimiento %.',
            NEW.id_movimiento;
    END IF;


    /* ENTRADA */
    IF tipo = 'entrada' THEN

        UPDATE producto
        SET stock_actual = stock_actual + NEW.cantidad::INTEGER
        WHERE id_producto = NEW.id_producto;


    /* SALIDA */
    ELSIF tipo = 'salida' THEN

        SELECT stock_actual
        INTO stock_disponible
        FROM producto
        WHERE id_producto = NEW.id_producto
        FOR UPDATE;

        IF stock_disponible IS NULL THEN
            RAISE EXCEPTION
                'El producto % no existe.',
                NEW.id_producto;
        END IF;

        IF stock_disponible < NEW.cantidad THEN
            RAISE EXCEPTION
                'Stock insuficiente para el producto %. Stock disponible: %, cantidad solicitada: %.',
                NEW.id_producto,
                stock_disponible,
                NEW.cantidad;
        END IF;

        UPDATE producto
        SET stock_actual = stock_actual - NEW.cantidad::INTEGER
        WHERE id_producto = NEW.id_producto;

    END IF;


    RETURN NEW;
END;
$$;


/* ------------------------------------------------------------
   FUNCIÓN 4
   Controlar modificaciones de detalle_movimiento.
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION fn_actualizar_stock_detalle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    tipo_anterior tipo_movimiento_enum;
    tipo_nuevo tipo_movimiento_enum;
    stock_disponible INTEGER;
BEGIN

    /* -----------------------------------------------
       Obtener tipo anterior
       ----------------------------------------------- */

    SELECT tipo_movimiento
    INTO tipo_anterior
    FROM movimiento
    WHERE id_movimiento = OLD.id_movimiento
    FOR UPDATE;

    /* -----------------------------------------------
       Revertir efecto anterior
       ----------------------------------------------- */

    IF tipo_anterior = 'entrada' THEN

        UPDATE producto
        SET stock_actual = stock_actual - OLD.cantidad::INTEGER
        WHERE id_producto = OLD.id_producto;

    ELSIF tipo_anterior = 'salida' THEN

        UPDATE producto
        SET stock_actual = stock_actual + OLD.cantidad::INTEGER
        WHERE id_producto = OLD.id_producto;

    END IF;


    /* -----------------------------------------------
       Obtener tipo nuevo
       ----------------------------------------------- */

    SELECT tipo_movimiento
    INTO tipo_nuevo
    FROM movimiento
    WHERE id_movimiento = NEW.id_movimiento
    FOR UPDATE;

    /* -----------------------------------------------
       Aplicar nuevo efecto
       ----------------------------------------------- */

    IF tipo_nuevo = 'entrada' THEN

        UPDATE producto
        SET stock_actual = stock_actual + NEW.cantidad::INTEGER
        WHERE id_producto = NEW.id_producto;

    ELSIF tipo_nuevo = 'salida' THEN

        SELECT stock_actual
        INTO stock_disponible
        FROM producto
        WHERE id_producto = NEW.id_producto
        FOR UPDATE;

        IF stock_disponible < NEW.cantidad THEN

            RAISE EXCEPTION
                'La modificación dejaría el stock negativo para el producto %. Stock disponible: %, cantidad solicitada: %.',
                NEW.id_producto,
                stock_disponible,
                NEW.cantidad;

        END IF;

        UPDATE producto
        SET stock_actual = stock_actual - NEW.cantidad::INTEGER
        WHERE id_producto = NEW.id_producto;

    END IF;


    RETURN NEW;
END;
$$;


/* ------------------------------------------------------------
   FUNCIÓN 5
   Revertir stock al eliminar detalle_movimiento.
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION fn_revertir_stock_detalle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    tipo tipo_movimiento_enum;
BEGIN

    SELECT tipo_movimiento
    INTO tipo
    FROM movimiento
    WHERE id_movimiento = OLD.id_movimiento
    FOR UPDATE;

    IF tipo = 'entrada' THEN

        UPDATE producto
        SET stock_actual = stock_actual - OLD.cantidad::INTEGER
        WHERE id_producto = OLD.id_producto;

    ELSIF tipo = 'salida' THEN

        UPDATE producto
        SET stock_actual = stock_actual + OLD.cantidad::INTEGER
        WHERE id_producto = OLD.id_producto;

    END IF;


    RETURN OLD;
END;
$$;


/* ------------------------------------------------------------
   FUNCIÓN 6
   Crear movimiento de Venta cuando el pedido pasa a
   Alistamiento.
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION fn_crear_movimiento_venta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    nuevo_movimiento INTEGER;
    detalle RECORD;
BEGIN

    /* Solo ejecutar cuando cambia a Alistamiento */
    IF NEW.estado_pedido = 'Alistamiento'
       AND OLD.estado_pedido IS DISTINCT FROM 'Alistamiento'
    THEN

        /* Evitar doble movimiento */
        IF EXISTS (
            SELECT 1
            FROM movimiento
            WHERE id_pedido = NEW.id_pedido
              AND motivo = 'Venta'
        ) THEN

            RETURN NEW;

        END IF;


        /* -----------------------------------------------
           Crear movimiento
           ----------------------------------------------- */

        INSERT INTO movimiento (
            motivo,
            tipo_movimiento,
            id_usuario,
            id_pedido
        )
        VALUES (
            'Venta',
            'salida',
            NEW.id_vendedor,
            NEW.id_pedido
        )
        RETURNING id_movimiento
        INTO nuevo_movimiento;


        /* -----------------------------------------------
           Copiar detalle_pedido hacia
           detalle_movimiento
           ----------------------------------------------- */

        FOR detalle IN
            SELECT
                id_producto,
                cantidad
            FROM detalle_pedido
            WHERE id_pedido = NEW.id_pedido
        LOOP

            INSERT INTO detalle_movimiento (
                id_movimiento,
                id_producto,
                cantidad
            )
            VALUES (
                nuevo_movimiento,
                detalle.id_producto,
                detalle.cantidad
            );

        END LOOP;

    END IF;


    RETURN NEW;
END;
$$;


/* ------------------------------------------------------------
   FUNCIÓN 7
   Validar que el stock nunca quede negativo.
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION fn_validar_stock_no_negativo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    IF NEW.stock_actual < 0 THEN

        RAISE EXCEPTION
            'El stock del producto % no puede ser negativo. Valor calculado: %.',
            NEW.id_producto,
            NEW.stock_actual;

    END IF;

    RETURN NEW;
END;
$$;