import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || '597055555532'
const API_KEY       = process.env.WEBPAY_API_KEY       || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'
const IS_PROD       = process.env.WEBPAY_ENV === 'production'

const BASE_URL = IS_PROD
  ? 'https://webpay3g.transbank.cl'
  : 'https://webpay3gint.transbank.cl'

export async function POST(req: NextRequest) {
  try {
    const { token, orderData } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    // Confirmar con Transbank (PUT)
    const res = await fetch(
      `${BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Tbk-Api-Key-Id':     COMMERCE_CODE,
          'Tbk-Api-Key-Secret': API_KEY,
        },
      }
    )

    const result = await res.json()

    if (!res.ok) {
      return NextResponse.json({ success: false, message: result.error_message || 'Error Transbank' })
    }

    // Pago aprobado: response_code 0 + status AUTHORIZED
    if (result.response_code !== 0 || result.status !== 'AUTHORIZED') {
      return NextResponse.json({
        success:      false,
        responseCode: result.response_code,
        status:       result.status,
        message:      result.response_code !== 0
          ? 'Pago rechazado por el banco'
          : 'Transacción no autorizada',
      })
    }

    // Registrar orden en Supabase
    let orderId: string | null = null
    if (orderData) {
      try {
        const supabase  = getSupabase()
        const orderNum  = `EF-${Date.now().toString().slice(-8)}`

        const { data: order } = await supabase
          .from('orders')
          .insert({
            order_number:     orderNum,
            customer_name:    orderData.customer_name,
            customer_phone:   orderData.customer_phone,
            customer_address: orderData.customer_address || '',
            notes:            orderData.notes || '',
            subtotal:         result.amount,
            discount_total:   0,
            tax_total:        0,
            total:            result.amount,
            payment_method:   'webpay',
            payment_status:   'paid',
            delivery_type:    'delivery',
            status:           'confirmed',
          })
          .select('id')
          .single()

        if (order?.id && orderData.items?.length) {
          await supabase.from('order_items').insert(
            orderData.items.map((item: {
              id: string; name: string; quantity: number; price: number; unit?: string
            }) => ({
              order_id:     order.id,
              product_id:   item.id,
              product_name: item.name,
              quantity:     item.quantity,
              unit_price:   item.price,
              subtotal:     item.price * item.quantity,
            }))
          )
          orderId = order.id
        }
      } catch (dbErr) {
        console.error('[WebPay confirm] DB error (non-fatal):', dbErr)
      }
    }

    return NextResponse.json({
      success:           true,
      amount:            result.amount,
      authorizationCode: result.authorization_code,
      cardNumber:        result.card_detail?.card_number,
      transactionDate:   result.transaction_date,
      buyOrder:          result.buy_order,
      orderId,
    })
  } catch (err: unknown) {
    console.error('[WebPay confirm]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al confirmar' },
      { status: 500 }
    )
  }
}
