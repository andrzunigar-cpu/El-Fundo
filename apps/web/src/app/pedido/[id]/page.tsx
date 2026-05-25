'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  CheckCircle2, Clock, Package, Truck, Store,
  Phone, MapPin, ArrowLeft, Loader, AlertCircle,
  CreditCard, Banknote, Building2, Lock,
} from 'lucide-react'

interface OrderItem {
  id: string
  product_name?: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  notes: string
  total_amount: number
  shipping_cost?: number
  status: string
  delivery_type?: string
  payment_method?: string
  created_at: string
  scheduled_for?: string | null
  order_items: OrderItem[]
}

// ── Configuración visual de estados ────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending',   label: 'Recibido',    icon: CheckCircle2, desc: 'Tu pedido fue recibido correctamente' },
  { key: 'confirmed', label: 'Confirmado',  icon: CheckCircle2, desc: 'El local confirmó tu pedido' },
  { key: 'preparing', label: 'Preparando',  icon: Package,      desc: 'Estamos preparando tu pedido' },
  { key: 'ready',     label: 'Listo',       icon: Package,      desc: 'Tu pedido está listo' },
  { key: 'delivered', label: 'Entregado',   icon: CheckCircle2, desc: 'Pedido entregado con éxito' },
]

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  webpay:        { label: 'WebPay',        icon: <Lock className="w-4 h-4" /> },
  transferencia: { label: 'Transferencia', icon: <Building2 className="w-4 h-4" /> },
  efectivo:      { label: 'Efectivo',      icon: <Banknote className="w-4 h-4" /> },
  tarjeta_local: { label: 'Tarjeta',       icon: <CreditCard className="w-4 h-4" /> },
  amipass:       { label: 'Amipass',       icon: <span>🎫</span> },
  edenred:       { label: 'Edenred',       icon: <span>🎫</span> },
  pluxee:        { label: 'Pluxee',        icon: <span>🎫</span> },
  machbank:      { label: 'Mach / Bank',   icon: <span>📱</span> },
}

function fmt(n: number) { return n.toLocaleString('es-CL') }
function fmtQty(qty: number) {
  if (qty < 1 && qty > 0) return `${qty * 1000} g`
  return qty % 1 === 0 ? `${qty}` : `${qty}`
}

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>()
  const [order,   setOrder]   = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/orders/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Pedido no encontrado')
        return r.json()
      })
      .then(data => { setOrder(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [id])

  // auto-refresh cada 30s mientras el pedido no está finalizado
  useEffect(() => {
    if (!id || !order || ['delivered', 'cancelled'].includes(order.status)) return
    const t = setInterval(() => {
      fetch(`/api/orders/${id}`)
        .then(r => r.json())
        .then(data => setOrder(data))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [id, order])

  const currentIdx = order ? STATUS_ORDER.indexOf(order.status) : -1
  const isCancelled = order?.status === 'cancelled'
  const shortId = id ? id.slice(0, 8).toUpperCase() : ''

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">

          <Link href="/productos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>

          {loading && (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader className="w-6 h-6 animate-spin" />
              <span>Buscando pedido...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido no encontrado</h2>
              <p className="text-gray-500 text-sm mb-6">No encontramos un pedido con el número <span className="font-mono font-bold">#{shortId}</span>.<br />Verifica que el número sea correcto.</p>
              <Link href="/" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition text-sm">
                Ir al inicio
              </Link>
            </div>
          )}

          {order && !loading && (
            <div className="space-y-4">

              {/* Encabezado */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Número de pedido</p>
                    <p className="text-2xl font-black text-gray-900 font-mono tracking-widest">#{shortId}</p>
                  </div>
                  {isCancelled ? (
                    <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700">Cancelado</span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {STATUS_STEPS.find(s => s.key === order.status)?.label || order.status}
                    </span>
                  )}
                </div>

                {/* Info cliente */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{order.customer_phone}</span>
                  </div>
                  {order.delivery_type === 'pickup' ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Store className="w-4 h-4 text-gray-400" />
                      <span>Retiro en local · Av. Parque Central 06441, Puente Alto</span>
                    </div>
                  ) : order.customer_address ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{order.customer_address}</span>
                    </div>
                  ) : null}
                  {order.payment_method && PAYMENT_LABELS[order.payment_method] && (
                    <div className="flex items-center gap-2 text-gray-600">
                      {PAYMENT_LABELS[order.payment_method].icon}
                      <span>{PAYMENT_LABELS[order.payment_method].label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar de estados */}
              {!isCancelled && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="font-bold text-gray-900 mb-5">Estado del pedido</h2>
                  <div className="relative">
                    {/* línea de fondo */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
                    {/* línea de progreso */}
                    <div
                      className="absolute top-4 left-4 h-0.5 bg-red-500 transition-all duration-700"
                      style={{ width: currentIdx >= 0 ? `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                    />
                    <div className="relative flex justify-between">
                      {STATUS_STEPS.map((step, i) => {
                        const done    = i <= currentIdx
                        const current = i === currentIdx
                        const Icon    = step.icon
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              done
                                ? current
                                  ? 'bg-red-600 border-red-600'
                                  : 'bg-red-100 border-red-400'
                                : 'bg-white border-gray-200'
                            }`}>
                              <Icon className={`w-4 h-4 ${done ? current ? 'text-white' : 'text-red-500' : 'text-gray-300'}`} />
                            </div>
                            <span className={`text-xs font-semibold text-center leading-tight ${done ? 'text-red-600' : 'text-gray-400'}`}>
                              {step.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {currentIdx >= 0 && (
                    <p className="text-center text-sm text-gray-500 mt-5 bg-gray-50 py-2.5 px-4 rounded-xl">
                      {STATUS_STEPS[currentIdx].desc}
                    </p>
                  )}
                  <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Se actualiza automáticamente cada 30 segundos
                  </p>
                </div>
              )}

              {/* Productos */}
              {order.order_items?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Detalle del pedido</h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {order.order_items.map(item => (
                      <div key={item.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.product_name || item.product_id}</p>
                          <p className="text-xs text-gray-400">{fmtQty(item.quantity)} × ${fmt(item.unit_price)}</p>
                        </div>
                        <span className="font-bold text-gray-900 text-sm shrink-0">${fmt(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>${fmt(order.total_amount - (order.shipping_cost || 0))}</span>
                    </div>
                    {(order.shipping_cost ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Despacho</span>
                        <span>${fmt(order.shipping_cost!)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-gray-900 text-base pt-1 border-t border-gray-200">
                      <span>Total</span>
                      <span>${fmt(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {order.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 text-sm text-yellow-800">
                  <span className="font-semibold">Nota: </span>{order.notes}
                </div>
              )}

              {/* Contacto */}
              <div className="bg-gray-900 rounded-2xl p-5 text-center text-white">
                <p className="text-sm text-gray-400 mb-2">¿Tienes dudas sobre tu pedido?</p>
                <a
                  href="https://wa.me/56928239161"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition"
                >
                  💬 Contactar por WhatsApp
                </a>
              </div>

            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
