import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt,
  Building2, Zap, Droplets, Megaphone, Wrench, CreditCard,
  ChevronDown, Save, RefreshCw, Banknote, AlertCircle,
  ArrowUpRight, ArrowDownRight, BarChart2, Wallet, Users, Plus, Trash2, FileText,
} from 'lucide-react'
import { PreIvaTab } from './reports/PreIvaTab'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const api = () => (window as any).posAPI

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n ?? 0)

const pct = (v: number, base: number) =>
  base === 0 ? '0%' : `${((v / base) * 100).toFixed(1)}%`

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

interface Summary {
  ventaBruta: number
  porCategoria: { cat: string; revenue: number; costo_vendido: number }[]
  comisiones: { payment_method: string; label: string; commission_pct: number; revenue: number }[]
  facturas: { total: number; subtotal: number; tax: number; count: number }
  efectivoMes: number
  cuentasPorPagar: number
  flujoProyectado: number
}

interface Salary { name: string; amount: number }

interface Expenses {
  rent: number; commonExpenses: number; electricity: number; water: number
  advertising: number; maintenance: number; other: number; notes: string
  invoices: Record<string, boolean>  // key = campo, true = con factura
  salaries: Salary[]
}

const EMPTY_EXP: Expenses = {
  rent: 0, commonExpenses: 0, electricity: 0, water: 0,
  advertising: 0, maintenance: 0, other: 0, notes: '',
  invoices: {},
  salaries: [],
}

// ── Sub-componentes utilitarios ──────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'gray', icon: Icon }:
  { label: string; value: string; sub?: string; color?: string; icon: any }) {
  const colors: Record<string, string> = {
    green:  'border-green-500/30 bg-green-950/20',
    red:    'border-red-500/30 bg-red-950/20',
    blue:   'border-blue-500/30 bg-blue-950/20',
    amber:  'border-amber-500/30 bg-amber-950/20',
    gray:   'border-gray-700 bg-gray-800/40',
    purple: 'border-purple-500/30 bg-purple-950/20',
  }
  const textColors: Record<string, string> = {
    green: 'text-green-400', red: 'text-red-400', blue: 'text-blue-400',
    amber: 'text-amber-400', gray: 'text-white', purple: 'text-purple-400',
  }
  return (
    <div className={clsx('rounded-xl border p-4 flex flex-col gap-1', colors[color])}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <Icon className={clsx('w-4 h-4 opacity-60', textColors[color])} />
      </div>
      <span className={clsx('text-xl font-black font-mono', textColors[color])}>{value}</span>
      {sub && <span className="text-[11px] text-gray-500">{sub}</span>}
    </div>
  )
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </h3>
  )
}

