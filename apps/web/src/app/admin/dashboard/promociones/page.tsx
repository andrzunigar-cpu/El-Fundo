'use client'

import { useEffect, useState } from 'react'
import { Tag, Save, Loader, X, Percent, Calendar } from 'lucide-react'

interface Product {
  id: string
  name: string
  category_id: string
  base_price: number
  online_price: number
  promotional_price?: number
  promo_label?: string
  promo_ends_at?: string
  image_urls: string | string[]
}

function getImage(p: Product): string {
  try {
    const arr = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls || '[]') : p.image_urls || []
    return arr[0] || ''
  } catch { return '' }
}

function formatPrice(n: number) {
  return `$${n?.toLocaleString('es-CL')}`
}

export default function PromocionesAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [edits, setEdits] = useState<Record<string, Partial<Product>>>({})

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const edit = (id: string, key: keyof Product, val: unknown) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }))
  }

  const getVal = <K extends keyof Product>(p: Product, key: K): Product[K] =>
    (edits[p.id]?.[key] ?? p[key]) as Product[K]

  const applyPromo = async (p: Product) => {
    setSaving(p.id)
    const promoPrice = edits[p.id]?.promotional_price ?? p.promotional_price
    const payload: Record<string, unknown> = {
      promotional_price: promoPrice ? Number(promoPrice) : null,
      promo_label: promoPrice ? (edits[p.id]?.promo_label ?? p.promo_label ?? 'Oferta') : null,
      promo_ends_at: promoPrice ? (edits[p.id]?.promo_ends_at ?? p.promo_ends_at ?? null) : null,
    }
    const res = await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const updated = await res.json()
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...updated } : x))
      setEdits(prev => { const n = { ...prev }; delete n[p.id]; return n })
      setSaved(p.id)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  const removePromo = async (p: Product) => {
    setSaving(p.id)
    await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promotional_price: null, promo_label: null, promo_ends_at: null }),
    })
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, promotional_price: undefined, promo_label: undefined, promo_ends_at: undefined } : x))
    setSaving(null)
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const withPromo = filtered.filter(p => p.promotional_price)
  const withoutPromo = filtered.filter(p => !p.promotional_price)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
        <p className="text-gray-500 text-sm mt-1">Configura precios especiales para tus productos</p>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando productos...</div>
      ) : (
        <>
          {/* Productos con promo activa */}
          {withPromo.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Promociones activas ({withPromo.length})
              </h2>
              <div className="space-y-3">
                {withPromo.map(p => <PromoRow key={p.id} p={p} edit={edit} getVal={getVal} saving={saving} saved={saved} applyPromo={applyPromo} removePromo={removePromo} />)}
              </div>
            </div>
          )}

          {/* Todos los demás */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
              Sin promoción ({withoutPromo.length})
            </h2>
            <div className="space-y-3">
              {withoutPromo.map(p => <PromoRow key={p.id} p={p} edit={edit} getVal={getVal} saving={saving} saved={saved} applyPromo={applyPromo} removePromo={removePromo} />)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PromoRow({ p, edit, getVal, saving, saved, applyPromo, removePromo }: {
  p: Product
  edit: (id: string, key: keyof Product, val: unknown) => void
  getVal: <K extends keyof Product>(p: Product, key: K) => Product[K]
  saving: string | null
  saved: string | null
  applyPromo: (p: Product) => void
  removePromo: (p: Product) => void
}) {
  const img = getImage(p)
  const promoPrice = getVal(p, 'promotional_price') as number | undefined
  const promoLabel = getVal(p, 'promo_label') as string | undefined
  const promoEnds = getVal(p, 'promo_ends_at') as string | undefined
  const basePrice = p.online_price || p.base_price
  const discount = promoPrice ? Math.round((1 - promoPrice / basePrice) * 100) : 0
  const hasActivePromo = !!p.promotional_price
  const isSaving = saving === p.id
  const isSaved = saved === p.id

  return (
    <div className={`bg-white rounded-xl border p-4 ${hasActivePromo ? 'border-orange-300' : 'border-gray-200'}`}>
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
            {hasActivePromo && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex-shrink-0">🏷️ En oferta</span>}
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Precio normal: <span className="font-semibold">{formatPrice(basePrice)}/kg</span>
            {promoPrice && <span className="ml-2 text-orange-600 font-semibold">{formatPrice(promoPrice)}/kg ({discount}% OFF)</span>}
          </p>

          {/* Campos de edición */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Precio promo ($/kg)</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input
                  type="number"
                  value={promoPrice || ''}
                  onChange={e => edit(p.id, 'promotional_price', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Sin promo"
                  className="w-full pl-5 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Etiqueta</label>
              <input
                type="text"
                value={promoLabel || ''}
                onChange={e => edit(p.id, 'promo_label', e.target.value)}
                placeholder="Oferta"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Válida hasta</label>
              <input
                type="datetime-local"
                value={promoEnds ? promoEnds.slice(0, 16) : ''}
                onChange={e => edit(p.id, 'promo_ends_at', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex items-end gap-1">
              <button
                onClick={() => applyPromo(p)}
                disabled={isSaving}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSaved ? 'bg-green-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'
                } disabled:opacity-50`}
              >
                {isSaving ? <Loader className="w-3 h-3 animate-spin" /> :
                 isSaved ? '✓' :
                 <><Save className="w-3 h-3" /> Aplicar</>}
              </button>
              {hasActivePromo && (
                <button
                  onClick={() => removePromo(p)}
                  disabled={isSaving}
                  className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-red-500 hover:border-red-200 transition disabled:opacity-50"
                  title="Quitar promoción"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
