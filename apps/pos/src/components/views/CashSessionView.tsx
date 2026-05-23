import React, { useEffect, useState, useCallback } from 'react'
import {
  Wallet, TrendingUp, ShoppingBag, Lock, Unlock,
  Receipt, X, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── helpers ───────────────────────────────────────────────
const fmt = (n: number) => `$${Number(n || 0).toLocaleString('es-CL')}`

const PAY_LABEL: Record<string, string> = {
  cash: 'Efectivo', debit_card: 'Débito', credit_card: 'Crédito',
  transfer: 'Transfer.', webpay: 'Webpay',
  amipass: 'Amipass', edenred: 'Edenred', pluxee: 'Pluxee',
  uber_reparto: 'Uber', uber_local: 'Uber L', rappi_reparto: 'Rappi',
  rappi_local: 'Rappi L', pedidosya_reparto: 'PedYa', pedidosya_local: 'PedYa L',
}

const PAY_COLOR: Record<string, string> = {
  cash:        'bg-green-900/60 text-green-300',
  debit_card:  'bg-blue-900/60 text-blue-300',
  credit_card: 'bg-purple-900/60 text-purple-300',
  transfer:    'bg-cyan-900/60 text-cyan-300',
  webpay:      'bg-indigo-900/60 text-indigo-300',
  amipass:     'bg-amber-900/60 text-amber-300',
  edenred:     'bg-orange-900/60 text-orange-300',
  pluxee:      'bg-rose-900/60 text-rose-300',
}
const payColor = (m: string) => PAY_COLOR[m] ?? 'bg-gray-800 text-gray-300'
const payLabel = (m: string) => PAY_LABEL[m] ?? m

// ── root ──────────────────────────────────────────────────
export function CashSessionView() {
  const [session, setSession]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [showClose, setShowClose] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const s = await (window as any).posAPI.session.getCurrent()
    setSession(s)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="h-full flex items-center justify-center text-gray-500">Cargando...</div>
  )

  if (showClose && session) return (
    <CierreDeCaja
      session={session}
      onCancelled={() => setShowClose(false)}
      onClosed={() => { setShowClose(false); load() }}
    />
  )

  return (
    <div className="h-full overflow-y-auto bg-gray-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Caja</h1>
          {session && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Abierta desde{' '}
              {new Date(session.opened_at).toLocaleTimeString('es-CL', {
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
          )}
        </div>

        {!session
          ? <OpenSessionCard onOpened={load} />
          : <CurrentSessionCard session={session} onRequestClose={() => setShowClose(true)} />
        }
      </div>
    </div>
  )
}

// ── abrir caja ────────────────────────────────────────────
function OpenSessionCard({ onOpened }: { onOpened: () => void }) {
  const [openingCash, setOpeningCash] = useState('')
  const [saving, setSaving] = useState(false)

  const open = async () => {
    const cash = parseInt(openingCash.replace(/\D/g, ''), 10) || 0
    setSaving(true)
    try {
      await (window as any).posAPI.session.open({
        openingCash: cash, registerNumber: 1, cashierId: 'admin',
      })
      toast.success('Caja abierta')
      onOpened()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <Unlock className="w-8 h-8 text-gray-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">No hay caja abierta</h2>
      <p className="text-sm text-gray-400 mb-6">
        Antes de comenzar a vender, abre la caja con el monto inicial en efectivo.
      </p>
      <div className="max-w-xs mx-auto space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block text-left">Monto inicial en efectivo</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
            <input
              type="text" inputMode="numeric"
              value={openingCash ? Number(openingCash).toLocaleString('es-CL') : ''}
              onChange={e => setOpeningCash(e.target.value.replace(/\D/g, ''))}
              placeholder="50.000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-3 text-xl font-bold focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
        <button onClick={open} disabled={saving}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
          <Unlock className="w-4 h-4" />
          {saving ? 'Abriendo...' : 'Abrir caja'}
        </button>
      </div>
    </div>
  )
}

// ── vista principal de sesión activa ──────────────────────
function CurrentSessionCard({ session, onRequestClose }: any) {
  const [dailySales, setDailySales] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<any[]>([])

  useEffect(() => {
    const api = (window as any).posAPI
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      api.reports.dailySales(today),
      api.orders.getAll({ from: today, limit: 500 }),
    ]).then(([daily, allOrders]: any[]) => {
      setDailySales(daily)
      // breakdown por medio de pago (desde apertura de sesión)
      const byMethod: Record<string, { count: number; total: number }> = {}
      for (const o of (allOrders || [])) {
        if (o.created_at < session.opened_at) continue
        const m = o.payment_method || 'cash'
        byMethod[m] = byMethod[m] ?? { count: 0, total: 0 }
        byMethod[m].count++
        byMethod[m].total += Number(o.total)
      }
      setBreakdown(Object.entries(byMethod).map(([method, v]) => ({ method, ...v })))
    })
  }, [session])

  const cashTotal   = breakdown.find(p => p.method === 'cash')?.total ?? 0
  const expectedCash = (session.opening_cash || 0) + cashTotal

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Saldo inicial"  value={fmt(session.opening_cash)}         icon={Wallet} />
        <Stat label="Ventas hoy"     value={String(dailySales?.total_orders || 0)} icon={ShoppingBag} />
        <Stat label="Ingresos hoy"   value={fmt(dailySales?.total_revenue || 0)} icon={TrendingUp} highlight />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Medios de pago en esta sesión
        </h3>
        {breakdown.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-4">Sin ventas aún</p>
        ) : (
          <div className="space-y-1">
            {breakdown.map(p => (
              <div key={p.method} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${payColor(p.method)}`}>
                    {payLabel(p.method)}
                  </span>
                  <span className="text-xs text-gray-500">{p.count} venta{p.count !== 1 ? 's' : ''}</span>
                </div>
                <span className="font-bold">{fmt(p.total)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-sm font-bold text-gray-300">
              <span>Efectivo esperado en caja</span>
              <span>{fmt(expectedCash)}</span>
            </div>
          </div>
        )}
      </div>

      <button onClick={onRequestClose}
        className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
        <Lock className="w-5 h-5" /> Cerrar caja
      </button>
    </div>
  )
}

// ── cierre de caja ─────────────────────────────────────────
function CierreDeCaja({ session, onCancelled, onClosed }: any) {
  const [orders, setOrders]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    const api = (window as any).posAPI
    const dateFrom = session.opened_at.slice(0, 10)
    api.orders.getAll({ from: dateFrom, limit: 500 }).then((all: any[]) => {
      const sessionOrders = (all || [])
        .filter((o: any) => o.created_at >= session.opened_at && o.status !== 'cancelled')
        .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
      setOrders(sessionOrders)
      setLoading(false)
    })
  }, [session])

  // totales
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0)
  const byMethod: Record<string, { count: number; total: number }> = {}
  for (const o of orders) {
    const m = o.payment_method || 'cash'
    byMethod[m] = byMethod[m] ?? { count: 0, total: 0 }
    byMethod[m].count++
    byMethod[m].total += Number(o.total)
  }
  const cashTotal    = byMethod['cash']?.total ?? 0
  const expectedCash = (session.opening_cash || 0) + cashTotal
  const countedRaw   = parseInt(closingCash.replace(/\D/g, ''), 10) || 0
  const diff         = closingCash ? countedRaw - expectedCash : null

  const submit = async () => {
    setSaving(true)
    try {
      const result = await (window as any).posAPI.session.close({ closingCash: countedRaw, notes })
      const d = result.difference
      if (d === 0)      toast.success('✓ Caja cuadrada perfectamente 🎉')
      else if (d > 0)   toast.success(`Sobrante: ${fmt(d)}`)
      else              toast.error(`Faltante: ${fmt(Math.abs(d))}`)
      onClosed()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">

      {/* ── header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-bold">Cierre de Caja</h1>
          <span className="text-sm text-gray-500">
            Abierta a las{' '}
            {new Date(session.opened_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {new Date(session.opened_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        </div>
        <button onClick={onCancelled}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* lista de movimientos */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 font-semibold text-gray-300">
              <Receipt className="w-4 h-4" />
              Movimientos de la sesión
            </h2>
            <span className="text-sm text-gray-500">
              {orders.length} venta{orders.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
              Cargando movimientos...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
              <ShoppingBag className="w-10 h-10" />
              <span className="text-sm">No hubo ventas en esta sesión</span>
            </div>
          ) : (
            <>
              {/* cabecera tabla */}
              <div className="grid grid-cols-[56px_110px_1fr_80px_90px] gap-2 px-3 mb-1 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
                <span>Hora</span>
                <span>N° orden</span>
                <span>Ítems</span>
                <span>Pago</span>
                <span className="text-right">Total</span>
              </div>

              <div className="space-y-1">
                {orders.map(order => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>

              {/* total al pie */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800 text-sm font-bold">
                <span className="text-gray-400">{orders.length} ventas · Total sesión</span>
                <span className="text-lg text-green-400">{fmt(totalRevenue)}</span>
              </div>
            </>
          )}
        </div>

        {/* panel derecho: resumen + form */}
        <div className="w-[300px] shrink-0 border-l border-gray-800 overflow-y-auto bg-gray-900/40 p-4 flex flex-col gap-4">

          {/* resumen ventas */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Resumen</h3>
            <Row label="N° ventas"     value={String(orders.length)} />
            <Row label="Total ingresos" value={fmt(totalRevenue)} bold green />
          </div>

          {/* desglose por método */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Por medio de pago</h3>
            {Object.keys(byMethod).length === 0 ? (
              <span className="text-xs text-gray-600">Sin ventas</span>
            ) : (
              <div className="space-y-2">
                {Object.entries(byMethod).map(([m, v]) => (
                  <div key={m} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${payColor(m)}`}>
                        {payLabel(m)}
                      </span>
                      <span className="text-gray-600 text-xs">{v.count}</span>
                    </div>
                    <span className="font-semibold">{fmt(v.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* cuadre efectivo */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cuadre efectivo</h3>
            <Row label="Saldo inicial"    value={fmt(session.opening_cash)} />
            <Row label="Ventas efectivo"  value={fmt(cashTotal)} />
            <div className="border-t border-gray-700 pt-2">
              <Row label="Esperado en caja" value={fmt(expectedCash)} bold />
            </div>
          </div>

          {/* input contado */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">Efectivo contado en caja</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold select-none">$</span>
              <input
                type="text" inputMode="numeric" autoFocus
                value={closingCash ? Number(closingCash).toLocaleString('es-CL') : ''}
                onChange={e => setClosingCash(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-3 text-xl font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            {diff !== null && (
              <div className={`text-center text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 ${
                diff === 0 ? 'bg-green-900/30 text-green-400' :
                diff >  0  ? 'bg-blue-900/30 text-blue-400' :
                             'bg-red-900/30 text-red-400'
              }`}>
                {diff !== 0 && <AlertCircle className="w-3.5 h-3.5" />}
                {diff === 0
                  ? '✓ Caja cuadrada'
                  : diff > 0
                    ? `Sobrante ${fmt(diff)}`
                    : `Faltante ${fmt(Math.abs(diff))}`}
              </div>
            )}
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones (opcional)..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600 resize-none"
          />

          <div className="flex gap-2">
            <button onClick={onCancelled}
              className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={saving || !closingCash}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors">
              <Lock className="w-4 h-4" />
              {saving ? 'Cerrando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── fila de orden ─────────────────────────────────────────
function OrderRow({ order }: { order: any }) {
  const time = new Date(order.created_at).toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit',
  })
  const num = (order.order_number ?? '').replace('EF-LOCAL-', '#')

  return (
    <div className="grid grid-cols-[56px_110px_1fr_80px_90px] gap-2 items-center px-3 py-2.5 bg-gray-900 hover:bg-gray-800/60 rounded-lg transition-colors">
      <span className="text-xs text-gray-500 tabular-nums">{time}</span>
      <span className="text-xs font-mono text-gray-400">{num}</span>
      <span className="text-xs text-gray-500 truncate">
        {order.item_count} ítem{order.item_count !== 1 ? 's' : ''}
        {order.customer_name ? ` · ${order.customer_name}` : ''}
      </span>
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium text-center ${payColor(order.payment_method)}`}>
        {payLabel(order.payment_method)}
      </span>
      <span className="text-sm font-bold tabular-nums text-right">
        {fmt(Number(order.total))}
      </span>
    </div>
  )
}

// ── helpers visuales ──────────────────────────────────────
function Stat({ label, value, icon: Icon, highlight }: any) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-red-950/30 border-red-900' : 'bg-gray-900 border-gray-800'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">{label}</span>
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}

function Row({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`${bold ? 'font-bold' : ''} ${green ? 'text-green-400' : ''}`}>{value}</span>
    </div>
  )
}
