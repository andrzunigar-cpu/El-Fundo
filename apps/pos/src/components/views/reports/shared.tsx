import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import { clsx } from 'clsx'

export const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n) || 0)

export const fmtN = (n: number | null | undefined, dec = 0) =>
  (Number(n) || 0).toFixed(dec)

// Usa fecha LOCAL (no UTC) para evitar desfase en Chile UTC-3
const localISO = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const today = () => localISO()
export const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d) }
export const monthStart = () => { const d = new Date(); return localISO(new Date(d.getFullYear(), d.getMonth(), 1)) }

export const PERIODS = [
  { label: 'Hoy',        from: today,       to: today },
  { label: 'Ayer',       from: () => daysAgo(1), to: () => daysAgo(1) },
  { label: '7 días',     from: () => daysAgo(6), to: today },
  { label: 'Este mes',   from: monthStart,   to: today },
  { label: '30 días',    from: () => daysAgo(29), to: today },
]

interface DateRangeProps {
  from: string; to: string
  onChange: (f: string, t: string) => void
  compareFrom?: string; compareTo?: string
  onCompareChange?: (f: string, t: string) => void
  showCompare?: boolean
}

export function DateRangeBar({ from, to, onChange, compareFrom, compareTo, onCompareChange, showCompare }: DateRangeProps) {
  const [activePeriod, setActivePeriod] = useState(0)
  const [showCmp, setShowCmp] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PERIODS.map((p, i) => (
        <button key={p.label} onClick={() => { setActivePeriod(i); onChange(p.from(), p.to()) }}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            activePeriod === i ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
          {p.label}
        </button>
      ))}
      <div className="flex items-center gap-1">
        <input type="date" value={from} onChange={e => { onChange(e.target.value, to); setActivePeriod(-1) }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-red-500" />
        <span className="text-gray-600 text-xs">—</span>
        <input type="date" value={to} onChange={e => { onChange(from, e.target.value); setActivePeriod(-1) }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-red-500" />
      </div>
      {showCompare && onCompareChange && (
        <button onClick={() => setShowCmp(v => !v)}
          className={clsx('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
            showCmp ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
          Comparar
        </button>
      )}
      {showCompare && showCmp && onCompareChange && (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-blue-400" />
          <input type="date" value={compareFrom ?? daysAgo(37)} onChange={e => onCompareChange(e.target.value, compareTo ?? daysAgo(31))}
            className="bg-gray-900 border border-blue-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
          <span className="text-gray-600 text-xs">—</span>
          <input type="date" value={compareTo ?? daysAgo(7)} onChange={e => onCompareChange(compareFrom ?? daysAgo(37), e.target.value)}
            className="bg-gray-900 border border-blue-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
        </div>
      )}
    </div>
  )
}

interface KpiProps { label: string; value: string | number; sub?: string; delta?: number; highlight?: boolean; color?: string }
export function Kpi({ label, value, sub, delta, highlight, color }: KpiProps) {
  return (
    <div className={clsx('rounded-2xl p-5 border', highlight ? 'bg-red-950/30 border-red-900' : 'bg-gray-900 border-gray-800')}>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">{label}</p>
      <p className={clsx('text-3xl font-black', color ?? 'text-white')}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      {delta !== undefined && (
        <p className={clsx('text-xs mt-1 font-medium', delta >= 0 ? 'text-green-400' : 'text-red-400')}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs anterior
        </p>
      )}
    </div>
  )
}

export function Section({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-1 mb-4">
        <h3 className="font-bold text-sm text-gray-200">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  )
}

export function EmptyState({ msg = 'Sin datos en el período' }: { msg?: string }) {
  return <div className="text-center text-gray-600 py-8 text-sm">{msg}</div>
}

export function delta(curr: number, prev: number) {
  if (!prev) return undefined
  return ((curr - prev) / prev) * 100
}
