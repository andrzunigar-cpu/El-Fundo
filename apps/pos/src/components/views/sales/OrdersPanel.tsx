import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search, Ban, ChevronDown, ChevronRight, Receipt } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const api = () => (window as any).posAPI
const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n ?? 0)

const today = () => new Date().toISOString().slice(0, 10)

const STATUS_META: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completada', color: 'text-emerald-400' },
  voided:    { label: 'Anulada',    color: 'text-red-500' },
  pending:   { label: 'Pendiente',  color: 'text-amber-400' },
}

export function OrdersPanel() {
  const [orders,   setOrders]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [from,     setFrom]     = useState(today())
  const [to,       setTo]       = useState(today())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detail,   setDetail]   = useState<Record<string, any>>({})
  const [voiding,  setVoiding]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api().orders.getAll({ from, to, limit: 500 })
    setOrders(data)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const loadDetail = async (id: string) => {
    if (detail[id]) return
    const d = await api().orders.getById(id)
    setDetail(prev => ({ ...prev, [id]: d }))
  }

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    await loadDetail(id)
  }

  const voidOrder = async (order: any) => {
    if (!confirm(`¿Anular pedido ${order.order_number}? Esta acción no se puede deshacer.`)) return
    setVoiding(order.id)
    try {
      await api().orders.void(order.id)
      toast.success(`Pedido ${order.order_number} anulado`)
      load()
      setExpanded(null)
    } catch (e: any) {
      toast.error(e.message ?? 'Error al anular')
    } finally {
      setVoiding(null)
    }
  }

  const totals = orders.reduce((acc, o) => {
    if (!o.voided) acc.ventas += Number(o.total)
    return acc
  }, { ventas: 0 })

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Filtros */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500" />
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-all disabled:opacity-50">
          <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} /> Actualizar
        </button>
        <div className="ml-auto text-xs text-gray-500">
          <span className="text-white font-mono font-bold">{orders.filter(o => !o.voided).length}</span> órdenes ·{' '}
          <span className="text-emerald-400 font-mono font-bold">{fmt(totals.ventas)}</span>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-2">
            <Receipt className="w-10 h-10 opacity-30" />
            <p className="text-sm">Sin órdenes en el período</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {orders.map(order => {
              const isExpanded = expanded === order.id
              const status = order.voided ? 'voided' : order.status
              const meta = STATUS_META[status] ?? STATUS_META.completed
              const det = detail[order.id]

              return (
                <div key={order.id} className={clsx('transition-colors', order.voided && 'opacity-60')}>
                  {/* Fila principal */}
                  <div
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-900/50 cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{order.order_number}</span>
                        <span className={clsx('text-[10px] font-semibold', meta.color)}>{meta.label}</span>
                        {order.discount_total > 0 && (
                          <span className="text-[10px] text-orange-400 bg-orange-900/30 px-1.5 py-0.5 rounded">
                            Desc. {fmt(order.discount_total)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.created_at).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {order.customer_name && ` · ${order.customer_name}`}
                        {' · '}{order.item_count ?? 0} productos
                        {' · '}{order.payment_method}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={clsx('font-mono font-bold text-sm', order.voided ? 'line-through text-gray-600' : 'text-white')}>
                        {fmt(Number(order.total))}
                      </p>
                      {order.change_given > 0 && (
                        <p className="text-[10px] text-gray-500">Vuelto: {fmt(order.change_given)}</p>
                      )}
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="bg-gray-900/40 border-t border-gray-800/60 px-8 py-4">
                      {!det ? (
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando…
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1.5 mb-4">
                            {det.items?.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs text-gray-300">
                                <span>
                                  {item.weight_kg
                                    ? `${Number(item.weight_kg).toFixed(3)} kg`
                                    : `${item.quantity}×`}{' '}
                                  {item.product_name}
                                </span>
                                <span className="font-mono text-gray-400">{fmt(Number(item.subtotal))}</span>
                              </div>
                            ))}
                          </div>

                          {!order.voided && (
                            <button
                              onClick={() => voidOrder(order)}
                              disabled={voiding === order.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70
                                         border border-red-700/50 text-red-400 hover:text-red-300 text-xs font-semibold
                                         rounded-lg transition-all disabled:opacity-50">
                              {voiding === order.id
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <Ban className="w-3.5 h-3.5" />}
                              Anular pedido completo
                            </button>
                          )}
                          {order.voided && (
                            <p className="text-xs text-red-500 font-semibold">⊘ Pedido anulado — stock revertido</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
