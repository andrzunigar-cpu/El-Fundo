/**
 * Envío de notificaciones por WhatsApp usando CallMeBot (gratuito).
 *
 * CONFIGURACIÓN (una sola vez):
 * 1. Agrega el contacto: +34 644 58 44 88 en tu WhatsApp
 * 2. Envíale el mensaje: "I allow callmebot to send me messages"
 * 3. Recibirás tu API key personal
 * 4. Agrega en Vercel (el-fundo-web):
 *      WHATSAPP_PHONE   → número SIN + ni espacios, ej: 56928239161
 *      WHATSAPP_APIKEY  → apikey que te envió CallMeBot
 */

function fmt(n: number) {
  return (n ?? 0).toLocaleString('es-CL')
}

interface NotifyOrderParams {
  orderId:       string
  orderNumber?:  string
  customerName:  string
  customerPhone: string
  customerAddress?: string
  deliveryType?: string
  paymentMethod?: string
  paymentStatus?: string
  totalAmount:   number
  shippingCost?: number
  scheduledFor?: string | null
  notes?:        string
  items?: Array<{
    product_name?: string
    product_id?:   string
    quantity:      number
    unit_price:    number
    subtotal:      number
  }>
}

export async function notifyNewOrder(params: NotifyOrderParams): Promise<void> {
  const phone  = process.env.WHATSAPP_PHONE
  const apikey = process.env.WHATSAPP_APIKEY

  if (!phone || !apikey) {
    // Si no están configuradas las vars, simplemente no enviamos (no es error)
    console.log('[whatsapp] WHATSAPP_PHONE o WHATSAPP_APIKEY no configurados — omitiendo notificación')
    return
  }

  try {
    const shortId = params.orderNumber || `#${params.orderId.slice(0, 8).toUpperCase()}`

    // Tipo de entrega
    const entrega = params.deliveryType === 'pickup'
      ? '🏪 Retiro en local'
      : `🚚 Delivery${params.customerAddress ? ` → ${params.customerAddress}` : ''}`

    // Horario
    let horario = '⚡ Lo antes posible'
    if (params.scheduledFor) {
      const d = new Date(params.scheduledFor)
      horario = `📅 Programado: ${d.toLocaleDateString('es-CL')} ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Medio de pago
    const pagoLabel: Record<string, string> = {
      webpay:        '💳 WebPay (online)',
      efectivo:      '💵 Efectivo',
      tarjeta_local: '💳 Tarjeta (local)',
      amipass:       '🎫 Amipass',
      edenred:       '🎫 Edenred',
      pluxee:        '🎫 Pluxee',
      machbank:      '📱 Mach / Bank',
    }
    const pago = pagoLabel[params.paymentMethod || ''] || params.paymentMethod || 'No especificado'
    const pagado = (params.paymentStatus === 'paid' || params.paymentMethod === 'webpay')
      ? '✅ Pagado'
      : '⏳ Pendiente de pago'

    // Lista de productos
    let productosLines = ''
    if (params.items?.length) {
      productosLines = params.items.map(i =>
        `  • ${i.product_name || i.product_id} × ${i.quantity} = $${fmt(i.subtotal)}`
      ).join('\n')
    } else {
      productosLines = '  (sin detalle de productos)'
    }

    // Subtotal / despacho / total
    const subtotal = params.totalAmount - (params.shippingCost ?? 0)
    let totales = `  Subtotal: $${fmt(subtotal)}`
    if ((params.shippingCost ?? 0) > 0) {
      totales += `\n  Despacho: $${fmt(params.shippingCost!)}`
    }
    totales += `\n  *TOTAL: $${fmt(params.totalAmount)}*`

    const message = [
      `🛒 *NUEVO PEDIDO — Carnicería El Fundo*`,
      ``,
      `📋 *Pedido:* ${shortId}`,
      `👤 *Cliente:* ${params.customerName}`,
      `📞 *Teléfono:* ${params.customerPhone}`,
      ``,
      `${entrega}`,
      `${horario}`,
      ``,
      `💰 *Pago:* ${pago}`,
      `   ${pagado}`,
      ``,
      `🥩 *Productos:*`,
      productosLines,
      ``,
      totales,
      params.notes ? `\n📝 *Nota:* ${params.notes}` : '',
    ].filter(l => l !== undefined).join('\n')

    // Codificar el mensaje para URL
    const encoded = encodeURIComponent(message)
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apikey}`

    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      console.error('[whatsapp] CallMeBot error:', res.status, await res.text())
    } else {
      console.log('[whatsapp] Notificación enviada OK para pedido', shortId)
    }
  } catch (err) {
    // No bloquear el flujo principal si falla la notificación
    console.error('[whatsapp] Error enviando notificación:', err)
  }
}
