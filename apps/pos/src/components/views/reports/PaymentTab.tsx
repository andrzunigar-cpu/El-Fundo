import React, { useState, useEffect, useCallback } from 'react'
import { Edit2, Check, X, CreditCard, Banknote } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { DateRangeBar, Section, EmptyState, fmt, today, daysAgo, delta } from './shared'

export function PaymentTab() {
  const [from, setFrom] = useState(today())
  const [to,   setTo]   = useState(today())
  const [cFrom, setCFrom] = useState(daysAgo(7))
  const [cTo,   setCTo]   = useState(daysAgo(1))
  const [data, setData] = useState<any>(null)
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editMethod, setEditMethod] = useState<string | null>(null)
  const [editPct, setEditPct] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const [r, s] = await Promise.all([
      api.reports.byPaymentMethod(from, to, cFrom, cTo),
      api.paymentSettings.getAll(),
    ])
    setData(r)
    setSettings(s)
    setLoading(false)
  }, [from, to, cFrom, cTo])

  useEffect(() => { load() }, [load])

  const savePct = async (method: string) => {
    const pct = parseFloat(editPct)
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error('Comisión inválida (0-100)'); return }
    await (window as any).posAPI.paymentSettings.update(method, pct)
    toast.success('Comisión actualizada')
    setEditMethod(null)
    load()
  }

  const rows: any[] = data?.rows ?? []
  const cRows: any[] = data?.compare ?? []
  const totalNet = rows.reduce((s, r) => s + r.net_revenue, 0)
  const totalComm = rows.reduce((s, r) => s + r.commission_amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <DateRangeBar from={from} to={to} onChange={(f,t)=>{setFrom(f);setTo(t)}}
          compareFrom={cFrom} compareTo={cTo}
          onCompareChange={(f,t)=>{setCFrom(f);setCTo(t)}}
          showCompare />
        <button onClick={() => setShowSettings(v => !v)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5',
            showSettings ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
          <Edit2 className="w-3 h-3" /> Comisiones
        </button>
      </div>

      {/* Panel comisiones */}
      {showSettings && (
        <Section title="Configurar comisiones por medio de pago">
          <div className="grid grid-cols-2 gap-2">
            {settings.map(s => (
              <div key={s.method} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  {s.method === 'cash' ? <Banknote className="w-4 h-4 text-green-400" /> : <CreditCard className="w-4 h-4 text-blue-400" />}
                  <span className="text-sm">{s.label}</span>
                </div>
                {editMethod === s.method ? (
                  <div className="flex items-center gap-1">
                    <input autoFocus type="number" step="0.1" min="0" max="100" value={editPct}
                      onChange={e => setEditPct(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') savePct(s.method); if (e.key === 'Escape') setEditMethod(null) }}
                      className="w-20 bg-gray-900 border border-red-500 rounded px-2 py-1 text-xs text-right focus:outline-none" />
                    <span className="text-xs text-gray-400">%</span>
                    <button onClick={() => savePct(s.method)} className="p-1 hover:bg-green-900 rounded"><Check className="w-3 h-3 text-green-400" /></button>
                    <button onClick={() => setEditMethod(null)} className="p-1 hover:bg-red-900 rounded"><X className="w-3 h-3 text-red-400" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditMethod(s.method); setEditPct(String(s.commission_pct)) }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                    {s.commission_pct}%
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {loading ? <div className="text-center text-gray-500 py-12">Cargando...</div> : rows.length === 0 ? <EmptyState /> : (
        <>
          {/* Resumen totales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Facturado bruto</p>
              <p className="text-3xl font-black">{fmt(data.total)}</p>
            </div>
            <div className="bg-red-950/30 border border-red-900 rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Neto (después comisiones)</p>
              <p className="text-3xl font-black text-green-400">{fmt(totalNet)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Total comisiones</p>
              <p className="text-3xl font-black text-red-400">{fmt(totalComm)}</p>
            </div>
          </div>

          {/* Tabla detalle */}
          <Section title="Detalle por método de pago">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                  <th className="py-2.5">Método</th>
                  <th className="py-2.5 text-right">Órdenes</th>
                  <th className="py-2.5 text-right">Ticket prom.</th>
                  <th className="py-2.5 text-right">Facturado</th>
                  <th className="py-2.5 text-right">% Part.</th>
                  <th className="py-2.5 text-right">Comisión</th>
                  <th className="py-2.5 text-right">Neto</th>
                  {cRows.length > 0 && <th className="py-2.5 text-right">Vs anterior</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const prev = cRows.find((c: any) => c.payment_method === r.payment_method)
                  const pct = prev ? ((r.revenue - prev.revenue) / prev.revenue * 100) : null
                  return (
                    <tr key={r.payment_method} className="border-b border-gray-800/40 hover:bg-gray-900/40">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {r.payment_method === 'cash'
                            ? <Banknote className="w-4 h-4 text-green-400" />
                            : <CreditCard className="w-4 h-4 text-blue-400" />}
                          <span className="font-medium">{r.label ?? r.payment_method}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-400">{r.orders}</td>
                      <td className="py-3 text-right text-gray-400">{fmt(r.avg_ticket)}</td>
                      <td className="py-3 text-right font-bold">{fmt(r.revenue)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${r.participation_pct}%` }} />
                          </div>
                          <span className="text-gray-300 text-xs w-10 text-right">{r.participation_pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-red-400 text-xs">
                        {r.commission_pct > 0 ? `-${fmt(r.commission_amount)} (${r.commission_pct}%)` : '—'}
                      </td>
                      <td className="py-3 text-right font-bold text-green-400">{fmt(r.net_revenue)}</td>
                      {cRows.length > 0 && (
                        <td className={clsx('py-3 text-right text-xs font-medium',
                          pct === null ? 'text-gray-600' : pct >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {pct !== null ? `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%` : '—'}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Section>
        </>
      )}
    </div>
  )
}
