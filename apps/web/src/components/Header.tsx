'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useState } from 'react'

const CATEGORIES = [
  { id: 'vacuno', name: 'Vacuno', emoji: '🐄' },
  { id: 'cerdo', name: 'Cerdo', emoji: '🐷' },
  { id: 'pollo', name: 'Pollo', emoji: '🐔' },
  { id: 'embutidos', name: 'Embutidos', emoji: '🌭' },
  { id: 'parrilla', name: 'Parrilla', emoji: '🔥' },
  { id: 'congelados', name: 'Congelados', emoji: '❄️' },
  { id: 'bebidas', name: 'Bebidas', emoji: '🥤' },
  { id: 'quesos', name: 'Quesos', emoji: '🧀' },
]

export function Header() {
  const { items } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="Carnicería El Fundo"
              width={200}
              height={67}
              className="h-14 w-auto object-contain"
              style={{ mixBlendMode: 'multiply' }}
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {CATEGORIES.slice(0, 5).map(cat => (
              <Link 
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/carrito" className="relative p-2.5 hover:bg-gray-100 rounded-lg transition group">
              <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-red-600 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 hover:bg-gray-100 rounded-lg transition"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-2 border-t border-gray-100 pt-4">
            {CATEGORIES.map(cat => (
              <Link 
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}