import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET público — busca pedido por UUID, código corto (8 chars) o teléfono
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id || id.length < 4) {
    return NextResponse.json({ error: 'Ingresa un código de pedido o teléfono válido' }, { status: 400 })
  }

  const SELECT = 'id, order_number, status, created_at, total_amount, shipping_cost, delivery_type, payment_method, customer_name, customer_phone, customer_address, notes, scheduled_for, order_items(id, product_name, product_id, quantity, unit_price, subtotal)'
  const sb = getSupabase()

  // 1. UUID completo (36 chars)
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const { data } = await sb.from('orders').select(SELECT).eq('id', id).single()
    if (data) return NextResponse.json(data)
  }

  // 2. Código corto (primeros 6-8 chars del UUID)
  if (id.length >= 6 && /^[0-9a-f]+$/i.test(id)) {
    const { data } = await sb.from('orders').select(SELECT)
      .ilike('id', `${id.toLowerCase()}%`)
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) return NextResponse.json(data[0])
  }

  // 3. Búsqueda por número de teléfono (últimos 8 dígitos)
  const digits = id.replace(/\D/g, '')
  if (digits.length >= 7) {
    const { data } = await sb.from('orders').select(SELECT)
      .ilike('customer_phone', `%${digits.slice(-8)}%`)
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) return NextResponse.json(data[0])
  }

  return NextResponse.json({ error: 'Pedido no encontrado. Prueba con el número de teléfono que usaste al pedir.' }, { status: 404 })
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
