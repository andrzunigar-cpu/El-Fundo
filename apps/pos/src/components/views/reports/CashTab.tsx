import React, { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { DateRangeBar, Section, EmptyState, fmt, fmtN, today, daysAgo } from './shared'

export function CashTab() {
  const [from, setFrom] = useState(today())
  const [to,   setTo]   = useState(today())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await (window as any).posAPI.reports.cashSessions(from, to)
    setData(r)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const sessions: any[] = data?.sessions ?? []
  const totalOrders  = sessions.reduce((s, r) => s + r.order_count, 0)
  const totalRevenue = sessions.reduce((s, r) => s + r.total_revenue, 0)
  const avgPerSession = sessions.length ? totalRevenue / sessions.length : 0

  return (
    <div className="space-y-5">
      <DateRangeBar from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />

      {loading ? <div className="text-center text-gray-500 py-12">Cargando...</div> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Sesiones de caja</p>
              <p className="text-3xl font-black">{sessions.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Total facturado</p>
              <p className="text-3xl font-black text-green-400">{fmt(totalRevenue)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Promedio por sesión</p>
              <p className="text-3xl font-black">{fmt(avgPerSession)}</p>
            </div>
          </div>

          {sessions.length === 0 ? <EmptyState msg="Sin sesiones en el período" /> : (
            <Section title="Sesiones de caja">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                    <th className="py-2.5">Apertura</th>
                    <th className="py-2.5">Cierre</th>
                    <th className="py-2.5 text-right">Duración</th>
                    <th className="py-2.5 text-right">Órdenes</th>
                    <th className="py-2.5 text-right">Efectivo</th>
                    <th className="py-2.5 text-right">Tarjeta / Digital</th>
                    <th className="py-2.5 text-right">Total</th>
                    <th className="py-2.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any) => {
                    const open  = new Date(s.opened_at)
                    const close = s.closed_at ? new Date(s.closed_at) : null
                    const mins  = close ? Math.round((close.getTime() - open.getTime()) / 60000) : null
                    const dur   = mins !== null
                      ? mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`
                      : '—'
                    const isOpen = s.status === 'open'
                    const isExpanded = expanded === s.id

                    return (
                      <React.Fragment key={s.id}>
                        <tr
                          className={clsx('border-b border-gray-800/40 hover:bg-gray-900/40 cursor-pointer',
                            isOpen && 'bg-green-950/10')}
                          onClick={() => setExpanded(isExpanded ? null : s.id)}>
                          <td className="py-3">
                            <p>{open.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                            <p className="text-xs text-gray-500">{open.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="py-3">
                            {close ? (
                              <>
                                <p>{close.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                <p className="text-xs text-gray-500">{close.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                              </>
                            ) : <span className="text-xs text-green-400">Abierta</span>}
                          </td>
                          <td className="py-3 text-right text-gray-400">{dur}</td>
                          <td className="py-3 text-right font-medium">{s.order_count}</td>
                          <td className="py-3 text-right text-green-400">{fmt(s.cash_revenue ?? 0)}</td>
                          <td className="py-3 text-right text-blue-400">{fmt((s.total_revenue ?? 0) - (s.cash_revenue ?? 0))}</td>
                          <td className="py-3 text-right font-bold">{fmt(s.total_revenue ?? 0)}</td>
                          <td className="py-3 text-right">
                            <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full',
                              isOpen ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400')}>
                              {isOpen ? 'Abierta' : 'Cerrada'}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && s.payment_breakdown && (
                          <tr className="border-b border-gray-800/40 bg-gray-900/30">
                            <td colSpan={8} className="px-4 py-3">
                              <p className="text-xs text-gray-400 uppercase mb-2 font-semibold">Desglose por medio de pago</p>
                              <div className="flex gap-4 flex-wrap">
                                {(s.payment_breakdown as any[]).map((pb: any) => (
                                  <div key={pb.method} className="bg-gray-800 rounded-lg px-3 py-2 text-xs">
                                    <p className="text-gray-400 mb-0.5">{pb.label ?? pb.method}</p>
                                    <p className="font-bold">{fmt(pb.revenue)}</p>
                                    <p className="text-gray-500">{pb.orders} órdenes</p>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-600 mt-3">
                * Haz clic en una sesión para ver el desglose por medio de pago · Total: {totalOrders} órdenes en el período
              </p>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
