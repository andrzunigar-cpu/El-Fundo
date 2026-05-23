'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useState } from 'react'

const CATEGORIES = [
  { id: 'vacuno', name: 'Vacuno' },
  { id: 'cerdo', name: 'Cerdo' },
  { id: 'pollo', name: 'Pollo' },
  { id: 'embutidos', name: 'Embutidos' },
  { id: 'parrilla', name: 'Parrilla' },
  { id: 'congelados', name: 'Congelados' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'quesos', name: 'Quesos' },
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
            {CATEGORIES.slice(0, 5).map(cat => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                {cat.name}
              </Link>
            ))}
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
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}