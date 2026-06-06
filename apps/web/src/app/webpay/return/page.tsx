'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/lib/store'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader, ArrowRight, Home, MapPin, Phone, Truck, Store, Clock } from 'lucide-react'

// Transbank envía token_ws como POST o GET; Next.js client recibe el GET final
function ReturnContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const { clearCart } = useCart()

  const confirmCalled = useRef(false)   // guard contra doble-confirm (Strict Mode / re-render)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [detail, setDetail] = useState<{
    amount?: number
    authCode?: string
    cardNumber?: string
    buyOrder?: string
    orderId?: string
    message?: string
    customerName?: string
    customerPhone?: string
    customerAddress?: string
    notes?: string
    deliveryType?: string
    shippingCost?: number
    scheduledFor?: string
    items?: Array<{ id: string; name: string; quantity: number; price: number; unit?: string }>
  }>({})

  useEffect(() => {
    const tokenWs      = searchParams.get('token_ws')
    const tbkToken     = searchParams.get('TBK_TOKEN')
    const tbkOrdenCompra = searchParams.get('TBK_ORDEN_COMPRA')

    // Error en formulario (solo producción): llegan token_ws + TBK_TOKEN juntos → NO confirmar
    if (tbkToken && tokenWs) {
      setStatus('error')
      setDetail({ message: 'Sesión de pago expirada. Por favor intenta nuevamente.' })
      return
    }

    // Cancelación: Transbank envía TBK_TOKEN (sin token_ws) → NO confirmar
    if (tbkToken && !tokenWs) {
      setStatus('error')
      setDetail({ message: 'Pago cancelado por el usuario' })
      return
    }

    // Timeout: llegan solo TBK_ID_SESION + TBK_ORDEN_COMPRA, sin token → NO confirmar
    if (!tokenWs && !tbkToken && tbkOrdenCompra) {
      setStatus('error')
      setDetail({ message: 'La sesión de pago expiró (más de 5 min sin actividad). Por favor intenta nuevamente.' })
      return
    }

    const token = tokenWs
    if (!token) {
      setStatus('error')
      setDetail({ message: 'Token de pago no encontrado' })
      return
    }

    // Guard: evitar doble-llamada a confirm (React Strict Mode / re-renders)
    if (confirmCalled.current) return
    confirmCalled.current = true

    // Recuperar datos del pedido desde sessionStorage
    let orderData = null
    try {
      const raw = sessionStorage.getItem('webpay_order')
      if (raw) orderData = JSON.parse(raw)
    } catch {}

    fetch('/api/webpay/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, orderData }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Limpieza total y defensiva: store, localStorage y sessionStorage
          clearCart()
          try { localStorage.removeItem('elfundo-cart') } catch {}
          try { sessionStorage.removeItem('webpay_order') } catch {}
          setStatus('success')
          setDetail({
            amount:          data.amount,
            authCode:        data.authorizationCode,
            cardNumber:      data.cardNumber,
            buyOrder:        data.buyOrder,
            orderId:         data.orderId,
            customerName:    orderData?.customer_name,
            customerPhone:   orderData?.customer_phone,
            customerAddress: orderData?.customer_address,
            notes:           orderData?.notes,
            deliveryType:    orderData?.delivery_type,
            shippingCost:    orderData?.shipping_cost,
            scheduledFor:    orderData?.scheduled_for,
            items:           orderData?.items,
          })
        } else {
          setStatus('error')
          setDetail({ message: data.message || 'Pago rechazado' })
        }
      })
      .catch(() => {
        setStatus('error')
        setDetail({ message: 'Error al confirmar el pago' })
      })
  }, [searchParams, clearCart])

  // Segundo ciclo: si por cualquier razón se rehidratara el carrito desde
  // localStorage después de la limpieza inicial, lo borramos nuevamente
  // al entrar en estado 'success'.
  useEffect(() => {
    if (status !== 'success') return
    clearCart()
    try { localStorage.removeItem('elfundo-cart') } catch {}
  }, [status, clearCart])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Confirmando tu pago...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-red-100">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-gray-900 mb-2">Pago no completado</h1>
            <p className="text-gray-500 mb-8">{detail.message || 'El pago fue rechazado o cancelado.'}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/carrito')}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition"
              >
                Volver al carrito
              </button>
              <Link href="/productos" className="text-sm text-gray-400 hover:text-gray-600 transition">
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const fmt = (n: number) => n.toLocaleString('es-CL')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full space-y-4">

        {/* Header éxito */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">¡Pago exitoso!</h1>
          <p className="text-gray-500 text-sm">Tu pedido fue registrado. Te contactaremos para coordinar la entrega.</p>

          {detail.orderId && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mt-5">
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Tu número de pedido</p>
              <p className="text-3xl font-black text-red-600 tracking-wider">
                #{detail.orderId.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-400 mt-1">📌 Guarda este número para seguir tu pedido</p>
            </div>
          )}
        </div>

        {/* Detalle del pedido */}
        {detail.items && detail.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Productos pedidos</p>
            </div>
            <div className="divide-y divide-gray-50">
              {detail.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4 text-right">
                    <span className="text-gray-500">
                      {item.quantity}{item.unit === 'kg' ? ' kg' : ' un'} × ${fmt(item.price)}
                    </span>
                    <span className="font-bold text-gray-900 w-20 text-right">
                      ${fmt(Math.round(item.quantity * item.price))}
                    </span>
                  </div>
                </div>
              ))}
              {(detail.shippingCost ?? 0) > 0 && (
                <div className="flex justify-between px-5 py-2.5 text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Despacho</span>
                  <span className="text-gray-700">${fmt(detail.shippingCost!)}</span>
                </div>
              )}
              <div className="flex justify-between px-5 py-3 bg-red-50 text-sm font-black">
                <span className="text-gray-800">Total pagado</span>
                <span className="text-red-700 text-base">${fmt(detail.amount ?? 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Info de entrega */}
        {(detail.customerName || detail.deliveryType || detail.scheduledFor) && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Datos de entrega</p>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-sm">
              {detail.customerName && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-gray-400">👤</span>
                  <span className="font-semibold">{detail.customerName}</span>
                </div>
              )}
              {detail.customerPhone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{detail.customerPhone}</span>
                </div>
              )}
              {detail.deliveryType === 'pickup' ? (
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>Retiro en local</span>
                </div>
              ) : detail.customerAddress ? (
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <span>{detail.customerAddress}</span>
                </div>
              ) : null}
              {detail.scheduledFor && (
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {new Date(detail.scheduledFor).toLocaleDateString('es-CL', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })} a las {new Date(detail.scheduledFor).toLocaleTimeString('es-CL', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {detail.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-yellow-800 text-xs">
                  📝 {detail.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comprobante Transbank */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comprobante Transbank</p>
          </div>
          <div className="px-5 py-4 space-y-2.5 text-sm">
            {detail.buyOrder && (
              <div className="flex justify-between">
                <span className="text-gray-500">N° transacción</span>
                <span className="font-semibold text-gray-900">{detail.buyOrder}</span>
              </div>
            )}
            {detail.authCode && (
              <div className="flex justify-between">
                <span className="text-gray-500">Código autorización</span>
                <span className="font-semibold text-gray-900">{detail.authCode}</span>
              </div>
            )}
            {detail.cardNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tarjeta</span>
                <span className="font-semibold text-gray-900">**** {detail.cardNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <Link
            href="/productos"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Seguir comprando <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition">
            <Home className="w-4 h-4" /> Inicio
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function WebpayReturn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    }>
      <ReturnContent />
    </Suspense>
  )
}
