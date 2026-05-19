'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../stores/cart-store'

export function Navbar() {
  const itemCount = useCartStore(s => s.itemCount())

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl text-red-700">El Fundo</Link>

        <div className="flex items-center gap-6">
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900">Productos</Link>
          <Link href="/cart" className="relative p-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
