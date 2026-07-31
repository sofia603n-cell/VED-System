CREATE VIEW productos_bajo_stock AS
SELECT nombre_producto, stock
FROM producto
WHERE stock <= 10;



CREATE VIEW ventas_por_usuario AS
SELECT u.nombre_usuario, COUNT(v.id_venta) AS total_ventas
FROM usuario u
JOIN venta v ON u.id_usuario = v.id_usuario
GROUP BY u.nombre_usuario;




