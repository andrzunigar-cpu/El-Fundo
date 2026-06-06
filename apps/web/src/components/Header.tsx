'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'


const MAS_LINKS = [
  { href: '/calculadora-asado', label: '🔥 Calculadora de Asado' },
  { href: '/recetas',           label: '🥩 Guía de Cortes' },
  { href: '/nosotros',          label: '🏪 Quiénes Somos' },
  { href: '/proveedores',       label: '🚚 Proveedores' },
]


export function Header() {
  const { items } = useCart()
  const pathname  = usePathname()
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [masOpen,       setMasOpen]       = useState(false)

  const masRef = useRef<HTMLDivElement>(null)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Clase de nav link: mismo color base para todos, rojo activo
  const navLink = (href: string) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
    const isPromos = href === '/promociones'
    if (isActive && isPromos) return 'px-3 py-2 text-sm font-bold text-yellow-400 bg-red-600 rounded-lg transition whitespace-nowrap'
    if (isActive)             return 'px-3 py-2 text-sm font-bold text-white bg-red-600 rounded-lg transition whitespace-nowrap'
    return 'px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition whitespace-nowrap'
  }

  const mobileNavLink = (href: string) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
    const isPromos = href === '/promociones'
    if (isActive && isPromos) return 'block px-4 py-2.5 text-sm font-bold text-yellow-400 bg-red-600 rounded-lg transition'
    if (isActive)             return 'block px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg transition'
    return 'block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition'
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (masRef.current && !masRef.current.contains(e.target as Node)) setMasOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
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
            <Link href="/combos"       className={navLink('/combos')}>🔥 Combos</Link>
            <Link href="/promociones"  className={navLink('/promociones')}>🏷️ Promos</Link>
            <Link href="/#categorias"  className="px-2.5 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition whitespace-nowrap">Productos</Link>
            <Link href="/horarios"     className={navLink('/horarios')}>Horarios</Link>
            <Link href="/como-llegar"  className={navLink('/como-llegar')}>Cómo Llegar</Link>
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

            <Link href="/combos"      onClick={() => setMenuOpen(false)} className={mobileNavLink('/combos')}>🔥 Combos</Link>
            <Link href="/promociones" onClick={() => setMenuOpen(false)} className={mobileNavLink('/promociones')}>🏷️ Promos</Link>
            <Link href="/#categorias" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">Productos</Link>
            <div className="border-t border-white/10 my-1" />
            <Link href="/horarios"    onClick={() => setMenuOpen(false)} className={mobileNavLink('/horarios')}>🕐 Horarios</Link>
            <Link href="/como-llegar" onClick={() => setMenuOpen(false)} className={mobileNavLink('/como-llegar')}>📍 Cómo Llegar</Link>
            <div className="border-t border-white/10 my-1" />
            {MAS_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className={mobileNavLink(l.href)}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>

  </>
  )
}