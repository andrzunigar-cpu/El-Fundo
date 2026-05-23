import React, { useEffect, useState, useCallback } from 'react'
import { Receipt, Search, X, Printer, ChevronRight, RefreshCw, Ban } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

const PAY_LABEL: Record<string, string> = {
  cash: 'Efectivo', debit_card: 'Débito', credit_card: 'Crédito',
  amipass: 'Amipass', edenred: 'Edenred', pluxee: 'Pluxee',
  transfer: 'Transferencia', webpay: 'Webpay', rappi: 'Rappi',
  pedidosya: 'PedidosYa', mercadopago: 'MercadoPago',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function HistoryView() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [payFilter, setPayFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any | null>(null)
  const [payFilters, setPayFilters] = useState<{ id: string; label: string }[]>([{ id: '', label: 'Todos' }])

  // Cargar medios de pago desde configuración
  useEffect(() => {
    const api = (window as any).posAPI
    api.paymentSettings.getAll().then((settings: any[]) => {
      const active = settings.filter((s: any) => s.is_active)
      const filters = [
        { id: '', label: 'Todos' },
        ...active.map((s: any) => ({ id: s.method, label: s.label ?? PAY_LABEL[s.method] ?? s.method })),
      ]
      setPayFilters(filters)
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const data = await api.orders.getAll({ from, to, limit: 1000 })
    setOrders(data)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const filtered = orders.filter(o =>
    (!payFilter || o.payment_method === payFilter) &&
    (!search.trim() ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase()))
  )

  const activeOrders  = filtered.filter(o => !o.voided && o.status === 'completed')
  const voidedOrders  = filtered.filter(o => o.voided)
  const totalRevenue  = activeOrders.reduce((s, o) => s + Number(o.total), 0)

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 flex-wrap">
        <h1 className="text-xl font-bold flex-shrink-0">Historial</h1>

        {/* Rango de fechas */}
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500" />
          <span className="text-gray-500">—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500" />
          <button onClick={() => { setFrom(today()); setTo(today()) }}
            className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg">Hoy</button>
          <button onClick={() => { setFrom(daysAgo(6)); setTo(today()) }}
            className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg">7d</button>
          <button onClick={() => { setFrom(daysAgo(29)); setTo(today()) }}
            className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg">30d</button>
        </div>

        {/* Buscador */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="N° venta o cliente..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-red-500" />
        </div>

        {/* Resumen */}
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-gray-400">{activeOrders.length} ventas</span>
          {voidedOrders.length > 0 && <span className="text-red-500 text-xs">{voidedOrders.length} anuladas</span>}
          <span className="font-bold text-green-400">{fmt(totalRevenue)}</span>
          <button onClick={load} disabled={loading}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filtro método de pago */}
      <div className="flex gap-2 px-5 py-2 border-b border-gray-800 overflow-x-auto">
        {payFilters.map(p => (
          <button key={p.id} onClick={() => setPayFilter(p.id)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
              payFilter === p.id ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-16">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin ventas en el período</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-950 z-10">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-3 px-4">N° venta</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4">Pago</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}
                  onClick={() => setDetail(o)}
                  className={clsx('border-b border-gray-800/40 hover:bg-gray-900 cursor-pointer',
                    o.voided && 'opacity-50')}>
                  <td className="py-3 px-4 font-mono text-xs text-gray-300">{o.order_number}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{fmtTime(o.created_at)}</td>
                  <td className="py-3 px-4">{o.customer_name || <span className="text-gray-600">—</span>}</td>
                  <td className="py-3 px-4 text-center text-gray-400">{o.item_count}</td>
                  <td className="py-3 px-4 text-gray-300">{PAY_LABEL[o.payment_method] ?? o.payment_method}</td>
                  <td className={clsx('py-3 px-4 text-right font-bold', o.voided && 'line-through text-gray-600')}>{fmt(o.total)}</td>
                  <td className="py-3 px-4 text-center">
                    {o.voided
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400">Anulada</span>
                      : <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                          o.status === 'completed' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400')}>
                          {o.status === 'completed' ? 'Completada' : o.status}
                        </span>
                    }
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} onVoided={load} />}
    </div>
  )
}

function OrderDetailModal({ order, onClose, onVoided }: { order: any; onClose: () => void; onVoided?: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [voiding, setVoiding] = useState(false)
  const [localOrder, setLocalOrder] = useState(order)

  useEffect(() => {
    const api = (window as any).posAPI
    api.orders.getById(order.id).then((data: any) => {
      setItems(data?.items ?? [])
      setLoading(false)
    })
  }, [order.id])

  const reprint = async () => {
    const api = (window as any).posAPI
    await api.printer.printTicket(localOrder)
    toast.success('Reimprimir ticket solicitado')
  }

  const handleVoid = async () => {
    if (!confirm(`¿Anular venta ${localOrder.order_number}? Esta acción no se puede deshacer.`)) return
    setVoiding(true)
    const api = (window as any).posAPI
    try {
      await api.orders.void(localOrder.id)
      toast.success(`Venta ${localOrder.order_number} anulada — stock revertido`)
      setLocalOrder((prev: any) => ({ ...prev, voided: 1 }))
      onVoided?.()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al anular')
    } finally {
      setVoiding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-[580px] border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-gray-800">
          <div>
            <p className="font-mono text-xs text-gray-400 mb-1">{localOrder.order_number}</p>
            <h2 className={clsx('text-xl font-bold', localOrder.voided && 'line-through text-gray-600')}>{fmt(localOrder.total)}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {fmtTime(localOrder.created_at)} · {PAY_LABEL[localOrder.payment_method] ?? localOrder.payment_method}
              {localOrder.customer_name && <> · {localOrder.customer_name}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!localOrder.voided && (
              <button onClick={handleVoid} disabled={voiding}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 border border-red-700/50 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
                {voiding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                Anular
              </button>
            )}
            {localOrder.voided && (
              <span className="text-xs text-red-500 font-semibold">⊘ Anulada</span>
            )}
            <button onClick={reprint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
              <Printer className="w-4 h-4" /> Reimprimir
            </button>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
          </div>
        </div>

        {/* Items */}
        <div className="p-5">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Cargando...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                  <th className="py-2">Producto</th>
                  <th className="py-2 text-right w-24">Cantidad</th>
                  <th className="py-2 text-right w-24">P. Unit.</th>
                  <th className="py-2 text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-800/40">
                    <td className="py-2.5">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.product_sku}</p>
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {item.weight_kg
                        ? `${Number(item.weight_kg).toFixed(3)} kg`
                        : `${Number(item.quantity).toFixed(0)} un`}
                    </td>
                    <td className="py-2.5 text-right text-gray-400">{fmt(item.unit_price)}</td>
                    <td className="py-2.5 text-right font-medium">{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totales */}
          <div className="mt-4 pt-3 border-t border-gray-800 space-y-1 text-sm">
            {order.discount_total > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Descuento</span><span>-{fmt(order.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <p className="mt-3 text-xs text-gray-500 italic">"{order.notes}"</p>
          )}
        </div>
      </div>
    </div>
  )
}
