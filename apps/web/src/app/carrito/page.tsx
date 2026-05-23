'use client'

import { useCart } from '@/lib/store'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const PAYMENT_METHODS = [
  { name: 'Efectivo', icon: '💵' },
  { name: 'Débito', icon: '💳' },
  { name: 'Crédito', icon: '💳' },
  { name: 'Transferencia', icon: '🏦' },
  { name: 'Webpay', icon: '🔐' },
  { name: 'Amipass', icon: '🎫' },
  { name: 'Edenred', icon: '🎫' },
  { name: 'Pluxee', icon: '🎫' },
]

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const handleOrder = async () => {
    if (!name || !phone) return
    setOrdering(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
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

              {/* Items */}
              <div className="lg:col-span-2 space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-400">
                        ${item.price.toLocaleString('es-CL')} / kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right min-w-[80px]">
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

              {/* Summary + Form */}
              <div className="space-y-4">

                {/* Order summary */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h2 className="font-bold text-gray-900 mb-4">Resumen</h2>
                  <div className="space-y-2 mb-4">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span className="truncate mr-2">{item.name} x{item.quantity}</span>
                        <span className="shrink-0">${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-black text-xl text-gray-900">${total().toLocaleString('es-CL')}</span>
                  </div>
                </div>

                {/* Contact form */}
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
                  <button
                    onClick={handleOrder}
                    disabled={ordering || !name || !phone}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ordering ? 'Enviando...' : 'Confirmar pedido'}
                  </button>
                </div>

                {/* Payment methods */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Medios de pago</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <div key={m.name} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50">
                        <span className="text-xl">{m.icon}</span>
                        <span className="text-xs text-gray-500 text-center leading-tight">{m.name}</span>
                      </div>
                    ))}
                  </div>
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