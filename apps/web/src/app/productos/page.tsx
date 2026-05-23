'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/lib/types'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useCart } from '@/lib/store'
import { ShoppingCart, Search, Tag, Package } from 'lucide-react'

const CATEGORY_IMAGES: Record<string, string> = {
  vacuno:    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
  cerdo:     'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  pollo:     'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80',
  embutidos: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&q=80',
  parrilla:  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  congelados:'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80',
  bebidas:   'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80',
  quesos:    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  combos:    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
  default:   'https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=400&q=80',
}

const CATEGORIES = [
  { id: 'all',           label: 'Todos' },
  { id: 'cat-vacuno',    label: 'Vacuno' },
  { id: 'cat-cerdo',     label: 'Cerdo' },
  { id: 'cat-pollo',     label: 'Aves' },
  { id: 'cat-embutidos', label: 'Embutidos' },
  { id: 'cat-parrilla',  label: 'Parrilla' },
  { id: 'cat-combos',    label: 'Combos' },
  { id: 'cat-bebidas',   label: 'Bebidas' },
]

const CATALOGO: Product[] = [
  { id: 'prod-vac-001', name: 'Lomo Liso',         category_id: 'cat-vacuno',    base_price: 14990, online_price: 14990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80"]' },
  { id: 'prod-vac-002', name: 'Lomo Vetado',        category_id: 'cat-vacuno',    base_price: 12990, online_price: 12990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80"]' },
  { id: 'prod-vac-003', name: 'Posta Negra',        category_id: 'cat-vacuno',    base_price:  9990, online_price:  9990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80"]' },
  { id: 'prod-vac-004', name: 'Asado de Tira',      category_id: 'cat-vacuno',    base_price: 10000, online_price: 10000, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80"]' },
  { id: 'prod-vac-005', name: 'Entraña',            category_id: 'cat-vacuno',    base_price: 11990, online_price: 11990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80"]' },
  { id: 'prod-vac-006', name: 'Plateada',           category_id: 'cat-vacuno',    base_price:  7990, online_price:  7990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"]' },
  { id: 'prod-vac-007', name: 'Osobuco',            category_id: 'cat-vacuno',    base_price:  5990, online_price:  5990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80"]' },
  { id: 'prod-vac-008', name: 'Carne Molida',       category_id: 'cat-vacuno',    base_price: 10000, online_price: 10000, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80"]' },
  { id: 'prod-cer-001', name: 'Pulpa de Cerdo',     category_id: 'cat-cerdo',     base_price:  6990, online_price:  6990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=80"]' },
  { id: 'prod-cer-002', name: 'Costillar de Cerdo', category_id: 'cat-cerdo',     base_price:  7990, online_price:  7990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80"]' },
  { id: 'prod-cer-003', name: 'Chuleta Centro',     category_id: 'cat-cerdo',     base_price:  5990, online_price:  5990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80"]' },
  { id: 'prod-pol-001', name: 'Pollo Entero',       category_id: 'cat-pollo',     base_price:  3490, online_price:  3490, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80"]' },
  { id: 'prod-pol-002', name: 'Pechuga de Pollo',   category_id: 'cat-pollo',     base_price:  5990, online_price:  5990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600&q=80"]' },
  { id: 'prod-pol-003', name: 'Trutro de Pollo',    category_id: 'cat-pollo',     base_price:  3990, online_price:  3990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?w=600&q=80"]' },
  { id: 'prod-emb-001', name: 'Longaniza Casera',   category_id: 'cat-embutidos', base_price:  2990, online_price:  2990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&q=80"]' },
  { id: 'prod-emb-002', name: 'Chorizo Parrillero', category_id: 'cat-embutidos', base_price: 10000, online_price: 10000, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80"]' },
  { id: 'prod-emb-003', name: 'Prieta',             category_id: 'cat-embutidos', base_price:  2490, online_price:  2490, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&q=80"]' },
  { id: 'prod-cor-001', name: 'Pierna de Cordero',  category_id: 'cat-parrilla',  base_price: 13990, online_price: 13990, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80"]' },
  { id: 'prod-cor-002', name: 'Costillar Cordero',  category_id: 'cat-parrilla',  base_price: 11990, online_price: 11990, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=600&q=80"]' },
  { id: 'prod-beb-1',   name: 'Coca Cola 1.5L',     category_id: 'cat-bebidas',   base_price:  1500, online_price:  1500, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80"]' },
  { id: 'prod-beb-2',   name: 'Fanta 1.5L',         category_id: 'cat-bebidas',   base_price:  2000, online_price:  2000, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80"]' },
  { id: 'prod-combo-001', name: 'Pack Asado Familiar',    category_id: 'cat-combos', base_price: 35000, online_price: 35000, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80"]' },
  { id: 'prod-combo-002', name: 'Pack Parrilla Completa', category_id: 'cat-combos', base_price: 45000, online_price: 45000, is_featured: true,  status: 'active', image_urls: '["https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80"]' },
  { id: 'prod-combo-003', name: 'Pack Económico',         category_id: 'cat-combos', base_price: 20000, online_price: 20000, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"]' },
  { id: 'prod-combo-004', name: 'Pack Pollo y Cerdo',     category_id: 'cat-combos', base_price: 18000, online_price: 18000, is_featured: false, status: 'active', image_urls: '["https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80"]' },
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
        if (Array.isArray(data) && data.length > 0) setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getProductImage = (product: Product) => {
    try {
      const imgs = typeof product.image_urls === 'string'
        ? JSON.parse(product.image_urls || '[]')
        : product.image_urls || []
      if (Array.isArray(imgs) && imgs.length > 0) return imgs[0]
    } catch {}
    const catKey = product.category_id?.replace('cat-', '') || 'default'
    return CATEGORY_IMAGES[catKey] || CATEGORY_IMAGES.default
  }

  const getPrice = (p: Product) => (p as any).promotional_price || p.online_price || p.base_price

  const promos   = products.filter(p => (p as any).promotional_price)
  const filtered = products.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category_id === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })
  const isInCart = (id: string) => items.some(i => i.id === id)

  const ProductCard = ({ product }: { product: Product }) => {
    const promoPrice = (product as any).promotional_price
    const promoLabel = (product as any).promo_label
    const img = getProductImage(product)
    const isCombo = product.category_id === 'cat-combos'
    const inCart = isInCart(product.id)
    const precio = product.online_price || product.base_price
    const discount = promoPrice ? Math.round((1 - promoPrice / precio) * 100) : 0

    return (
      <div className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
        {/* Imagen */}
        <div className="relative h-44 overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).src = CATEGORY_IMAGES[product.category_id?.replace('cat-','') || 'default'] || CATEGORY_IMAGES.default }}
          />
          {/* Badge promo */}
          {promoPrice && (
            <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-2">
              <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                {promoLabel || 'Oferta'} -{discount}%
              </span>
            </div>
          )}
          {!promoPrice && product.is_featured && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
              ⭐ Destacado
            </span>
          )}
          {isCombo && (
            <span className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-lg">
              📦 Combo
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            {product.category_id?.replace('cat-', '')}
          </p>

          {/* Precio */}
          <div className="mb-3 mt-auto">
            {promoPrice ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-orange-600">${promoPrice.toLocaleString('es-CL')}</span>
                  <span className="text-sm text-gray-400 line-through">${precio.toLocaleString('es-CL')}</span>
                </div>
                <p className="text-xs text-orange-500 font-semibold">Ahorras ${(precio - promoPrice).toLocaleString('es-CL')}{isCombo ? '' : '/kg'}</p>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">${precio.toLocaleString('es-CL')}</span>
                {!isCombo && <span className="text-xs text-gray-400">/kg</span>}
              </div>
            )}
          </div>

          {/* Botón agregar */}
          <button
            onClick={() => addItem({ id: product.id, name: product.name, price: getPrice(product), quantity: 1 })}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              inCart
                ? 'bg-green-500 text-white'
                : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {inCart ? '✓ Agregado' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* ── Promoción de la semana ── */}
        {!loading && promos.length > 0 && (
          <section className="bg-gradient-to-r from-orange-600 to-red-600 py-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-black text-white">Promoción de la semana</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {promos.map(p => {
                  const pp = (p as any).promotional_price
                  const normal = p.online_price || p.base_price
                  const disc = Math.round((1 - pp / normal) * 100)
                  const inCart = isInCart(p.id)
                  return (
                    <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col">
                      <div className="relative h-40 overflow-hidden">
                        <img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = CATEGORY_IMAGES.default }} />
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-black px-2 py-1 rounded-lg">-{disc}%</span>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <p className="font-bold text-gray-900 text-sm line-clamp-1 mb-2">{p.name}</p>
                        <div className="mb-3">
                          <p className="text-xl font-black text-orange-600">${pp.toLocaleString('es-CL')}<span className="text-xs font-normal text-gray-400">/kg</span></p>
                          <p className="text-xs text-gray-400 line-through">${normal.toLocaleString('es-CL')}/kg</p>
                        </div>
                        <button
                          onClick={() => addItem({ id: p.id, name: p.name, price: pp, quantity: 1 })}
                          className={`mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition ${inCart ? 'bg-green-500 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {inCart ? '✓ Agregado' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Combos ── */}
        {!loading && activeCategory === 'all' && (
          (() => {
            const combos = products.filter(p => p.category_id === 'cat-combos')
            if (combos.length === 0) return null
            return (
              <section className="bg-gray-900 py-10">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-black text-white">Combos y Packs</h2>
                    <span className="text-gray-400 text-sm">— para llevar más ahorrando</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {combos.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                </div>
              </section>
            )
          })()
        )}

        {/* ── Filtros y catálogo ── */}
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-2xl font-black text-gray-900">Nuestros Productos</h1>
              <div className="relative sm:ml-auto max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar corte..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mt-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    activeCategory === cat.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filtered.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
