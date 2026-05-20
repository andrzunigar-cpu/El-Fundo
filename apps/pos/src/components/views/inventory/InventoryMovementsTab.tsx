import React, { useEffect, useState, useCallback } from 'react'
import { History, Search } from 'lucide-react'
import { DateRangeFilter, formatDate, todayISO, daysAgoISO, MovementBadge } from './shared'

const TYPES = [
  { id: '',                  label: 'Todos' },
  { id: 'initial',           label: 'Inicial' },
  { id: 'purchase',          label: 'Compra' },
  { id: 'sale',              label: 'Venta' },
  { id: 'consumption',       label: 'Consumo' },
  { id: 'adjustment',        label: 'Ajuste manual' },
  { id: 'count_adjustment',  label: 'Toma de inventario' },
]

export function InventoryMovementsTab() {
  const [from, setFrom] = useState(daysAgoISO(7))
  const [to, setTo] = useState(todayISO())
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const data = await api.inventory.getMovements({ from, to, type: type || undefined, limit: 500 })
    setMovements(data)
    setLoading(false)
  }, [from, to, type])

  useEffect(() => { load() }, [load])

  const filtered = movements.filter(m =>
    !search.trim() ||
    (m.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.product_sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.notes || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-wrap gap-3">
        <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
        <div className="flex items-center gap-2">
          <select value={type} onChange={e => setType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500">
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Producto o nota..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-red-500" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin movimientos para los filtros aplicados</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-3">Mostrando {filtered.length} de {movements.length} movimientos</div>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-950 z-10">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                  <th className="py-2 px-2">Fecha</th>
                  <th className="py-2 px-2">Tipo</th>
                  <th className="py-2 px-2">Producto</th>
                  <th className="py-2 px-2 text-right">Cantidad</th>
                  <th className="py-2 px-2 text-right">Antes</th>
                  <th className="py-2 px-2 text-right">Después</th>
                  <th className="py-2 px-2">Motivo / Referencia</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b border-gray-800/40 hover:bg-gray-900">
                    <td className="py-2 px-2 text-xs text-gray-400 whitespace-nowrap">{formatDate(m.created_at)}</td>
                    <td className="py-2 px-2"><MovementBadge type={m.type} /></td>
                    <td className="py-2 px-2">
                      <div className="font-medium">{m.product_name || '—'}</div>
                      <div className="text-xs text-gray-500 font-mono">{m.product_sku}</div>
                    </td>
                    <td className={`py-2 px-2 text-right font-bold ${Number(m.quantity) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(m.quantity) >= 0 ? '+' : ''}{Number(m.quantity).toFixed(m.requires_weight ? 2 : 0)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-400">{Number(m.quantity_before).toFixed(m.requires_weight ? 2 : 0)}</td>
                    <td className="py-2 px-2 text-right text-gray-300 font-medium">{Number(m.quantity_after).toFixed(m.requires_weight ? 2 : 0)}</td>
                    <td className="py-2 px-2 text-xs text-gray-400 max-w-xs truncate" title={m.notes}>{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
