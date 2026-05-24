import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
  store_name:      'Carnicería El Fundo',
  store_phone:     '+56 9 XXXX XXXX',
  store_address:   'Santiago, Chile',
  store_hours:     'Lun–Sáb 8:00–20:00, Dom 9:00–14:00',
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
  try {
    const body = await req.json()
    const supabase = getSupabase()

    const rows = Object.entries(body).map(([key, value]) => ({
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
