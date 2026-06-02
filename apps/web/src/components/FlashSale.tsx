'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, ShoppingCart, ArrowRight, Clock } from 'lucide-react'
import { useCart } from '@/lib/store'

interface PromoProduct {
  id: string
  name: string
  base_price: number
  online_price?: number
  promotional_price?: number
  image_urls?: unknown
  unit?: string
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=600&q=80'

function getImg(p: PromoProduct): string {
  try {
    const raw = p.image_urls
    let arr: unknown[] = []
    if (Array.isArray(raw)) arr = raw
    else if (typeof raw === 'string' && raw.trim()) arr = JSON.parse(raw)
    const url = arr[0]
    if (typeof url === 'string' && url.startsWith('http')) return url
  } catch {}
  return FALLBACK_IMG
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function FlashSale() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<PromoProduct[]>([])
  const [endsAt,   setEndsAt]   = useState<Date | null>(null)
  const [now,      setNow]      = useState(() => Date.now())
  const [loading,  setLoading]  = useState(true)
  const [added,    setAdded]    = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/products?is_promo=true')
      .then(r => r.json())
      .then((data: PromoProduct[] | { error: string }) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        // Solo mostrar si hay productos CON precio promocional real
        const withPromo = list.filter(p => p.promotional_price && p.promotional_price < (p.online_price ?? p.base_price))
        if (withPromo.length > 0) {
          setProducts(withPromo.slice(0, 6))
          const end = new Date(); end.setHours(23, 59, 59, 999)
          setEndsAt(end)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  // Timer
  useEffect(() => {
    if (!endsAt || products.length === 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt, products.length])

  if (loading || products.length === 0 || !endsAt) return null
  const remaining = endsAt.getTime() - now
  if (remaining <= 0) return null

  const total = Math.floor(remaining / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const handleAdd = (p: PromoProduct) => {
    const price = p.promotional_price ?? p.online_price ?? p.base_price
    addItem({ id: p.id, name: p.name, price, quantity: p.unit === 'kg' ? 0.5 : 1, unit: p.unit === 'kg' ? 'kg' : 'un' })
    setAdded(p.id)
    setTimeout(() => setAdded(null), 2000)
  }

  return (
    <section className="max-w-7xl mx-auto px-4 pt-6">
      <div className="rounded-2xl border border-red-200 bg-white overflow-hidden">

        {/* Header compacto */}
        <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-600 fill-red-600" />
            <span className="font-black text-red-700 text-sm uppercase tracking-wide">Ofertas Flash</span>
            <span className="text-xs text-red-500 hidden sm:inline">— precios válidos hasta medianoche</span>
          </div>
          {/* Timer compacto */}
          <div className="flex items-center gap-1.5 text-red-600">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono font-bold text-sm">
              {pad(h)}:{pad(m)}:{pad(s)}
            </span>
          </div>
        </div>

        {/* Mobile: scroll horizontal compacto / Desktop: grid */}
        <div className="px-3 py-3 sm:p-4">
          {/* Mobile: fila horizontal con scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden" style={{ scrollbarWidth: 'none' }}>
            {products.map(p => {
              const original = p.online_price ?? p.base_price ?? 0
              const final    = p.promotional_price ?? original
              const pct      = original > 0 ? Math.round((1 - final / original) * 100) : 0
              const isAdded  = added === p.id
              return (
                <div key={p.id} className="flex-shrink-0 w-28 flex flex-col rounded-xl border border-gray-100 overflow-hidden bg-white">
                  <div className="relative w-full h-20 bg-gray-50 overflow-hidden">
                    <img src={getImg(p)} alt={p.name} className="w-full h-full object-cover"
                      onError={e => { const img = e.target as HTMLImageElement; if (!img.dataset.err) { img.dataset.err='1'; img.src=FALLBACK_IMG } }} />
                    {pct > 0 && (
                      <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">-{pct}%</span>
                    )}
                  </div>
                  <div className="p-1.5 flex flex-col gap-1">
                    <p className="text-[10px] font-medium text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                    <p className="text-xs font-black text-red-600">${final.toLocaleString('es-CL')}</p>
                    <button onClick={() => handleAdd(p)}
                      className={`w-full text-[10px] font-bold py-1 rounded-lg transition ${isAdded ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>
                      {isAdded ? '✓' : '+ Agregar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: grid */}
          <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map(p => {
              const original = p.online_price ?? p.base_price ?? 0
              const final    = p.promotional_price ?? original
              const pct      = original > 0 ? Math.round((1 - final / original) * 100) : 0
              const isAdded  = added === p.id
              return (
                <div key={p.id} className="group flex flex-col rounded-xl border border-gray-100 overflow-hidden hover:border-red-200 hover:shadow-sm transition">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <img src={getImg(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { const img = e.target as HTMLImageElement; if (!img.dataset.err) { img.dataset.err='1'; img.src=FALLBACK_IMG } }} />
                    {pct > 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">-{pct}%</span>
                    )}
                  </div>
                  <div className="p-2 flex-1 flex flex-col">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1.5 leading-tight min-h-[2rem]">{p.name}</p>
                    <div className="mt-auto">
                      {pct > 0 && <p className="text-[10px] text-gray-400 line-through leading-none">${original.toLocaleString('es-CL')}</p>}
                      <p className="text-sm font-black text-red-600">${final.toLocaleString('es-CL')}</p>
                      <button onClick={() => handleAdd(p)}
                        className={`mt-1.5 w-full text-[11px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${isAdded ? 'bg-green-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                        {isAdded ? '✓' : <><ShoppingCart className="w-3 h-3" /> Agregar</>}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-5 pb-3 text-right">
          <Link href="/promociones" className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition">
            Ver todas las ofertas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  )
}
