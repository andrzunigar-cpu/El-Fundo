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
    type SbError = { message?: string; code?: string; details?: string; hint?: string }
    let order: { id: string } | null = null
    let orderError: SbError | null = null
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

    if (orderError || !order) {
      // Log completo a Vercel para diagnosticar (no expone al cliente más de lo necesario)
      console.error('[orders.insert] failed', { error: orderError, payload: orderPayload })
      const detail = orderError
        ? [orderError.message, orderError.details, orderError.hint, orderError.code]
            .filter(Boolean).join(' — ')
        : 'No se pudo crear el pedido'
      return NextResponse.json({ error: detail || 'No se pudo crear el pedido' }, { status: 500 })
    }

    if (items?.length) {
      const orderItems = items.map((item: { product_id: string; product_name?: string; quantity: number; unit_price: number }) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name || item.product_id,
        // product_sku es NOT NULL en algunas variantes del schema; usar id como fallback
        product_sku: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: Math.round(item.quantity * item.unit_price),
      }))
      const { error: itemsError } = await getSupabase().from('order_items').insert(orderItems)
      if (itemsError) console.error('[order_items.insert] failed', itemsError)
    }

    return NextResponse.json({ id: order.id, status: 'pending' }, { status: 201 })
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; details?: string; hint?: string } | undefined
    console.error('[orders.POST] exception', err)
    const detail =
      e && typeof e === 'object'
        ? [e.message, e.details, e.hint, e.code].filter(Boolean).join(' — ')
        : ''
    return NextResponse.json(
      { error: detail || (err instanceof Error ? err.message : 'Error creating order') },
      { status: 500 }
    )
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