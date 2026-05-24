'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag, Phone, MapPin, Clock, RefreshCw, ChevronDown } from 'lucide-react'

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
  customer_name: string
  customer_phone: string
  customer_address: string
  notes: string
  total_amount: number
  status: string
  channel: string
  created_at: string
  order_items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',   color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed: { label: 'Confirmado',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  preparing: { label: 'Preparando',  color: 'text-purple-700', bg: 'bg-purple-100' },
  ready:     { label: 'Listo',       color: 'text-green-700',  bg: 'bg-green-100' },
  delivered: { label: 'Entregado',   color: 'text-gray-700',   bg: 'bg-gray-100' },
  cancelled: { label: 'Cancelado',   color: 'text-red-700',    bg: 'bg-red-100' },
}

const STATUS_NEXT: Record<string, string[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export default function PedidosAdmin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/orders').catch(() => null)
    if (!res?.ok) { setLoading(false); return }
    const data = await res.json()
    setOrders(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
    setUpdating(null)
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} pedidos en total</p>
        </div>
        <button
          onClick={() => { setLoading(true); load() }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          Todos ({orders.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          counts[key] > 0 || filter === key ? (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === key ? `${cfg.bg} ${cfg.color}` : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {cfg.label} {counts[key] > 0 && `(${counts[key]})`}
            </button>
          ) : null
        ))}
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
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const nextSteps = STATUS_NEXT[order.status] || []
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header del pedido */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <ShoppingBag className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{order.customer_name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(order.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.customer_phone}
                          </span>
                          {order.customer_address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {order.customer_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900">
                        ${order.total_amount?.toLocaleString('es-CL')}
                      </p>
                      <p className="text-xs text-gray-400">{order.channel === 'web' ? 'Web' : 'Local'}</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-3 px-3 py-2 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                      <span className="font-medium">Nota: </span>{order.notes}
                    </div>
                  )}
                </div>

                {/* Items */}
                {order.order_items?.length > 0 && (
                  <div className="px-5 py-3 bg-gray-50">
                    <div className="space-y-1">
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            <span className="font-medium text-gray-800">{item.product_name || item.product_id}</span>
                            {' — '}{item.quantity} × ${item.unit_price?.toLocaleString('es-CL')}
                          </span>
                          <span className="font-semibold text-gray-900">${item.subtotal?.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                {nextSteps.length > 0 && (
                  <div className="px-5 py-3 flex gap-2 flex-wrap">
                    {nextSteps.map(next => {
                      const nextCfg = STATUS_CONFIG[next]
                      const isCancelling = next === 'cancelled'
                      return (
                        <button
                          key={next}
                          onClick={() => updateStatus(order.id, next)}
                          disabled={updating === order.id}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                            isCancelling
                              ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {updating === order.id ? '...' : `→ ${nextCfg.label}`}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
