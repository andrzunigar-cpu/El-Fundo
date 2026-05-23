import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, AlertTriangle, Clock, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { Section, EmptyState, fmtN } from './shared'

type ExpiryRow = {
  id: number
  product_id: string
  product_name: string
  sku: string
  quantity: number
  requires_weight: boolean
  lot_number: string
  supplier_name: string
  expiry_date: string
  days_remaining: number
}

type Bucket = { label: string; color: string; bg: string; border: string; rows: ExpiryRow[] }

function AddExpiryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [products, setProducts] = useState<any[]>([])
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [lot, setLot] = useState('')
  const [supplier, setSupplier] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(window as any).posAPI.products.getAll().then((list: any[]) => {
      setProducts(list.filter((p: any) => p.is_active !== 0))
    })
  }, [])

  const save = async () => {
    if (!productId || !expiryDate || !qty) { toast.error('Producto, cantidad y fecha son obligatorios'); return }
    const q = parseFloat(qty)
    if (isNaN(q) || q <= 0) { toast.error('Cantidad inválida'); return }
    setSaving(true)
    try {
      await (window as any).posAPI.expiry.create({ product_id: productId, quantity: q, lot_number: lot, supplier_name: supplier, expiry_date: expiryDate })
      toast.success('Vencimiento registrado')
      onSaved()
      onClose()
    } catch { toast.error('Error al guardar') }
    setSaving(false)
  }

  const selected = products.find(p => p.id === productId)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold">Registrar fecha de vencimiento</h3>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Producto *</label>
          <select value={productId} onChange={e => setProductId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
            <option value="">— seleccionar —</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cantidad *</label>
            <input type="number" step={selected?.requires_weight ? '0.001' : '1'} min="0"
              value={qty} onChange={e => setQty(e.target.value)}
              placeholder={selected?.requires_weight ? '0.000 kg' : '0 un'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Fecha vencimiento *</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Lote / código</label>
            <input type="text" value={lot} onChange={e => setLot(e.target.value)} placeholder="Opcional"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Proveedor</label>
            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Opcional"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm font-medium hover:bg-gray-700">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BucketSection({ bucket, onDelete }: { bucket: Bucket; onDelete: (id: number) => void }) {
  if (bucket.rows.length === 0) return null
  return (
    <div className={clsx('rounded-2xl border p-4', bucket.bg, bucket.border)}>
      <div className="flex items-center gap-2 mb-3">
        {bucket.label === 'Vencido' || bucket.label === 'Vence esta semana'
          ? <AlertTriangle className={clsx('w-4 h-4', bucket.color)} />
          : <CalendarClock className={clsx('w-4 h-4', bucket.color)} />}
        <h3 className={clsx('font-bold text-sm', bucket.color)}>{bucket.label}</h3>
        <span className={clsx('ml-auto text-xs font-bold px-2 py-0.5 rounded-full', bucket.bg, bucket.color)}>
          {bucket.rows.length} registros
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-700/50">
            <th className="pb-2">Producto</th>
            <th className="pb-2">Lote / Proveedor</th>
            <th className="pb-2 text-right">Cantidad</th>
            <th className="pb-2 text-right">Vencimiento</th>
            <th className="pb-2 text-right">Días</th>
            <th className="pb-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {bucket.rows.map(r => (
            <tr key={r.id} className="border-b border-gray-700/30">
              <td className="py-2">
                <p className="font-medium">{r.product_name}</p>
                <p className="text-xs font-mono text-gray-500">{r.sku}</p>
              </td>
              <td className="py-2 text-gray-400 text-xs">
                {r.lot_number && <p>{r.lot_number}</p>}
                {r.supplier_name && <p>{r.supplier_name}</p>}
                {!r.lot_number && !r.supplier_name && '—'}
              </td>
              <td className="py-2 text-right">
                {fmtN(r.quantity, r.requires_weight ? 2 : 0)}
                <span className="text-xs text-gray-500 ml-1">{r.requires_weight ? 'kg' : 'un'}</span>
              </td>
              <td className="py-2 text-right text-xs">
                {new Date(r.expiry_date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </td>
              <td className={clsx('py-2 text-right font-bold text-xs', bucket.color)}>
                {r.days_remaining < 0 ? `${Math.abs(r.days_remaining)}d vencido` : `${r.days_remaining}d`}
              </td>
              <td className="py-2 text-right">
                <button onClick={() => onDelete(r.id)} className="p-1 hover:bg-red-900/50 rounded text-gray-600 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ExpiryTab() {
  const [rows, setRows] = useState<ExpiryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await (window as any).posAPI.expiry.getAll()
    setRows(r)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id: number) => {
    await (window as any).posAPI.expiry.delete(id)
    toast.success('Registro eliminado')
    load()
  }

  const buckets: Bucket[] = [
    {
      label: 'Vencido',
      color: 'text-red-400',
      bg: 'bg-red-950/20',
      border: 'border-red-900/50',
      rows: rows.filter(r => r.days_remaining < 0),
    },
    {
      label: 'Vence esta semana',
      color: 'text-orange-400',
      bg: 'bg-orange-950/20',
      border: 'border-orange-900/50',
      rows: rows.filter(r => r.days_remaining >= 0 && r.days_remaining <= 7),
    },
    {
      label: 'Vence en 2 semanas o menos',
      color: 'text-yellow-400',
      bg: 'bg-yellow-950/20',
      border: 'border-yellow-900/50',
      rows: rows.filter(r => r.days_remaining > 7 && r.days_remaining <= 14),
    },
    {
      label: 'Vence en 1 mes o menos',
      color: 'text-blue-400',
      bg: 'bg-blue-950/20',
      border: 'border-blue-900/50',
      rows: rows.filter(r => r.days_remaining > 14 && r.days_remaining <= 30),
    },
    {
      label: 'Vence en más de 1 mes',
      color: 'text-green-400',
      bg: 'bg-green-950/10',
      border: 'border-green-900/30',
      rows: rows.filter(r => r.days_remaining > 30),
    },
  ]

  const urgent = rows.filter(r => r.days_remaining <= 7).length
  const expiring = rows.filter(r => r.days_remaining > 7 && r.days_remaining <= 30).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          {urgent > 0 && (
            <div className="flex items-center gap-1.5 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold">{urgent}</span> productos urgentes
            </div>
          )}
          {expiring > 0 && (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span className="font-bold">{expiring}</span> vencen pronto
            </div>
          )}
          {rows.length === 0 && !loading && (
            <span className="text-gray-500">Sin registros de vencimiento</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Cargando...</div>
      ) : rows.length === 0 ? (
        <EmptyState msg="No hay fechas de vencimiento registradas" />
      ) : (
        <div className="space-y-4">
          {buckets.map(b => (
            <BucketSection key={b.label} bucket={b} onDelete={del} />
          ))}
        </div>
      )}

      {showAdd && <AddExpiryModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  )
}
