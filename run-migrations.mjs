/**
 * Script de migración para Supabase - El Fundo
 * Ejecutar: node run-migrations.mjs
 *
 * Requiere variable DB_PASSWORD o editar directamente abajo.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tubrjgkzookemtnvpvdg.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Fallback: intentar via Management API con PAT
const SUPABASE_PAT = process.env.SUPABASE_ACCESS_TOKEN || ''
const PROJECT_REF = 'tubrjgkzookemtnvpvdg'

const MIGRATIONS = [
  { name: 'unit en products',           sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'kg'` },
  { name: 'promotional_price',          sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS promotional_price integer` },
  { name: 'promo_label',                sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_label text` },
  { name: 'promo_ends_at',              sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_ends_at timestamptz` },
  { name: 'scheduled_for en orders',    sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for timestamptz` },
  { name: 'delivery_type en orders',    sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'delivery'` },
  { name: 'shipping_cost en orders',    sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost integer DEFAULT 0` },
  { name: 'product_name en order_items',sql: `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name text` },
  { name: 'crear store_settings',       sql: `CREATE TABLE IF NOT EXISTS store_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz DEFAULT now())` },
  { name: 'RLS store_settings',         sql: `ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY` },
  { name: 'Policy store_settings',      sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_settings' AND policyname='anon all') THEN CREATE POLICY "anon all" ON store_settings FOR ALL USING (true) WITH CHECK (true); END IF; END $$` },
]

async function runViaManagementAPI() {
  if (!SUPABASE_PAT) {
    console.log('❌ No hay SUPABASE_ACCESS_TOKEN. Skipping Management API.')
    return false
  }

  console.log('🔑 Usando Supabase Management API con PAT...\n')
  let allOk = true

  for (const m of MIGRATIONS) {
    const resp = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: m.sql }),
    })
    const result = await resp.json()
    if (resp.ok) {
      console.log(`✅ ${m.name}`)
    } else {
      console.error(`❌ ${m.name}: ${JSON.stringify(result)}`)
      allOk = false
    }
  }
  return allOk
}

async function runViaServiceRole() {
  if (!SERVICE_ROLE_KEY) {
    console.log('❌ No hay SUPABASE_SERVICE_ROLE_KEY. Skipping service role.')
    return false
  }

  console.log('🔑 Usando service role key...\n')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  for (const m of MIGRATIONS) {
    const { error } = await supabase.rpc('exec_sql', { sql: m.sql })
    if (error) {
      console.error(`❌ ${m.name}: ${error.message}`)
    } else {
      console.log(`✅ ${m.name}`)
    }
  }
  return true
}

async function main() {
  console.log('🥩 El Fundo — Migraciones SQL\n')

  // Intentar primero con PAT (Management API)
  const ok = await runViaManagementAPI()
  if (ok) {
    console.log('\n✅ Todas las migraciones completadas via Management API')
    return
  }

  // Intentar con service role
  const ok2 = await runViaServiceRole()
  if (ok2) {
    console.log('\n✅ Migraciones completadas via service role')
    return
  }

  // Ninguno funcionó
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  No se pudo ejecutar las migraciones automáticamente.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para ejecutarlas manualmente:
1. Ir a https://supabase.com/dashboard/project/tubrjgkzookemtnvpvdg/sql/new
2. Pegar y ejecutar el SQL del archivo memory/el_fundo_pendientes.md

Alternativa — con token personal (PAT):
1. Ir a https://supabase.com/dashboard/account/tokens
2. Crear un token nuevo
3. Ejecutar: SUPABASE_ACCESS_TOKEN=<tu_token> node run-migrations.mjs
`)
}

main().catch(console.error)
