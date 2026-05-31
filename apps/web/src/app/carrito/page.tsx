'use client'

import { useCart } from '@/lib/store'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight,
  Loader, Lock, Clock, Calendar, Zap, Truck, Store,
  Banknote, CreditCard, Building2, CheckCircle2, X, ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect, useRef } from 'react'

// ── Promociones ───────────────────────────────────────────────────────────
interface PromoProduct {
  id: string; name: string; base_price: number; online_price: number
  promotional_price?: number; image_urls: unknown; category_id?: string; unit?: string
}

const CAT_FALLBACK: Record<string, string> = {
  'cat-bebidas':        'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=70',
  'cat-vacuno':         'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=70',
  'cat-cerdo':          'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=70',
  'cat-pollo':          'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=70',
  'cat-embutidos':      'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&q=70',
  'cat-parrilla':       'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=70',
  'cat-combos':         'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=70',
  'cat-congelados':     'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=70',
  'cat-complementarios':'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&q=70',
  'default':            'https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=400&q=70',
}

// Productos hardcoded para "¿Se te olvidó algo?" — garantizan imágenes válidas
const BEBIDAS_CATALOGO: PromoProduct[] = [
  { id: 'beb-001', name: 'Coca-Cola 2,5 lt',       category_id: 'cat-bebidas', base_price: 12702, online_price: 12702, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80'] },
  { id: 'beb-002', name: 'Coca-Cola 1,5 lt',       category_id: 'cat-bebidas', base_price:  9614, online_price:  9614, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80'] },
  { id: 'beb-003', name: 'Coca-Cola Lata 350 ml',  category_id: 'cat-bebidas', base_price:  4416, online_price:  4416, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80'] },
  { id: 'beb-007', name: 'Fanta Naranja 2,5 lt',   category_id: 'cat-bebidas', base_price: 12702, online_price: 12702, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1569529465828-f66efbcef9c6?w=400&q=80'] },
  { id: 'beb-013', name: 'Monster Energy 473 ml',  category_id: 'cat-bebidas', base_price:  9295, online_price:  9295, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1630358854434-6c1ca31de37d?w=400&q=80'] },
  { id: 'beb-018', name: 'Benedictino 500 ml',     category_id: 'cat-bebidas', base_price:  6601, online_price:  6601, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80'] },
  { id: 'beb-022', name: 'Aquarius Uva 1,6 lt',    category_id: 'cat-bebidas', base_price:  5251, online_price:  5251, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'] },
  { id: 'beb-028', name: 'Del Valle Durazno 1,5 lt',category_id:'cat-bebidas', base_price:  7736, online_price:  7736, unit: 'un', image_urls: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'] },
]

function usePromos() {
  const [promos, setPromos] = useState<PromoProduct[]>([])
  useEffect(() => {
    fetch('/api/products?is_promo=true')
      .then(r => r.json())
      .catch(() => [])
      .then((promoData) => {
        const promoList: PromoProduct[] = Array.isArray(promoData) ? promoData : []
        // Mezclar promos reales con bebidas hardcoded, deduplicando por id y nombre
        const seenIds   = new Set<string>()
        const seenNames = new Set<string>()
        const combined  = [
          ...promoList,
          ...BEBIDAS_CATALOGO.filter(b => !promoList.some(p => p.id === b.id)),
        ].filter(p => {
          if (seenIds.has(p.id)) return false
          seenIds.add(p.id)
          const nameKey = p.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
          if (seenNames.has(nameKey)) return false
          seenNames.add(nameKey)
          return true
        })
        setPromos(combined.slice(0, 16))
      })
  }, [])
  return promos
}

function getImg(p: PromoProduct): string {
  try {
    const raw = p.image_urls
    let arr: unknown[] = []
    if (Array.isArray(raw)) {
      arr = raw
    } else if (typeof raw === 'string' && raw.trim()) {
      arr = JSON.parse(raw)
    }
    const url = arr[0]
    if (typeof url === 'string' && url.startsWith('http')) return url
  } catch {}
  return CAT_FALLBACK[p.category_id ?? ''] ?? CAT_FALLBACK['default']
}

// ── Modal "¿Se te olvidó algo?" ────────────────────────────────────────────
function ForgotModal({ onClose }: { onClose: () => void }) {
  const promos = usePromos()
  const { addItem, items } = useCart()
  if (promos.length === 0) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900">🥤 ¿Se te olvidó algo?</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto grid grid-cols-3 gap-3">
          {promos.map(p => {
            const price  = p.promotional_price || p.online_price || p.base_price
            const inCart = items.some(i => i.id === p.id)
            return (
              <div key={p.id} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 mb-1.5">
                  <img src={getImg(p)} alt={p.name} className="w-full h-full object-cover"
                    onError={e => {
                      const img = e.target as HTMLImageElement
                      if (!img.dataset.err) {
                        img.dataset.err = '1'
                        img.src = CAT_FALLBACK[p.category_id ?? ''] ?? CAT_FALLBACK['default']
                      }
                    }} />
                </div>
                <p className="text-[11px] text-gray-700 line-clamp-2 leading-tight mb-1">{p.name}</p>
                <p className="text-[11px] font-bold text-gray-900 mb-1.5">${price.toLocaleString('es-CL')}</p>
                <button
                  onClick={() => addItem({ id: p.id, name: p.name, price, quantity: p.unit === 'kg' ? 0.5 : 1, unit: p.unit === 'kg' ? 'kg' : 'un' })}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${
                    inCart ? 'bg-green-100 text-green-700' : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {inCart ? '✓ Listo' : '+ Agregar'}
                </button>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
            No gracias
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition">
            Ir al pago
          </button>
        </div>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 9; h < 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 19) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}
function fmtQty(qty: number, unit?: string) {
  if (unit === 'kg') return qty < 1 ? `${qty * 1000} g` : `${qty} kg`
  return `${qty} un`
}
function fmt(n: number) { return n.toLocaleString('es-CL') }

// ── tipos de pago ──────────────────────────────────────────────────────────
type PayMethod = 'webpay' | 'efectivo' | 'tarjeta_local' | 'amipass' | 'edenred' | 'pluxee' | 'machbank'

interface PayOption {
  id: PayMethod
  label: string
  sub: string
  icon: React.ReactNode
  soon?: boolean
  pickupOnly?: boolean
}

const PAY_ONLINE: PayOption[] = [
  { id: 'webpay', label: 'WebPay', sub: 'Débito, crédito y prepago', icon: <Lock className="w-5 h-5" /> },
]

const PAY_PRESENCIAL: PayOption[] = [
  { id: 'tarjeta_local', label: 'Tarjeta',  sub: 'Débito, crédito y cuenta RUT',      icon: <CreditCard className="w-5 h-5" /> },
  { id: 'efectivo',      label: 'Efectivo', sub: 'Pago al recibir o en local',         icon: <Banknote className="w-5 h-5" /> },
  { id: 'amipass',       label: 'Amipass',  sub: 'Tarjeta de beneficios al recibir',   icon: <span className="text-base">🎫</span> },
  { id: 'pluxee',        label: 'Pluxee',   sub: 'Tarjeta de beneficios al recibir',   icon: <span className="text-base">🎫</span> },
  { id: 'edenred',       label: 'Edenred',  sub: 'Tarjeta de beneficios al recibir',   icon: <span className="text-base">🎫</span> },
]

// ── componente principal ───────────────────────────────────────────────────
export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()

  const [name,        setName]        = useState('')
  const [phonePrefix, setPhonePrefix] = useState('+569')
  const [phone,       setPhone]       = useState('')
  const [address,     setAddress]     = useState('')
  const [notes,   setNotes]   = useState('')

  const [scheduleMode, setScheduleMode] = useState<'asap' | 'scheduled'>('asap')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')

  const [deliveryMode,  setDeliveryMode]  = useState<'delivery' | 'pickup'>('delivery')
  const [deliveryPrice, setDeliveryPrice] = useState(2990)
  const [storeAddress,  setStoreAddress]  = useState('Av. Parque Central 06441, Puente Alto')

  const [payMethod,   setPayMethod]   = useState<PayMethod>('webpay')
  const [showErrors,  setShowErrors]  = useState(false)

  const [ordering,      setOrdering]      = useState(false)
  const [ordered,       setOrdered]       = useState(false)
  const [orderId,       setOrderId]       = useState('')
  const [webpayLoading, setWebpayLoading] = useState(false)
  const [webpayError,   setWebpayError]   = useState('')
  const [showForgot,    setShowForgot]    = useState(false)
  const forgotShown = useRef(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (typeof d.delivery_price === 'number') setDeliveryPrice(d.delivery_price)
        if (d.store_address)                      setStoreAddress(d.store_address)
        if (d.delivery_active === false)           setDeliveryMode('pickup')
      })
      .catch(() => {})
  }, [])

  // Abrir modal "¿Se te olvidó algo?" al entrar al checkout (solo 1 vez)
  useEffect(() => {
    if (forgotShown.current || items.length === 0) return
    const hasBebida = items.some(i =>
      i.id.startsWith('beb-') || i.name.toLowerCase().includes('bebida') ||
      i.name.toLowerCase().includes('coca') || i.name.toLowerCase().includes('agua') ||
      i.name.toLowerCase().includes('jugo')
    )
    if (hasBebida) return
    const timer = setTimeout(() => {
      setShowForgot(true)
      forgotShown.current = true
    }, 800)
    return () => clearTimeout(timer)
  }, [items])

  const shippingCost = deliveryMode === 'delivery' ? deliveryPrice : 0
  const grandTotal   = total() + shippingCost

  const dateOptions = useMemo(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i)
      return {
        value: toDateStr(d),
        label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
      }
    })
  }, [])

  const timeOptions = useMemo(() => {
    const all = generateTimeSlots()
    if (!schedDate || schedDate !== toDateStr(new Date())) return all
    const minMins = new Date().getHours() * 60 + new Date().getMinutes() + 60
    return all.filter(s => { const [h, m] = s.split(':').map(Number); return h * 60 + m >= minMins })
  }, [schedDate])

  const scheduledFor = useMemo(() => {
    if (scheduleMode !== 'scheduled' || !schedDate || !schedTime) return null
    return `${schedDate}T${schedTime}:00`
  }, [scheduleMode, schedDate, schedTime])

  const scheduleValid  = scheduleMode === 'asap' || (!!schedDate && !!schedTime && timeOptions.length > 0)
  const addressValid   = deliveryMode === 'pickup' || !!address.trim()
  const canCheckout    = !!name && !!phone && scheduleValid && addressValid

  // ── pedido sin webpay ────────────────────────────────────────────────────
  const handleOrder = async () => {
    if (!canCheckout) return
    setOrdering(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:    name,
          customer_phone:   `${phonePrefix}${phone.replace(/^\+?56\d?/, '')}`,
          customer_address: address,
          notes,
          payment_method:   payMethod,
          items: items.map(i => ({ product_id: i.id, product_name: i.name, quantity: i.quantity, unit_price: i.price })),
          total_amount:  grandTotal,
          shipping_cost: shippingCost,
          delivery_type: deliveryMode,
          scheduled_for: scheduledFor,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setOrderId(data.id || '')
      setOrdered(true)
      clearCart()
    } catch (err: unknown) {
      alert(`Error al enviar el pedido: ${err instanceof Error ? err.message : 'Inténtalo de nuevo'}`)
    } finally {
      setOrdering(false)
    }
  }

  // ── webpay ───────────────────────────────────────────────────────────────
  const handleWebpay = async () => {
    setWebpayError('')
    setWebpayLoading(true)
    try {
      sessionStorage.setItem('webpay_order', JSON.stringify({
        customer_name: name, customer_phone: phone, customer_address: address,
        notes, items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, unit: i.unit })),
        scheduled_for: scheduledFor, delivery_type: deliveryMode, shipping_cost: shippingCost,
      }))
      const res  = await fetch('/api/webpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal, orderId: `${Date.now()}`, returnUrl: `${window.location.origin}/webpay/return` }),
      })
      const data = await res.json()
      if (!res.ok || !data.token) throw new Error(data.error || 'No se pudo iniciar el pago')
      const form  = document.createElement('form')
      form.method = 'POST'; form.action = data.url
      const inp   = document.createElement('input')
      inp.type    = 'hidden'; inp.name = 'token_ws'; inp.value = data.token
      form.appendChild(inp); document.body.appendChild(form); form.submit()
    } catch (err: unknown) {
      setWebpayError(err instanceof Error ? err.message : 'Error al iniciar WebPay')
      setWebpayLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!canCheckout) {
      setShowErrors(true)
      // Scroll al primer campo inválido
      const firstInvalid = !name ? 'field-name'
        : !phone   ? 'field-phone'
        : !addressValid ? 'field-address'
        : 'field-schedule'
      document.getElementById(firstInvalid)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById(firstInvalid)?.focus()
      return
    }
    payMethod === 'webpay' ? handleWebpay() : handleOrder()
  }

  // ── pantalla éxito ───────────────────────────────────────────────────────
  if (ordered) {
    const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : '--------'
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-lg w-full">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">¡Pedido recibido!</h1>
            <p className="text-gray-500 mb-6">Hola <strong>{name}</strong>, recibimos tu pedido correctamente.</p>

            {/* Número de pedido */}
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl px-6 py-5 mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Número de pedido</p>
              <p className="text-3xl font-black text-gray-900 tracking-widest font-mono">#{shortId}</p>
              {orderId && (
                <p className="text-xs text-gray-400 mt-1 font-mono break-all">{orderId}</p>
              )}
              <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-3 font-medium">
                📌 Guarda este número para consultar el estado de tu pedido
              </p>
            </div>

            {/* Info según medio de pago */}
            {payMethod === 'efectivo' && (
              <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 mb-4">
                💵 Pago en efectivo al {deliveryMode === 'pickup' ? 'retirar en local' : 'momento de la entrega'}.
              </p>
            )}

            <p className="text-gray-400 text-sm mb-6">Te contactaremos pronto para confirmar tu pedido.</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/pedido/${orderId}`}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition"
              >
                Ver estado del pedido
              </Link>
              <Link href="/productos" className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-red-700 transition">
                Seguir comprando <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ── carrito vacío ────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-6">Tu carrito está vacío</p>
            <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition">
              Ver productos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ── checkout layout ──────────────────────────────────────────────────────
  return (
    <>
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
      <Header />

      {/* ── Barra fija inferior (solo mobile) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <p className="text-xs text-gray-400">{deliveryMode === 'delivery' ? 'Con despacho' : 'Retiro en local'}</p>
            <p className="text-xl font-black text-gray-900">${fmt(grandTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-gray-500">{payMethod === 'webpay' ? '🔒 WebPay' : payMethod === 'efectivo' ? '💵 Efectivo' : payMethod === 'tarjeta_local' ? '💳 Tarjeta' : payMethod.charAt(0).toUpperCase() + payMethod.slice(1)}</p>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={webpayLoading || ordering}
          className={`w-full py-3.5 rounded-2xl font-black text-base transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 ${
            canCheckout ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {(webpayLoading || ordering) ? (
            <><Loader className="w-5 h-5 animate-spin" /> {payMethod === 'webpay' ? 'Redirigiendo...' : 'Enviando...'}</>
          ) : canCheckout ? (
            <>{payMethod === 'webpay' ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} Confirmar pedido</>
          ) : (
            <>Completa los datos para continuar</>
          )}
        </button>
      </div>

      <main className="min-h-screen bg-gray-100">
        {/* Padding bottom en mobile para que la barra fija no tape contenido */}
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-36 lg:pb-8">

          <Link href="/productos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition mb-5">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>

          <div className="grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-4 sm:gap-5 items-start">

            {/* ═══ COLUMNA IZQUIERDA ═══ */}
            <div className="space-y-3 sm:space-y-4">

              {/* Productos */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">
                    Tus productos{' '}
                    <span className="text-gray-400 font-normal text-sm">({items.length})</span>
                  </h2>
                  <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition">
                    Vaciar
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(item => (
                    <div key={item.id} className="px-4 sm:px-6 py-3.5 sm:py-4">
                      {/* Mobile: 2 filas / Desktop: 1 fila */}
                      <div className="flex items-start gap-3">
                        {/* Nombre + precio unit */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">${fmt(item.price)} / {item.unit || 'kg'}</p>
                        </div>
                        {/* Total + eliminar (derecha) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-gray-900 text-sm">
                            ${fmt(item.price * item.quantity)}
                          </span>
                          <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition p-0.5">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {/* Controles cantidad — fila propia */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          onClick={() => { const s = item.unit === 'kg' ? 0.25 : 1; const n = parseFloat((item.quantity - s).toFixed(2)); if (n >= s) updateQuantity(item.id, n) }}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition"
                        ><Minus className="w-3.5 h-3.5" /></button>
                        <span className="min-w-[60px] text-center text-sm font-semibold text-gray-900">
                          {fmtQty(item.quantity, item.unit)}
                        </span>
                        <button
                          onClick={() => { const s = item.unit === 'kg' ? 0.25 : 1; updateQuantity(item.id, parseFloat((item.quantity + s).toFixed(2))) }}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition"
                        ><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipo de entrega */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-3 sm:mb-4">¿Cómo lo recibes?</h2>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {[
                    { mode: 'delivery' as const, icon: <Truck className="w-5 h-5" />, label: 'Despacho', sub: deliveryPrice > 0 ? `+ $${fmt(deliveryPrice)}` : 'Gratis' },
                    { mode: 'pickup'   as const, icon: <Store className="w-5 h-5" />, label: 'Retiro en local', sub: 'Sin costo extra' },
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => setDeliveryMode(opt.mode)}
                      className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3.5 sm:py-4 rounded-xl border-2 text-left transition ${
                        deliveryMode === opt.mode
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`shrink-0 ${deliveryMode === opt.mode ? 'text-red-600' : 'text-gray-400'}`}>{opt.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">{opt.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {deliveryMode === 'pickup' && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 sm:px-4 py-3 rounded-xl">
                    📍 <span className="font-semibold text-gray-700">{storeAddress}</span>
                  </p>
                )}
              </div>

              {/* Datos de contacto */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-3 sm:mb-4">Datos de contacto</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nombre *</label>
                      <input
                        id="field-name"
                        type="text"
                        placeholder="Tu nombre"
                        value={name}
                        onChange={e => { setName(e.target.value); setShowErrors(false) }}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${showErrors && !name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Teléfono *</label>
                      <div id="field-phone" className={`flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500 ${showErrors && !phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                        <select
                          value={phonePrefix}
                          onChange={e => setPhonePrefix(e.target.value)}
                          className="px-2 py-3 text-sm font-semibold bg-gray-50 border-r border-gray-200 text-gray-700 focus:outline-none cursor-pointer"
                        >
                          <option value="+569">+569</option>
                          <option value="+562">+562</option>
                          <option value="+56">+56</option>
                        </select>
                        <input
                          type="tel"
                          placeholder="9 1234 5678"
                          value={phone}
                          onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setShowErrors(false) }}
                          className="flex-1 px-3 py-3 text-sm bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  {deliveryMode === 'delivery' && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Dirección de entrega *</label>
                      <input
                        id="field-address"
                        type="text"
                        placeholder="Calle, número, ciudad"
                        value={address}
                        onChange={e => { setAddress(e.target.value); setShowErrors(false) }}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${showErrors && !addressValid ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Notas adicionales</label>
                    <textarea
                      placeholder="Instrucciones especiales, cortes, etc."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cuándo */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" /> ¿Cuándo lo quieres?
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3">
                  {[
                    { mode: 'asap' as const,      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,   label: 'Lo antes posible', sub: '~45 min' },
                    { mode: 'scheduled' as const, icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Programar',        sub: 'Elegir día y hora' },
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => setScheduleMode(opt.mode)}
                      className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3.5 sm:py-4 rounded-xl border-2 text-left transition ${
                        scheduleMode === opt.mode
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className={`shrink-0 ${scheduleMode === opt.mode ? 'text-red-600' : 'text-gray-400'}`}>{opt.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold leading-tight">{opt.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {scheduleMode === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 animate-in fade-in">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Día</label>
                      <select
                        value={schedDate}
                        onChange={e => { setSchedDate(e.target.value); setSchedTime('') }}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      >
                        <option value="">Selecciona...</option>
                        {dateOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Hora</label>
                      <select
                        value={schedTime}
                        onChange={e => setSchedTime(e.target.value)}
                        disabled={!schedDate}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">{!schedDate ? 'Elige día primero' : 'Selecciona...'}</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t} hrs</option>)}
                      </select>
                    </div>
                    {schedDate && timeOptions.length === 0 && (
                      <p className="col-span-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-xl">
                        ⚠️ Sin horarios disponibles hoy. Elige otro día.
                      </p>
                    )}
                    {scheduledFor && (
                      <p className="col-span-2 text-xs text-green-700 bg-green-50 px-3 py-2.5 rounded-xl flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Entrega: <strong>{dateOptions.find(o => o.value === schedDate)?.label}</strong> a las <strong>{schedTime} hrs</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* ═══ COLUMNA DERECHA — sticky con scroll propio ═══ */}
            <div className="space-y-3 sm:space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-0.5">

              {/* Resumen */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-3 sm:mb-4">Resumen</h2>
                <div className="space-y-2 mb-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm gap-2">
                      <span className="text-gray-500 truncate flex-1">{item.name} × {fmtQty(item.quantity, item.unit)}</span>
                      <span className="text-gray-800 shrink-0">${fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-800">${fmt(total())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{deliveryMode === 'delivery' ? 'Despacho' : 'Retiro'}</span>
                    <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : 'text-gray-800'}>
                      {shippingCost > 0 ? `$${fmt(shippingCost)}` : 'Gratis'}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-black text-2xl text-gray-900">${fmt(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-3 sm:mb-4">Método de pago</h2>

                {/* ── Online ── */}
                <div className="mb-4">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block mb-2">
                    🌐 Online
                  </span>
                  <div className="space-y-1.5">
                    {PAY_ONLINE.map(opt => opt.soon ? (
                      <div key={opt.id} className="w-full flex items-center gap-2.5 px-3 sm:px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed">
                        <span className="shrink-0 text-gray-300">{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-400">{opt.label}</p>
                          <p className="text-xs text-gray-400 truncate">{opt.sub}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full shrink-0">Pronto</span>
                      </div>
                    ) : (
                      <button
                        key={opt.id}
                        onClick={() => setPayMethod(opt.id)}
                        className={`w-full flex items-center gap-2.5 px-3 sm:px-4 py-3 rounded-xl border-2 text-left transition ${
                          payMethod === opt.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`shrink-0 ${payMethod === opt.id ? 'text-red-600' : 'text-gray-400'}`}>{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${payMethod === opt.id ? 'text-red-700' : 'text-gray-800'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400 truncate">{opt.sub}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          payMethod === opt.id ? 'border-red-500 bg-red-500' : 'border-gray-300'
                        }`}>
                          {payMethod === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Presencial ── */}
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-1 rounded-full inline-block mb-2">
                    🏪 Presencial
                  </span>
                  <div className="space-y-1.5">
                    {PAY_PRESENCIAL.map(opt => {
                      const disabled = opt.pickupOnly && deliveryMode === 'delivery'
                      const selected = payMethod === opt.id
                      if (disabled) return (
                        <div key={opt.id} className="w-full flex items-center gap-2.5 px-3 sm:px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed">
                          <span className="shrink-0 text-gray-300">{opt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-400">{opt.label}</p>
                            <p className="text-xs text-gray-400 truncate">{opt.sub}</p>
                          </div>
                          <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full shrink-0">Solo local</span>
                        </div>
                      )
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPayMethod(opt.id)}
                          className={`w-full flex items-center gap-2.5 px-3 sm:px-4 py-3 rounded-xl border-2 text-left transition ${
                            selected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`shrink-0 ${selected ? 'text-red-600' : 'text-gray-400'}`}>{opt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${selected ? 'text-red-700' : 'text-gray-800'}`}>{opt.label}</p>
                            <p className="text-xs text-gray-400 truncate">{opt.sub}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                          }`}>
                            {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {webpayError && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{webpayError}</p>
                )}
              </div>

              {/* Botón confirmar — solo visible en desktop */}
              <div className="hidden lg:block space-y-2">
                {showErrors && !canCheckout && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 space-y-1">
                    <p className="font-bold">Completa los campos requeridos:</p>
                    {!name && <p>• Nombre</p>}
                    {!phone && <p>• Teléfono</p>}
                    {!addressValid && <p>• Dirección de entrega</p>}
                    {!scheduleValid && <p>• Día y hora de entrega</p>}
                  </div>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={webpayLoading || ordering}
                  className={`w-full py-4 rounded-2xl font-black text-base transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    canCheckout ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                >
                  {(webpayLoading || ordering) ? (
                    <><Loader className="w-5 h-5 animate-spin" /> {payMethod === 'webpay' ? 'Redirigiendo...' : 'Enviando...'}</>
                  ) : (
                    <>
                      {payMethod === 'webpay' ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span className="truncate">
                        {canCheckout ? `Confirmar — $${fmt(grandTotal)}` : 'Completa los datos para continuar'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Compra segura · El Fundo
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
