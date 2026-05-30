'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, Flame, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/store'

const COMBOS = [
  {
    id: 'combo-gym',
    nombre: 'Pack Gym para Dos',
    badge: '💪 Fitness',
    badgeColor: 'bg-blue-600',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80',
    items: [
      { emoji: '🐔', producto: 'Pechuga de Pollo', cantidad: '10 kg' },
      { emoji: '🥩', producto: 'Posta Rosada',      cantidad: '4 kg'  },
      { emoji: '🥚', producto: 'Huevos',            cantidad: '12 un' },
    ],
    precioNum: 89990,
    precio: '$89.990',
    ahorro: 'Ahorras $12.000',
    personas: 'Para 2 personas · 2 semanas',
  },
  {
    id: 'combo-asado-familiar',
    nombre: 'Pack Asado Familiar',
    badge: '🔥 Más vendido',
    badgeColor: 'bg-red-600',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    items: [
      { emoji: '🥩', producto: 'Asado de Tira',     cantidad: '2 kg' },
      { emoji: '🌭', producto: 'Longaniza Casera',   cantidad: '6 un' },
      { emoji: '🌭', producto: 'Chorizo Parrillero', cantidad: '6 un' },
      { emoji: '🫀', producto: 'Prieta',             cantidad: '4 un' },
    ],
    precioNum: 34990,
    precio: '$34.990',
    ahorro: 'Ahorras $6.000',
    personas: 'Para 6–8 personas',
  },
  {
    id: 'combo-premium',
    nombre: 'Pack Parrillero Premium',
    badge: '⭐ Premium',
    badgeColor: 'bg-yellow-600',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80',
    items: [
      { emoji: '🥩', producto: 'Lomo Vetado',        cantidad: '1 kg'   },
      { emoji: '🥩', producto: 'Entraña',            cantidad: '1 kg'   },
      { emoji: '🐷', producto: 'Costillar de Cerdo', cantidad: '1.5 kg' },
      { emoji: '🌭', producto: 'Chorizo Parrillero', cantidad: '6 un'   },
    ],
    precioNum: 54990,
    precio: '$54.990',
    ahorro: 'Ahorras $9.000',
    personas: 'Para 4–5 personas',
  },
  {
    id: 'combo-semanal',
    nombre: 'Pack Familiar Semanal',
    badge: '🏠 Hogar',
    badgeColor: 'bg-green-600',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    items: [
      { emoji: '🥩', producto: 'Carne Molida',     cantidad: '2 kg'   },
      { emoji: '🥩', producto: 'Posta Negra',       cantidad: '1.5 kg' },
      { emoji: '🐔', producto: 'Pollo Entero',      cantidad: '2 un'   },
      { emoji: '🌭', producto: 'Longaniza Casera',  cantidad: '6 un'   },
    ],
    precioNum: 29990,
    precio: '$29.990',
    ahorro: 'Ahorras $7.000',
    personas: 'Para 4 personas · 1 semana',
  },
  {
    id: 'combo-cazuela',
    nombre: 'Pack Cazuela Completa',
    badge: '🍲 Casero',
    badgeColor: 'bg-amber-600',
    image: 'https://images.unsplash.com/photo-1615937691194-97dbd3f3dc29?w=600&q=80',
    items: [
      { emoji: '🦴', producto: 'Osobuco',          cantidad: '1.5 kg' },
      { emoji: '🥩', producto: 'Posta Negra',       cantidad: '500 g'  },
      { emoji: '🐔', producto: 'Pechuga de Pollo', cantidad: '500 g'  },
    ],
    precioNum: 19990,
    precio: '$19.990',
    ahorro: 'Ahorras $3.500',
    personas: 'Para 4–6 personas',
  },
  {
    id: 'combo-cerdo-bbq',
    nombre: 'Pack Cerdo BBQ',
    badge: '🐷 Cerdo',
    badgeColor: 'bg-orange-600',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80',
    items: [
      { emoji: '🐷', producto: 'Costillar de Cerdo', cantidad: '2 kg' },
      { emoji: '🥩', producto: 'Pulpa de Cerdo',     cantidad: '1 kg' },
      { emoji: '🌭', producto: 'Longaniza Casera',   cantidad: '6 un' },
      { emoji: '🌭', producto: 'Chorizo Parrillero', cantidad: '4 un' },
    ],
    precioNum: 32990,
    precio: '$32.990',
    ahorro: 'Ahorras $5.500',
    personas: 'Para 5–6 personas',
  },
]

function ComboCard({ combo }: { combo: typeof COMBOS[0] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const handleAdd = () => {
    addItem({ id: combo.id, name: combo.nombre, price: combo.precioNum, quantity: 1, unit: 'un', image: combo.image })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      <div className="relative h-44 overflow-hidden">
        <img src={combo.image} alt={combo.nombre} className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className={`absolute top-3 left-3 ${combo.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
          {combo.badge}
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-black text-lg leading-tight drop-shadow">{combo.nombre}</h3>
          <p className="text-white/80 text-xs mt-0.5">{combo.personas}</p>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <ul className="space-y-2 mb-5 flex-1">
          {combo.items.map((item, j) => (
            <li key={j} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{item.producto}</span>
              </div>
              <span className="text-sm font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg shrink-0">{item.cantidad}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">Precio del pack</p>
              <p className="text-2xl font-black text-gray-900">{combo.precio}</p>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">{combo.ahorro}</span>
          </div>
          <button onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition ${added ? 'bg-green-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
            {added ? <><Check className="w-4 h-4" /> ¡Agregado!</> : <><ShoppingCart className="w-4 h-4" /> Agregar al carrito</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CombosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="mb-10">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Packs armados
            </p>
            <h1 className="text-4xl font-black text-gray-900">Combos</h1>
            <p className="text-gray-500 mt-2">Todo listo para cocinar · Los mejores cortes juntos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COMBOS.map(combo => <ComboCard key={combo.id} combo={combo} />)}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            * Precios de referencia. Contáctanos para confirmar disponibilidad.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
