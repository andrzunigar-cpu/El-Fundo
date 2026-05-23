'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, ImageIcon, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  base_price: number
  meat_type: string
  status: string
  image_urls: string[]
  category_id: string
}

export default function ProductosAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/products`)
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} productos en total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Imagen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(product => {
                const hasImage = product.image_urls && product.image_urls.length > 0
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {hasImage ? (
                          <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.meat_type}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category_id?.replace('cat-', '')}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 text-sm">
                        ${product.base_price?.toLocaleString('es-CL')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/dashboard/productos/${product.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium text-gray-700 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay productos</p>
          </div>
        )}
      </div>
    </div>
  )
}