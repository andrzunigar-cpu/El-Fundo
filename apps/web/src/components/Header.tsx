'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useState, useRef, useEffect } from 'react'

const MAS_LINKS = [
  { href: '/calculadora-asado', label: '🔥 Calculadora de Asado' },
  { href: '/nosotros',          label: '🏪 Quiénes Somos' },
  { href: '/como-llegar',       label: '📍 Cómo Llegar' },
  { href: '/horarios',          label: '🕐 Horarios' },
  { href: '/proveedores',       label: '🚚 Proveedores' },
]


export function Header() {
  const { items } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [masOpen,  setMasOpen]  = useState(false)
  const masRef = useRef<HTMLDivElement>(null)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (masRef.current && !masRef.current.contains(e.target as Node)) setMasOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
            <Link href="/combos" className="px-2.5 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              🔥 Combos
            </Link>
            <Link href="/promociones" className="px-2.5 py-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              🏷️ Promos
            </Link>
            <Link href="/productos" className="px-2.5 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              Productos
            </Link>
            <Link href="/horarios" className="px-2.5 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              Horarios
            </Link>
            <span className="w-px h-4 bg-white/20 mx-1" />
            {/* Dropdown Más */}
            <div ref={masRef} className="relative">
              <button
                onClick={() => setMasOpen(o => !o)}
                className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition whitespace-nowrap"
              >
                Más <ChevronDown className={`w-3 h-3 transition-transform ${masOpen ? 'rotate-180' : ''}`} />
              </button>
              {masOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                  {MAS_LINKS.map(l => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMasOpen(false)}
                      className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
            <Link href="/combos" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition">
              🔥 Combos
            </Link>
            <Link href="/promociones" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-bold text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition">
              🏷️ Promociones
            </Link>
            <Link href="/productos" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
              Productos
            </Link>
            <div className="border-t border-white/10 my-1" />
            <Link href="/horarios" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded-lg transition">
              🕐 Horarios
            </Link>
            <div className="border-t border-white/10 my-1" />
            {MAS_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}