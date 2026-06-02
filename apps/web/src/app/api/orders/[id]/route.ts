import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

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

// PATCH — actualizar estado del pedido
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

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

// DELETE — eliminar pedido
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  // Eliminar items primero, luego el pedido
  await getSupabase().from('order_items').delete().eq('order_id', id)
  await getSupabase().from('webpay_transactions').update({ order_id: null }).eq('order_id', id)
  const { error } = await getSupabase().from('orders').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
