/* ============================================================
    TRIGGERS
   ============================================================ */


/* ------------------------------------------------------------
   Trigger para validar roles en pedido
   ------------------------------------------------------------ */

CREATE TRIGGER trg_validar_roles_pedido
BEFORE INSERT OR UPDATE OF id_cliente, id_vendedor
ON pedido
FOR EACH ROW
EXECUTE FUNCTION fn_validar_roles_pedido();


/* ------------------------------------------------------------
   Trigger para validar movimiento
   ------------------------------------------------------------ */

CREATE TRIGGER trg_validar_movimiento
BEFORE INSERT OR UPDATE
ON movimiento
FOR EACH ROW
EXECUTE FUNCTION fn_validar_movimiento();


/* ------------------------------------------------------------
   Trigger para actualizar stock al insertar detalle
   ------------------------------------------------------------ */

CREATE TRIGGER trg_insertar_detalle_movimiento_stock
AFTER INSERT
ON detalle_movimiento
FOR EACH ROW
EXECUTE FUNCTION fn_aplicar_stock_detalle();


/* ------------------------------------------------------------
   Trigger para controlar modificaciones
   ------------------------------------------------------------ */

CREATE TRIGGER trg_actualizar_detalle_movimiento_stock
BEFORE UPDATE
ON detalle_movimiento
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_stock_detalle();


/* ------------------------------------------------------------
   Trigger para revertir stock al eliminar detalle
   ------------------------------------------------------------ */

CREATE TRIGGER trg_eliminar_detalle_movimiento_stock
BEFORE DELETE
ON detalle_movimiento
FOR EACH ROW
EXECUTE FUNCTION fn_revertir_stock_detalle();


/* ------------------------------------------------------------
   Trigger para crear automáticamente Venta
   ------------------------------------------------------------ */

CREATE TRIGGER trg_crear_movimiento_venta
AFTER UPDATE OF estado_pedido
ON pedido
FOR EACH ROW
EXECUTE FUNCTION fn_crear_movimiento_venta();


/* ------------------------------------------------------------
   Trigger adicional para impedir stock negativo
   ------------------------------------------------------------ */

CREATE TRIGGER trg_validar_stock_producto
BEFORE INSERT OR UPDATE OF stock_actual
ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_validar_stock_no_negativo();


