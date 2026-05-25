'use client'

import { useCart } from '@/lib/store'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight,
  Loader, Lock, Clock, Calendar, Zap, Truck, Store,
  Banknote, CreditCard, Building2, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'

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
type PayMethod = 'webpay' | 'efectivo' | 'transferencia' | 'tarjeta_local' | 'amipass' | 'edenred' | 'pluxee' | 'machbank'

interface PayOption {
  id: PayMethod
  label: string
  sub: string
  icon: React.ReactNode
  soon?: boolean       // próximamente — visible pero no seleccionable
  pickupOnly?: boolean // solo retiro en local
}

const PAY_ONLINE: PayOption[] = [
  { id: 'webpay',        label: 'WebPay',          sub: 'Débito, crédito y prepago',         icon: <Lock className="w-5 h-5" /> },
  { id: 'transferencia', label: 'Transferencia',   sub: 'Te enviamos los datos por WhatsApp', icon: <Building2 className="w-5 h-5" /> },
  { id: 'amipass',       label: 'Amipass',         sub: 'Tarjeta de beneficios online',      icon: <span className="text-base">🎫</span>, soon: true },
  { id: 'pluxee',        label: 'Pluxee',          sub: 'Tarjeta de beneficios online',      icon: <span className="text-base">🎫</span>, soon: true },
  { id: 'edenred',       label: 'Edenred',         sub: 'Tarjeta de beneficios online',      icon: <span className="text-base">🎫</span>, soon: true },
  { id: 'machbank',      label: 'Mach / Bank',     sub: 'App de pagos móvil',                icon: <span className="text-base">📱</span>, soon: true },
]

const PAY_PRESENCIAL: PayOption[] = [
  { id: 'tarjeta_local', label: 'Tarjeta',  sub: 'Débito, crédito y cuenta RUT',          icon: <CreditCard className="w-5 h-5" /> },
  { id: 'efectivo',      label: 'Efectivo', sub: 'Pago al recibir o en local',             icon: <Banknote className="w-5 h-5" /> },
  { id: 'amipass',       label: 'Amipass',  sub: 'Tarjeta de beneficios al recibir',       icon: <span className="text-base">🎫</span> },
  { id: 'pluxee',        label: 'Pluxee',   sub: 'Tarjeta de beneficios al recibir',       icon: <span className="text-base">🎫</span> },
  { id: 'edenred',       label: 'Edenred',  sub: 'Tarjeta de beneficios al recibir',       icon: <span className="text-base">🎫</span> },
]

