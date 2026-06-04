import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET público — permite seguimiento de pedido por UUID completo o ID corto (8 chars)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id || id.length < 6) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const sb = getSupabase()
  let query = sb
    .from('orders')
    .select('id, order_number, status, created_at, total_amount, shipping_cost, delivery_type, payment_method, customer_name, customer_phone, customer_address, notes, scheduled_for, order_items(id, product_name, product_id, quantity, unit_price, subtotal)')

  // Si es UUID completo (36 chars) buscar exacto, si es corto buscar por prefijo
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    query = query.eq('id', id)
  } else {
    // Búsqueda por los primeros 8 caracteres del UUID (case-insensitive)
    query = query.ilike('id', `${id.toLowerCase()}%`)
  }

  const { data, error } = await query.single()

  if (error || !data) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
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
