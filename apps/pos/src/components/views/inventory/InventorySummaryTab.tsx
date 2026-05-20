import React, { useEffect, useState } from 'react'
import { Package, AlertTriangle, FileText, Trash2, ClipboardList, TrendingUp } from 'lucide-react'
import { DateRangeFilter, todayISO, daysAgoISO, formatCLP } from './shared'

export function InventorySummaryTab() {
  const [from, setFrom] = useState(daysAgoISO(30))
  const [to, setTo] = useState(todayISO())
  const [data, setData] = useState<any>(null)
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = (window as any).posAPI
    setLoading(true)
    Promise.all([
      api.inventory.getSummary({ from, to }),
      api.inventory.getMovements({ from, to, limit: 10 }),
    ]).then(([summary, movements]) => {
      setData(summary)
      setRecentMovements(movements)
      setLoading(false)
    })
  }, [from, to])

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="flex items-center justify-end mb-5">
        <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Productos activos"  value={data.activeProducts}     icon={Package}        color="gray" />
        <KpiCard label="Sin stock"           value={data.outOfStock}         icon={AlertTriangle}  color="red" />
        <KpiCard label="Stock bajo"          value={data.lowStock}           icon={AlertTriangle}  color="orange" />
        <KpiCard label="Tomas realizadas"    value={data.completedCounts}    icon={ClipboardList}  color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <PeriodKpi
          label="Compras del período"
          subLabel={`${data.purchasesCount} facturas`}
          value={formatCLP(data.purchasesTotal)}
          icon={FileText}
          color="green"
        />
        <PeriodKpi
          label="Consumos / Mermas del período"
          subLabel="kg / unidades dadas de baja"
          value={Number(data.consumptionQuantity || 0).toFixed(2)}
          icon={Trash2}
          color="orange"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-500" />
          Últimos movimientos en el período
        </h3>
        {recentMovements.length === 0 ? (
          <div className="text-center text-gray-500 py-6 text-sm">Sin movimientos en este período</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-2">Fecha</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Producto</th>
                <th className="py-2 text-right">Cantidad</th>
                <th className="py-2">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((m: any) => (
                <tr key={m.id} className="border-b border-gray-800/40">
                  <td className="py-2 text-gray-400 text-xs">
                    {new Date(m.created_at).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 capitalize">{m.type}</td>
                  <td className="py-2">{m.product_name}</td>
                  <td className={`py-2 text-right font-medium ${m.quantity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {m.quantity >= 0 ? '+' : ''}{Number(m.quantity).toFixed(m.requires_weight ? 2 : 0)}
                  </td>
                  <td className="py-2 text-gray-400 text-xs truncate max-w-xs">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    gray:   'bg-gray-900 border-gray-800',
    red:    'bg-red-950/40 border-red-900 text-red-300',
    orange: 'bg-orange-950/40 border-orange-900 text-orange-300',
    purple: 'bg-purple-950/40 border-purple-900 text-purple-300',
  }
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

function PeriodKpi({ label, subLabel, value, icon: Icon, color }: any) {
  const colors: any = {
    green:  'bg-green-950/30 border-green-900',
    orange: 'bg-orange-950/30 border-orange-900',
  }
  return (
    <div className={`rounded-xl p-5 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
          <div className="text-[11px] text-gray-500">{subLabel}</div>
        </div>
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  )
}
