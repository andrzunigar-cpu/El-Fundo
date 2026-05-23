import React, { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { DateRangeBar, Section, EmptyState, fmt, fmtN, today, daysAgo } from './shared'

export function HourlyTab() {
  const [from, setFrom] = useState(today())
  const [to,   setTo]   = useState(today())
  const [cFrom, setCFrom] = useState(daysAgo(7))
  const [cTo,   setCTo]   = useState(daysAgo(1))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await (window as any).posAPI.reports.byHour(from, to, cFrom, cTo)
    setData(r)
    setLoading(false)
  }, [from, to, cFrom, cTo])

  useEffect(() => { load() }, [load])

  const hours: any[] = data?.hours ?? []
  const cHours: any[] = data?.compare ?? []
  const maxRevenue = Math.max(...hours.map(h => h.revenue), 1)
  const maxOrders  = Math.max(...hours.map(h => h.orders), 1)

  const peakHour  = hours.reduce((best, h) => h.revenue > (best?.revenue ?? 0) ? h : best, null as any)
  const totalOrders = hours.reduce((s, h) => s + h.orders, 0)
  const totalRevenue = hours.reduce((s, h) => s + h.revenue, 0)
  const activeHours = hours.filter(h => h.orders > 0).length

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12  = h % 12 === 0 ? 12 : h % 12
    return `${h12}:00 ${ampm}`
  }

  return (
    <div className="space-y-5">
      <DateRangeBar
        from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }}
        compareFrom={cFrom} compareTo={cTo}
        onCompareChange={(f, t) => { setCFrom(f); setCTo(t) }}
        showCompare />

      {loading ? <div className="text-center text-gray-500 py-12">Cargando...</div> : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Total órdenes</p>
              <p className="text-3xl font-black">{totalOrders}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Total facturado</p>
              <p className="text-3xl font-black text-green-400">{fmt(totalRevenue)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Horas activas</p>
              <p className="text-3xl font-black">{activeHours}</p>
              <p className="text-xs text-gray-500 mt-1">de 24 posibles</p>
            </div>
            <div className="bg-red-950/30 border border-red-900 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Hora pico</p>
              <p className="text-3xl font-black text-red-400">
                {peakHour ? formatHour(peakHour.hour) : '—'}
              </p>
              {peakHour && <p className="text-xs text-gray-500 mt-1">{fmt(peakHour.revenue)}</p>}
            </div>
          </div>

          {hours.every(h => h.orders === 0) ? <EmptyState /> : (
            <Section title="Ventas por hora del día">
              <div className="space-y-1">
                {hours.map(h => {
                  const prev = cHours.find(c => c.hour === h.hour)
                  const pct  = prev?.revenue ? ((h.revenue - prev.revenue) / prev.revenue * 100) : null
                  const revBar  = (h.revenue / maxRevenue) * 100
                  const ordBar  = (h.orders  / maxOrders)  * 100
                  const isPeak  = peakHour && h.hour === peakHour.hour
                  return (
                    <div key={h.hour}
                      className={clsx('grid items-center gap-2 py-1.5 px-2 rounded-lg',
                        h.orders > 0 ? 'hover:bg-gray-900/50' : 'opacity-30',
                        isPeak && 'bg-red-950/20')}>
                      {/* Hour label */}
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0 font-mono"
                        style={{ gridColumn: '1' }}>
                        {formatHour(h.hour)}
                      </span>

                      {/* Revenue bar */}
                      <div className="flex-1 flex items-center gap-2" style={{ gridColumn: '2' }}>
                        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                          <div className={clsx('h-full rounded-full', isPeak ? 'bg-red-500' : 'bg-red-700/60')}
                            style={{ width: `${revBar}%` }} />
                        </div>
                      </div>

                      {/* Revenue value */}
                      <span className={clsx('text-xs font-bold w-24 text-right flex-shrink-0',
                        isPeak ? 'text-red-400' : h.orders > 0 ? 'text-white' : 'text-gray-600')}
                        style={{ gridColumn: '3' }}>
                        {h.orders > 0 ? fmt(h.revenue) : '—'}
                      </span>

                      {/* Orders */}
                      <div className="flex items-center gap-1.5 w-20 flex-shrink-0" style={{ gridColumn: '4' }}>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600/60 rounded-full" style={{ width: `${ordBar}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500 w-6 text-right">{h.orders > 0 ? h.orders : ''}</span>
                      </div>

                      {/* Avg ticket */}
                      <span className="text-[10px] text-gray-500 w-20 text-right flex-shrink-0" style={{ gridColumn: '5' }}>
                        {h.orders > 0 ? fmt(Math.round(h.revenue / h.orders)) : ''}
                      </span>

                      {/* vs compare */}
                      {cHours.length > 0 && (
                        <span className={clsx('text-[10px] font-medium w-16 text-right flex-shrink-0',
                          pct === null ? 'text-gray-700' : pct >= 0 ? 'text-green-400' : 'text-red-400')}
                          style={{ gridColumn: '6' }}>
                          {pct !== null && h.orders > 0 ? `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(0)}%` : ''}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-2 bg-red-700/60 rounded-full" />
                  <span>Facturado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-1.5 bg-blue-600/60 rounded-full" />
                  <span>Órdenes</span>
                </div>
                <span className="ml-auto">Columnas: hora · facturado · ticket prom. {cHours.length > 0 ? '· vs anterior' : ''}</span>
              </div>
            </Section>
          )}

          {/* Heatmap-style table */}
          {hours.some(h => h.orders > 0) && (
            <Section title="Tabla resumen por hora">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="py-2 text-left">Hora</th>
                    <th className="py-2 text-right">Órdenes</th>
                    <th className="py-2 text-right">Facturado</th>
                    <th className="py-2 text-right">Ticket prom.</th>
                    {cHours.length > 0 && <th className="py-2 text-right">Vs anterior</th>}
                  </tr>
                </thead>
                <tbody>
                  {hours.filter(h => h.orders > 0).map(h => {
                    const prev = cHours.find(c => c.hour === h.hour)
                    const pct  = prev?.revenue ? ((h.revenue - prev.revenue) / prev.revenue * 100) : null
                    const isPeak = peakHour && h.hour === peakHour.hour
                    return (
                      <tr key={h.hour} className={clsx('border-b border-gray-800/40', isPeak && 'bg-red-950/10')}>
                        <td className={clsx('py-2 font-mono', isPeak ? 'text-red-400 font-bold' : '')}>{formatHour(h.hour)}</td>
                        <td className="py-2 text-right">{h.orders}</td>
                        <td className={clsx('py-2 text-right font-medium', isPeak ? 'text-red-400' : '')}>{fmt(h.revenue)}</td>
                        <td className="py-2 text-right text-gray-400">{fmt(Math.round(h.revenue / h.orders))}</td>
                        {cHours.length > 0 && (
                          <td className={clsx('py-2 text-right font-medium',
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
          )}
        </>
      )}
    </div>
  )
}
