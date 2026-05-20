import React, { useEffect, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { clsx } from 'clsx'

export function HistoryView() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = (window as any).posAPI
    api.orders.getAll({ limit: 100 }).then((data: any[]) => {
      setOrders(data)
      setLoading(false)
    })
  }, [])

  const filtered = orders.filter(o =>
    !search.trim() ||
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const formatCLP = (n: number) => `$${Number(n).toLocaleString('es-CL')}`
  const formatTime = (iso: string) => new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const payLabel = (m: string) => ({
    cash: 'Efectivo', debit_card: 'Débito', credit_card: 'Crédito',
    amipass: 'Amipass', edenred: 'Edenred', pluxee: 'Pluxee', transfer: 'Transf.',
  } as any)[m] || m

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Historial de ventas</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="N° venta o cliente..."
            className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm w-72 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin ventas registradas aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-3 px-3">N° venta</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-3">Pago</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-900">
                  <td className="py-3 px-3 font-mono text-xs">{o.order_number}</td>
                  <td className="py-3 px-3 text-gray-400">{formatTime(o.created_at)}</td>
                  <td className="py-3 px-3">{o.customer_name || <span className="text-gray-600">—</span>}</td>
                  <td className="py-3 px-3 text-center text-gray-400">{o.item_count}</td>
                  <td className="py-3 px-3 text-gray-300">{payLabel(o.payment_method)}</td>
                  <td className="py-3 px-3 text-right font-bold">{formatCLP(o.total)}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      o.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                      o.status === 'cancelled' ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-400'
                    )}>
                      {o.status === 'completed' ? 'Completada' : o.status === 'cancelled' ? 'Anulada' : o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
