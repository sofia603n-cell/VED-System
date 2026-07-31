--Datos de Pueba

INSERT INTO roles (nombre_rol) VALUES
('ADMIN'),
('SUPER_ADMIN');



INSERT INTO usuario (nombre, dni, contraseña, rol, estado) VALUES
('Carlos Rodriguez', '1012456789', '12345', 'SUPER_ADMIN', TRUE),
('Maria Lopez', '1023567890', '12345', 'ADMIN', TRUE),
('Juan Perez', '1034678901', '12345', 'ADMIN', TRUE),
('Laura Gomez', '1045789012', '12345', 'ADMIN', TRUE),
('Andres Martinez', '1056890123', '12345', 'SUPER_ADMIN', TRUE);




INSERT INTO producto (nombre, tipo, precio, stock_actual, stock_minimo) VALUES
('Vela Blanca Grande', 'Vela religiosa', 15000.00, 50, 10),
('Vela Blanca Pequeña', 'Vela religiosa', 5000.00, 100, 20),
('Vela Roja Amor', 'Vela decorativa', 8000.00, 40, 10),
('Vela Azul Esperanza', 'Vela decorativa', 8500.00, 35, 10),
('Vela Verde Prosperidad', 'Vela decorativa', 9000.00, 30, 5),
('Vela Aromática Lavanda', 'Aromática', 12000.00, 25, 5),
('Vela Aromática Canela', 'Aromática', 13000.00, 20, 5),
('Vela Virgen Maria', 'Religiosa', 20000.00, 15, 5),
('Vela San Judas', 'Religiosa', 18000.00, 12, 5),
('Vela Personalizada', 'Decorativa', 25000.00, 10, 3);





INSERT INTO inventario (id_producto, stock_actual, stock_minimo) VALUES
(1,50,10),
(2,100,20),
(3,40,10),
(4,35,10),
(5,30,5),
(6,25,5),
(7,20,5),
(8,15,5),
(9,12,5),
(10,10,3);




INSERT INTO venta (fecha_venta, id_usuario) VALUES
('2026-07-01 10:30:00',2),
('2026-07-03 15:20:00',3),
('2026-07-05 09:45:00',2),
('2026-07-10 14:10:00',4),
('2026-07-15 17:00:00',1);



INSERT INTO detalle_venta 
(id_venta, id_producto, cantidad, precio_unitario, total) VALUES

(1,1,2,15000.00,30000.00),
(1,3,1,8000.00,8000.00),

(2,2,5,5000.00,25000.00),
(2,6,2,12000.00,24000.00),

(3,8,1,20000.00,20000.00),
(3,4,2,8500.00,17000.00),

(4,5,3,9000.00,27000.00),
(4,7,1,13000.00,13000.00),

(5,10,2,25000.00,50000.00);




INSERT INTO movimientos (tipo_movimiento, id_usuario) VALUES
('REGISTRO PRODUCTO',1),
('ACTUALIZACION STOCK',2),
('VENTA REALIZADA',2),
('VENTA REALIZADA',3),
('INGRESO INVENTARIO',1),
('ELIMINACION PRODUCTO',5);