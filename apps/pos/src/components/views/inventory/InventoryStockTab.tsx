import React, { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Minus, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export function InventoryStockTab() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState<any>(null)
  const [showInitial, setShowInitial] = useState(false)

  const load = useCallback(async () => {
    const api = (window as any).posAPI
    const data = await api.inventory.getAllStock()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(i =>
    !search.trim() ||
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm w-72 focus:outline-none focus:border-red-500"
          />
        </div>
        <button
          onClick={() => setShowInitial(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium text-sm"
        >
          <Sparkles className="w-4 h-4" /> Cargar inventario inicial
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Producto</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3 text-right">Reservado</th>
                <th className="py-3 px-3 text-right">Disponible</th>
                <th className="py-3 px-3 text-right">Mínimo</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const qty = Number(item.quantity)
                const reserved = Number(item.reserved_quantity || 0)
                const available = qty - reserved
                const min = Number(item.min_stock || 0)
                const status = qty <= 0 ? 'out' : qty < min ? 'low' : 'ok'
                return (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-900">
                    <td className="py-3 px-3 font-mono text-xs text-gray-400">{item.sku}</td>
                    <td className="py-3 px-3 font-medium">{item.name}</td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={clsx(status === 'out' ? 'text-red-400' : status === 'low' ? 'text-orange-400' : 'text-white')}>
                        {qty.toFixed(item.requires_weight ? 2 : 0)}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">{item.requires_weight ? 'kg' : 'un'}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-400">{reserved.toFixed(item.requires_weight ? 2 : 0)}</td>
                    <td className="py-3 px-3 text-right">{available.toFixed(item.requires_weight ? 2 : 0)}</td>
                    <td className="py-3 px-3 text-right text-gray-500">{min.toFixed(item.requires_weight ? 1 : 0)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                        status === 'out' ? 'bg-red-900/40 text-red-400' :
                        status === 'low' ? 'bg-orange-900/40 text-orange-400' : 'bg-green-900/40 text-green-400'
                      )}>
                        {status === 'out' ? 'Agotado' : status === 'low' ? 'Bajo' : 'OK'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => setAdjusting(item)} className="px-3 py-1 bg-gray-800 hover:bg-red-600 rounded text-xs font-medium">
                        Ajustar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {adjusting && <AdjustModal product={adjusting} onClose={() => setAdjusting(null)} onSaved={() => { setAdjusting(null); load() }} />}
      {showInitial && <InitialInventoryModal items={items} onClose={() => setShowInitial(false)} onSaved={() => { setShowInitial(false); load() }} />}
    </div>
  )
}

function AdjustModal({ product, onClose, onSaved }: any) {
  const [mode, setMode] = useState<'add' | 'subtract' | 'set'>('add')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const q = parseFloat(quantity)
    if (isNaN(q) || q <= 0) { toast.error('Cantidad inválida'); return }
    setSaving(true)
    const api = (window as any).posAPI
    const delta = mode === 'add' ? q : mode === 'subtract' ? -q : (q - Number(product.quantity))
    try {
      await api.inventory.adjust(product.id, delta, notes || `Ajuste manual ${mode}`)
      toast.success('Stock actualizado')
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-6 w-[480px] border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Ajustar stock</h2>
            <p className="text-sm text-gray-400">{product.name}</p>
            <p className="text-xs text-gray-500">Actual: {Number(product.quantity).toFixed(product.requires_weight ? 2 : 0)} {product.requires_weight ? 'kg' : 'un'}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => setMode('add')} className={clsx('py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1', mode === 'add' ? 'bg-green-600' : 'bg-gray-800 text-gray-400')}>
            <Plus className="w-4 h-4" /> Agregar
          </button>
          <button onClick={() => setMode('subtract')} className={clsx('py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1', mode === 'subtract' ? 'bg-red-600' : 'bg-gray-800 text-gray-400')}>
            <Minus className="w-4 h-4" /> Restar
          </button>
          <button onClick={() => setMode('set')} className={clsx('py-2 rounded-lg text-sm font-medium', mode === 'set' ? 'bg-blue-600' : 'bg-gray-800 text-gray-400')}>
            Fijar
          </button>
        </div>

        <label className="text-xs text-gray-400 mb-1 block">{mode === 'set' ? 'Cantidad final' : 'Cantidad'}</label>
        <input
          type="number" step={product.requires_weight ? '0.01' : '1'}
          value={quantity} onChange={e => setQuantity(e.target.value)} autoFocus
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-2xl font-bold mb-3 focus:outline-none focus:border-red-500"
        />
        <label className="text-xs text-gray-400 mb-1 block">Motivo</label>
        <input
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Recepción, merma, conteo..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-red-500"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InitialInventoryModal({ items, onClose, onSaved }: any) {
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    items.forEach((i: any) => { init[i.id] = String(i.quantity || 0) })
    return init
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    const api = (window as any).posAPI
    const updates = Object.entries(quantities)
      .map(([productId, q]) => ({ productId, quantity: parseFloat(q) || 0 }))
      .filter(u => u.quantity > 0)

    if (updates.length === 0) {
      toast.error('Ingresa al menos una cantidad')
      setSaving(false)
      return
    }
    try {
      const result = await api.inventory.setInitial(updates)
      toast.success(`Inventario inicial cargado: ${result.productsUpdated} productos`)
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-[720px] max-h-[85vh] border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold">Cargar inventario inicial</h2>
            <p className="text-sm text-gray-400">Establece las cantidades de partida para cada producto</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-2 px-2">SKU</th>
                <th className="py-2 px-2">Producto</th>
                <th className="py-2 px-2 text-right">Cantidad inicial</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-800/40">
                  <td className="py-2 px-2 font-mono text-xs text-gray-400">{p.sku}</td>
                  <td className="py-2 px-2">{p.name}</td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        step={p.requires_weight ? '0.01' : '1'}
                        value={quantities[p.id] ?? ''}
                        onChange={e => setQuantities({ ...quantities, [p.id]: e.target.value })}
                        className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right text-sm focus:outline-none focus:border-red-500"
                      />
                      <span className="text-xs text-gray-500 w-6">{p.requires_weight ? 'kg' : 'un'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Cargar inventario'}
          </button>
        </div>
      </div>
    </div>
  )
}
