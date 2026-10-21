-- =====================================================================
-- Script de base de datos - Actividad Sumativa Unidad 2 (Docker)
-- Motor: MySQL 8.0
--
-- Modelo entidad-relacion:
--
--   +------------------+ 1                N +--------------------+
--   |     clientes     |--------------------<|      pedidos       |
--   +------------------+   (un cliente tiene |--------------------+
--   | PK id_cliente    |    muchos pedidos)  | PK id_pedido       |
--   |    nombre        |                     | FK id_cliente      |
--   |    correo (UQ)   |                     |    producto        |
--   |    fecha_nacim.  |                     |    cantidad        |
--   |    activo        |                     |    precio_unitario |
--   |    saldo         |                     |    fecha_pedido    |
--   |    fecha_registro|                     |    entregado       |
--   +------------------+                     +--------------------+
--
-- Este script lo ejecuta MySQL automaticamente la primera vez que arranca
-- el contenedor (carpeta /docker-entrypoint-initdb.d de la imagen).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS tienda_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tienda_db;

-- ---------------------------------------------------------------------
-- Tabla 1: clientes (7 columnas)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente       INT            NOT NULL AUTO_INCREMENT,   -- entero
  nombre           VARCHAR(80)    NOT NULL,                  -- caracter
  correo           VARCHAR(100)   NOT NULL,                  -- caracter (unico)
  fecha_nacimiento DATE           NOT NULL,                  -- fecha
  activo           BOOLEAN        NOT NULL DEFAULT TRUE,     -- booleano
  saldo            DECIMAL(10,2)  NOT NULL DEFAULT 0.00,     -- decimal
  fecha_registro   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP, -- fecha y hora
  PRIMARY KEY (id_cliente),
  UNIQUE KEY uq_clientes_correo (correo)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla 2: pedidos (7 columnas) - depende de clientes (llave foranea)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido       INT            NOT NULL AUTO_INCREMENT,    -- entero
  id_cliente      INT            NOT NULL,                   -- entero (FK)
  producto        VARCHAR(100)   NOT NULL,                   -- caracter
  cantidad        SMALLINT       NOT NULL DEFAULT 1,         -- entero pequeno
  precio_unitario DECIMAL(10,2)  NOT NULL,                   -- decimal
  fecha_pedido    DATE           NOT NULL,                   -- fecha
  entregado       BOOLEAN        NOT NULL DEFAULT FALSE,     -- booleano
  PRIMARY KEY (id_pedido),
  KEY idx_pedidos_cliente (id_cliente),
  CONSTRAINT fk_pedidos_clientes
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Consultas de ejemplo (para mostrar en el video, ejecutar a mano)
-- ---------------------------------------------------------------------
-- SHOW TABLES;
-- DESCRIBE clientes;
-- DESCRIBE pedidos;
-- SELECT c.nombre, p.producto, p.cantidad, p.precio_unitario, p.fecha_pedido
--   FROM pedidos p JOIN clientes c ON c.id_cliente = p.id_cliente;
