'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, X, Phone, MapPin, Clock, Calendar, Zap, CreditCard, ShoppingBag, Truck, Store } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  product_id: string
  product_name?: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Order {
  id: string
  order_number?: string
  customer_name: string
  customer_phone: string
  customer_address?: string
  notes?: string
  total_amount: number
  shipping_cost?: number
  status: string
  payment_method?: string
  delivery_type?: string
  scheduled_for?: string | null
  channel?: string
  created_at: string
  order_items?: OrderItem[]
}

const POLL_MS = 15000
const STORAGE_KEY = 'last_seen_order_at'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    // Tres beeps consecutivos en tonos distintos
    const tones = [880, 1100, 1320]
    tones.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain); gain.connect(ctx.destination)
      const t0 = ctx.currentTime + i * 0.25
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22)
      osc.start(t0); osc.stop(t0 + 0.22)
    })
  } catch {/* navegador antiguo */}
}

function formatScheduled(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  const isToday    = d.toDateString() === today.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (isToday)    return `Hoy ${hh}:${mm}`
  if (isTomorrow) return `Mañana ${hh}:${mm}`
  return `${d.getDate()}/${d.getMonth() + 1} ${hh}:${mm}`
}

export default function NewOrderNotifier() {
  const [newOrder, setNewOrder] = useState<Order | null>(null)
  const lastSeenRef = useRef<string>(
    typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) || new Date().toISOString()) : new Date().toISOString()
  )

  useEffect(() => {
    // Inicializar el "last seen" si no existe
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    }

    const check = async () => {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' })
        if (!res.ok) return
        const orders: Order[] = await res.json()
        if (!Array.isArray(orders) || orders.length === 0) return

        const lastSeen = lastSeenRef.current
        // Buscar pedidos más nuevos que la última vez vista
        const nuevos = orders.filter(o => new Date(o.created_at) > new Date(lastSeen))
        if (nuevos.length > 0) {
          // Mostrar el más reciente (orders ya viene ordenado desc)
          const masReciente = nuevos[0]
          setNewOrder(masReciente)
          playBeep()
          // Pedir permiso de notificación nativa si no lo tiene
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🥩 Nuevo pedido', {
              body: `${masReciente.customer_name} — $${masReciente.total_amount?.toLocaleString('es-CL')}`,
              icon: '/logo.png',
            })
          } else if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
          }
          // Actualizar última vez vista
          lastSeenRef.current = masReciente.created_at
          localStorage.setItem(STORAGE_KEY, masReciente.created_at)
        }
      } catch {/* silencio */}
    }

    check() // primer check inmediato
    const id = setInterval(check, POLL_MS)
    return () => clearInterval(id)
  }, [])

  const dismiss = () => setNewOrder(null)

  if (!newOrder) return null

  const o = newOrder
  const isDelivery = o.delivery_type !== 'pickup'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto animate-in zoom-in-95 slide-in-from-bottom-4">

        {/* Header con animación */}
        <div className="relative bg-gradient-to-r from-red-600 to-orange-600 p-5 rounded-t-2xl text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest font-bold opacity-90">¡Nuevo pedido!</p>
              <h2 className="text-xl font-black">{o.customer_name}</h2>
            </div>
            <button
              onClick={dismiss}
              className="p-1.5 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {o.order_number && (
            <p className="text-xs mt-2 opacity-80">Pedido N° {o.order_number}</p>
          )}
        </div>

        <div className="p-5 space-y-4">

          {/* Total destacado */}
          <div className="text-center py-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-4xl font-black text-gray-900">${o.total_amount?.toLocaleString('es-CL')}</p>
            {o.payment_method === 'webpay' && (
              <p className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-green-700">
                <CreditCard className="w-3 h-3" /> Pagado con WebPay
              </p>
            )}
          </div>

          {/* Datos cliente */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <a href={`tel:${o.customer_phone}`} className="hover:text-red-600">{o.customer_phone}</a>
            </div>
            {isDelivery ? (
              <div className="flex items-start gap-2 text-gray-700">
                <Truck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Despacho a domicilio</p>
                  <p>{o.customer_address || 'Sin dirección'}</p>
                  {(o.shipping_cost ?? 0) > 0 && (
                    <p className="text-xs text-gray-500">Costo despacho: ${o.shipping_cost?.toLocaleString('es-CL')}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-700">
                <Store className="w-4 h-4 text-gray-400 shrink-0" />
                <p>Retiro en local</p>
              </div>
            )}
            {o.scheduled_for ? (
              <div className="flex items-center gap-2 text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                <Calendar className="w-4 h-4 shrink-0" />
                <p className="font-semibold">Programado para {formatScheduled(o.scheduled_for)}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                <Zap className="w-4 h-4 shrink-0" />
                <p className="font-semibold">Lo antes posible</p>
              </div>
            )}
            {o.notes && (
              <div className="flex items-start gap-2 text-yellow-800 bg-yellow-50 px-3 py-2 rounded-lg">
                <ShoppingBag className="w-4 h-4 shrink-0 mt-0.5" />
                <p><span className="font-semibold">Nota:</span> {o.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          {(o.order_items?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Productos</p>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                {o.order_items!.map(it => (
                  <div key={it.id} className="flex justify-between p-3 text-sm">
                    <span className="text-gray-700">
                      <span className="font-semibold">{it.product_name || it.product_id}</span>
                      {' × '}{it.quantity}
                    </span>
                    <span className="font-bold text-gray-900">${it.subtotal?.toLocaleString('es-CL')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={dismiss}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cerrar
            </button>
            <Link
              href="/admin/dashboard/pedidos"
              onClick={dismiss}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
            >
              <ShoppingBag className="w-4 h-4" /> Ver pedidos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
