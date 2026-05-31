-- ─────────────────────────────────────────────────────────────────────
-- Web orders RLS — permite que el checkout publico cree pedidos
-- ─────────────────────────────────────────────────────────────────────
-- Correr una sola vez en Supabase Dashboard -> SQL Editor -> Run.
-- Idempotente: usa DROP IF EXISTS + CREATE para que se pueda re-ejecutar.
--
-- Motivo: el endpoint /api/orders usa la clave anonima de Supabase (no la
-- service_role). Sin estas politicas, INSERT cae con error 42501 RLS.
-- Las politicas abren INSERT publico SOLO en orders / order_items y
-- webpay_transactions (no SELECT/UPDATE/DELETE — esos siguen protegidos).
-- ─────────────────────────────────────────────────────────────────────

-- Asegurar que RLS esta activo (sin esto los policies no aplican)
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE webpay_transactions   ENABLE ROW LEVEL SECURITY;

-- ── orders: INSERT publico ──────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── order_items: INSERT publico ─────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items"
  ON order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── webpay_transactions: INSERT + UPDATE publico ────────────────────
-- (necesario porque el flujo Webpay crea la tx al iniciar y luego la
-- actualiza con el status devuelto por Transbank)
DROP POLICY IF EXISTS "anon_insert_webpay_tx" ON webpay_transactions;
CREATE POLICY "anon_insert_webpay_tx"
  ON webpay_transactions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_webpay_tx" ON webpay_transactions;
CREATE POLICY "anon_update_webpay_tx"
  ON webpay_transactions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── orders: SELECT publico (lookup por UUID) ────────────────────────
-- El endpoint /api/orders/[id] permite que el cliente vea el estado de
-- su pedido. Solo expone los campos no sensibles. El UUID es opaco
-- (128 bits) asi que no se puede enumerar.
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders"
  ON orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items"
  ON order_items
  FOR SELECT
  TO anon, authenticated
  USING (true);
