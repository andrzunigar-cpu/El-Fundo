import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Minus, Search, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export function StockView() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const lowStock = items.filter(i => Number(i.quantity) < Number(i.min_stock || 5))
  const outOfStock = items.filter(i => Number(i.quantity) <= 0)

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar + KPIs */}
      <div className="p-4 border-b border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Stock</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm w-72 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Productos en catálogo" value={items.length} color="gray" />
          <KpiCard label="Stock bajo" value={lowStock.length} color="orange" icon={AlertTriangle} />
          <KpiCard label="Sin stock" value={outOfStock.length} color="red" icon={AlertTriangle} />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Producto</th>
                <th className="py-3 px-3 text-right">Stock actual</th>
                <th className="py-3 px-3 text-right">Reservado</th>
                <th className="py-3 px-3 text-right">Mínimo</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const qty = Number(item.quantity)
                const min = Number(item.min_stock || 0)
                const reserved = Number(item.reserved_quantity || 0)
                const status = qty <= 0 ? 'out' : qty < min ? 'low' : 'ok'

                return (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-900">
                    <td className="py-3 px-3 font-mono text-gray-400 text-xs">{item.sku}</td>
                    <td className="py-3 px-3 font-medium">{item.name}</td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={clsx(
                        status === 'out' ? 'text-red-400' :
                        status === 'low' ? 'text-orange-400' : 'text-white'
                      )}>
                        {qty.toFixed(item.requires_weight ? 2 : 0)}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">{item.requires_weight ? 'kg' : 'un'}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-400">{reserved.toFixed(item.requires_weight ? 2 : 0)}</td>
                    <td className="py-3 px-3 text-right text-gray-500">{min.toFixed(item.requires_weight ? 1 : 0)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        status === 'out' ? 'bg-red-900/40 text-red-400' :
                        status === 'low' ? 'bg-orange-900/40 text-orange-400' : 'bg-green-900/40 text-green-400'
                      )}>
                        {status === 'out' ? 'Agotado' : status === 'low' ? 'Bajo' : 'OK'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setAdjustingProduct(item)}
                        className="px-3 py-1 bg-gray-800 hover:bg-red-600 rounded text-xs font-medium transition-colors"
                      >
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

      {adjustingProduct && (
        <AdjustStockModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSaved={() => { setAdjustingProduct(null); load() }}
        />
      )}
    </div>
  )
}

function KpiCard({ label, value, color, icon: Icon }: { label: string; value: number; color: 'gray' | 'orange' | 'red'; icon?: any }) {
  const colors = {
    gray:   'bg-gray-900 border-gray-800 text-white',
    orange: 'bg-orange-950/50 border-orange-900 text-orange-300',
    red:    'bg-red-950/50 border-red-900 text-red-300',
  }
  return (
    <div className={clsx('rounded-xl p-4 border flex items-center justify-between', colors[color])}>
      <div>
        <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </div>
      {Icon && <Icon className="w-7 h-7 opacity-60" />}
    </div>
  )
}

function AdjustStockModal({ product, onClose, onSaved }: { product: any; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<'add' | 'subtract' | 'set'>('add')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const q = parseFloat(quantity)
    if (isNaN(q) || q <= 0) {
      toast.error('Cantidad inválida')
      return
    }
    setSaving(true)
    const api = (window as any).posAPI
    const delta = mode === 'add' ? q : mode === 'subtract' ? -q : (q - Number(product.quantity))
    try {
      await api.inventory.adjust(product.id, delta, notes || `Ajuste manual: ${mode === 'set' ? 'fijar a' : mode === 'add' ? 'agregar' : 'restar'} ${q}`)
      toast.success('Stock actualizado')
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-6 w-[480px] border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Ajustar stock</h2>
            <p className="text-sm text-gray-400 mt-1">{product.name}</p>
            <p className="text-xs text-gray-500">Stock actual: {Number(product.quantity).toFixed(product.requires_weight ? 2 : 0)} {product.requires_weight ? 'kg' : 'un'}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setMode('add')}
            className={clsx('py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5',
              mode === 'add' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
          <button
            onClick={() => setMode('subtract')}
            className={clsx('py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5',
              mode === 'subtract' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
          >
            <Minus className="w-4 h-4" /> Restar
          </button>
          <button
            onClick={() => setMode('set')}
            className={clsx('py-3 rounded-lg text-sm font-medium',
              mode === 'set' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
          >
            Fijar
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Cantidad {mode === 'set' ? 'final' : 'a ' + (mode === 'add' ? 'agregar' : 'restar')}
            </label>
            <input
              type="number"
              step={product.requires_weight ? '0.01' : '1'}
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              autoFocus
              placeholder={product.requires_weight ? '0.0 kg' : '0 unidades'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-2xl font-bold focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Motivo (opcional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Recepción de pedido, merma, conteo físico..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Confirmar ajuste'}
          </button>
        </div>
      </div>
    </div>
  )
}
