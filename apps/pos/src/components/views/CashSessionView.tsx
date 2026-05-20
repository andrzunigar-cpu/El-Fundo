import React, { useEffect, useState, useCallback } from 'react'
import { Wallet, Clock, TrendingUp, ShoppingBag, Lock, Unlock } from 'lucide-react'
import toast from 'react-hot-toast'

export function CashSessionView() {
  const [session, setSession] = useState<any>(null)
  const [todaysSales, setTodaysSales] = useState<any>(null)
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const api = (window as any).posAPI
    const [s, daily] = await Promise.all([
      api.session.getCurrent(),
      api.reports.dailySales(new Date().toISOString().slice(0, 10)),
    ])
    setSession(s)
    setTodaysSales(daily)
    if (s?.id) {
      const closing = await api.reports.cashClosing(s.id)
      setPaymentBreakdown(closing.paymentBreakdown || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const formatCLP = (n: number) => `$${Number(n || 0).toLocaleString('es-CL')}`

  if (loading) {
    return <div className="h-full flex items-center justify-center text-gray-500">Cargando...</div>
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Caja</h1>
          {session && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-gray-400">Caja abierta desde</span>
              <span className="font-medium">{new Date(session.opened_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {!session ? (
          <OpenSessionCard onOpened={load} />
        ) : (
          <CurrentSessionCard
            session={session}
            todaysSales={todaysSales}
            paymentBreakdown={paymentBreakdown}
            onClosed={load}
          />
        )}
      </div>
    </div>
  )
}

function OpenSessionCard({ onOpened }: { onOpened: () => void }) {
  const [openingCash, setOpeningCash] = useState('')
  const [registerNumber, setRegisterNumber] = useState('1')
  const [saving, setSaving] = useState(false)

  const open = async () => {
    const cash = parseInt(openingCash, 10)
    if (isNaN(cash) || cash < 0) {
      toast.error('Monto inicial inválido')
      return
    }
    setSaving(true)
    const api = (window as any).posAPI
    try {
      await api.session.open({
        openingCash: cash,
        registerNumber: parseInt(registerNumber, 10),
        cashierId: 'admin',
      })
      toast.success('Caja abierta')
      onOpened()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <Unlock className="w-8 h-8 text-gray-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">No hay caja abierta</h2>
      <p className="text-sm text-gray-400 mb-6">Antes de comenzar a vender, abre la caja con el monto inicial en efectivo.</p>

      <div className="max-w-xs mx-auto space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block text-left">Caja N°</label>
          <input
            type="number"
            value={registerNumber}
            onChange={e => setRegisterNumber(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block text-left">Monto inicial efectivo</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              placeholder="50000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-3 text-xl font-bold focus:outline-none focus:border-red-500"
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

function CurrentSessionCard({ session, todaysSales, paymentBreakdown, onClosed }: any) {
  const [showClose, setShowClose] = useState(false)
  const formatCLP = (n: number) => `$${Number(n || 0).toLocaleString('es-CL')}`

  const cashSales = paymentBreakdown.find((p: any) => p.payment_method === 'cash')?.total || 0
  const expectedCash = (session.opening_cash || 0) + Number(cashSales)

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Saldo inicial" value={formatCLP(session.opening_cash)} icon={Wallet} />
        <Stat label="Ventas hoy"    value={String(todaysSales?.total_orders || 0)} icon={ShoppingBag} />
        <Stat label="Ingresos hoy"  value={formatCLP(todaysSales?.total_revenue || 0)} icon={TrendingUp} highlight />
        <Stat label="Esperado caja" value={formatCLP(expectedCash)} icon={Wallet} highlight />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-bold mb-4">Desglose por método de pago</h3>
        {paymentBreakdown.length === 0 ? (
          <div className="text-center text-gray-500 py-6 text-sm">Aún no hay ventas en esta sesión</div>
        ) : (
          <div className="space-y-2">
            {paymentBreakdown.map((p: any) => (
              <div key={p.payment_method} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-medium capitalize">{labelPayment(p.payment_method)}</span>
                  <span className="text-xs text-gray-500">{p.count} {p.count === 1 ? 'venta' : 'ventas'}</span>
                </div>
                <span className="font-bold">{formatCLP(p.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowClose(true)}
        className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
        <Lock className="w-5 h-5" /> Cerrar caja
      </button>

      {showClose && (
        <CloseSessionModal
          session={session}
          expectedCash={expectedCash}
          onClose={() => setShowClose(false)}
          onClosed={() => { setShowClose(false); onClosed() }}
        />
      )}
    </>
  )
}

function CloseSessionModal({ session, expectedCash, onClose, onClosed }: any) {
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const cash = parseInt(closingCash, 10)
    if (isNaN(cash) || cash < 0) {
      toast.error('Monto inválido')
      return
    }
    setSaving(true)
    const api = (window as any).posAPI
    try {
      const result = await api.session.close({ closingCash: cash, notes })
      const diff = result.difference
      if (diff === 0)        toast.success('Caja cuadrada perfectamente 🎉')
      else if (diff > 0)     toast.success(`Sobrante: $${diff.toLocaleString('es-CL')}`)
      else                   toast.error(`Faltante: $${Math.abs(diff).toLocaleString('es-CL')}`)
      onClosed()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const diff = parseInt(closingCash, 10) - expectedCash

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-[480px] border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Cierre de caja</h2>

        <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Saldo inicial</span><span>${session.opening_cash.toLocaleString('es-CL')}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Esperado en caja</span><span className="font-bold">${expectedCash.toLocaleString('es-CL')}</span></div>
        </div>

        <label className="text-xs text-gray-400 mb-1 block">Efectivo contado en caja</label>
        <input
          type="number"
          value={closingCash}
          onChange={e => setClosingCash(e.target.value)}
          autoFocus
          placeholder="0"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-2xl font-bold mb-3 focus:outline-none focus:border-red-500"
        />

        {closingCash && !isNaN(diff) && (
          <div className={`text-center font-bold mb-3 ${diff === 0 ? 'text-green-400' : diff > 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {diff === 0 ? '✓ Caja cuadrada' : diff > 0 ? `Sobrante: $${diff.toLocaleString('es-CL')}` : `Faltante: $${Math.abs(diff).toLocaleString('es-CL')}`}
          </div>
        )}

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observaciones (opcional)..."
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
        />

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon, highlight }: any) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-red-950/30 border-red-900' : 'bg-gray-900 border-gray-800'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">{label}</span>
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  )
}

function labelPayment(m: string) {
  const map: Record<string, string> = {
    cash: 'Efectivo', debit_card: 'Débito', credit_card: 'Crédito',
    amipass: 'Amipass', edenred: 'Edenred', pluxee: 'Pluxee',
    transfer: 'Transferencia', webpay: 'Webpay',
  }
  return map[m] || m
}
