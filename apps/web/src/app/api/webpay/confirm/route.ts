import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Credenciales públicas de integración Transbank (no cobran dinero real).
// Si en Vercel se setean WEBPAY_COMMERCE_CODE/WEBPAY_API_KEY, esos tienen prioridad.
const TBK_TEST_COMMERCE_CODE = '597055555532'
const TBK_TEST_API_KEY       = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'

const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || TBK_TEST_COMMERCE_CODE
const API_KEY       = process.env.WEBPAY_API_KEY       || TBK_TEST_API_KEY
const IS_PROD       = process.env.WEBPAY_ENV === 'production'

const BASE_URL = IS_PROD
  ? 'https://webpay3g.transbank.cl'
  : 'https://webpay3gint.transbank.cl'

// Insert robusto: reintenta hasta 5 veces sacando columnas desconocidas
async function robustInsert(
  table: string,
  payload: Record<string, unknown>
): Promise<{ id: string } | null> {
  const supabase = getSupabase()
  const data = { ...payload }
  for (let i = 0; i < 5; i++) {
    const res = await supabase.from(table).insert(data).select('id').single()
    if (!res.error) return res.data as { id: string }
    const missing = res.error.message.match(/['"]([a-z_]+)['"]/i)?.[1]
    if (missing && missing in data) { delete data[missing]; continue }
    console.error(`[robustInsert ${table}] error:`, res.error.message)
    break
  }
  return null
}

export async function POST(req: NextRequest) {
  if (!COMMERCE_CODE || !API_KEY) {
    console.error('[webpay/confirm] WEBPAY_COMMERCE_CODE o WEBPAY_API_KEY no configurados')
    return NextResponse.json({ error: 'Pago no disponible en este momento' }, { status: 503 })
  }

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

    // Tipo de tarjeta legible desde payment_type_code
    const cardTypeMap: Record<string, string> = {
      VD: 'Débito', VN: 'Crédito', VC: 'Crédito', SI: 'Crédito',
      S2: 'Crédito', NC: 'Crédito', VP: 'Prepago',
    }
    const cardType = cardTypeMap[result.payment_type_code] ?? result.payment_type_code ?? null

    // Hora legible en hora Chile
    const txDate   = result.transaction_date ? new Date(result.transaction_date) : new Date()
    const txHour   = txDate.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    // Solo los 4 últimos dígitos de la tarjeta
    const cardLast4 = result.card_detail?.card_number
      ? String(result.card_detail.card_number).slice(-4)
      : null

    // raw_response: solo campos no sensibles (sin token interno, sin PAN completo)
    const safeResponse = {
      buy_order:          result.buy_order,
      amount:             result.amount,
      status:             result.status,
      response_code:      result.response_code,
      authorization_code: result.authorization_code,
      payment_type_code:  result.payment_type_code,
      transaction_date:   result.transaction_date,
    }

    // Guardar transacción Transbank siempre (aprobada o rechazada)
    const supabase = getSupabase()
    await robustInsert('webpay_transactions', {
      token,
      buy_order:          result.buy_order          ?? null,
      session_id:         result.session_id         ?? null,
      amount:             result.amount             ?? null,
      status:             result.status             ?? 'UNKNOWN',
      response_code:      result.response_code      ?? null,
      authorization_code: result.authorization_code ?? null,
      card_number:        cardLast4,                           // solo últimos 4 dígitos
      transaction_date:   result.transaction_date   ?? null,
      payment_type_code:  result.payment_type_code  ?? null,
      commerce_code:      COMMERCE_CODE,
      raw_response:       safeResponse,                        // sin datos sensibles
      card_type:          cardType,
      transaction_hour:   txHour,
      order_identifier:   result.buy_order          ?? null,
    })

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
        const orderNum = `EF-${Date.now().toString().slice(-8)}`

        const orderPayload: Record<string, unknown> = {
          order_number:     orderNum,
          customer_name:    orderData.customer_name,
          customer_phone:   orderData.customer_phone,
          customer_address: orderData.customer_address || '',
          notes:            orderData.notes            || '',
          total_amount:     result.amount,
          payment_method:   'webpay',
          payment_status:   'paid',
          channel:          'web',
          status:           'confirmed',
        }

        // Campos opcionales según lo que envíe el cliente
        if (orderData.delivery_type)          orderPayload.delivery_type  = orderData.delivery_type
        if (orderData.shipping_cost != null)  orderPayload.shipping_cost  = orderData.shipping_cost
        if (orderData.scheduled_for)          orderPayload.scheduled_for  = orderData.scheduled_for
        if (result.authorization_code)        orderPayload.webpay_auth_code = result.authorization_code

        const order = await robustInsert('orders', orderPayload)

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

          // Vincular transacción con la orden
          await supabase
            .from('webpay_transactions')
            .update({ order_id: order.id })
            .eq('token', token)

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
      cardNumber:        cardLast4,          // solo últimos 4 dígitos al cliente
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
