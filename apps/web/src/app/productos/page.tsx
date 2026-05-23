'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/lib/types'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useCart } from '@/lib/store'
import { ShoppingCart, Search } from 'lucide-react'

const CATEGORY_IMAGES: Record<string, string> = {
  vacuno: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
  cerdo: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  pollo: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80',
  embutidos: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&q=80',
  parrilla: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  congelados: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80',
  bebidas: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80',
  quesos: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=400&q=80',
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'cat-vacuno', label: 'Vacuno' },
  { id: 'cat-cerdo', label: 'Cerdo' },
  { id: 'cat-pollo', label: 'Aves' },
  { id: 'cat-embutidos', label: 'Embutidos' },
  { id: 'cat-parrilla', label: 'Parrilla' },
  { id: 'cat-congelados', label: 'Congelados' },
  { id: 'cat-bebidas', label: 'Bebidas' },
  { id: 'cat-quesos', label: 'Quesos' },
]

// Catálogo local — respaldo si Supabase no responde
const CATALOGO: Product[] = [
  // Vacuno
  { id: 'prod-vac-001', name: 'Lomo Liso',      category_id: 'cat-vacuno',    base_price: 14990, online_price: 14990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80"]' },
  { id: 'prod-vac-002', name: 'Lomo Vetado',     category_id: 'cat-vacuno',    base_price: 12990, online_price: 12990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80"]' },
  { id: 'prod-vac-003', name: 'Posta Negra',     category_id: 'cat-vacuno',    base_price:  9990, online_price:  9990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80"]' },
  { id: 'prod-vac-004', name: 'Asado de Tira',   category_id: 'cat-vacuno',    base_price: 10000, online_price: 10000, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=600&q=80"]' },
  { id: 'prod-vac-005', name: 'Entraña',         category_id: 'cat-vacuno',    base_price: 11990, online_price: 11990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80"]' },
  { id: 'prod-vac-006', name: 'Plateada',        category_id: 'cat-vacuno',    base_price:  7990, online_price:  7990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"]' },
  { id: 'prod-vac-007', name: 'Osobuco',         category_id: 'cat-vacuno',    base_price:  5990, online_price:  5990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80"]' },
  { id: 'prod-vac-008', name: 'Carne Molida',    category_id: 'cat-vacuno',    base_price: 10000, online_price: 10000, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1588347818036-c6e8a5e0c9f1?w=600&q=80"]' },
  // Cerdo
  { id: 'prod-cer-001', name: 'Pulpa de Cerdo',     category_id: 'cat-cerdo', base_price:  6990, online_price:  6990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80"]' },
  { id: 'prod-cer-002', name: 'Costillar de Cerdo', category_id: 'cat-cerdo', base_price:  7990, online_price:  7990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80"]' },
  { id: 'prod-cer-003', name: 'Chuleta Centro',     category_id: 'cat-cerdo', base_price:  5990, online_price:  5990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=80"]' },
  // Pollo
  { id: 'prod-pol-001', name: 'Pollo Entero',      category_id: 'cat-pollo',  base_price:  3490, online_price:  3490, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80"]' },
  { id: 'prod-pol-002', name: 'Pechuga de Pollo',  category_id: 'cat-pollo',  base_price:  5990, online_price:  5990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80"]' },
  { id: 'prod-pol-003', name: 'Trutro de Pollo',   category_id: 'cat-pollo',  base_price:  3990, online_price:  3990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=600&q=80"]' },
  // Embutidos
  { id: 'prod-emb-001', name: 'Longaniza Casera',   category_id: 'cat-embutidos', base_price:  2990, online_price:  2990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&q=80"]' },
  { id: 'prod-emb-002', name: 'Chorizo Parrillero', category_id: 'cat-embutidos', base_price: 10000, online_price: 10000, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80"]' },
  { id: 'prod-emb-003', name: 'Prieta',             category_id: 'cat-embutidos', base_price:  2490, online_price:  2490, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&q=80"]' },
  // Parrilla / Cordero
  { id: 'prod-cor-001', name: 'Pierna de Cordero',  category_id: 'cat-parrilla',  base_price: 13990, online_price: 13990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80"]' },
  { id: 'prod-cor-002', name: 'Costillar Cordero',  category_id: 'cat-parrilla',  base_price: 11990, online_price: 11990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=600&q=80"]' },
  // Bebidas
  { id: 'prod-beb-1',   name: 'Coca Cola 1.5L',     category_id: 'cat-bebidas',   base_price:  1500, online_price:  1500, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80"]' },
  { id: 'prod-beb-2',   name: 'Fanta 1.5L',         category_id: 'cat-bebidas',   base_price:  2000, online_price:  2000, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80"]' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(CATALOGO)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const { addItem, items } = useCart()

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        // Usar datos de Supabase si llegan, si no mantener catálogo local
        if (Array.isArray(data) && data.length > 0) setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getProductImage = (product: Product) => {
    const imgs = typeof product.image_urls === 'string'
      ? JSON.parse(product.image_urls || '[]')
      : product.image_urls || []
    if (imgs.length > 0) return imgs[0]
    const catKey = product.category_id?.replace('cat-', '') || 'default'
    return CATEGORY_IMAGES[catKey] || CATEGORY_IMAGES.default
  }

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category_id === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const isInCart = (id: string) => items.some(i => i.id === id)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* Page Header */}
        <div className="bg-white border-b border-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black text-gray-900 mb-6">Nuestros Productos</h1>

            {/* Search */}
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar corte..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Category filters */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    activeCategory === cat.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          {loading && (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No hay productos en esta categoría</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-6">{filtered.length} productos</p>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filtered.map(product => (
                  <div key={product.id} className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                    {/* Imagen */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {(product as any).promotional_price && (
                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          {(product as any).promo_label || 'Oferta'}
                        </span>
                      )}
                      {!(product as any).promotional_price && product.is_featured && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Destacado
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-0.5 line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                        {product.category_id?.replace('cat-', '')}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {(product as any).promotional_price ? (
                            <>
                              <span className="text-xl font-black text-orange-600">
                                ${(product as any).promotional_price?.toLocaleString('es-CL')}
                              </span>
                              <span className="text-xs text-gray-400 line-through ml-2">
                                ${(product.online_price || product.base_price)?.toLocaleString('es-CL')}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">/ kg</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl font-black text-gray-900">
                                ${(product.online_price || product.base_price)?.toLocaleString('es-CL')}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">/ kg</span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => addItem({ id: product.id, name: product.name, price: (product as any).promotional_price || product.online_price || product.base_price, quantity: 1 })}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                            isInCart(product.id)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {isInCart(product.id) ? '✓' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}