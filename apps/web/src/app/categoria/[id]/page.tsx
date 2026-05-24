'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useCart } from '@/lib/store'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES: Record<string, { name: string; image: string; desc: string }> = {
  vacuno:    { name: 'Vacuno',    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80', desc: 'Cortes premium de res' },
  cerdo:     { name: 'Cerdo',     image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80', desc: 'Carnes selectas de cerdo' },
  pollo:     { name: 'Aves',      image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80', desc: 'Pollo fresco y pavo' },
  embutidos: { name: 'Embutidos', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80', desc: 'Longanizas y chorizos' },
  parrilla:  { name: 'Parrilla',  image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80', desc: 'Para tu asado perfecto' },
  congelados:{ name: 'Congelados',image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80', desc: 'Listos para cocinar' },
  bebidas:   { name: 'Bebidas',   image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80', desc: 'Para acompañar tu comida' },
  quesos:    { name: 'Quesos',    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=80', desc: 'Selección artesanal de quesos' },
}

// Catálogo de respaldo — se muestra inmediatamente mientras carga la API
const CATALOGO_FALLBACK: Product[] = [
  { id: 'prod-vac-001', name: 'Lomo Liso',         base_price: 14990, online_price: 14990, category_id: 'cat-vacuno',    is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80'] },
  { id: 'prod-vac-002', name: 'Lomo Vetado',        base_price: 12990, online_price: 12990, category_id: 'cat-vacuno',    is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80'] },
  { id: 'prod-vac-003', name: 'Posta Negra',        base_price:  9990, online_price:  9990, category_id: 'cat-vacuno',    is_featured: false, image_urls: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80'] },
  { id: 'prod-vac-004', name: 'Asado de Tira',      base_price: 10000, online_price: 10000, category_id: 'cat-vacuno',    is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=600&q=80'] },
  { id: 'prod-vac-005', name: 'Entraña',            base_price: 11990, online_price: 11990, category_id: 'cat-vacuno',    is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600&q=80'] },
  { id: 'prod-vac-006', name: 'Plateada',           base_price:  7990, online_price:  7990, category_id: 'cat-vacuno',    is_featured: false, image_urls: ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80'] },
  { id: 'prod-vac-007', name: 'Osobuco',            base_price:  5990, online_price:  5990, category_id: 'cat-vacuno',    is_featured: false, image_urls: ['https://images.unsplash.com/photo-1615937691194-97dbd3f3dc29?w=600&q=80'] },
  { id: 'prod-vac-008', name: 'Carne Molida',       base_price: 10000, online_price: 10000, category_id: 'cat-vacuno',    is_featured: false, image_urls: ['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80'] },
  { id: 'prod-cer-001', name: 'Pulpa de Cerdo',     base_price:  6990, online_price:  6990, category_id: 'cat-cerdo',     is_featured: false, image_urls: ['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80'] },
  { id: 'prod-cer-002', name: 'Costillar de Cerdo', base_price:  7990, online_price:  7990, category_id: 'cat-cerdo',     is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80'] },
  { id: 'prod-cer-003', name: 'Chuleta Centro',     base_price:  5990, online_price:  5990, category_id: 'cat-cerdo',     is_featured: false, image_urls: ['https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=80'] },
  { id: 'prod-pol-001', name: 'Pollo Entero',       base_price:  3490, online_price:  3490, category_id: 'cat-pollo',     is_featured: false, image_urls: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80'] },
  { id: 'prod-pol-002', name: 'Pechuga de Pollo',   base_price:  5990, online_price:  5990, category_id: 'cat-pollo',     is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80'] },
  { id: 'prod-pol-003', name: 'Trutro de Pollo',    base_price:  3990, online_price:  3990, category_id: 'cat-pollo',     is_featured: false, image_urls: ['https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80'] },
  { id: 'prod-emb-001', name: 'Longaniza Casera',   base_price:  2990, online_price:  2990, category_id: 'cat-embutidos', is_featured: false, image_urls: ['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80'] },
  { id: 'prod-emb-002', name: 'Chorizo Parrillero', base_price: 10000, online_price: 10000, category_id: 'cat-embutidos', is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80'] },
  { id: 'prod-emb-003', name: 'Prieta',             base_price:  2490, online_price:  2490, category_id: 'cat-embutidos', is_featured: false, image_urls: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80'] },
  { id: 'prod-cor-001', name: 'Pierna de Cordero',  base_price: 13990, online_price: 13990, category_id: 'cat-parrilla',  is_featured: true,  image_urls: ['https://images.unsplash.com/photo-1615937722923-67f6deaf2cc9?w=600&q=80'] },
  { id: 'prod-cor-002', name: 'Costillar Cordero',  base_price: 11990, online_price: 11990, category_id: 'cat-parrilla',  is_featured: false, image_urls: ['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80'] },
  { id: 'prod-beb-1',   name: 'Coca Cola 1.5L',     base_price:  1500, online_price:  1500, category_id: 'cat-bebidas',   is_featured: false, image_urls: ['https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80'] },
  { id: 'prod-beb-2',   name: 'Fanta 1.5L',         base_price:  2000, online_price:  2000, category_id: 'cat-bebidas',   is_featured: false, image_urls: ['https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80'] },
]

const QUESOS_EJEMPLO = [
  {
    id: 'q1', name: 'Queso Mantecoso', price: 4990,
    desc: 'Queso suave y cremoso, ideal para derretir',
    image: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&q=80',
  },
  {
    id: 'q2', name: 'Queso Gouda', price: 5990,
    desc: 'Queso holandés semiduro con sabor suave',
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  },
  {
    id: 'q3', name: 'Queso Chanco', price: 3990,
    desc: 'El clásico queso chileno, firme y sabroso',
    image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400&q=80',
  },
  {
    id: 'q4', name: 'Queso Brie', price: 7990,
    desc: 'Queso francés suave con corteza blanca',
    image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80',
  },
  {
    id: 'q5', name: 'Queso Parmesano', price: 8990,
    desc: 'Queso duro italiano, perfecto para rallar',
    image: 'https://images.unsplash.com/photo-1634487359989-3e90c9432133?w=400&q=80',
  },
  {
    id: 'q6', name: 'Queso Mozzarella', price: 4490,
    desc: 'Fresco y elástico, ideal para pizzas',
    image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&q=80',
  },
]

interface Product {
  id: string
  name: string
  base_price: number
  online_price?: number
  meat_type?: string
  image_urls?: string[]
  category_id?: string
  is_featured?: boolean
}

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.id as string
  const category = CATEGORIES[categoryId]

  const fallback = categoryId === 'quesos'
    ? QUESOS_EJEMPLO.map(q => ({ id: q.id, name: q.name, base_price: q.price, online_price: q.price, image_urls: [q.image] }))
    : CATALOGO_FALLBACK.filter(p => p.category_id === `cat-${categoryId}`)

  const [products, setProducts] = useState<Product[]>(fallback)
  const [loading, setLoading] = useState(fallback.length === 0)
  const { addItem, items } = useCart()

  const isInCart = (id: string) => items.some(i => i.id === id)

  useEffect(() => {
    if (categoryId === 'quesos') return // quesos usa datos locales

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/products?category_id=cat-${categoryId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setProducts(data) })
      .catch(() => {/* mantener fallback */})
      .finally(() => setLoading(false))
  }, [categoryId])

  const getImage = (product: Product) => {
    const imgs = typeof product.image_urls === 'string'
      ? JSON.parse(product.image_urls || '[]')
      : product.image_urls || []
    if (imgs.length > 0) return imgs[0]
    return category?.image || 'https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=400&q=80'
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* Hero categoría */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={category?.image}
            alt={category?.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
          <div className="absolute inset-0 flex items-center px-8 max-w-7xl mx-auto">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-3 transition">
                <ArrowLeft className="w-4 h-4" /> Inicio
              </Link>
              <h1 className="text-4xl font-black text-white">{category?.name}</h1>
              <p className="text-gray-300 mt-1">{category?.desc}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">

          {loading && (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(6)].map((_, i) => (
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

          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No hay productos en esta categoría aún</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-6">{products.length} productos</p>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map(product => {
                  const quesoInfo = QUESOS_EJEMPLO.find(q => q.id === product.id)
                  return (
                    <div key={product.id} className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={getImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                        {quesoInfo && (
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{quesoInfo.desc}</p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-xl font-black text-gray-900">
                              ${(product.online_price || product.base_price)?.toLocaleString('es-CL')}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">/ kg</span>
                          </div>
                          <button
                            onClick={() => addItem({ id: product.id, name: product.name, price: product.online_price || product.base_price, quantity: 1 })}
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
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}