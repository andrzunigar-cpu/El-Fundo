import React from 'react'
import { Calendar } from 'lucide-react'

export function formatCLP(n: number | string | null | undefined): string {
  const v = Number(n) || 0
  return `$${v.toLocaleString('es-CL')}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function DateRangeFilter({ from, to, onChange }: {
  from: string; to: string; onChange: (from: string, to: string) => void
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Calendar className="w-4 h-4 text-gray-500" />
      <span className="text-gray-400">Desde</span>
      <input
        type="date"
        value={from}
        onChange={e => onChange(e.target.value, to)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
      />
      <span className="text-gray-400">hasta</span>
      <input
        type="date"
        value={to}
        onChange={e => onChange(from, e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
      />
      <div className="flex gap-1 ml-2">
        <QuickRange label="Hoy" onClick={() => { const t = todayISO(); onChange(t, t) }} />
        <QuickRange label="7d"  onClick={() => onChange(daysAgoISO(7), todayISO())} />
        <QuickRange label="30d" onClick={() => onChange(daysAgoISO(30), todayISO())} />
        <QuickRange label="Mes" onClick={() => {
          const now = new Date()
          const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
          onChange(first, todayISO())
        }} />
      </div>
    </div>
  )
}

function QuickRange({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded">
      {label}
    </button>
  )
}

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  initial:          { label: 'Inicial',     color: 'bg-blue-900/40 text-blue-400' },
  purchase:         { label: 'Compra',      color: 'bg-green-900/40 text-green-400' },
  sale:             { label: 'Venta',       color: 'bg-red-900/40 text-red-400' },
  consumption:      { label: 'Consumo',     color: 'bg-orange-900/40 text-orange-400' },
  adjustment:       { label: 'Ajuste',      color: 'bg-yellow-900/40 text-yellow-400' },
  count_adjustment: { label: 'Toma',        color: 'bg-purple-900/40 text-purple-400' },
  transfer:         { label: 'Traslado',    color: 'bg-cyan-900/40 text-cyan-400' },
  reservation:      { label: 'Reserva',     color: 'bg-gray-800 text-gray-400' },
}

export function MovementBadge({ type }: { type: string }) {
  const info = MOVEMENT_LABELS[type] || { label: type, color: 'bg-gray-800 text-gray-400' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
      {info.label}
    </span>
  )
}
