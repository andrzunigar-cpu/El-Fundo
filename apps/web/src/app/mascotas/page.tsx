'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/store'

interface Product {
  id: string
  name: string
  base_price: number
  online_price?: number
  unit?: string
  image_urls?: string
  is_featured?: boolean
}

function getImg(p: Product): string {
  try {
    const a = JSON.parse(p.image_urls || '[]')
    if (a[0]) return a[0]
  } catch {}
  return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80'
}

function ProductCard({ p }: { p: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const price = p.online_price || p.base_price
  const unit  = p.unit === 'kg' ? 'kg' : 'un'

  const handleAdd = () => {
    addItem({ id: p.id, name: p.name, price, quantity: p.unit === 'kg' ? 0.5 : 1, unit: p.unit === 'kg' ? 'kg' : 'un' })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col">
      <div className="aspect-square bg-gray-50 overflow-hidden">
        <img src={getImg(p)} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80' }} />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{p.name}</p>
        <p className="text-2xl font-black text-gray-900 mt-auto mb-3">
          ${price.toLocaleString('es-CL')}
          <span className="text-xs font-normal text-gray-400 ml-1">/{unit}</span>
        </p>
        <button onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${
            added ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}>
          {added ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar</>}
        </button>
      </div>
    </div>
  )
}

export default function MascotasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/products?category_id=cat-mascotas')
      .then(r => r.json())
      .then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-amber-50">

        {/* Hero pet friendly */}
        <section className="bg-gradient-to-r from-amber-600 to-orange-500 py-10 px-4 text-white text-center">
          <p className="text-3xl mb-2">🐾</p>
          <h1 className="text-3xl font-black mb-2">Para tus Mascotas</h1>
          <p className="text-amber-100 text-sm max-w-md mx-auto">
            Carnicería El Fundo es pet friendly 🐕 — encuentra productos frescos y naturales para tus compañeros peludos
          </p>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 transition mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No hay productos disponibles aún</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
