'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Zap, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/store'

interface PromoProduct {
  id: string
  name: string
  base_price: number
  online_price?: number
  promotional_price?: number
  image_urls?: unknown
  category_id?: string
  unit?: string
}

interface SettingsResponse {
  flash_sale_active?: boolean
  flash_sale_ends_at?: string
  [k: string]: unknown
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

function chunkRemaining(ms: number) {
  const safe = Math.max(0, ms)
  const total = Math.floor(safe / 1000)
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function TimerBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center min-w-[34px] sm:min-w-[44px]">
      <p className="text-white font-mono font-black text-xl sm:text-2xl leading-none tabular-nums">{value}</p>
      <p className="text-white/70 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

export function FlashSale() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<PromoProduct[]>([])
  const [endsAt, setEndsAt] = useState<Date | null>(null)
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/settings').then(r => r.json()).catch(() => ({} as SettingsResponse)),
      fetch('/api/products?is_promo=true').then(r => r.json()).catch(() => [] as PromoProduct[]),
    ]).then(([settings, prods]: [SettingsResponse, PromoProduct[] | { error: string }]) => {
      if (cancelled) return
      if (settings.flash_sale_active === false) setActive(false)

      const customEnd = settings.flash_sale_ends_at
        ? new Date(settings.flash_sale_ends_at)
        : null
      if (customEnd && !isNaN(customEnd.getTime())) {
        setEndsAt(customEnd)
      } else {
        // Default: medianoche del día actual (Santiago de Chile)
        const end = new Date()
        end.setHours(23, 59, 59, 999)
        setEndsAt(end)
      }

      const list = Array.isArray(prods) ? prods : []
      setProducts(list.slice(0, 8))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // Tick cada segundo solo si hay datos a mostrar
  useEffect(() => {
    if (!active || !endsAt || products.length === 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active, endsAt, products.length])

  if (loading) return null
  if (!active) return null
  if (products.length === 0) return null
  if (!endsAt) return null

  const remaining = endsAt.getTime() - now
  if (remaining <= 0) return null

  const t = chunkRemaining(remaining)
  const showDays = t.d > 0

  return (
    <section className="relative max-w-7xl mx-auto px-4 pt-6 sm:pt-8">
      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-orange-500 shadow-2xl ring-1 ring-red-900/10">

        {/* ── Banner header con timer ─────────────────────────────────────── */}
        <div className="relative px-5 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Glow decorativo */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
              <p className="text-yellow-300 text-[11px] sm:text-xs font-black uppercase tracking-[0.18em]">
                Tiempo limitado
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-none">
              OFERTAS <span className="text-yellow-300">FLASH</span>
            </h2>
            <p className="text-red-100 text-xs sm:text-sm mt-1.5">
              ¡Aprovecha antes que se acaben!
            </p>
          </div>

          <div className="relative flex items-center gap-1 sm:gap-1.5 bg-black/35 backdrop-blur px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-white/15 shadow-inner">
            {showDays && (
              <>
                <TimerBlock value={pad(t.d)} label="días" />
                <span className="text-white/40 font-black -mt-3">:</span>
              </>
            )}
            <TimerBlock value={pad(t.h)} label="hrs" />
            <span className="text-white/40 font-black -mt-3">:</span>
            <TimerBlock value={pad(t.m)} label="min" />
            <span className="text-white/40 font-black -mt-3">:</span>
            <TimerBlock value={pad(t.s)} label="seg" />
          </div>
        </div>

        {/* ── Grid de productos ───────────────────────────────────────────── */}
        <div className="bg-white px-3 sm:px-5 pt-5 pb-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map(p => {
            const original = p.online_price ?? p.base_price ?? 0
            const final    = p.promotional_price ?? original
            const pct      = original > final && original > 0
              ? Math.round((1 - final / original) * 100)
              : 0
            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border-2 border-red-100 overflow-hidden hover:border-red-400 hover:shadow-xl transition flex flex-col"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <img
                    src={getImg(p)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => {
                      const img = e.target as HTMLImageElement
                      if (!img.dataset.err) {
                        img.dataset.err = '1'
                        img.src = FALLBACK_IMG
                      }
                    }}
                  />
                  {pct > 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-red-700 text-xs font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> -{pct}%
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Flash
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                    {p.name}
                  </p>
                  <div className="mt-auto">
                    {pct > 0 && (
                      <p className="text-xs text-gray-400 line-through leading-none">
                        ${original.toLocaleString('es-CL')}
                      </p>
                    )}
                    <p className="text-xl sm:text-2xl font-black text-red-600 leading-tight">
                      ${final.toLocaleString('es-CL')}
                      <span className="text-xs font-semibold text-gray-400 ml-1">
                        / {p.unit === 'kg' ? 'kg' : 'un'}
                      </span>
                    </p>
                    <button
                      onClick={() =>
                        addItem({
                          id: p.id,
                          name: p.name,
                          price: final,
                          quantity: p.unit === 'kg' ? 0.5 : 1,
                          unit: p.unit === 'kg' ? 'kg' : 'un',
                        })
                      }
                      className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <ShoppingCart className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Link a la página completa de promociones ────────────────────── */}
        <div className="bg-white px-5 pb-5 text-center">
          <Link
            href="/promociones"
            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold text-sm group/link"
          >
            Ver todas las ofertas
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </section>
  )
}
