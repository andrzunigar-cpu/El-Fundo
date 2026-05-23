import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Check, X, ChevronDown, Layers, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

// ─── Categorías (deben coincidir con el seed) ───────────────
const CATEGORIES = [
  { id: '',               label: 'Todas',      color: 'gray'   },
  { id: 'cat-vacuno',     label: 'Vacuno',     color: 'red'    },
  { id: 'cat-cerdo',      label: 'Cerdo',      color: 'orange' },
  { id: 'cat-pollo',      label: 'Pollo',      color: 'yellow' },
  { id: 'cat-embutidos',  label: 'Embutidos',  color: 'pink'   },
  { id: 'cat-parrilla',   label: 'Parrilla',   color: 'rose'   },
  { id: 'cat-congelados', label: 'Congelados', color: 'cyan'   },
  { id: 'cat-bebidas',    label: 'Bebidas',    color: 'sky'    },
  { id: 'cat-otros',      label: 'Otros',      color: 'slate'  },
]

const CAT_ACTIVE: Record<string, string> = {
  gray:   'bg-gray-600 text-white',
  red:    'bg-red-600 text-white',
  orange: 'bg-orange-600 text-white',
  yellow: 'bg-yellow-500 text-black',
  pink:   'bg-pink-600 text-white',
  rose:   'bg-rose-600 text-white',
  cyan:   'bg-cyan-600 text-white',
  sky:    'bg-sky-500 text-white',
  slate:  'bg-slate-600 text-white',
}

const MEAT_TYPES = ['vacuno', 'cerdo', 'pollo', 'pavo', 'otro']

// Categorías con impuesto adicional modificable (además del IVA 19% universal)
const CATS_EXTRA_TAX = new Set([
  'cat-vacuno','cat-cerdo','cat-pollo','cat-embutidos',
  'cat-parrilla','cat-congelados','cat-bebidas',
])
const extraTaxLabel = (catId: string) =>
  catId === 'cat-bebidas' ? 'ILA' : 'Imp. adicional'
const defaultExtraTax = (catId: string) =>
  catId === 'cat-bebidas' ? '15' : '0'

const CAT_INACTIVE = 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'

const CAT_BADGE: Record<string, string> = {
  gray:   'bg-gray-700 text-gray-300',
  red:    'bg-red-900/40 text-red-400',
  orange: 'bg-orange-900/40 text-orange-400',
  yellow: 'bg-yellow-900/40 text-yellow-400',
  pink:   'bg-pink-900/40 text-pink-400',
  rose:   'bg-rose-900/40 text-rose-400',
  cyan:   'bg-cyan-900/40 text-cyan-400',
  sky:    'bg-sky-900/40 text-sky-400',
  slate:  'bg-slate-800 text-slate-400',
}

