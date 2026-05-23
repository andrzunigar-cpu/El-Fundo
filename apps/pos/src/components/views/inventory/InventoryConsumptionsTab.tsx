import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { DateRangeFilter, formatDate, todayISO, daysAgoISO } from './shared'

const REASONS = [
  'Merma natural',
  'Producto vencido',
  'Daño/contaminación',
  'Consumo interno',
  'Muestra/degustación',
  'Robo/pérdida',
  'Otro',
]

export function InventoryConsumptionsTab() {
  const [consumptions, setConsumptions] = useState<any[]>([])
  const [from, setFrom] = useState(todayISO())
  const [to, setTo] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const data = await api.inventory.listConsumptions({ from, to })
    setConsumptions(data)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const totalQty = consumptions.reduce((s, c) => s + Math.abs(Number(c.quantity)), 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Registrar merma
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-800">
        <Stat label="Total registros" value={consumptions.length} />
        <Stat label="Cantidad total dada de baja" value={totalQty.toFixed(2)} highlight />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : consumptions.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin mermas en el período</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Producto</th>
                <th className="py-3 px-3 text-right">Cantidad</th>
                <th className="py-3 px-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {consumptions.map(c => (
                <tr key={c.id} className="border-b border-gray-800/40 hover:bg-gray-900">
                  <td className="py-3 px-3 text-gray-400">{formatDate(c.created_at)}</td>
                  <td className="py-3 px-3 font-medium">{c.product_name}</td>
                  <td className="py-3 px-3 text-right text-red-400 font-medium">
                    -{Math.abs(Number(c.quantity)).toFixed(c.requires_weight ? 2 : 0)}
                    <span className="text-gray-500 text-xs ml-1">{c.requires_weight ? 'kg' : 'un'}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-300">{c.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && <NewConsumptionModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load() }} />}
    </div>
  )
}

function NewConsumptionModal({ onClose, onSaved }: any) {
  const [reason, setReason] = useState(REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [items, setItems] = useState<any[]>([{ productId: '', quantity: '' }])
  const [products, setProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const api = (window as any).posAPI
    api.products.getAll().then(setProducts)
  }, [])

  const addItem = () => setItems([...items, { productId: '', quantity: '' }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, patch: any) => setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it))

  const submit = async () => {
    const validItems = items.filter(i => i.productId && parseFloat(i.quantity) > 0)
    if (validItems.length === 0) { toast.error('Agrega al menos un producto con cantidad'); return }

    const finalReason = reason === 'Otro' ? customReason : reason
    if (!finalReason.trim()) { toast.error('Especifica el motivo'); return }

    setSaving(true)
    const api = (window as any).posAPI
    try {
      const result = await api.inventory.registerConsumption({
        reason: finalReason,
        items: validItems.map(i => ({
          productId: i.productId,
          quantity: parseFloat(i.quantity),
          reason: finalReason,
        })),
      })
      toast.success(`${result.items} merma${result.items !== 1 ? 's' : ''} registrada${result.items !== 1 ? 's' : ''}`)
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 rounded-xl w-[700px] max-h-[85vh] border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold">Registrar merma</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Motivo</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {reason === 'Otro' && (
              <input value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Especifica el motivo..."
                className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            )}
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <h3 className="font-medium text-sm">Productos a dar de baja</h3>
              <button onClick={addItem} className="text-xs text-red-400 hover:text-red-300">+ Agregar</button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                  <th className="py-2">Producto</th>
                  <th className="py-2 w-32 text-right">Cantidad</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const product = products.find(p => p.id === it.productId)
                  const stock = product?.quantity ?? 0
                  return (
                    <tr key={idx} className="border-b border-gray-800/40">
                      <td className="py-2 pr-2">
                        <select value={it.productId} onChange={e => updateItem(idx, { productId: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500">
                          <option value="">Selecciona...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {Number(p.quantity).toFixed(1)})</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-1">
                          <input type="number" step="0.01" value={it.quantity}
                            onChange={e => updateItem(idx, { quantity: e.target.value })}
                            max={stock}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-red-500" />
                          <span className="text-xs text-gray-500 whitespace-nowrap w-5 text-left">
                            {product ? (product.requires_weight ? 'kg' : 'un') : ''}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <button onClick={() => removeItem(idx)} className="text-gray-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Registrar y descontar stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: any) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-orange-950/30 border-orange-900' : 'bg-gray-900 border-gray-800'}`}>
      <div className="text-[10px] uppercase text-gray-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
