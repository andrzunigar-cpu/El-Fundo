-- ============================================================
--  Carnicería El Fundo — Inicialización PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda full-text
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- índices compuestos

-- Schemas para separar dominio
CREATE SCHEMA IF NOT EXISTS catalog;    -- productos, categorías, precios
CREATE SCHEMA IF NOT EXISTS sales;      -- ventas, pedidos, facturas
CREATE SCHEMA IF NOT EXISTS inventory; -- stock, movimientos
CREATE SCHEMA IF NOT EXISTS customers; -- clientes, direcciones
CREATE SCHEMA IF NOT EXISTS branches;  -- sucursales (multi-tienda futuro)
CREATE SCHEMA IF NOT EXISTS sync;      -- cola de sincronización

-- Roles de base de datos
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'elfundo_app') THEN
    CREATE ROLE elfundo_app LOGIN PASSWORD 'change_me_app_password';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'elfundo_readonly') THEN
    CREATE ROLE elfundo_readonly LOGIN PASSWORD 'change_me_readonly_password';
  END IF;
END$$;

GRANT USAGE ON SCHEMA catalog, sales, inventory, customers, branches, sync TO elfundo_app;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO elfundo_readonly;
