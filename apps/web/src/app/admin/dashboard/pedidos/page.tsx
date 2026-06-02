'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ShoppingBag, Phone, MapPin, Clock, RefreshCw, Calendar, Zap,
  Truck, Store, CreditCard, Banknote, Lock, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Package,
} from 'lucide-react'

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
  customer_address: string
  notes: string
  total_amount: number
  shipping_cost?: number
  status: string
  payment_status?: string
  payment_method?: string
  channel: string
  delivery_type?: string
  created_at: string
  scheduled_for?: string | null
  webpay_auth_code?: string
  order_items: OrderItem[]
}

const PAY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  webpay:        { label: 'WebPay',                icon: <Lock className="w-3.5 h-3.5" /> },
  efectivo:      { label: 'Efectivo',              icon: <Banknote className="w-3.5 h-3.5" /> },
  tarjeta_local: { label: 'Tarjeta (local)',       icon: <CreditCard className="w-3.5 h-3.5" /> },
  amipass:       { label: 'Amipass',               icon: <span className="text-xs">🎫</span> },
  edenred:       { label: 'Edenred',               icon: <span className="text-xs">🎫</span> },
  pluxee:        { label: 'Pluxee',                icon: <span className="text-xs">🎫</span> },
  machbank:      { label: 'Mach / Bank',           icon: <span className="text-xs">📱</span> },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: 'Pendiente',   color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  confirmed: { label: 'Confirmado',  color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  preparing: { label: 'Preparando',  color: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500' },
  ready:     { label: 'Listo',       color: 'text-green-700',  bg: 'bg-green-100',  dot: 'bg-green-500' },
  delivered: { label: 'Entregado',   color: 'text-gray-700',   bg: 'bg-gray-100',   dot: 'bg-gray-500' },
  cancelled: { label: 'Cancelado',   color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500' },
}

const STATUS_NEXT: Record<string, string[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

function fmt(n: number) { return (n ?? 0).toLocaleString('es-CL') }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function formatScheduled(iso: string) {
  const d = new Date(iso)
  const today    = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (d.toDateString() === today.toDateString())    return `Hoy ${hh}:${mm}`
  if (d.toDateString() === tomorrow.toDateString()) return `Mañana ${hh}:${mm}`
  return `${d.getDate()}/${d.getMonth() + 1} ${hh}:${mm}`
}

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(true)
  const [updating, setUpdating] = useState(false)

  const cfg      = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const nextSteps = STATUS_NEXT[order.status] || []
  const isPaid   = order.payment_status === 'paid' || order.payment_method === 'webpay'
  const shortId  = order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`
  const pm       = PAY_LABELS[order.payment_method || '']

  const handleStatus = async (next: string) => {
    setUpdating(true)
    await onStatusChange(order.id, next)
    setUpdating(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Cabecera ── */}
      <div
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-4">

          {/* Izquierda: número + estado */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="pt-0.5">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} mt-1`} />
            </div>
            <div className="min-w-0">
              {/* Fila 1: número de pedido + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-gray-900 text-base font-mono">{shortId}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                {isPaid ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Pagado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Pendiente pago
                  </span>
                )}
                {order.scheduled_for ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatScheduled(order.scheduled_for)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Lo antes posible
                  </span>
                )}
              </div>

              {/* Fila 2: nombre + hora */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-semibold text-gray-800">{order.customer_name}</span>
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeAgo(order.created_at)} · {formatDate(order.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Derecha: total + expandir */}
          <div className="flex items-start gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xl font-black text-gray-900">${fmt(order.total_amount)}</p>
              {(order.shipping_cost ?? 0) > 0 && (
                <p className="text-xs text-gray-400">incl. ${fmt(order.shipping_cost!)} despacho</p>
              )}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />}
          </div>
        </div>
      </div>

      {/* ── Detalle expandible ── */}
      {expanded && (
        <>
          {/* Info del cliente */}
          <div className="px-5 pb-4 grid sm:grid-cols-2 gap-4 border-t border-gray-50 pt-4">

            {/* Columna 1: Cliente y entrega */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a href={`tel:${order.customer_phone}`} className="hover:text-red-600 font-medium">
                    {order.customer_phone}
                  </a>
                </div>
                <div className="flex items-start gap-2 text-gray-700">
                  {order.delivery_type === 'pickup'
                    ? <><Store className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" /><span className="font-medium text-blue-700">Retiro en local</span></>
                    : <><Truck className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" /><span className="font-medium text-green-700">Delivery</span></>
                  }
                </div>
                {order.customer_address && order.delivery_type !== 'pickup' && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>{order.customer_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Pago */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pago</p>
              <div className="space-y-1.5 text-sm">
                {pm && (
                  <div className="flex items-center gap-2 text-gray-700">
                    {pm.icon}
                    <span className="font-medium">{pm.label}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {isPaid
                    ? <span className="flex items-center gap-1.5 text-green-700 font-semibold"><CheckCircle className="w-4 h-4" /> Pagado</span>
                    : <span className="flex items-center gap-1.5 text-orange-600 font-semibold"><XCircle className="w-4 h-4" /> Sin pagar</span>
                  }
                </div>
                {order.webpay_auth_code && (
                  <p className="text-xs text-gray-500">Auth: {order.webpay_auth_code}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <div className="mx-5 mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <span className="font-semibold">📝 Nota: </span>{order.notes}
            </div>
          )}

          {/* Productos */}
          <div className="mx-5 mb-4 border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Productos ({order.order_items?.length ?? 0})
              </span>
            </div>
            {order.order_items?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-800">{item.product_name || item.product_id}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4 text-right">
                      <span className="text-gray-500">{item.quantity} × ${fmt(item.unit_price)}</span>
                      <span className="font-bold text-gray-900 w-20 text-right">${fmt(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 bg-gray-50 text-sm font-bold">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${fmt(order.total_amount - (order.shipping_cost ?? 0))}</span>
                </div>
                {(order.shipping_cost ?? 0) > 0 && (
                  <div className="flex justify-between px-4 py-2 bg-gray-50 text-sm">
                    <span className="text-gray-500">Despacho</span>
                    <span className="text-gray-700">${fmt(order.shipping_cost!)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-red-50 text-sm font-black">
                  <span className="text-gray-800">Total</span>
                  <span className="text-red-700 text-base">${fmt(order.total_amount)}</span>
                </div>
              </div>
            ) : (
              <p className="px-4 py-3 text-sm text-gray-400 italic">Sin detalle de productos registrado</p>
            )}
          </div>

          {/* Acciones */}
          {nextSteps.length > 0 && (
            <div className="px-5 pb-4 flex gap-2 flex-wrap">
              {nextSteps.map(next => {
                const nextCfg = STATUS_CONFIG[next]
                const isCancelling = next === 'cancelled'
                return (
                  <button
                    key={next}
                    onClick={() => handleStatus(next)}
                    disabled={updating}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                      isCancelling
                        ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {updating ? '...' : `→ ${nextCfg.label}`}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function PedidosAdmin() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/orders').catch(() => null)
    if (!res?.ok) { setLoading(false); return }
    const data = await res.json()
    setOrders(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (orderId: string, newStatus: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const counts   = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length; return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          Todos ({orders.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) =>
          counts[key] > 0 || filter === key ? (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === key ? `${cfg.bg} ${cfg.color}` : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {cfg.label} {counts[key] > 0 && `(${counts[key]})`}
            </button>
          ) : null
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No hay pedidos {filter !== 'all' ? 'en este estado' : 'aún'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  )
}
