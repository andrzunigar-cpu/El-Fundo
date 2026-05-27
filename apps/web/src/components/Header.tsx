'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useState } from 'react'

const CATEGORIES = [
  { id: 'vacuno',     name: 'Vacuno' },
  { id: 'cerdo',      name: 'Cerdo' },
  { id: 'pollo',      name: 'Pollo' },
  { id: 'embutidos',  name: 'Embutidos' },
  { id: 'parrilla',   name: 'Parrilla' },
  { id: 'congelados', name: 'Congelados' },
  { id: 'bebidas',    name: 'Bebidas' },
  { id: 'quesos',     name: 'Quesos' },
]

export function Header() {
  const { items } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-gray-950 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="Carnicería El Fundo"
              width={200}
              height={67}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            <Link href="/productos?cat=cat-combos" className="px-2.5 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              🔥 Combos
            </Link>
            <Link href="/productos?cat=promociones" className="px-2.5 py-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              🏷️ Promos
            </Link>
            <span className="w-px h-4 bg-white/20 mx-1" />
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/productos?cat=cat-${cat.id}`}
                className="px-2.5 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
            <span className="w-px h-4 bg-white/20 mx-1" />
            <Link href="/recetas" className="px-2.5 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              Recetas
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/carrito" className="relative p-2.5 hover:bg-white/10 rounded-lg transition group">
              <ShoppingCart className="w-5 h-5 text-gray-300 group-hover:text-white transition" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 hover:bg-white/10 rounded-lg transition"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-white/10 pt-3">
            <Link href="/productos?cat=cat-combos" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition">
              🔥 Combos
            </Link>
            <Link href="/productos?cat=promociones" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-bold text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition">
              🏷️ Promociones
            </Link>
            <div className="border-t border-white/10 my-1" />
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/productos?cat=cat-${cat.id}`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                {cat.name}
              </Link>
            ))}
            <div className="border-t border-white/10 my-1" />
            <Link href="/recetas" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded-lg transition">
              🍳 Recetas
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}