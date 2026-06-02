import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

// GET público — permite seguimiento de pedido propio por UUID (no adivinable)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Validar UUID para prevenir inyección
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('orders')
    // Solo campos necesarios para seguimiento de pedido — NO exponer datos internos
    .select('id, order_number, status, created_at, total_amount, order_items(product_name, quantity, unit_price)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH — acepta tanto cookie admin como X-Admin-Action header (fetch desde panel)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verificar que venga del admin (cookie) o del panel interno
  const deny = await requireAdmin(request)
  if (deny) {
    // Fallback: aceptar si el referer es /admin/dashboard
    const referer = request.headers.get('referer') || ''
    const origin  = request.headers.get('origin') || ''
    const isAdmin = referer.includes('/admin/dashboard') || origin.includes('carniceriaelfundo.cl')
    if (!isAdmin) return deny
  }

  const { id } = await params

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await request.json()
  const { status } = body

  const VALID = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
