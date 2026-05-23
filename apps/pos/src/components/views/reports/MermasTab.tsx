import React, { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { DateRangeBar, Section, EmptyState, fmt, fmtN, today, daysAgo } from './shared'

export function MermasTab() {
  const [from, setFrom] = useState(today())
  const [to,   setTo]   = useState(today())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'product' | 'reason'>('reason')

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const r = await api.reports.mermas(from, to)
    setData(r)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const byReason: any[] = data?.byReason ?? []
  const byProduct: any[] = data?.byProduct ?? []
  const maxVal = byReason.length ? byReason[0]?.value_lost ?? 1 : 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DateRangeBar from={from} to={to} onChange={(f,t) => { setFrom(f); setTo(t) }} />
        <div className="flex gap-2">
          {(['reason', 'product'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold',
                view === v ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
              {v === 'reason' ? 'Por motivo' : 'Por producto'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center text-gray-500 py-12">Cargando...</div> : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-950/30 border border-orange-900 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Pérdida total estimada</p>
              <p className="text-3xl font-black text-orange-400">{fmt(data?.total_value ?? 0)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Cantidad total dada de baja</p>
              <p className="text-3xl font-black">{fmtN(data?.total_qty, 2)}</p>
              <p className="text-xs text-gray-500 mt-1">unidades / kg</p>
            </div>
          </div>

          {view === 'reason' ? (
            <Section title="Mermas por motivo">
              {byReason.length === 0 ? <EmptyState /> : (
                <div className="space-y-3">
                  {byReason.map((r: any) => (
                    <div key={r.reason}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{r.reason || 'Sin especificar'}</span>
                        <span className="font-bold text-orange-400">{fmt(r.value_lost)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-600/70 rounded-full"
                            style={{ width: `${(r.value_lost / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-24 text-right">
                          {fmtN(r.total_qty, 2)} · {r.records} registros
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          ) : (
            <Section title="Mermas por producto">
              {byProduct.length === 0 ? <EmptyState /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                      <th className="py-2.5">Producto</th>
                      <th className="py-2.5">Motivo</th>
                      <th className="py-2.5 text-right">Cantidad</th>
                      <th className="py-2.5 text-right">Pérdida estimada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProduct.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-900/40">
                        <td className="py-2.5">
                          <p className="font-medium">{r.product_name}</p>
                          <p className="text-xs font-mono text-gray-500">{r.sku}</p>
                        </td>
                        <td className="py-2.5 text-gray-400">{r.reason || '—'}</td>
                        <td className="py-2.5 text-right">
                          {fmtN(r.total_qty, r.requires_weight ? 2 : 0)}
                          <span className="text-xs text-gray-500 ml-1">{r.requires_weight ? 'kg' : 'un'}</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-orange-400">{fmt(r.value_lost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  )
}
