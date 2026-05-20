import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Check, X, Power } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const CATEGORIES = [
  { id: 'cat-vacuno',     label: 'Vacuno' },
  { id: 'cat-cerdo',      label: 'Cerdo' },
  { id: 'cat-cordero',    label: 'Cordero' },
  { id: 'cat-pollo',      label: 'Pollo' },
  { id: 'cat-embutidos',  label: 'Embutidos' },
]

const MEAT_TYPES = ['vacuno', 'cerdo', 'cordero', 'pollo', 'pavo', 'otro']

export function ProductsView() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const api = (window as any).posAPI
    const data = await api.products.getAll()
    setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const startEditPrice = (p: any) => {
    setEditingId(p.id)
    setEditPrice(String(p.base_price))
  }

  const saveEditPrice = async (id: string) => {
    const price = parseInt(editPrice, 10)
    if (isNaN(price) || price < 0) {
      toast.error('Precio inválido')
      return
    }
    const api = (window as any).posAPI
    await api.products.updatePrice(id, price)
    toast.success('Precio actualizado')
    setEditingId(null)
    load()
  }

  const formatCLP = (n: number) => `$${Number(n).toLocaleString('es-CL')}`

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-2xl font-bold">Productos</h1>
          <span className="text-sm text-gray-500">{products.length} en catálogo</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm w-72 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo producto
          </button>
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
                <th className="py-3 px-3">Nombre</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3 text-right">Precio</th>
                <th className="py-3 px-3 text-center">Unidad</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-900">
                  <td className="py-3 px-3 font-mono text-gray-400 text-xs">{p.sku}</td>
                  <td className="py-3 px-3 font-medium">{p.name}</td>
                  <td className="py-3 px-3 text-gray-400 capitalize">{p.meat_type}</td>
                  <td className="py-3 px-3 text-right">
                    {editingId === p.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEditPrice(p.id)}
                          autoFocus
                          className="w-24 bg-gray-800 border border-red-500 rounded px-2 py-1 text-right"
                        />
                        <button onClick={() => saveEditPrice(p.id)} className="p-1 hover:bg-green-900 rounded">
                          <Check className="w-4 h-4 text-green-400" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 hover:bg-red-900 rounded">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEditPrice(p)} className="font-bold hover:text-red-400 hover:underline">
                        {formatCLP(p.base_price)}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-gray-400">{p.price_unit}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={clsx(
                      Number(p.quantity ?? 0) <= 0 ? 'text-red-400' :
                      Number(p.quantity ?? 0) < 5 ? 'text-orange-400' : 'text-gray-300'
                    )}>
                      {Number(p.quantity ?? 0).toFixed(p.requires_weight ? 1 : 0)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      p.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'
                    )}>
                      {p.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => startEditPrice(p)}
                      className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                      title="Editar precio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-12">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showNew && <NewProductModal onClose={() => setShowNew(false)} onSaved={load} />}
    </div>
  )
}

function NewProductModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    sku: '', name: '', categoryId: 'cat-vacuno', meatType: 'vacuno',
    basePrice: '', requiresWeight: true, priceUnit: 'kg',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.sku || !form.name || !form.basePrice) {
      toast.error('Completa SKU, nombre y precio')
      return
    }
    setSaving(true)
    const api = (window as any).posAPI
    try {
      await api.products.create({
        sku: form.sku.toUpperCase(),
        name: form.name,
        categoryId: form.categoryId,
        meatType: form.meatType,
        basePrice: parseInt(form.basePrice, 10),
        requiresWeight: form.requiresWeight ? 1 : 0,
        priceUnit: form.priceUnit,
      })
      toast.success('Producto creado')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-6 w-[500px] border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Nuevo producto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">SKU</label>
              <input
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                placeholder="VAC-009"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
              <select
                value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Filete de Vacuno"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo de carne</label>
              <select
                value={form.meatType}
                onChange={e => setForm({ ...form, meatType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 capitalize"
              >
                {MEAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Precio base (CLP)</label>
              <input
                type="number"
                value={form.basePrice}
                onChange={e => setForm({ ...form, basePrice: e.target.value })}
                placeholder="9990"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requiresWeight}
                onChange={e => setForm({ ...form, requiresWeight: e.target.checked, priceUnit: e.target.checked ? 'kg' : 'unidad' })}
                className="w-4 h-4"
              />
              <span className="text-sm">Se vende por kilo (con balanza)</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}
