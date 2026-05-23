import React, { useState, useEffect, useCallback } from 'react'
import { DateRangeBar, Kpi, Section, EmptyState, fmt, today, daysAgo, delta } from './shared'

export function SummaryTab() {
  const [from, setFrom] = useState(today())
  const [to,   setTo]   = useState(today())
  const [cFrom, setCFrom] = useState(daysAgo(7))
  const [cTo,   setCTo]   = useState(daysAgo(1))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const r = await api.reports.summary(from, to, cFrom, cTo)
    setData(r)
    setLoading(false)
  }, [from, to, cFrom, cTo])

  useEffect(() => { load() }, [load])

  const d = data ?? {}
  const c = d.compare ?? {}

  return (
    <div className="space-y-5">
      <DateRangeBar from={from} to={to} onChange={(f,t) => { setFrom(f); setTo(t) }}
        compareFrom={cFrom} compareTo={cTo}
        onCompareChange={(f,t) => { setCFrom(f); setCTo(t) }}
        showCompare />

      {loading ? <div className="text-center text-gray-500 py-16">Cargando...</div> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Kpi label="Órdenes" value={d.orders ?? 0} sub="transacciones"
              delta={c.orders ? delta(d.orders, c.orders) : undefined} />
            <Kpi label="Facturado" value={fmt(d.revenue)} highlight
              delta={c.revenue ? delta(d.revenue, c.revenue) : undefined} />
            <Kpi label="Ticket promedio" value={fmt(d.avg_ticket)}
              delta={c.avg_ticket ? delta(d.avg_ticket, c.avg_ticket) : undefined} />
          </div>

          {c.orders !== undefined && (
            <Section title="Comparativo período anterior">
              <div className="grid grid-cols-3 gap-4 text-sm">
                {[
                  { label: 'Órdenes', curr: d.orders, prev: c.orders },
                  { label: 'Facturado', curr: d.revenue, prev: c.revenue, money: true },
                  { label: 'Ticket prom.', curr: d.avg_ticket, prev: c.avg_ticket, money: true },
                ].map(({ label, curr, prev, money }) => {
                  const pct = prev ? ((curr - prev) / prev * 100) : 0
                  return (
                    <div key={label} className="bg-gray-800 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="font-bold">{money ? fmt(curr) : curr}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Anterior: {money ? fmt(prev) : prev}</p>
                      <p className={`text-xs font-medium mt-1 ${pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
                      </p>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {d.series?.length > 1 && (
            <Section title="Evolución diaria">
              <div className="space-y-1.5">
                {d.series.map((row: any) => {
                  const pct = d.revenue > 0 ? (row.revenue / d.revenue) * 100 : 0
                  return (
                    <div key={row.day} className="flex items-center gap-3 text-xs">
                      <span className="text-gray-400 w-24 flex-shrink-0">
                        {new Date(row.day + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex-1 h-3.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600/70 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-24 text-right font-medium">{fmt(row.revenue)}</span>
                      <span className="text-gray-500 w-14 text-right">{row.orders} ventas</span>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {!d.orders && <EmptyState />}
        </>
      )}
    </div>
  )
}
