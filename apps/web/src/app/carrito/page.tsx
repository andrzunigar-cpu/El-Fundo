'use client'

import { useCart } from '@/lib/store'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, Loader, Lock } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState('')
  const [notes,   setNotes]   = useState('')

  // Pago normal (sin webpay)
  const [ordering, setOrdering] = useState(false)
  const [ordered,  setOrdered]  = useState(false)

  // WebPay
  const [webpayLoading, setWebpayLoading] = useState(false)
  const [webpayError,   setWebpayError]   = useState('')

  // ── Pedido sin pago online ───────────────────────────────────
  const handleOrder = async () => {
    if (!name || !phone) return
    setOrdering(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:    name,
          customer_phone:   phone,
          customer_address: address,
          notes,
          items: items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price })),
          total_amount: total(),
        }),
      })
      setOrdered(true)
      clearCart()
    } catch {
      alert('Error al enviar el pedido. Inténtalo de nuevo.')
    } finally {
      setOrdering(false)
    }
  }

  // ── WebPay Plus ──────────────────────────────────────────────
  const handleWebpay = async () => {
    if (!name || !phone) {
      setWebpayError('Completa tu nombre y teléfono antes de pagar.')
      return
    }
    setWebpayError('')
    setWebpayLoading(true)

    try {
      const orderId = `${Date.now()}`

      // Guardar datos del pedido en sessionStorage para recuperarlos en /webpay/return
      sessionStorage.setItem('webpay_order', JSON.stringify({
        customer_name:    name,
        customer_phone:   phone,
        customer_address: address,
        notes,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, unit: i.unit })),
      }))

      const res = await fetch('/api/webpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:    total(),
          orderId,
          returnUrl: `${window.location.origin}/webpay/return`,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.token) {
        throw new Error(data.error || 'No se pudo iniciar el pago')
      }

      // Redirigir a Transbank: el formulario debe hacer POST con token_ws
      // Creamos un formulario y lo enviamos programáticamente
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.url

      const input = document.createElement('input')
      input.type  = 'hidden'
      input.name  = 'token_ws'
      input.value = data.token

      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    } catch (err: unknown) {
      setWebpayError(err instanceof Error ? err.message : 'Error al iniciar WebPay')
      setWebpayLoading(false)
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────
  if (ordered) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-black text-gray-900 mb-3">¡Pedido recibido!</h1>
            <p className="text-gray-500 mb-8">Te contactaremos pronto para confirmar y coordinar la entrega.</p>
            <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition">
              Seguir comprando <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ── Helpers visuales ─────────────────────────────────────────
  const fmtQty = (qty: number, unit?: string) => {
    if (unit === 'kg') {
      if (qty < 1) return `${qty * 1000} g`
      return `${qty % 1 === 0 ? qty : qty} kg`
    }
    return `${qty} ${unit || 'un'}`
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-10">

          <div className="mb-8">
            <Link href="/productos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition mb-4">
              <ArrowLeft className="w-4 h-4" /> Volver al catálogo
            </Link>
            <h1 className="text-3xl font-black text-gray-900">Tu carrito</h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-24">
              <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-6">Tu carrito está vacío</p>
              <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition">
                Ver productos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">

              {/* ── Lista de items ── */}
              <div className="lg:col-span-2 space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-400">
                        ${item.price.toLocaleString('es-CL')} / {item.unit || 'kg'}
                      </p>
                    </div>
                    {/* Cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const step = item.unit === 'kg' ? 0.25 : 1
                          const next = parseFloat((item.quantity - step).toFixed(2))
                          if (next >= (item.unit === 'kg' ? 0.25 : 1)) updateQuantity(item.id, next)
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="min-w-[64px] text-center font-semibold text-gray-900 text-sm">
                        {fmtQty(item.quantity, item.unit)}
                      </span>
                      <button
                        onClick={() => {
                          const step = item.unit === 'kg' ? 0.25 : 1
                          updateQuantity(item.id, parseFloat((item.quantity + step).toFixed(2)))
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Subtotal */}
                    <div className="text-right min-w-[90px]">
                      <p className="font-black text-gray-900">${(item.price * item.quantity).toLocaleString('es-CL')}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition mt-2">
                  Vaciar carrito
                </button>
              </div>

              {/* ── Resumen + Formulario + Pago ── */}
              <div className="space-y-4">

                {/* Resumen */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h2 className="font-bold text-gray-900 mb-4">Resumen</h2>
                  <div className="space-y-2 mb-4">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span className="truncate mr-2">{item.name} × {fmtQty(item.quantity, item.unit)}</span>
                        <span className="shrink-0">${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-black text-xl text-gray-900">${total().toLocaleString('es-CL')}</span>
                  </div>
                </div>

                {/* Datos de contacto */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
                  <h2 className="font-bold text-gray-900 mb-1">Datos de contacto</h2>
                  <input
                    type="text"
                    placeholder="Nombre *"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono *"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Dirección de entrega"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <textarea
                    placeholder="Notas adicionales"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                {/* Botones de pago */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
                  <h2 className="font-bold text-gray-900 mb-2">Forma de pago</h2>

                  {webpayError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{webpayError}</p>
                  )}

                  {/* WebPay */}
                  <button
                    onClick={handleWebpay}
                    disabled={webpayLoading || !name || !phone}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#0f3460] hover:bg-[#162447] text-white"
                  >
                    {webpayLoading ? (
                      <><Loader className="w-5 h-5 animate-spin" /> Redirigiendo a WebPay...</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Pagar con WebPay</>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Débito, crédito y prepago — pago seguro con Transbank
                  </p>

                  {/* Separador */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">o paga al recibir</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Confirmar sin pago online */}
                  <button
                    onClick={handleOrder}
                    disabled={ordering || !name || !phone}
                    className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ordering ? 'Enviando...' : 'Pedir sin pago online'}
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Efectivo · Transferencia · Débito en local
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