// ── componente principal ───────────────────────────────────────────────────
export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState('')
  const [notes,   setNotes]   = useState('')

  const [scheduleMode, setScheduleMode] = useState<'asap' | 'scheduled'>('asap')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')

  const [deliveryMode,  setDeliveryMode]  = useState<'delivery' | 'pickup'>('delivery')
  const [deliveryPrice, setDeliveryPrice] = useState(2990)
  const [minOrder,      setMinOrder]      = useState(0)
  const [storeAddress,  setStoreAddress]  = useState('Av. Parque Central 06441, Puente Alto')

  const [payMethod, setPayMethod] = useState<PayMethod>('webpay')

  const [ordering,      setOrdering]      = useState(false)
  const [ordered,       setOrdered]       = useState(false)
  const [orderId,       setOrderId]       = useState('')
  const [webpayLoading, setWebpayLoading] = useState(false)
  const [webpayError,   setWebpayError]   = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (typeof d.delivery_price === 'number') setDeliveryPrice(d.delivery_price)
        if (typeof d.min_order     === 'number')  setMinOrder(d.min_order)
        if (d.store_address)                      setStoreAddress(d.store_address)
        if (d.delivery_active === false)           setDeliveryMode('pickup')
      })
      .catch(() => {})
  }, [])

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
          customer_phone:   phone,
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

  const handleConfirm = () => payMethod === 'webpay' ? handleWebpay() : handleOrder()

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
            <h1 className="text-3xl font-black text-gray-900 mb-2">¡Pedido recibido!</h1>
            <p className="text-gray-500 mb-6">Hola <strong>{name}</strong>, recibimos tu pedido correctamente.</p>

            {/* Número de pedido */}
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl px-6 py-5 mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Número de pedido</p>
              <p className="text-3xl font-black text-gray-900 tracking-widest font-mono">#{shortId}</p>
              {orderId && (
                <p className="text-xs text-gray-400 mt-1 font-mono">{orderId}</p>
              )}
              <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-3 font-medium">
                📌 Guarda este número para consultar el estado de tu pedido
              </p>
            </div>

            {/* Info según medio de pago */}
            {payMethod === 'transferencia' && (
              <p className="text-sm text-blue-700 bg-blue-50 rounded-xl px-4 py-3 mb-4">
                📲 Te enviaremos los datos de transferencia por WhatsApp al <strong>{phone}</strong>.
              </p>
            )}
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
      <Header />
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">

          <Link href="/productos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>

          <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

            {/* ═══ COLUMNA IZQUIERDA ═══ */}
            <div className="space-y-4">

              {/* Productos */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">Tus productos <span className="text-gray-400 font-normal text-sm">({items.length})</span></h2>
                  <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition">Vaciar</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(item => (
                    <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">${fmt(item.price)} / {item.unit || 'kg'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { const s = item.unit === 'kg' ? 0.25 : 1; const n = parseFloat((item.quantity - s).toFixed(2)); if (n >= s) updateQuantity(item.id, n) }}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition"
                        ><Minus className="w-3 h-3" /></button>
                        <span className="min-w-[56px] text-center text-sm font-semibold text-gray-900">{fmtQty(item.quantity, item.unit)}</span>
                        <button
                          onClick={() => { const s = item.unit === 'kg' ? 0.25 : 1; updateQuantity(item.id, parseFloat((item.quantity + s).toFixed(2))) }}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition"
                        ><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-gray-900 text-sm min-w-[80px] text-right">
                        ${fmt(item.price * item.quantity)}
                      </span>
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipo de entrega */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">¿Cómo lo recibes?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { mode: 'delivery' as const, icon: <Truck className="w-5 h-5" />, label: 'Despacho a domicilio', sub: deliveryPrice > 0 ? `+ $${fmt(deliveryPrice)}` : 'Gratis' },
                    { mode: 'pickup'   as const, icon: <Store className="w-5 h-5" />, label: 'Retiro en local',       sub: 'Sin costo extra' },
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => setDeliveryMode(opt.mode)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition ${
                        deliveryMode === opt.mode
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={deliveryMode === opt.mode ? 'text-red-600' : 'text-gray-400'}>{opt.icon}</span>
                      <div>
                        <p className="text-sm font-bold leading-tight">{opt.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {deliveryMode === 'pickup' && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 px-4 py-3 rounded-xl">
                    📍 <span className="font-semibold text-gray-700">{storeAddress}</span>
                  </p>
                )}
              </div>

              {/* Datos de contacto */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Datos de contacto</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre *</label>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Teléfono *</label>
                      <input
                        type="tel"
                        placeholder="+56 9 0000 0000"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {deliveryMode === 'delivery' && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Dirección de entrega *</label>
                      <input
                        type="text"
                        placeholder="Calle, número, ciudad"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Notas adicionales</label>
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
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" /> ¿Cuándo lo quieres?
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { mode: 'asap' as const,      icon: <Zap className="w-5 h-5" />,   label: 'Lo antes posible', sub: '~45 min' },
                    { mode: 'scheduled' as const, icon: <Clock className="w-5 h-5" />, label: 'Programar',        sub: 'Elegir día y hora' },
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => setScheduleMode(opt.mode)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition ${
                        scheduleMode === opt.mode
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className={scheduleMode === opt.mode ? 'text-red-600' : 'text-gray-400'}>{opt.icon}</span>
                      <div>
                        <p className="text-sm font-bold leading-tight">{opt.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {scheduleMode === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Día</label>
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
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Hora</label>
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

            {/* ═══ COLUMNA DERECHA — sticky ═══ */}
            <div className="space-y-4 lg:sticky lg:top-6">

              {/* Resumen */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Resumen</h2>
                <div className="space-y-2 mb-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-500 truncate mr-2 max-w-[160px]">{item.name} × {fmtQty(item.quantity, item.unit)}</span>
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
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Método de pago</h2>

                {/* ── Online ── */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">🌐 Online</span>
                  </div>
                  <div className="space-y-2">
                    {PAY_ONLINE.map(opt => opt.soon ? (
                      <div key={opt.id} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed">
                        <span className="shrink-0 text-gray-300">{opt.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-400">{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.sub}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full shrink-0">Pronto</span>
                      </div>
                    ) : (
                      <button
                        key={opt.id}
                        onClick={() => setPayMethod(opt.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition ${
                          payMethod === opt.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`shrink-0 ${payMethod === opt.id ? 'text-red-600' : 'text-gray-400'}`}>{opt.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${payMethod === opt.id ? 'text-red-700' : 'text-gray-800'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.sub}</p>
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-1 rounded-full">🏪 Presencial</span>
                  </div>
                  <div className="space-y-2">
                    {PAY_PRESENCIAL.map(opt => {
                      const disabled = opt.pickupOnly && deliveryMode === 'delivery'
                      const selected = payMethod === opt.id
                      if (disabled) return (
                        <div key={opt.id} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed">
                          <span className="shrink-0 text-gray-300">{opt.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-400">{opt.label}</p>
                            <p className="text-xs text-gray-400">{opt.sub}</p>
                          </div>
                          <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">Solo en local</span>
                        </div>
                      )
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPayMethod(opt.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition ${
                            selected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`shrink-0 ${selected ? 'text-red-600' : 'text-gray-400'}`}>{opt.icon}</span>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${selected ? 'text-red-700' : 'text-gray-800'}`}>{opt.label}</p>
                            <p className="text-xs text-gray-400">{opt.sub}</p>
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

              {/* Botón confirmar */}
              <button
                onClick={handleConfirm}
                disabled={!canCheckout || webpayLoading || ordering}
                className="w-full py-4 rounded-2xl font-black text-base transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                {(webpayLoading || ordering) ? (
                  <><Loader className="w-5 h-5 animate-spin" /> {payMethod === 'webpay' ? 'Redirigiendo...' : 'Enviando...'}</>
                ) : (
                  <>
                    {payMethod === 'webpay' ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirmar pedido — ${fmt(grandTotal)}
                  </>
                )}
              </button>

              {!canCheckout && (
                <p className="text-xs text-center text-gray-400">
                  {!name || !phone ? 'Completa nombre y teléfono' :
                   !addressValid   ? 'Ingresa dirección de entrega' :
                   !scheduleValid  ? 'Selecciona día y hora' : ''}
                </p>
              )}

              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Compra segura · El Fundo Carnicería
              </p>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
