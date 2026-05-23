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
  embutidos: { name: 'Embutidos', image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800&q=80', desc: 'Longanizas y chorizos' },
  parrilla:  { name: 'Parrilla',  image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', desc: 'Para tu asado perfecto' },
  congelados:{ name: 'Congelados',image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80', desc: 'Listos para cocinar' },
  bebidas:   { name: 'Bebidas',   image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80', desc: 'Para acompañar tu comida' },
  quesos:    { name: 'Quesos',    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=80', desc: 'Selección artesanal de quesos' },
}

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

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem, items } = useCart()

  const isInCart = (id: string) => items.some(i => i.id === id)

  useEffect(() => {
    if (categoryId === 'quesos') {
      setProducts(QUESOS_EJEMPLO.map(q => ({
        id: q.id,
        name: q.name,
        base_price: q.price,
        online_price: q.price,
        image_urls: [q.image],
      })))
      setLoading(false)
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/products?category_id=cat-${categoryId}`)
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
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