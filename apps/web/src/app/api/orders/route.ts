import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, customer_phone, customer_address, notes, items, total_amount, scheduled_for, delivery_type, shipping_cost, payment_method } = body

    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Nombre y teléfono son requeridos' }, { status: 400 })
    }

    const orderPayload: Record<string, unknown> = {
      customer_name,
      customer_phone,
      customer_address: customer_address || '',
      notes: notes || '',
      total_amount,
      status: 'pending',
      channel: 'web',
    }
    if (scheduled_for)         orderPayload.scheduled_for  = scheduled_for
    if (delivery_type)         orderPayload.delivery_type  = delivery_type
    if (shipping_cost != null) orderPayload.shipping_cost  = shipping_cost
    if (payment_method)        orderPayload.payment_method = payment_method

    // Insert robusto: si falta cualquier columna, sacarla y reintentar
    let order: { id: string } | null = null
    let orderError: { message: string } | null = null
    for (let i = 0; i < 5; i++) {
      const res = await getSupabase().from('orders').insert(orderPayload).select().single()
      if (!res.error) { order = res.data; orderError = null; break }
      const missing = res.error.message.match(/['"]([a-z_]+)['"]/i)?.[1]
      if (missing && missing in orderPayload) {
        delete orderPayload[missing]
        continue
      }
      orderError = res.error
      break
    }

    if (orderError || !order) throw orderError || new Error('No se pudo crear el pedido')

    if (items?.length) {
      const orderItems = items.map((item: { product_id: string; product_name?: string; quantity: number; unit_price: number }) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name || item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }))
      const { error: itemsError } = await getSupabase().from('order_items').insert(orderItems)
      if (itemsError) console.error('Order items error:', itemsError)
    }

    return NextResponse.json({ id: order.id, status: 'pending' }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error creating order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Solo admin puede listar todos los pedidos
  const { verifyAdminToken } = await import('@/lib/admin-auth')
  const token = request.cookies.get('admin_auth')?.value ?? ''
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data, error } = await getSupabase()
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}