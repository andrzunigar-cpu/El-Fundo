'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, Tag, Timer, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/store'

const PROMOCIONES = [
  { id: 'promo-lomo',     nombre: 'Lomo Liso',            desc: 'Corte premium de vacuno',   image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600&q=80', precioNormal: 12990, precioPromo: 9990,  unidad: '/ kg', descuento: 23, tag: '🥩 Vacuno' },
  { id: 'promo-pechuga',  nombre: 'Pechuga de Pollo',     desc: 'Pollo fresco sin hueso',    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', precioNormal: 4990,  precioPromo: 3490,  unidad: '/ kg', descuento: 30, tag: '🐔 Aves' },
  { id: 'promo-costillar',nombre: 'Costillar de Cerdo',   desc: 'Ideal para el asado',       image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80', precioNormal: 7990,  precioPromo: 5990,  unidad: '/ kg', descuento: 25, tag: '🐷 Cerdo' },
  { id: 'promo-molida',   nombre: 'Carne Molida Especial',desc: 'Mezcla vacuno 80/20',        image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80', precioNormal: 5990,  precioPromo: 4490,  unidad: '/ kg', descuento: 25, tag: '🥩 Vacuno' },
]

const FLASH_OFFERS = [
  { id: 'flash-entraña',   nombre: 'Entraña',          desc: 'El corte favorito para la parrilla', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80', precioNormal: 15990, precioFlash: 10990, unidad: '/ kg', stock: 8,  descuento: 31 },
  { id: 'flash-longaniza', nombre: 'Longaniza Casera', desc: 'Artesanal, receta tradicional',       image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80', precioNormal: 3990,  precioFlash: 2490,  unidad: '/ un', stock: 20, descuento: 38 },
  { id: 'flash-plateada',  nombre: 'Plateada',         desc: 'Corte meloso para el horno',          image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80', precioNormal: 8990,  precioFlash: 6490,  unidad: '/ kg', stock: 5,  descuento: 28 },
]

function useCountdown() {
  const getRemaining = () => {
    const now = new Date()
    const end = new Date(); end.setHours(23, 59, 59, 0)
    const diff = Math.max(0, end.getTime() - now.getTime())
    return {
      h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
      m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
    }
  }
  const [time, setTime] = useState(getRemaining)
  useEffect(() => {
    const t = setInterval(() => setTime(getRemaining()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

function PromoCard({ promo }: { promo: typeof PROMOCIONES[0] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const handleAdd = () => {
    addItem({ id: promo.id, name: promo.nombre, price: promo.precioPromo, quantity: 1, unit: 'kg' })
    setAdded(true); setTimeout(() => setAdded(false), 2000)
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img src={promo.image} alt={promo.nombre} className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">-{promo.descuento}%</span>
        <span className="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">{promo.tag}</span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-sm mb-0.5">{promo.nombre}</h3>
        <p className="text-xs text-gray-400 mb-3">{promo.desc}</p>
        <div className="mt-auto">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-xl font-black text-gray-900">${promo.precioPromo.toLocaleString('es-CL')}</span>
            <span className="text-xs text-gray-400 line-through mb-0.5">${promo.precioNormal.toLocaleString('es-CL')}</span>
            <span className="text-xs text-gray-400 mb-0.5">{promo.unidad}</span>
          </div>
          <button onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${added ? 'bg-green-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
            {added ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function FlashCard({ offer }: { offer: typeof FLASH_OFFERS[0] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const handleAdd = () => {
    addItem({ id: offer.id, name: offer.nombre, price: offer.precioFlash, quantity: 1, unit: offer.unidad.includes('kg') ? 'kg' : 'un' })
    setAdded(true); setTimeout(() => setAdded(false), 2000)
  }
  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex flex-col border border-red-500/30 hover:border-red-500/60 transition-colors">
      <div className="relative h-44 overflow-hidden">
        <img src={offer.image} alt={offer.nombre} className="w-full h-full object-cover opacity-70"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">⚡ -{offer.descuento}%</span>
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-black text-lg leading-tight">{offer.nombre}</p>
          <p className="text-gray-300 text-xs">{offer.desc}</p>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-end gap-2 mb-1">
          <span className="text-2xl font-black text-red-400">${offer.precioFlash.toLocaleString('es-CL')}</span>
          <span className="text-sm text-gray-500 line-through mb-0.5">${offer.precioNormal.toLocaleString('es-CL')}</span>
          <span className="text-xs text-gray-500 mb-0.5">{offer.unidad}</span>
        </div>
        <p className="text-xs text-orange-400 mb-3">🔴 Solo quedan {offer.stock} disponibles</p>
        <button onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${added ? 'bg-green-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {added ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar al carrito</>}
        </button>
      </div>
    </div>
  )
}

export default function PromocionesPage() {
  const { h, m, s } = useCountdown()
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>

          {/* Flash */}
          <div className="bg-gray-950 rounded-3xl p-8 mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Timer className="w-4 h-4 animate-pulse" /> Solo por hoy
                </p>
                <h2 className="text-3xl font-black text-white">⚡ Oferta Flash</h2>
                <p className="text-gray-400 text-sm mt-1">Precios especiales que terminan a medianoche</p>
              </div>
              <div className="flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-2xl px-5 py-3">
                <Timer className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex items-center gap-1 font-mono">
                  {[{ v: h, l: 'H' }, { v: m, l: 'M' }, { v: s, l: 'S' }].map(({ v, l }, i) => (
                    <span key={l} className="flex items-center gap-1">
                      {i > 0 && <span className="text-red-400 font-black text-xl">:</span>}
                      <span className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white leading-none">{v}</span>
                        <span className="text-xs text-red-400 font-semibold">{l}</span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FLASH_OFFERS.map(offer => <FlashCard key={offer.id} offer={offer} />)}
            </div>
          </div>

          {/* Promociones */}
          <div className="mb-8">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Descuentos especiales
            </p>
            <h2 className="text-4xl font-black text-gray-900">Promociones</h2>
            <p className="text-gray-500 mt-2 text-sm">Precios rebajados en productos seleccionados · Válido mientras dure el stock</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROMOCIONES.map(promo => <PromoCard key={promo.id} promo={promo} />)}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
