'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, ChevronDown, Search, ClipboardList, Loader, CheckCircle2, Package, Clock, AlertCircle } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ── Modal seguimiento de pedido ───────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Recibido',   color: 'text-yellow-600' },
  confirmed: { label: 'Confirmado', color: 'text-blue-600'   },
  preparing: { label: 'Preparando', color: 'text-purple-600' },
  ready:     { label: 'Listo ✓',   color: 'text-green-600'  },
  delivered: { label: 'Entregado',  color: 'text-gray-600'   },
  cancelled: { label: 'Cancelado',  color: 'text-red-600'    },
}
const STATUS_ORDER = ['pending','confirmed','preparing','ready','delivered']

function OrderTrackModal({ onClose }: { onClose: () => void }) {
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [order,   setOrder]   = useState<any>(null)
  const [error,   setError]   = useState('')
  const router = useRouter()

  const search = async () => {
    const q = code.trim().replace('#','')
    if (!q) return
    setLoading(true); setError(''); setOrder(null)
    try {
      const r = await fetch(`/api/orders/${q}`)
      if (!r.ok) { setError('Pedido no encontrado. Verifica el número.'); setLoading(false); return }
      setOrder(await r.json())
    } catch { setError('Error al buscar. Intenta de nuevo.') }
    setLoading(false)
  }

  const currentIdx = order ? STATUS_ORDER.indexOf(order.status) : -1
  const statusInfo = order ? (STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-gray-600' }) : null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-600" />
            <h2 className="font-black text-gray-900 text-base">Estado de mi pedido</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Input de búsqueda */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              Ingresa tu número de pedido
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">#</span>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="ej: 2CAF79E3"
                  maxLength={36}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
                />
              </div>
              <button
                onClick={search}
                disabled={loading || !code.trim()}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center gap-1.5"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              El número lo recibiste al confirmar tu compra o en el comprobante de pago.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Resultado */}
          {order && (
            <div className="space-y-3">
              {/* Datos del pedido */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Pedido</span>
                  <span className="font-mono font-black text-gray-900 text-sm">#{order.id.slice(0,8).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Cliente</span>
                  <span className="text-sm font-semibold text-gray-800">{order.customer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estado</span>
                  <span className={`text-sm font-black ${statusInfo?.color}`}>{statusInfo?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-sm font-black text-gray-900">${(order.total_amount || 0).toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Barra de progreso */}
              {order.status !== 'cancelled' && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    {STATUS_ORDER.map((s, i) => (
                      <div key={s} className="flex flex-col items-center gap-1 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          i <= currentIdx ? 'bg-red-600 border-red-600' : 'bg-white border-gray-200'
                        }`}>
                          {i <= currentIdx
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : <div className="w-2 h-2 rounded-full bg-gray-200" />
                          }
                        </div>
                        <span className={`text-[9px] font-semibold text-center leading-tight ${i <= currentIdx ? 'text-red-600' : 'text-gray-400'}`}>
                          {STATUS_LABELS[s]?.label.replace(' ✓','')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ver detalle completo */}
              <button
                onClick={() => { onClose(); router.push(`/pedido/${order.id}`) }}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" /> Ver detalle completo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MAS_LINKS = [
  { href: '/calculadora-asado', label: '🔥 Calculadora de Asado' },
  { href: '/recetas',           label: '🥩 Guía de Cortes' },
  { href: '/nosotros',          label: '🏪 Quiénes Somos' },
  { href: '/proveedores',       label: '🚚 Proveedores' },
]


export function Header() {
  const { items } = useCart()
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [masOpen,       setMasOpen]       = useState(false)
  const [trackingOpen,  setTrackingOpen]  = useState(false)
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
            <Link href="/combos" className="px-2.5 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              🔥 Combos
            </Link>
            <Link href="/promociones" className="px-2.5 py-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              🏷️ Promos
            </Link>
            <Link href="/#categorias" className="px-2.5 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              Productos
            </Link>
            <Link href="/horarios" className="px-2.5 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              Horarios
            </Link>
            <Link href="/como-llegar" className="px-2.5 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition whitespace-nowrap">
              Cómo Llegar
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
            {/* Botón seguimiento pedido — desktop */}
            <button
              onClick={() => setTrackingOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded-lg text-xs font-medium transition whitespace-nowrap"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Mi pedido
            </button>

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
            {/* Botón seguimiento — mobile */}
            <button
              onClick={() => { setMenuOpen(false); setTrackingOpen(true) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition mb-1"
            >
              <ClipboardList className="w-4 h-4" />
              Ver estado de mi pedido
            </button>

            <Link href="/combos" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition">
              🔥 Combos
            </Link>
            <Link href="/promociones" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-bold text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition">
              🏷️ Promos
            </Link>
            <Link href="/#categorias" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
              Productos
            </Link>
            <div className="border-t border-white/10 my-1" />
            <Link href="/horarios" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded-lg transition">
              🕐 Horarios
            </Link>
            <Link href="/como-llegar" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
              📍 Cómo Llegar
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

    {/* Modal seguimiento de pedido */}
    {trackingOpen && <OrderTrackModal onClose={() => setTrackingOpen(false)} />}
  </>
  )
}