function ExpenseInput({ label, icon: Icon, value, onChange, color = 'text-gray-300', hasInvoice, onToggleInvoice }:
  { label: string; icon: any; value: number; onChange: (v: number) => void; color?: string
    hasInvoice?: boolean; onToggleInvoice?: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className={clsx('flex items-center gap-1.5 flex-1 min-w-0', color)}>
        <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
        <span className="text-xs truncate">{label}</span>
      </div>
      {onToggleInvoice && (
        <button
          type="button"
          onClick={onToggleInvoice}
          title={hasInvoice ? 'Con factura' : 'Sin factura'}
          className={clsx(
            'flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold border transition-all flex-shrink-0',
            hasInvoice
              ? 'bg-emerald-900/40 border-emerald-700/60 text-emerald-400'
              : 'bg-gray-800/60 border-gray-700 text-gray-600 hover:text-gray-400'
          )}
        >
          <FileText className="w-3 h-3" />
          {hasInvoice ? 'c/F' : 's/F'}
        </button>
      )}
      <div className="relative flex-shrink-0">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? '' : value.toLocaleString('es-CL')}
          onChange={e => {
            const raw = e.target.value.replace(/\D/g, '')
            onChange(raw === '' ? 0 : parseInt(raw))
          }}
          placeholder="0"
          className="w-32 pl-5 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-right font-mono
                     text-white focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function ResultadoView() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [summary,  setSummary]  = useState<Summary | null>(null)
  const [expenses, setExpenses] = useState<Expenses>(EMPTY_EXP)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, e] = await Promise.all([
        api().resultado.getSummary(year, month),
        api().resultado.getExpenses(year, month),
      ])
      setSummary(s)
      if (e) {
        setExpenses({
          rent:           e.rent ?? 0,
          commonExpenses: e.common_expenses ?? 0,
          electricity:    e.electricity ?? 0,
          water:          e.water ?? 0,
          advertising:    e.advertising ?? 0,
          maintenance:    e.maintenance ?? 0,
          other:          e.other ?? 0,
          notes:          e.notes ?? '',
          invoices:       e.invoices ?? {},
          salaries:       e.salaries ?? [],
        })
      } else {
        setExpenses(EMPTY_EXP)
      }
      setDirty(false)
    } catch (err) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const setExp = (key: keyof Expenses, val: number | string) => {
    setExpenses(prev => ({ ...prev, [key]: val }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api().resultado.saveExpenses(year, month, expenses)
      toast.success('Gastos guardados')
      setDirty(false)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Cálculos derivados ───────────────────────────────────────────────────
  if (!summary) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <RefreshCw className={clsx('w-6 h-6', loading && 'animate-spin')} />
      </div>
    )
  }

  const totalComisiones = summary.comisiones.reduce(
    (s, c) => s + Math.round(c.revenue * c.commission_pct / 100), 0
  )
  const ingresoNeto     = summary.ventaBruta - totalComisiones
  const ivaEstimado     = Math.round(summary.ventaBruta / 1.19 * 0.19)
  const totalOpex       = expenses.rent + expenses.commonExpenses +
                          expenses.electricity + expenses.water + expenses.other
  const totalPublicidad = expenses.advertising
  const totalMantención = expenses.maintenance
  const costoProductos  = summary.facturas.total
  const totalCostoVendido = summary.porCategoria.reduce((s, c) => s + c.costo_vendido, 0)
  const totalSueldos    = (expenses.salaries ?? []).reduce((s, e) => s + (e.amount || 0), 0)

  const margenFinal = ingresoNeto - costoProductos - totalOpex -
                      totalPublicidad - totalMantención - totalSueldos - ivaEstimado - totalComisiones

  const toggleInvoice = (key: string) => {
    setExpenses(prev => ({
      ...prev,
      invoices: { ...prev.invoices, [key]: !prev.invoices[key] },
    }))
    setDirty(true)
  }
  const setInv = (key: string) => () => toggleInvoice(key)

  const addSalary = () => {
    setExpenses(prev => ({ ...prev, salaries: [...(prev.salaries ?? []), { name: '', amount: 0 }] }))
    setDirty(true)
  }
  const removeSalary = (i: number) => {
    setExpenses(prev => ({ ...prev, salaries: prev.salaries.filter((_, idx) => idx !== i) }))
    setDirty(true)
  }
  const setSalaryField = (i: number, field: 'name' | 'amount', val: any) => {
    setExpenses(prev => ({
      ...prev,
      salaries: prev.salaries.map((s, idx) => idx === i ? { ...s, [field]: val } : s),
    }))
    setDirty(true)
  }

  const flujoNeto = summary.efectivoMes - summary.cuentasPorPagar

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-bold">Resultado</h2>
          <span className="text-sm text-gray-500">Estado de resultados — {MONTHS[month-1]} {year}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 pr-7 text-sm text-white focus:outline-none focus:border-red-500">
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 pr-7 text-sm text-white focus:outline-none focus:border-red-500">
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          {dirty && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando…' : 'Guardar gastos'}
            </button>
          )}
          <button onClick={load} disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Listado único ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-5">

          {/* Fila helper */}
          {(() => {
            const Row = ({ label, value, sub, indent = false, bold = false, color = 'text-gray-300' }:
              { label: string; value: string; sub?: string; indent?: boolean; bold?: boolean; color?: string }) => (
              <div className={clsx('flex items-center justify-between py-2 text-sm',
                indent ? 'pl-4' : '',
                bold ? 'font-bold' : ''
              )}>
                <span className={clsx('text-gray-400', bold && 'text-gray-200', indent && 'text-gray-500 text-xs')}>
                  {label}{sub && <span className="ml-1 text-[11px] text-gray-600">{sub}</span>}
                </span>
                <span className={clsx('font-mono', color, bold && 'text-base')}>{value}</span>
              </div>
            )

            const Divider = ({ label }: { label: string }) => (
              <div className="flex items-center gap-3 pt-5 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
            )

            const Total = ({ label, value, color }: { label: string; value: string; color: string }) => (
              <div className={clsx('flex items-center justify-between py-2 border-t border-gray-700 mt-1')}>
                <span className={clsx('text-sm font-semibold', color)}>{label}</span>
                <span className={clsx('font-mono font-bold text-base', color)}>{value}</span>
              </div>
            )

            return (
              <>
                {/* ── INGRESOS ── */}
                <Divider label="Ingresos" />
                <Row label="Venta bruta" value={fmt(summary.ventaBruta)} bold color="text-white" />
                {summary.porCategoria.map(c => (
                  <Row key={c.cat} label={c.cat} value={fmt(c.revenue)} indent
                    sub={`${c.revenue === 0 ? '0' : Math.round((c.revenue - c.costo_vendido) / c.revenue * 100)}%`}
                  />
                ))}
                <Row label="Comisiones medios de pago" value={`−${fmt(totalComisiones)}`} color="text-red-400" />
                {summary.comisiones.map(c => {
                  const amt = Math.round(c.revenue * c.commission_pct / 100)
                  return amt > 0
                    ? <Row key={c.payment_method} label={`${c.label} (${c.commission_pct}%)`}
                        value={`−${fmt(amt)}`} indent color="text-red-400/70" />
                    : null
                })}
                <Total label="Ingreso neto" value={fmt(ingresoNeto)} color="text-green-400" />

                {/* ── COSTO DE PRODUCTOS ── */}
                <Divider label="Costo de Productos" />
                <Row label={`Facturas ingresadas (${summary.facturas.count})`} value={fmt(summary.facturas.total)} />
                <Row label="Subtotal neto" value={fmt(summary.facturas.subtotal)} indent />
                <Row label="IVA facturas" value={fmt(summary.facturas.tax)} indent />
                <Row label="Costo teórico vendido" value={fmt(totalCostoVendido)} indent color="text-gray-500" />
                <Total label="Total costo productos" value={`−${fmt(costoProductos)}`} color="text-red-400" />

                {/* ── GASTOS OPERACIONALES ── */}
                <Divider label="Gastos Operacionales" />
                <ExpenseInput label="Arriendo local"   icon={Building2} value={expenses.rent}           onChange={v => setExp('rent', v)}           color="text-orange-400" hasInvoice={!!expenses.invoices['rent']}           onToggleInvoice={setInv('rent')} />
                <ExpenseInput label="Gasto común"      icon={Building2} value={expenses.commonExpenses}  onChange={v => setExp('commonExpenses', v)} hasInvoice={!!expenses.invoices['commonExpenses']}  onToggleInvoice={setInv('commonExpenses')} />
                <ExpenseInput label="Electricidad"     icon={Zap}       value={expenses.electricity}     onChange={v => setExp('electricity', v)}    color="text-yellow-400" hasInvoice={!!expenses.invoices['electricity']}    onToggleInvoice={setInv('electricity')} />
                <ExpenseInput label="Agua"             icon={Droplets}  value={expenses.water}           onChange={v => setExp('water', v)}          color="text-blue-400"   hasInvoice={!!expenses.invoices['water']}          onToggleInvoice={setInv('water')} />
                <ExpenseInput label="Mantención"       icon={Wrench}    value={expenses.maintenance}     onChange={v => setExp('maintenance', v)}    color="text-sky-400"    hasInvoice={!!expenses.invoices['maintenance']}    onToggleInvoice={setInv('maintenance')} />
                <ExpenseInput label="Publicidad"       icon={Megaphone} value={expenses.advertising}     onChange={v => setExp('advertising', v)}    color="text-pink-400"   hasInvoice={!!expenses.invoices['advertising']}   onToggleInvoice={setInv('advertising')} />
                <ExpenseInput label="Otros"            icon={Receipt}   value={expenses.other}           onChange={v => setExp('other', v)}          hasInvoice={!!expenses.invoices['other']}          onToggleInvoice={setInv('other')} />
                <Total label="Total gastos"
                  value={`−${fmt(totalOpex + totalMantención + totalPublicidad)}`}
                  color="text-orange-400" />

                {/* ── SUELDOS ── */}
                <Divider label="Sueldos" />
                {(expenses.salaries ?? []).length === 0 && (
                  <p className="text-xs text-gray-600 py-1">Sin sueldos ingresados</p>
                )}
                {(expenses.salaries ?? []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <Users className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <input
                      value={s.name}
                      onChange={e => setSalaryField(i, 'name', e.target.value)}
                      placeholder="Nombre empleado"
                      className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                    <div className="relative flex-shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">$</span>
                      <input
                        type="text" inputMode="numeric"
                        value={s.amount === 0 ? '' : s.amount.toLocaleString('es-CL')}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '')
                          setSalaryField(i, 'amount', raw === '' ? 0 : parseInt(raw))
                        }}
                        placeholder="0"
                        className="w-32 pl-5 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-right font-mono text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <button onClick={() => removeSalary(i)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={addSalary}
                  className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-violet-900/30 hover:bg-violet-900/50 border border-violet-700/40 text-violet-400 text-xs font-semibold rounded-lg transition-all">
                  <Plus className="w-3.5 h-3.5" /> Agregar empleado
                </button>
                {totalSueldos > 0 && (
                  <Total label="Total sueldos" value={`−${fmt(totalSueldos)}`} color="text-violet-400" />
                )}

                {/* ── IMPUESTOS ── */}
                <Divider label="Impuestos y Comisiones" />
                <Row label="IVA 19% estimado" value={`−${fmt(ivaEstimado)}`} color="text-amber-400"
                  sub={`base: ${fmt(Math.round(summary.ventaBruta / 1.19))}`} />
                <Total label="Total impuestos" value={`−${fmt(ivaEstimado)}`} color="text-amber-400" />

                {/* ── RESULTADO FINAL ── */}
                <div className="mt-6 mb-2">
                  <div className={clsx(
                    'flex items-center justify-between rounded-xl px-5 py-4 border',
                    margenFinal >= 0 ? 'bg-green-950/40 border-green-500/40' : 'bg-red-950/40 border-red-500/40'
                  )}>
                    <div className="flex items-center gap-2">
                      {margenFinal >= 0
                        ? <ArrowUpRight className="w-5 h-5 text-green-400" />
                        : <ArrowDownRight className="w-5 h-5 text-red-400" />}
                      <div>
                        <p className={clsx('font-bold text-base', margenFinal >= 0 ? 'text-green-400' : 'text-red-400')}>
                          Resultado del período
                        </p>
                        <p className="text-[11px] text-gray-500">{MONTHS[month-1]} {year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={clsx('text-3xl font-black font-mono', margenFinal >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {fmt(margenFinal)}
                      </p>
                      <p className={clsx('text-sm font-semibold', margenFinal >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {pct(margenFinal, summary.ventaBruta)} sobre ventas
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── FLUJO DE CAJA ── */}
                <Divider label="Flujo de Caja" />
                <Row label="Efectivo recibido en el mes" value={fmt(summary.efectivoMes)} color="text-green-400" />
                {summary.comisiones.filter(c => c.payment_method !== 'cash').map(c => (
                  <Row key={c.payment_method} label={c.label} value={fmt(c.revenue)} indent />
                ))}
                <Row label="Cuentas por pagar (proveedores)" value={`−${fmt(summary.cuentasPorPagar)}`} color="text-amber-400" />
                <Row label="Prom. ventas últimos 3 meses" value={fmt(summary.flujoProyectado)} color="text-gray-500" />
                <Total label="Flujo neto proyectado"
                  value={fmt(flujoNeto)}
                  color={flujoNeto >= 0 ? 'text-blue-400' : 'text-red-400'} />

                {/* ── NOTAS ── */}
                <Divider label="Notas del mes" />
                <textarea
                  value={expenses.notes}
                  onChange={e => setExp('notes', e.target.value)}
                  placeholder="Observaciones, gastos extraordinarios, etc."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300
                             placeholder:text-gray-600 focus:outline-none focus:border-red-500 resize-none mt-2"
                />

                <div className="h-6" />
              </>
            )
          })()}
        </div>

        {/* ── PRE IVA ─────────────────────────────────────────────────── */}
        <div className="border-t border-gray-800 mt-2">
          <div className="flex items-center gap-3 px-6 pt-5 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pre IVA</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="px-6 pb-8 max-w-5xl mx-auto">
            <PreIvaTab />
          </div>
        </div>
      </div>
    </div>
  )
}
