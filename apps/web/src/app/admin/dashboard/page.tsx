'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Tag, TrendingUp, ArrowRight, ShoppingBag, DollarSign, Clock, CheckCircle } from 'lucide-react'

interface Order {
  id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
}

export default function Dashboard() {
  const [products, setProducts] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()).catch(() => []),
      fetch('/api/orders').then(r => r.json()).catch(() => []),
    ]).then(([prods, ords]) => {
      setProducts(Array.isArray(prods) ? prods.length : 0)
      setOrders(Array.isArray(ords) ? ords : [])
      setLoading(false)
    })
  }, [])

  const pending  = orders.filter(o => o.status === 'pending').length
  const today    = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  const revenue  = today.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const delivered = orders.filter(o => o.status === 'delivered').length

  const stats = [
    { label: 'Pedidos pendientes', value: pending,  icon: Clock,         color: 'bg-yellow-50 text-yellow-600', href: '/admin/dashboard/pedidos' },
    { label: 'Ingresos hoy',       value: `$${revenue.toLocaleString('es-CL')}`, icon: DollarSign, color: 'bg-green-50 text-green-600', href: '/admin/dashboard/pedidos' },
    { label: 'Total pedidos',      value: orders.length, icon: ShoppingBag,  color: 'bg-blue-50 text-blue-600',   href: '/admin/dashboard/pedidos' },
    { label: 'Productos activos',  value: products,  icon: Package,       color: 'bg-red-50 text-red-600',     href: '/admin/dashboard/productos' },
  ]

  const recent = orders.slice(0, 5)

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
    preparing: { label: 'Preparando', color: 'bg-purple-100 text-purple-700' },
    ready:     { label: 'Listo',      color: 'bg-green-100 text-green-700' },
    delivered: { label: 'Entregado',  color: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu tienda online</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group">
              <div className={`inline-flex p-2.5 rounded-lg ${s.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-gray-900">{loading ? '–' : s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pedidos recientes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Pedidos recientes</h2>
            <Link href="/admin/dashboard/pedidos" className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-sm">Cargando...</div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Sin pedidos aún</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(order => {
                const s = STATUS_LABEL[order.status] || STATUS_LABEL.pending
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">${order.total_amount?.toLocaleString('es-CL')}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="space-y-2">
            <Link href="/admin/dashboard/pedidos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
              <ShoppingBag className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Gestionar pedidos</span>
              {pending > 0 && <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">{pending}</span>}
              {!pending && <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />}
            </Link>
            <Link href="/admin/dashboard/productos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
              <Package className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Gestionar productos y precios</span>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
            <Link href="/" target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Ver tienda pública</span>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
