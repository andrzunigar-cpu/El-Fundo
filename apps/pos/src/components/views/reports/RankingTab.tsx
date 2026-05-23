import React, { useState, useEffect, useCallback } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { DateRangeBar, Section, EmptyState, fmt, fmtN, today } from './shared'

const SORT_OPTS = {
  bruto: [
    { id: 'revenue', label: 'Ventas ($)' },
    { id: 'orders',  label: 'Órdenes' },
    { id: 'qty',     label: 'Cantidad' },
    { id: 'profit',  label: 'Utilidad ($)' },
    { id: 'margin',  label: 'Margen (%)' },
  ],
  neto: [
    { id: 'revenue',     label: 'Ventas ($)' },
    { id: 'orders',      label: 'Órdenes' },
    { id: 'qty',         label: 'Cantidad' },
    { id: 'neto_profit', label: 'Utilidad neta ($)' },
    { id: 'neto_margin', label: 'Margen neto (%)' },
  ],
}

export function RankingTab() {
  const [from,      setFrom]      = useState(today())
  const [to,        setTo]        = useState(today())
  const [priceMode, setPriceMode] = useState<'bruto' | 'neto'>('neto')
  const [sortBy,    setSortBy]    = useState('neto_margin')
  const [rows,      setRows]      = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editCost,  setEditCost]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const data = await api.reports.productRanking(from, to, sortBy)
    setRows(data)
    setLoading(false)
  }, [from, to, sortBy])

  useEffect(() => { load() }, [load])

  // Al cambiar modo, resetear sort al primero del modo nuevo
  const switchMode = (mode: 'bruto' | 'neto') => {
    setPriceMode(mode)
    setSortBy(mode === 'neto' ? 'neto_margin' : 'revenue')
  }

  const saveCost = async (row: any) => {
    const cost = parseInt(editCost, 10)
    if (isNaN(cost) || cost < 0) { toast.error('Costo inválido'); return }
    await (window as any).posAPI.products.updateCost(row.product_id, cost)
    toast.success('Costo actualizado')
    setEditId(null)
    load()
  }

  const sortOpts = SORT_OPTS[priceMode]

  // Referencia del máximo para la barra de progreso
  const maxRev = priceMode === 'neto'
    ? (rows[0]?.neto_revenue  ?? 1)
    : (rows[0]?.total_revenue ?? 1)

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DateRangeBar from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />

        <div className="flex items-center gap-3">
          {/* Toggle Bruto / Neto */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs font-semibold">
            <button
              onClick={() => switchMode('neto')}
              className={clsx(
                'px-3 py-1.5 transition-colors',
                priceMode === 'neto'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              Neto (sin IVA)
            </button>
            <button
              onClick={() => switchMode('bruto')}
              className={clsx(
                'px-3 py-1.5 transition-colors border-l border-gray-700',
                priceMode === 'bruto'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              Bruto (con IVA)
            </button>
          </div>
        </div>
      </div>

      {/* ── Ordenar por ──────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {sortOpts.map(o => (
          <button key={o.id} onClick={() => setSortBy(o.id)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              sortBy === o.id
                ? priceMode === 'neto' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Tabla ────────────────────────────────────────────── */}
      {loading
        ? <div className="text-center text-gray-500 py-12">Cargando...</div>
        : rows.length === 0
          ? <EmptyState />
          : (
            <Section
              title={`Ranking productos — ${sortOpts.find(o => o.id === sortBy)?.label}`}
              badge={
                priceMode === 'neto'
                  ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 font-semibold ml-2">
                      Precios netos · IVA 19% excluido
                    </span>
                  : <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 font-semibold ml-2">
                      Precios brutos · IVA incluido
                    </span>
              }
            >
              <p className="text-xs text-gray-500 mb-3">
                {priceMode === 'neto'
                  ? 'Ingresos sin IVA (÷1.19). Costo ingresado = precio neto de factura.'
                  : 'Ingresos con IVA incluido. Haz click en el costo para editarlo.'}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                    <th className="py-2.5 w-8">#</th>
                    <th className="py-2.5">Producto</th>
                    <th className="py-2.5 text-right">Órdenes</th>
                    <th className="py-2.5 text-right">Cantidad</th>
                    <th className="py-2.5 text-right">
                      {priceMode === 'neto' ? 'Ventas (neto)' : 'Ventas (bruto)'}
                    </th>
                    <th className="py-2.5 text-right">Costo unit.</th>
                    <th className="py-2.5 text-right">
                      {priceMode === 'neto' ? 'Utilidad neta' : 'Utilidad bruta'}
                    </th>
                    <th className="py-2.5 text-right">
                      {priceMode === 'neto' ? 'Margen neto' : 'Margen bruto'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const revenue = priceMode === 'neto' ? r.neto_revenue  : r.total_revenue
                    const profit  = priceMode === 'neto' ? r.neto_profit   : r.gross_profit
                    const margin  = priceMode === 'neto' ? r.neto_margin_pct : r.margin_pct
                    const hasCost = r.cost_price > 0

                    return (
                      <tr key={r.product_id} className="border-b border-gray-800/40 hover:bg-gray-900/40">
                        {/* Posición */}
                        <td className="py-3 pr-2">
                          <span className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                            i === 0 ? 'bg-yellow-500 text-black' :
                            i === 1 ? 'bg-gray-400 text-black' :
                            i === 2 ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400'
                          )}>
                            {i + 1}
                          </span>
                        </td>

                        {/* Producto + barra */}
                        <td className="py-3">
                          <p className="font-medium">{r.product_name}</p>
                          <div className="w-32 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full',
                                priceMode === 'neto' ? 'bg-emerald-600/60' : 'bg-blue-600/60'
                              )}
                              style={{ width: `${Math.max(2, (revenue / maxRev) * 100)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 text-right text-gray-400">{r.order_count}</td>
                        <td className="py-3 text-right text-gray-400">
                          {fmtN(r.total_qty, r.requires_weight ? 2 : 0)}
                          {r.requires_weight ? ' kg' : ' un'}
                        </td>

                        {/* Ventas */}
                        <td className="py-3 text-right font-bold">{fmt(revenue)}</td>

                        {/* Costo unit. editable */}
                        <td className="py-3 text-right">
                          {editId === r.product_id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                autoFocus type="number" value={editCost}
                                onChange={e => setEditCost(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveCost(r)
                                  if (e.key === 'Escape') setEditId(null)
                                }}
                                className="w-20 bg-gray-900 border border-red-500 rounded px-1.5 py-1 text-xs text-right focus:outline-none"
                              />
                              <button onClick={() => saveCost(r)} className="p-1 hover:bg-green-900 rounded">
                                <Check className="w-3 h-3 text-green-400" />
                              </button>
                              <button onClick={() => setEditId(null)} className="p-1">
                                <X className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditId(r.product_id); setEditCost(String(r.cost_price ?? 0)) }}
                              className="flex items-center gap-1 text-gray-400 hover:text-white ml-auto"
                            >
                              {hasCost
                                ? fmt(r.cost_price)
                                : <span className="text-gray-600">— ingresar</span>}
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </td>

                        {/* Utilidad */}
                        <td className={clsx(
                          'py-3 text-right font-bold',
                          hasCost
                            ? profit >= 0 ? 'text-green-400' : 'text-red-400'
                            : 'text-gray-600'
                        )}>
                          {hasCost ? fmt(profit) : '—'}
                        </td>

                        {/* Margen */}
                        <td className={clsx(
                          'py-3 text-right font-bold text-sm',
                          hasCost
                            ? margin >= 30 ? 'text-green-400'
                              : margin >= 10 ? 'text-yellow-400'
                              : 'text-red-400'
                            : 'text-gray-600'
                        )}>
                          {hasCost ? `${margin}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Section>
          )}
    </div>
  )
}
