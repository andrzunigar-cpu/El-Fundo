import React, { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, Trophy, Calendar } from 'lucide-react'

export function ReportsView() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = (window as any).posAPI
    setLoading(true)
    api.reports.dailySales(date).then((r: any) => {
      setData(r)
      setLoading(false)
    })
  }, [date])

  const formatCLP = (n: number) => `$${Number(n || 0).toLocaleString('es-CL')}`

  return (
    <div className="h-full overflow-y-auto bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reportes de venta</h1>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <KpiBig label="Ventas" value={data?.total_orders || 0} icon={ShoppingBag} suffix="ventas" />
              <KpiBig label="Facturado" value={formatCLP(data?.total_revenue || 0)} icon={TrendingUp} />
              <KpiBig label="Ticket promedio" value={formatCLP(data?.avg_ticket || 0)} icon={Trophy} />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold mb-4">Top 5 productos del día</h3>
              {data?.topProducts?.length ? (
                <div className="space-y-2">
                  {data.topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="font-medium">{p.product_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCLP(p.revenue)}</div>
                        <div className="text-xs text-gray-500">{Number(p.qty).toFixed(1)} unidades</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6 text-sm">Sin ventas en esta fecha</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function KpiBig({ label, value, icon: Icon, suffix }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-gray-400">{label}</span>
        <Icon className="w-5 h-5 text-red-500" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {suffix && <div className="text-xs text-gray-500 mt-1">{suffix}</div>}
    </div>
  )
}
