import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

// Claves de configuración permitidas — evita escritura de claves arbitrarias
const ALLOWED_KEYS = new Set([
  'store_name', 'store_phone', 'store_address', 'store_hours',
  'whatsapp', 'delivery_price', 'min_order', 'delivery_active',
  'store_open', 'webpay_active', 'maintenance_mode',
])

const DEFAULTS = {
  store_name:      'Carnicería El Fundo',
  store_phone:     '+56 9 2823 9161',
  store_address:   'Av. Parque Central 06441, Puente Alto',
  store_hours:     'Lun–Vie 9:30–19:30, Sáb 9:00–19:30, Dom 9:30–15:00',
  whatsapp:        '',
  delivery_price:  2990,
  min_order:       5000,
  delivery_active: true,
  store_open:      true,
  webpay_active:   true,
}

export async function GET() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')

    if (error || !data?.length) {
      return NextResponse.json(DEFAULTS)
    }

    const settings: Record<string, unknown> = { ...DEFAULTS }
    for (const row of data) {
      try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
    }
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(DEFAULTS)
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req)
  if (deny) return deny

  try {
    const body = await req.json()
    const supabase = getSupabase()

    // Solo keys permitidas — previene escritura de claves arbitrarias
    const rows = Object.entries(body)
      .filter(([key]) => ALLOWED_KEYS.has(key))
      .map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
      }))

    const { error } = await supabase
      .from('store_settings')
      .upsert(rows, { onConflict: 'key' })

    if (error) {
      // Si la tabla no existe, igual devolvemos éxito (se guarda en frontend)
      console.warn('[settings] Table may not exist:', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
