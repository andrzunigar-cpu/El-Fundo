'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, ImageIcon, Package, Percent, RefreshCw, AlertCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  base_price: number
  online_price?: number
  promotional_price?: number
  promo_label?: string
  status: string
  image_urls: string | string[]
  category_id: string
  unit?: string
  is_featured?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  'cat-vacuno':    '🐄 Vacuno',
  'cat-cerdo':     '🐷 Cerdo',
  'cat-pollo':     '🐔 Aves',
  'cat-embutidos': '🌭 Embutidos',
  'cat-parrilla':  '🔥 Parrilla',
  'cat-congelados':'❄️ Congelados',
  'cat-bebidas':   '🥤 Bebidas',
  'cat-quesos':    '🧀 Quesos',
  'cat-combos':    '📦 Combos',
}

function getFirstImage(image_urls: string | string[] | undefined): string {
  if (!image_urls) return ''
  try {
    const arr = typeof image_urls === 'string' ? JSON.parse(image_urls) : image_urls
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : ''
  } catch {
    return ''
  }
}

export default function ProductosAdmin() {
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('all')

  const load = () => {
    setLoading(true)
    setError('')
    fetch('/api/products')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
        setProducts(Array.isArray(data) ? data : [])
      })
      .catch(e => setError(e.message || 'Error al cargar productos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p => {
    const matchCat    = catFilter === 'all' || p.category_id === catFilter
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Categorías presentes en los productos cargados
  const presentCats = [...new Set(products.map(p => p.category_id))].sort()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} productos en total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
          <Link
            href="/admin/dashboard/promociones"
            className="flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-50 transition"
          >
            <Percent className="w-4 h-4" /> Promociones
          </Link>
          <Link
            href="/admin/dashboard/productos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
          >
            <Plus className="w-4 h-4" /> Nuevo producto
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-red-600 underline text-xs">Reintentar</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="all">Todas las categorías</option>
            {presentCats.map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-gray-300" />
            Cargando productos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">No hay productos</p>
            {search && <p className="text-sm mt-1">Intenta con otro nombre</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Foto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => {
                  const img   = getFirstImage(product.image_urls)
                  const price = product.online_price || product.base_price
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      {/* Foto */}
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                          {img ? (
                            <img src={img} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </td>

                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                        {product.is_featured && (
                          <span className="text-xs text-red-500 font-medium">⭐ Destacado</span>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {CATEGORY_LABELS[product.category_id] || product.category_id?.replace('cat-', '')}
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-3">
                        {product.promotional_price ? (
                          <div>
                            <span className="font-bold text-orange-600 text-sm">
                              ${product.promotional_price.toLocaleString('es-CL')}
                            </span>
                            <span className="ml-1 line-through text-xs text-gray-400">
                              ${price.toLocaleString('es-CL')}
                            </span>
                            {product.promo_label && (
                              <span className="block text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                                {product.promo_label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900 text-sm">
                            ${price.toLocaleString('es-CL')}
                          </span>
                        )}
                      </td>

                      {/* Unidad */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          (product.unit || 'kg') === 'kg'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}>
                          {product.unit || 'kg'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {product.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/dashboard/productos/${product.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium text-gray-700 transition"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