export function ProductsView() {
  const [products, setProducts] = useState<any[]>([])
  const [formats, setFormats] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showFormats, setShowFormats] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [editCost, setEditCost] = useState<string>('')
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const api = (window as any).posAPI
    const [prods, fmts] = await Promise.all([
      api.products.getAll(),
      api.formats?.getAll?.() ?? Promise.resolve([]),
    ])
    setProducts(prods)
    setFormats(fmts)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p =>
    (!activeCat || p.category_id === activeCat) &&
    (!search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  // inline edit: mostramos y editamos en NETO; guardamos bruto (neto × 1.19)
  const startEditPrice = (p: any) => { setEditingId(p.id); setEditPrice(String(Math.round(p.base_price / 1.19))) }

  const saveEditPrice = async (id: string) => {
    const priceNeto = parseInt(editPrice, 10)
    if (isNaN(priceNeto) || priceNeto < 0) { toast.error('Precio inválido'); return }
    const api = (window as any).posAPI
    await api.products.updatePrice(id, Math.round(priceNeto * 1.19))
    toast.success('Precio actualizado')
    setEditingId(null)
    load()
  }

  const startEditCost = (p: any) => { setEditingCostId(p.id); setEditCost(String(p.cost_price ?? 0)) }

  const saveEditCost = async (id: string) => {
    const cost = parseInt(editCost, 10)
    if (isNaN(cost) || cost < 0) { toast.error('Costo inválido'); return }
    const api = (window as any).posAPI
    await api.products.updateCost(id, cost)
    toast.success('Costo actualizado')
    setEditingCostId(null)
    load()
  }

  const formatCLP = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  // Rentabilidad neta: precio neto (sin IVA) vs costo neto
  const rentabilidad = (basePrice: number, cost: number) => {
    if (!cost || cost <= 0) return null
    const precioNeto = basePrice / 1.19
    return ((precioNeto - cost) / precioNeto) * 100
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Productos</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{products.length}</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nombre o SKU..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormats(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300"
          >
            <Layers className="w-4 h-4" /> Formatos
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-lg font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Filtros categoría */}
      <div className="flex gap-2 px-5 py-2.5 border-b border-gray-800 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-semibold transition-all',
              activeCat === cat.id ? CAT_ACTIVE[cat.color] : CAT_INACTIVE
            )}
          >
            {cat.label}
            {cat.id && (
              <span className="ml-1 opacity-70">
                ({products.filter(p => p.category_id === cat.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-16">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-950 z-10">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Formato</th>
                <th className="py-3 px-4 text-right">Costo neto</th>
                <th className="py-3 px-4 text-right">Precio neto</th>
                <th className="py-3 px-4 text-right">Rentab.</th>
                <th className="py-3 px-4 text-center">Unidad</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-gray-500 py-16">
                    Sin productos en esta categoría
                  </td>
                </tr>
              )}
              {filtered.map(p => {
                const catInfo = CATEGORIES.find(c => c.id === p.category_id)
                return (
                  <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-900">
                    <td className="py-3 px-4 font-mono text-gray-400 text-xs">{p.sku}</td>
                    <td className="py-3 px-4 font-medium">{p.name}</td>
                    <td className="py-3 px-4">
                      {catInfo?.id ? (
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          CAT_BADGE[catInfo.color] ?? 'bg-gray-800 text-gray-400'
                        )}>
                          {catInfo.label}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {p.format_label ?? (p.requires_weight ? 'Granel (kg)' : 'Unidad')}
                    </td>
                    {/* Costo */}
                    <td className="py-3 px-4 text-right">
                      {editingCostId === p.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editCost}
                            onChange={e => setEditCost(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEditCost(p.id)
                              if (e.key === 'Escape') setEditingCostId(null)
                            }}
                            autoFocus
                            className="w-24 bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-right text-sm"
                          />
                          <button onClick={() => saveEditCost(p.id)} className="p-1 hover:bg-green-900 rounded">
                            <Check className="w-4 h-4 text-green-400" />
                          </button>
                          <button onClick={() => setEditingCostId(null)} className="p-1 hover:bg-red-900 rounded">
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEditCost(p)} className="text-gray-400 hover:text-yellow-400 hover:underline text-sm">
                          {p.cost_price ? formatCLP(p.cost_price) : <span className="text-gray-600 text-xs">— sin costo</span>}
                        </button>
                      )}
                    </td>
                    {/* Precio */}
                    <td className="py-3 px-4 text-right">
                      {editingId === p.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEditPrice(p.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            autoFocus
                            className="w-24 bg-gray-800 border border-red-500 rounded px-2 py-1 text-right text-sm"
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
                          {formatCLP(Math.round(p.base_price / 1.19))}
                        </button>
                      )}
                    </td>
                    {/* Rentabilidad */}
                    <td className="py-3 px-4 text-right">
                      {(() => {
                        const r = rentabilidad(p.base_price, p.cost_price)
                        if (r === null) return <span className="text-gray-600 text-xs">—</span>
                        return (
                          <span className={clsx(
                            'text-sm font-semibold',
                            r >= 40 ? 'text-green-400' :
                            r >= 20 ? 'text-yellow-400' :
                            'text-red-400'
                          )}>
                            {r.toFixed(1)}%
                          </span>
                        )
                      })()}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400 text-xs">{p.price_unit}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={clsx(
                        'font-medium',
                        Number(p.quantity ?? 0) <= 0 ? 'text-red-400' :
                        Number(p.quantity ?? 0) < 5 ? 'text-orange-400' : 'text-gray-300'
                      )}>
                        {Number(p.quantity ?? 0).toFixed(p.requires_weight ? 1 : 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        p.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'
                      )}>
                        {p.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1.5 hover:bg-gray-800 rounded text-gray-500 hover:text-white"
                        title="Editar producto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewProductModal
          formats={formats}
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load() }}
        />
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          formats={formats}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); load() }}
        />
      )}
      {showFormats && (
        <FormatsModal
          formats={formats}
          onClose={() => setShowFormats(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}

// ── Modal nuevo producto ────────────────────────────────────────────────────
export function NewProductModal({ formats, onClose, onSaved }: {
  formats: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    sku: '', name: '',
    categoryId: 'cat-vacuno', meatType: 'vacuno',
    basePrice: '',
    additionalTaxPct: '0',
    requiresWeight: true, priceUnit: 'kg',
    formatId: '',
  })
  const [saving, setSaving] = useState(false)
  const [dbCategories, setDbCategories] = useState<any[]>([])

  useEffect(() => {
    const api = (window as any).posAPI
    api.categories.getAll().then((cats: any[]) => {
      setDbCategories(cats.filter(c => c.status === 'active'))
    })
  }, [])

  const handleCatChange = (catId: string) => {
    const map: Record<string, string> = {
      'cat-vacuno': 'vacuno', 'cat-cerdo': 'cerdo',
      'cat-pollo': 'pollo', 'cat-embutidos': 'cerdo',
      'cat-parrilla': 'vacuno', 'cat-congelados': 'otro',
      'cat-bebidas': 'otro', 'cat-otros': 'otro',
    }
    const isBeverage = ['cat-bebidas','cat-congelados','cat-otros'].includes(catId)
    setForm(f => ({
      ...f, categoryId: catId,
      meatType: map[catId] ?? 'otro',
      requiresWeight: isBeverage ? false : f.requiresWeight,
      priceUnit: isBeverage ? 'unidad' : f.priceUnit,
      additionalTaxPct: defaultExtraTax(catId),
    }))
  }

  const submit = async () => {
    if (!form.sku || !form.name || !form.basePrice) {
      toast.error('Completa SKU, nombre y precio')
      return
    }
    setSaving(true)
    const api = (window as any).posAPI
    try {
      const selectedFormat = formats.find(f => f.id === form.formatId)
      await api.products.create({
        sku: form.sku.toUpperCase().trim(),
        name: form.name.trim(),
        categoryId: form.categoryId,
        meatType: form.meatType,
        basePrice: parseInt(form.basePrice, 10),
        additionalTaxPct: parseFloat(form.additionalTaxPct) || 0,
        requiresWeight: form.requiresWeight ? 1 : 0,
        priceUnit: form.priceUnit,
        formatId: form.formatId || null,
        formatLabel: selectedFormat?.name ?? null,
        formatWeightKg: selectedFormat?.weight_kg ?? null,
      })
      toast.success('Producto creado')
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  // Combinar categorías DB con los colores conocidos (fallback a gray)
  const catLabels = dbCategories.length > 0
    ? dbCategories.map(c => ({
        id: c.id,
        label: c.name,
        color: CATEGORIES.find(k => k.id === c.id)?.color ?? c.color ?? 'gray',
      }))
    : CATEGORIES.filter(c => c.id)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl p-6 w-[560px] border border-gray-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Nuevo producto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* SKU + Nombre */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">SKU</label>
              <input
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                placeholder="VAC-009"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="col-span-3">
              <label className="text-xs text-gray-400 mb-1 block">Nombre del producto</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Lomo Liso, Coca-Cola 1.5L"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Categoría pills — cargadas desde la DB */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {catLabels.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCatChange(cat.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    form.categoryId === cat.id
                      ? (CAT_ACTIVE[cat.color] ?? 'bg-gray-600 text-white')
                      : CAT_INACTIVE
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precio + tipo carne */}
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo de carne</label>
              <select
                value={form.meatType}
                onChange={e => setForm({ ...form, meatType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                {MEAT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
          </div>

          {/* Impuestos */}
          <div className="bg-gray-800/50 rounded-xl p-3 space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Impuestos</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">IVA</span>
              <span className="font-mono text-gray-300 font-semibold">19% <span className="text-xs text-gray-600 font-normal">(todos los productos)</span></span>
            </div>
            {CATS_EXTRA_TAX.has(form.categoryId) && (
              <div className="flex items-center justify-between text-sm border-t border-gray-700 pt-2">
                <span className="text-gray-400">{extraTaxLabel(form.categoryId)}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" step="0.5"
                    value={form.additionalTaxPct}
                    onChange={e => setForm(f => ({ ...f, additionalTaxPct: e.target.value }))}
                    className="w-16 bg-gray-900 border border-amber-700/60 rounded-lg px-2 py-1 text-right text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-gray-400 text-xs">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Formato */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Formato / presentación <span className="text-gray-600">(opcional)</span>
            </label>
            <select
              value={form.formatId}
              onChange={e => {
                const fmtId = e.target.value
                const fmt = formats.find(f => f.id === fmtId)
                setForm(f => ({
                  ...f,
                  formatId: fmtId,
                  requiresWeight: fmt ? !!fmt.is_variable : f.requiresWeight,
                  priceUnit: fmt ? fmt.unit : f.priceUnit,
                }))
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">Sin formato específico</option>
              {formats.filter(f => f.is_active).map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.is_variable ? 'Granel (peso variable)' : `${f.weight_kg} ${f.unit}`}
                </option>
              ))}
            </select>
          </div>

          {/* Venta por peso */}
          <div className="flex items-center gap-3 pt-1 p-3 bg-gray-800/50 rounded-xl">
            <button
              type="button"
              onClick={() => setForm(f => ({
                ...f,
                requiresWeight: !f.requiresWeight,
                priceUnit: !f.requiresWeight ? 'kg' : 'unidad',
              }))}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
                form.requiresWeight ? 'bg-red-600' : 'bg-gray-700'
              )}
            >
              <span className={clsx(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                form.requiresWeight ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
            <div>
              <p className="text-sm font-medium">
                {form.requiresWeight ? 'Se vende por kilo (requiere balanza)' : 'Se vende por unidad'}
              </p>
              <p className="text-xs text-gray-500">
                Precio {form.requiresWeight ? 'por kg — se ingresa peso al vender' : 'por unidad'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal editar producto ──────────────────────────────────────────────────
function EditProductModal({ product, formats, onClose, onSaved }: {
  product: any
  formats: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name:              product.name,
    categoryId:        product.category_id ?? 'cat-vacuno',
    meatType:          product.meat_type ?? 'vacuno',
    basePrice:         String(product.base_price ?? ''),
    costPrice:         String(product.cost_price ?? ''),
    ilaAmount:         String(product.ila_amount ?? '0'),
    fleteAmount:       String(product.flete_amount ?? '0'),
    additionalTaxPct:  String(product.additional_tax_pct ?? defaultExtraTax(product.category_id ?? '')),
    requiresWeight:    !!product.requires_weight,
    priceUnit:         product.price_unit ?? 'kg',
    formatId:          product.format_id ?? '',
    promotionActive:   !!product.promotion_active,
    promotionPct:      String(product.promotion_pct ?? ''),
    promotionName:     product.promotion_name ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleCatChange = (catId: string) => {
    const map: Record<string, string> = {
      'cat-vacuno': 'vacuno', 'cat-cerdo': 'cerdo',
      'cat-pollo': 'pollo', 'cat-embutidos': 'cerdo',
      'cat-parrilla': 'vacuno', 'cat-congelados': 'otro',
      'cat-bebidas': 'otro', 'cat-otros': 'otro',
    }
    const isBeverage = ['cat-bebidas','cat-congelados','cat-otros'].includes(catId)
    setForm(f => ({
      ...f, categoryId: catId,
      meatType: map[catId] ?? 'otro',
      requiresWeight: isBeverage ? false : f.requiresWeight,
      priceUnit: isBeverage ? 'unidad' : f.priceUnit,
      additionalTaxPct: defaultExtraTax(catId),
    }))
  }

  const submit = async () => {
    if (!form.name.trim() || !form.basePrice) { toast.error('Nombre y precio son requeridos'); return }
    setSaving(true)
    const api = (window as any).posAPI
    try {
      const selectedFormat = formats.find(f => f.id === form.formatId)
      await api.products.update(product.id, {
        name:             form.name.trim(),
        categoryId:       form.categoryId,
        meatType:         form.meatType,
        basePrice:        parseInt(form.basePrice, 10),
        costPrice:        parseInt(form.costPrice, 10) || 0,
        ilaAmount:        parseInt(form.ilaAmount, 10) || 0,
        fleteAmount:      parseInt(form.fleteAmount, 10) || 0,
        additionalTaxPct: parseFloat(form.additionalTaxPct) || 0,
        requiresWeight:   form.requiresWeight ? 1 : 0,
        priceUnit:        form.priceUnit,
        formatId:         form.formatId || null,
        formatLabel:      selectedFormat?.name ?? null,
        formatWeightKg:   selectedFormat?.weight_kg ?? null,
      })
      await api.products.updatePromotion(product.id, {
        promotionActive: form.promotionActive ? 1 : 0,
        promotionPct:    parseFloat(form.promotionPct) || 0,
        promotionName:   form.promotionName.trim(),
      })
      toast.success('Producto actualizado')
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const toggleStatus = async () => {
    setToggling(true)
    const api = (window as any).posAPI
    try {
      await api.products.toggleStatus(product.id)
      toast.success(product.status === 'active' ? 'Producto desactivado' : 'Producto activado')
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setToggling(false) }
  }

  const catLabels = CATEGORIES.filter(c => c.id)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-[580px] max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Editar producto</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nombre del producto</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {catLabels.map(cat => (
                <button key={cat.id} type="button" onClick={() => handleCatChange(cat.id)}
                  className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    form.categoryId === cat.id ? CAT_ACTIVE[cat.color] : CAT_INACTIVE
                  )}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precio + Costo */}
          <div className={clsx('gap-3', form.categoryId === 'cat-bebidas' ? 'block' : 'grid grid-cols-2')}>
            <div className={clsx(form.categoryId === 'cat-bebidas' && 'mb-3')}>
              <label className="text-xs text-gray-400 mb-1 block">Precio base (CLP)</label>
              <input type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            {form.categoryId !== 'cat-bebidas' && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Costo (CLP)</label>
                <input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            )}
          </div>

          {/* ── Desglose costo Bebidas ── */}
          {form.categoryId === 'cat-bebidas' && (() => {
            const ila    = parseInt(form.ilaAmount)   || 0
            const flete  = parseInt(form.fleteAmount) || 0
            const total  = parseInt(form.costPrice)   || 0
            const base   = Math.max(0, total - ila - flete)

            const setBase = (val: string) => {
              const b = parseInt(val) || 0
              setForm(f => ({ ...f, costPrice: String(b + (parseInt(f.ilaAmount)||0) + (parseInt(f.fleteAmount)||0)) }))
            }
            const setIla = (val: string) => {
              const i = parseInt(val) || 0
              setForm(f => {
                const b2 = Math.max(0, (parseInt(f.costPrice)||0) - (parseInt(f.ilaAmount)||0) - (parseInt(f.fleteAmount)||0))
                return { ...f, ilaAmount: val, costPrice: String(b2 + i + (parseInt(f.fleteAmount)||0)) }
              })
            }
            const setFlete = (val: string) => {
              const fl = parseInt(val) || 0
              setForm(f => {
                const b2 = Math.max(0, (parseInt(f.costPrice)||0) - (parseInt(f.ilaAmount)||0) - (parseInt(f.fleteAmount)||0))
                return { ...f, fleteAmount: val, costPrice: String(b2 + (parseInt(f.ilaAmount)||0) + fl) }
              })
            }

            return (
              <div className="bg-sky-950/40 border border-sky-800/40 rounded-xl p-3.5 space-y-3">
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  🍺 Desglose costo — Bebidas
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Costo base</label>
                    <input
                      type="number" value={base === 0 ? '' : base} placeholder="0"
                      onChange={e => setBase(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">ILA</label>
                    <input
                      type="number" value={form.ilaAmount === '0' ? '' : form.ilaAmount} placeholder="0"
                      onChange={e => setIla(e.target.value)}
                      className="w-full bg-gray-800 border border-sky-700/60 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Flete</label>
                    <input
                      type="number" value={form.fleteAmount === '0' ? '' : form.fleteAmount} placeholder="0"
                      onChange={e => setFlete(e.target.value)}
                      className="w-full bg-gray-800 border border-sky-700/60 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
                {/* Costo Total */}
                <div className="border-t border-sky-800/40 pt-2.5 flex items-center gap-3">
                  <span className="text-xs text-sky-300 font-semibold flex-1">Costo Total</span>
                  <input
                    type="number" value={form.costPrice === '0' ? '' : form.costPrice} placeholder="0"
                    onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    className="w-32 bg-gray-900 border border-yellow-600/60 rounded-lg px-2 py-2 text-sm text-right font-bold text-yellow-300 focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            )
          })()}

          {/* Rentabilidad preview (neta) */}
          {Number(form.basePrice) > 0 && Number(form.costPrice) > 0 && (
            <div className="bg-gray-800/50 rounded-lg px-4 py-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">Rentabilidad neta estimada</span>
              <span className={clsx('font-bold', (() => {
                const pNeto = Number(form.basePrice) / 1.19
                const r = ((pNeto - Number(form.costPrice)) / pNeto) * 100
                return r >= 40 ? 'text-green-400' : r >= 20 ? 'text-yellow-400' : 'text-red-400'
              })())}>
                {(() => {
                  const pNeto = Number(form.basePrice) / 1.19
                  return (((pNeto - Number(form.costPrice)) / pNeto) * 100).toFixed(1)
                })()}%
              </span>
            </div>
          )}

          {/* Tipo de carne */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tipo de carne</label>
            <select value={form.meatType} onChange={e => setForm({ ...form, meatType: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              {MEAT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>

          {/* Impuestos */}
          <div className="bg-gray-800/50 rounded-xl p-3 space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Impuestos</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">IVA</span>
              <span className="font-mono text-gray-300 font-semibold">19% <span className="text-xs text-gray-600 font-normal">(todos los productos)</span></span>
            </div>
            {CATS_EXTRA_TAX.has(form.categoryId) && (
              <div className="flex items-center justify-between text-sm border-t border-gray-700 pt-2">
                <span className="text-gray-400">{extraTaxLabel(form.categoryId)}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" step="0.5"
                    value={form.additionalTaxPct}
                    onChange={e => setForm(f => ({ ...f, additionalTaxPct: e.target.value }))}
                    className="w-16 bg-gray-900 border border-amber-700/60 rounded-lg px-2 py-1 text-right text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-gray-400 text-xs">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Formato */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Formato / presentación <span className="text-gray-600">(opcional)</span></label>
            <select value={form.formatId}
              onChange={e => {
                const fmt = formats.find(f => f.id === e.target.value)
                setForm(f => ({
                  ...f, formatId: e.target.value,
                  requiresWeight: fmt ? !!fmt.is_variable : f.requiresWeight,
                  priceUnit: fmt ? fmt.unit : f.priceUnit,
                }))
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              <option value="">Sin formato específico</option>
              {formats.filter(f => f.is_active).map(f => (
                <option key={f.id} value={f.id}>{f.name} — {f.is_variable ? 'Granel' : `${f.weight_kg} ${f.unit}`}</option>
              ))}
            </select>
          </div>

          {/* Venta por peso */}
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
            <button type="button"
              onClick={() => setForm(f => ({ ...f, requiresWeight: !f.requiresWeight, priceUnit: !f.requiresWeight ? 'kg' : 'unidad' }))}
              className={clsx('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', form.requiresWeight ? 'bg-red-600' : 'bg-gray-700')}>
              <span className={clsx('absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow', form.requiresWeight ? 'translate-x-6' : 'translate-x-1')} />
            </button>
            <div>
              <p className="text-sm font-medium">{form.requiresWeight ? 'Se vende por kilo (requiere balanza)' : 'Se vende por unidad'}</p>
              <p className="text-xs text-gray-500">Precio {form.requiresWeight ? 'por kg' : 'por unidad'}</p>
            </div>
          </div>

          {/* Promoción */}
          <div className={clsx('border rounded-xl p-4', form.promotionActive ? 'border-orange-600/50 bg-orange-950/20' : 'border-gray-700 bg-gray-800/30')}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-orange-400">🏷️ Promoción</p>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, promotionActive: !f.promotionActive }))}
                className="text-gray-400 hover:text-white transition-colors">
                {form.promotionActive
                  ? <ToggleRight className="w-6 h-6 text-orange-400" />
                  : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
            {form.promotionActive && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">% de descuento *</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" max="99" value={form.promotionPct}
                        onChange={e => setForm(f => ({ ...f, promotionPct: e.target.value }))}
                        placeholder="ej: 20"
                        className="w-full bg-gray-800 border border-orange-700/60 rounded-lg px-3 py-2 text-sm font-mono text-center text-orange-300 focus:outline-none focus:border-orange-400" />
                      <span className="text-gray-400 text-sm flex-shrink-0">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Nombre promoción</label>
                    <input value={form.promotionName}
                      onChange={e => setForm(f => ({ ...f, promotionName: e.target.value }))}
                      placeholder="Oferta de la semana"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
                {Number(form.promotionPct) > 0 && Number(form.basePrice) > 0 && (
                  <div className="flex items-center gap-3 bg-orange-900/20 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-400">Precio con descuento:</span>
                    <span className="text-orange-300 font-mono font-bold">
                      {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
                        .format(Math.round(Number(form.basePrice) * (1 - Number(form.promotionPct) / 100)))}
                    </span>
                    <span className="text-gray-600 line-through font-mono text-xs">
                      {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
                        .format(Number(form.basePrice))}
                    </span>
                  </div>
                )}
              </div>
            )}
            {!form.promotionActive && (
              <p className="text-xs text-gray-600">Activa la promoción para asignar un descuento visible en la sección Ventas → Promociones</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button onClick={toggleStatus} disabled={toggling}
            className={clsx('px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50',
              product.status === 'active'
                ? 'bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400'
                : 'bg-gray-800 hover:bg-green-900/40 text-gray-400 hover:text-green-400'
            )}>
            {product.status === 'active' ? 'Desactivar' : 'Activar'}
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal gestión de formatos ───────────────────────────────────────────────
function FormatsModal({ formats, onClose, onSaved }: {
  formats: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('kg')
  const [newWeight, setNewWeight] = useState('')
  const [newVariable, setNewVariable] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!newName.trim()) { toast.error('Ingresa un nombre'); return }
    setSaving(true)
    const api = (window as any).posAPI
    try {
      await api.formats.create({
        name: newName.trim(),
        unit: newUnit,
        weightKg: newVariable ? 0 : parseFloat(newWeight) || 0,
        isVariable: newVariable ? 1 : 0,
      })
      toast.success('Formato creado')
      setNewName(''); setNewWeight(''); setNewVariable(false)
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-[480px] border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold">Gestionar formatos</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Lista existente */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {formats.length === 0 && (
              <p className="text-center text-gray-600 py-4 text-sm">Sin formatos aún</p>
            )}
            {formats.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <div>
                  <span className="font-medium text-sm">{f.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {f.is_variable ? 'Granel' : `${f.weight_kg} ${f.unit}`}
                  </span>
                </div>
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full',
                  f.is_active ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-500'
                )}>
                  {f.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>

          {/* Agregar nuevo */}
          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Nuevo formato</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="col-span-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Caja 5kg, Botella 1.5L, Bolsa 500g"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <select
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="kg">kg</option>
                  <option value="L">Litros (L)</option>
                  <option value="g">gramos (g)</option>
                  <option value="ml">mililitros (ml)</option>
                  <option value="un">unidad (un)</option>
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.001"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  disabled={newVariable}
                  placeholder={`Cantidad en ${newUnit}`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:opacity-40"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={newVariable}
                onChange={e => setNewVariable(e.target.checked)}
                className="w-4 h-4"
              />
              Peso variable (granel — se ingresa al vender)
            </label>
            <button
              onClick={save}
              disabled={saving || !newName.trim()}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-40"
            >
              {saving ? 'Guardando...' : 'Agregar formato'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
