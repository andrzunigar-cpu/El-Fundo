import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, customer_phone, customer_address, notes, items, total_amount } = body

    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Nombre y teléfono son requeridos' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        customer_address: customer_address || '',
        notes: notes || '',
        total_amount,
        status: 'pending',
        channel: 'web',
      })
      .select()
      .single()

    if (orderError) throw orderError

    if (items?.length) {
      const orderItems = items.map((item: { product_id: string; quantity: number; unit_price: number }) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }))
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) console.error('Order items error:', itemsError)
    }

    return NextResponse.json({ id: order.id, status: 'pending' }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error creating order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}