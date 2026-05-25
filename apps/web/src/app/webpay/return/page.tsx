'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/lib/store'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader, ArrowRight, Home, ClipboardList } from 'lucide-react'

// Transbank envía token_ws como POST o GET; Next.js client recibe el GET final
function ReturnContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const { clearCart } = useCart()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [detail, setDetail] = useState<{
    amount?: number
    authCode?: string
    cardNumber?: string
    buyOrder?: string
    orderId?: string
    message?: string
  }>({})

  useEffect(() => {
    const token = searchParams.get('token_ws') || searchParams.get('TBK_TOKEN')
    const tbkOrdenCompra = searchParams.get('TBK_ORDEN_COMPRA')

    // Si viene TBK_ORDEN_COMPRA sin token = pago anulado por el usuario
    if (!token && tbkOrdenCompra) {
      setStatus('error')
      setDetail({ message: 'Pago cancelado por el usuario' })
      return
    }

    if (!token) {
      setStatus('error')
      setDetail({ message: 'Token de pago no encontrado' })
      return
    }

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
          clearCart()
          sessionStorage.removeItem('webpay_order')
          setStatus('success')
          setDetail({
            amount:     data.amount,
            authCode:   data.authorizationCode,
            cardNumber: data.cardNumber,
            buyOrder:   data.buyOrder,
            orderId:    data.orderId,
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-green-100 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">¡Pago exitoso!</h1>
          <p className="text-gray-500 mb-4">Tu pedido fue registrado. Te contactaremos para coordinar la entrega.</p>

          {/* Número de pedido destacado */}
          {detail.orderId && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mb-6">
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Tu número de pedido</p>
              <p className="text-3xl font-black text-red-600 tracking-wider">
                #{detail.orderId.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 mt-1">📌 Guarda este número para seguir tu pedido</p>
            </div>
          )}

          {/* Comprobante Transbank */}
          <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-8">
            {detail.buyOrder && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">N° transacción</span>
                <span className="font-semibold text-gray-900">{detail.buyOrder}</span>
              </div>
            )}
            {detail.amount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total pagado</span>
                <span className="font-black text-gray-900">${detail.amount.toLocaleString('es-CL')}</span>
              </div>
            )}
            {detail.authCode && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Código autorización</span>
                <span className="font-semibold text-gray-900">{detail.authCode}</span>
              </div>
            )}
            {detail.cardNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tarjeta</span>
                <span className="font-semibold text-gray-900">**** {detail.cardNumber}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {detail.orderId && (
              <Link
                href={`/pedido/${detail.orderId}`}
                className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition"
              >
                <ClipboardList className="w-5 h-5" /> Ver estado del pedido
              </Link>
            )}
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
