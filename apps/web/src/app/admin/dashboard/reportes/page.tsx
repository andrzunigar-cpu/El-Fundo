'use client'

import { useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import {
  TrendingUp, Package, BarChart3, RefreshCw,
  DollarSign, ShoppingBag, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, Minus, Clock,
} from 'lucide-react'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface VentasData {
  range: number
  summary: { totalRevenue: number; totalOrders: number; avgTicket: number }
  dailySales: Array<{ date: string; total: number; count: number }>
  byPayment: Array<{ method: string; total: number; count: number }>
  topProducts: Array<{ name: string; qty: number; total: number }>
  lastSyncAt: string | null
}

interface InventarioData {
  summary: { totalProductos: number; sinStock: number; stockBajo: number; valorTotal: number }
  stock: Array<{
    id: string; name: string; sku: string; unit: string
    qty: number; available: number; minStock: number
    costPrice: number; basePrice: number; stockValue: number
    status: 'ok' | 'bajo' | 'sin_stock'; updatedAt: string | null
  }>
  lastSyncAt: string | null
}

interface ResultadoData {
  period: { year: number; month: number }
  summary: {
    totalIngresos: number; totalCosto: number
    margenBruto: number; margenBrutoPct: number
    totalPedidos: number; hasCostData: boolean
  }
  byWeek: Array<{ week: number; ingresos: number; count: number }>
  topRentabilidad: Array<{ name: string; ingresos: number; costo: number; margen: number; margenPct: number }>
  monthlyTrend: Array<{ label: string; ingresos: number; pedidos: number }>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Efectivo', debit_card: 'Débito', credit_card: 'Crédito',
  transfer: 'Transferencia', webpay: 'Webpay', amipass: 'Amipass',
  edenred: 'Edenred', pluxee: 'Pluxee',
}

const TABS = ['Ventas', 'Inventario', 'Resultado'] as const
type Tab = typeof TABS[number]

// ── Componente principal ──────────────────────────────────────────────────────

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Ventas')

  // Estado por tab
  const [ventas,     setVentas]     = useState<VentasData | null>(null)
  const [inventario, setInventario] = useState<InventarioData | null>(null)
  const [resultado,  setResultado]  = useState<ResultadoData | null>(null)

  const [loadingV, setLoadingV] = useState(false)
  const [loadingI, setLoadingI] = useState(false)
  const [loadingR, setLoadingR] = useState(false)

  // Filtros Ventas
  const [rangeV, setRangeV] = useState(30)

  // Filtros Resultado
  const now   = new Date()
  const [yearR,  setYearR]  = useState(now.getFullYear())
  const [monthR, setMonthR] = useState(now.getMonth() + 1)

  // ── Fetchers ────────────────────────────────────────────────────────────
  const fetchVentas = useCallback(async () => {
    setLoadingV(true)
    try {
      const r = await fetch(`/api/reports/ventas?range=${rangeV}`)
      if (r.ok) setVentas(await r.json())
    } finally { setLoadingV(false) }
  }, [rangeV])

  const fetchInventario = useCallback(async () => {
    setLoadingI(true)
    try {
      const r = await fetch('/api/reports/inventario')
      if (r.ok) setInventario(await r.json())
    } finally { setLoadingI(false) }
  }, [])

  const fetchResultado = useCallback(async () => {
    setLoadingR(true)
    try {
      const r = await fetch(`/api/reports/resultado?year=${yearR}&month=${monthR}`)
      if (r.ok) setResultado(await r.json())
    } finally { setLoadingR(false) }
  }, [yearR, monthR])

  // Cargar al cambiar de tab
  useEffect(() => {
    if (activeTab === 'Ventas'     && !ventas)     fetchVentas()
    if (activeTab === 'Inventario' && !inventario) fetchInventario()
    if (activeTab === 'Resultado'  && !resultado)  fetchResultado()
  }, [activeTab])

  useEffect(() => { if (activeTab === 'Ventas') fetchVentas() }, [rangeV])
  useEffect(() => { if (activeTab === 'Resultado') fetchResultado() }, [yearR, monthR])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Datos sincronizados desde el POS local · Sync automático 19:35 diario
          </p>
        </div>

        {/* Última sincronización */}
        {(ventas?.lastSyncAt || inventario?.lastSyncAt) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            Último sync POS: {fmtDate((ventas?.lastSyncAt ?? inventario?.lastSyncAt)!)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(tab => {
          const Icon = tab === 'Ventas' ? TrendingUp : tab === 'Inventario' ? Package : BarChart3
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Tab Ventas ────────────────────────────────────────────────────── */}
      {activeTab === 'Ventas' && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[7, 14, 30, 90].map(d => (
                <button key={d}
                  onClick={() => setRangeV(d)}
                  className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    rangeV === d ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {d}d
                </button>
              ))}
            </div>
            <button onClick={fetchVentas} disabled={loadingV}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors">
              <RefreshCw className={clsx('w-4 h-4', loadingV && 'animate-spin')} />
              Actualizar
            </button>
          </div>

          {loadingV ? <LoadingState /> : ventas ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <KpiCard icon={DollarSign} label="Ingresos" value={fmt(ventas.summary.totalRevenue)} color="green" />
                <KpiCard icon={ShoppingBag} label="Pedidos" value={String(ventas.summary.totalOrders)} color="blue" />
                <KpiCard icon={TrendingUp} label="Ticket promedio" value={fmt(ventas.summary.avgTicket)} color="purple" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Ventas diarias (mini chart) */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Ventas diarias</h3>
                  <DailyChart data={ventas.dailySales} />
                </div>

                {/* Por medio de pago */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Por medio de pago</h3>
                  <div className="space-y-2">
                    {ventas.byPayment.map(p => {
                      const pct = ventas.summary.totalRevenue > 0
                        ? Math.round((p.total / ventas.summary.totalRevenue) * 100) : 0
                      return (
                        <div key={p.method}>
                          <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                            <span>{PAYMENT_LABEL[p.method] ?? p.method}</span>
                            <span className="font-semibold">{fmt(p.total)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Top productos */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Top productos por ingresos</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left px-5 py-2 font-semibold">Producto</th>
                      <th className="text-right px-4 py-2 font-semibold">Cantidad</th>
                      <th className="text-right px-5 py-2 font-semibold">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ventas.topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-2.5 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500 font-mono">
                          {p.qty % 1 === 0 ? p.qty : p.qty.toFixed(2)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{fmt(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <EmptyState />}
        </div>
      )}

      {/* ── Tab Inventario ───────────────────────────────────────────────── */}
      {activeTab === 'Inventario' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={fetchInventario} disabled={loadingI}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors">
              <RefreshCw className={clsx('w-4 h-4', loadingI && 'animate-spin')} />
              Actualizar
            </button>
          </div>

          {loadingI ? <LoadingState /> : inventario ? (
            <>
              <div className="grid grid-cols-4 gap-4">
                <KpiCard icon={Package}      label="Total productos"  value={String(inventario.summary.totalProductos)} color="gray" />
                <KpiCard icon={CheckCircle2} label="Valor en stock"   value={fmt(inventario.summary.valorTotal)}        color="green" />
                <KpiCard icon={AlertTriangle} label="Stock bajo"      value={String(inventario.summary.stockBajo)}       color="yellow" />
                <KpiCard icon={AlertTriangle} label="Sin stock"       value={String(inventario.summary.sinStock)}        color="red" />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Stock por producto</h3>
                  {inventario.lastSyncAt && (
                    <span className="text-xs text-gray-400">Último sync: {fmtDate(inventario.lastSyncAt)}</span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-5 py-2.5 font-semibold">Producto</th>
                        <th className="text-center py-2.5 font-semibold">Unidad</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Stock</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Disponible</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Mín.</th>
                        <th className="text-right px-5 py-2.5 font-semibold">Valor</th>
                        <th className="text-center py-2.5 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {inventario.stock
                        .sort((a, b) => {
                          const ord = { sin_stock: 0, bajo: 1, ok: 2 }
                          return ord[a.status] - ord[b.status]
                        })
                        .map(s => (
                          <tr key={s.id} className={clsx('hover:bg-gray-50', s.status === 'sin_stock' && 'bg-red-50/30')}>
                            <td className="px-5 py-2.5">
                              <p className="font-medium text-gray-900">{s.name}</p>
                              <p className="text-[11px] text-gray-400">{s.sku}</p>
                            </td>
                            <td className="text-center py-2.5 text-xs text-gray-500">{s.unit}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs">{s.qty.toFixed(s.unit === 'kg' ? 2 : 0)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs">{s.available.toFixed(s.unit === 'kg' ? 2 : 0)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-400">{s.minStock}</td>
                            <td className="px-5 py-2.5 text-right font-mono text-xs">
                              {s.stockValue > 0 ? fmt(s.stockValue) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold',
                                s.status === 'ok'       ? 'bg-green-100 text-green-700' :
                                s.status === 'bajo'     ? 'bg-yellow-100 text-yellow-700' :
                                                          'bg-red-100 text-red-700')}>
                                {s.status === 'ok' ? 'OK' : s.status === 'bajo' ? 'Bajo' : 'Sin stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : <EmptyState />}
        </div>
      )}

      {/* ── Tab Resultado ────────────────────────────────────────────────── */}
      {activeTab === 'Resultado' && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select value={monthR} onChange={e => setMonthR(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-400">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('es-CL', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select value={yearR} onChange={e => setYearR(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-400">
                {[now.getFullYear() - 1, now.getFullYear()].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchResultado} disabled={loadingR}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors">
              <RefreshCw className={clsx('w-4 h-4', loadingR && 'animate-spin')} />
              Actualizar
            </button>
          </div>

          {loadingR ? <LoadingState /> : resultado ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-4">
                <KpiCard icon={DollarSign}   label="Ingresos"       value={fmt(resultado.summary.totalIngresos)}    color="green" />
                <KpiCard icon={ShoppingBag}  label="Pedidos"        value={String(resultado.summary.totalPedidos)}  color="blue" />
                {resultado.summary.hasCostData ? (
                  <>
                    <KpiCard icon={TrendingUp} label="Margen bruto" value={fmt(resultado.summary.margenBruto)}     color="purple" />
                    <KpiCard icon={BarChart3}   label="Margen %"    value={`${resultado.summary.margenBrutoPct}%`} color={resultado.summary.margenBrutoPct >= 30 ? 'green' : 'yellow'} />
                  </>
                ) : (
                  <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      Sin datos de costo — configura precio de costo en los productos del POS para ver rentabilidad
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Tendencia mensual */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Tendencia últimos 6 meses</h3>
                  <MonthlyChart data={resultado.monthlyTrend} />
                </div>

                {/* Por semana */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Ingresos por semana</h3>
                  <div className="space-y-2">
                    {resultado.byWeek.map(w => (
                      <div key={w.week} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Semana {w.week}</span>
                        <span className="font-semibold text-gray-900">{fmt(w.ingresos)}</span>
                        <span className="text-xs text-gray-400">{w.count} pedidos</span>
                      </div>
                    ))}
                    {resultado.byWeek.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Sin datos en este período</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top rentabilidad */}
              {resultado.summary.hasCostData && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Rentabilidad por producto</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-5 py-2.5 font-semibold">Producto</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Ingresos</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Costo</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Margen</th>
                        <th className="text-right px-5 py-2.5 font-semibold">Margen %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {resultado.topRentabilidad.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-2.5 font-medium text-gray-900">{p.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs">{fmt(p.ingresos)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-500">{fmt(p.costo)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">{fmt(p.margen)}</td>
                          <td className="px-5 py-2.5 text-right">
                            <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold',
                              p.margenPct >= 40 ? 'bg-green-100 text-green-700' :
                              p.margenPct >= 20 ? 'bg-blue-100 text-blue-700' :
                              p.margenPct >= 0  ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-red-100 text-red-700')}>
                              {p.margenPct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : <EmptyState />}
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string
  color: 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'gray'
}) {
  const colors = {
    green:  'bg-green-50 text-green-600',
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red:    'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray:   'bg-gray-100 text-gray-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className={clsx('p-2.5 rounded-xl', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function DailyChart({ data }: { data: Array<{ date: string; total: number; count: number }> }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
  const max = Math.max(...data.map(d => d.total), 1)
  const last = data.slice(-14)
  return (
    <div className="flex items-end gap-1 h-24">
      {last.map((d, i) => {
        const pct = Math.round((d.total / max) * 100)
        const label = new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full bg-red-500 rounded-t-sm transition-all hover:bg-red-600"
              style={{ height: `${Math.max(4, pct)}%` }} />
            <span className="text-[9px] text-gray-300 leading-tight">{label.split(' ')[0]}</span>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
              {fmt(d.total)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthlyChart({ data }: { data: Array<{ label: string; ingresos: number; pedidos: number }> }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
  const max = Math.max(...data.map(d => d.ingresos), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = Math.round((d.ingresos / max) * 100)
        const isLast = i === data.length - 1
        return (
          <div key={i}>
            <div className="flex justify-between text-xs text-gray-600 mb-0.5">
              <span className={isLast ? 'font-bold text-gray-900' : ''}>{d.label}</span>
              <span className={isLast ? 'font-bold text-gray-900' : ''}>{fmt(d.ingresos)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={clsx('h-full rounded-full', isLast ? 'bg-red-500' : 'bg-red-200')}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-6 h-6 text-gray-300 animate-spin mr-3" />
      <span className="text-gray-400 text-sm">Cargando datos...</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <BarChart3 className="w-10 h-10 text-gray-200 mb-3" />
      <p className="text-gray-400 text-sm">Haz clic en Actualizar para cargar los datos</p>
    </div>
  )
}