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

export async function POST(req: NextRequest) {
  if (!COMMERCE_CODE || !API_KEY) {
    console.error('[webpay/create] WEBPAY_COMMERCE_CODE o WEBPAY_API_KEY no configurados')
    return NextResponse.json({ error: 'Pago no disponible en este momento' }, { status: 503 })
  }

  try {
    const { amount, orderId } = await req.json()

    if (!amount || !orderId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // returnUrl siempre hardcodeado en servidor — nunca desde el cliente (previene SSRF)
    const RETURN_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://carniceriaelfundo.cl'}/webpay/return`

    // Validar monto: mínimo $50, máximo $5.000.000
    const amountInt = Math.round(Number(amount))
    if (!Number.isFinite(amountInt) || amountInt < 50 || amountInt > 5_000_000) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const buyOrder  = `EF${Date.now().toString().slice(-9)}`
    const sessionId = `S${String(orderId).slice(0, 50)}`
    const finalReturn = RETURN_URL

    const res = await fetch(`${BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Tbk-Api-Key-Id':     COMMERCE_CODE,
        'Tbk-Api-Key-Secret': API_KEY,
      },
      body: JSON.stringify({
        buy_order:  buyOrder,
        session_id: sessionId,
        amount:     amountInt,
        return_url: finalReturn,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[WebPay create] Transbank error:', data)
      return NextResponse.json({ error: data.error_message || 'Error Transbank' }, { status: 502 })
    }

    // Guardar token al crear — permite recuperarlo en cancelaciones
    try {
      const supabase = getSupabase()
      await supabase.from('webpay_transactions').insert({
        token:            data.token,
        buy_order:        buyOrder,
        session_id:       sessionId,
        amount:           amountInt,
        status:           'INITIATED',
        commerce_code:    COMMERCE_CODE,
        order_identifier: buyOrder,
        transaction_hour: new Date().toLocaleString('es-CL', {
          timeZone: 'America/Santiago',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
      })
    } catch (dbErr) {
      console.error('[WebPay create] DB save (non-fatal):', dbErr)
    }

    return NextResponse.json({ token: data.token, url: data.url })
  } catch (err: unknown) {
    console.error('[WebPay create]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al crear transacción' },
      { status: 500 }
    )
  }
}
