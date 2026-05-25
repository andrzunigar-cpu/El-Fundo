'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ArrowRight, Truck, Shield, Zap, Clock, MapPin, Building2, Send, ChefHat, ShoppingCart, Check, Tag, Flame, Timer } from "lucide-react"
import AsadoCalculator from "@/components/AsadoCalculator"
import WelcomePopup from "@/components/WelcomePopup"
import { useCart } from "@/lib/store"

const CATEGORIES = [
  { id: "vacuno",    name: "Vacuno",    desc: "Cortes premium de res",    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80" },
  { id: "cerdo",     name: "Cerdo",     desc: "Carnes selectas",          image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80" },
  { id: "pollo",     name: "Aves",      desc: "Pollo fresco y pavo",      image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80" },
  { id: "embutidos", name: "Embutidos", desc: "Longanizas y chorizos",    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80" },
  { id: "parrilla",  name: "Parrilla",  desc: "Para tu asado perfecto",   image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80" },
  { id: "congelados",name: "Congelados",desc: "Listos para cocinar",      image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80" },
  { id: "bebidas",   name: "Bebidas",   desc: "Para acompañar",           image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80" },
  { id: "quesos",    name: "Quesos",    desc: "Selección artesanal",      image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80" },
]

const COMBOS = [
  {
    id: "combo-gym",
    nombre: "Pack Gym para Dos",
    badge: "💪 Fitness",
    badgeColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80",
    items: [
      { emoji: "🐔", producto: "Pechuga de Pollo", cantidad: "10 kg" },
      { emoji: "🥩", producto: "Posta Rosada",      cantidad: "4 kg"  },
      { emoji: "🥚", producto: "Huevos",            cantidad: "12 un" },
    ],
    precioNum: 89990,
    precio: "$89.990",
    ahorro: "Ahorras $12.000",
    personas: "Para 2 personas · 2 semanas",
  },
  {
    id: "combo-asado-familiar",
    nombre: "Pack Asado Familiar",
    badge: "🔥 Más vendido",
    badgeColor: "bg-red-600",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
    items: [
      { emoji: "🥩", producto: "Asado de Tira",      cantidad: "2 kg"  },
      { emoji: "🌭", producto: "Longaniza Casera",    cantidad: "6 un"  },
      { emoji: "🌭", producto: "Chorizo Parrillero",  cantidad: "6 un"  },
      { emoji: "🫀", producto: "Prieta",              cantidad: "4 un"  },
    ],
    precioNum: 34990,
    precio: "$34.990",
    ahorro: "Ahorras $6.000",
    personas: "Para 6–8 personas",
  },
  {
    id: "combo-premium",
    nombre: "Pack Parrillero Premium",
    badge: "⭐ Premium",
    badgeColor: "bg-yellow-600",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80",
    items: [
      { emoji: "🥩", producto: "Lomo Vetado",         cantidad: "1 kg"  },
      { emoji: "🥩", producto: "Entraña",             cantidad: "1 kg"  },
      { emoji: "🐷", producto: "Costillar de Cerdo",  cantidad: "1.5 kg"},
      { emoji: "🌭", producto: "Chorizo Parrillero",  cantidad: "6 un"  },
    ],
    precioNum: 54990,
    precio: "$54.990",
    ahorro: "Ahorras $9.000",
    personas: "Para 4–5 personas",
  },
  {
    id: "combo-semanal",
    nombre: "Pack Familiar Semanal",
    badge: "🏠 Hogar",
    badgeColor: "bg-green-600",
    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80",
    items: [
      { emoji: "🥩", producto: "Carne Molida",        cantidad: "2 kg"  },
      { emoji: "🥩", producto: "Posta Negra",         cantidad: "1.5 kg"},
      { emoji: "🐔", producto: "Pollo Entero",        cantidad: "2 un"  },
      { emoji: "🌭", producto: "Longaniza Casera",    cantidad: "6 un"  },
    ],
    precioNum: 29990,
    precio: "$29.990",
    ahorro: "Ahorras $7.000",
    personas: "Para 4 personas · 1 semana",
  },
  {
    id: "combo-cazuela",
    nombre: "Pack Cazuela Completa",
    badge: "🍲 Casero",
    badgeColor: "bg-amber-600",
    image: "https://images.unsplash.com/photo-1615937691194-97dbd3f3dc29?w=600&q=80",
    items: [
      { emoji: "🦴", producto: "Osobuco",             cantidad: "1.5 kg"},
      { emoji: "🥩", producto: "Posta Negra",         cantidad: "500 g" },
      { emoji: "🐔", producto: "Pechuga de Pollo",    cantidad: "500 g" },
    ],
    precioNum: 19990,
    precio: "$19.990",
    ahorro: "Ahorras $3.500",
    personas: "Para 4–6 personas",
  },
  {
    id: "combo-cerdo-bbq",
    nombre: "Pack Cerdo BBQ",
    badge: "🐷 Cerdo",
    badgeColor: "bg-orange-600",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80",
    items: [
      { emoji: "🐷", producto: "Costillar de Cerdo",  cantidad: "2 kg"  },
      { emoji: "🥩", producto: "Pulpa de Cerdo",      cantidad: "1 kg"  },
      { emoji: "🌭", producto: "Longaniza Casera",    cantidad: "6 un"  },
      { emoji: "🌭", producto: "Chorizo Parrillero",  cantidad: "4 un"  },
    ],
    precioNum: 32990,
    precio: "$32.990",
    ahorro: "Ahorras $5.500",
    personas: "Para 5–6 personas",
  },
]

// Descuentos especiales en productos individuales
const PROMOCIONES = [
  {
    id: "promo-lomo",
    nombre: "Lomo Liso",
    desc: "Corte premium de vacuno",
    image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600&q=80",
    precioNormal: 12990,
    precioPromo: 9990,
    unidad: "/ kg",
    descuento: 23,
    tag: "🥩 Vacuno",
  },
  {
    id: "promo-pechuga",
    nombre: "Pechuga de Pollo",
    desc: "Pollo fresco sin hueso",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80",
    precioNormal: 4990,
    precioPromo: 3490,
    unidad: "/ kg",
    descuento: 30,
    tag: "🐔 Aves",
  },
  {
    id: "promo-costillar",
    nombre: "Costillar de Cerdo",
    desc: "Ideal para el asado",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80",
    precioNormal: 7990,
    precioPromo: 5990,
    unidad: "/ kg",
    descuento: 25,
    tag: "🐷 Cerdo",
  },
  {
    id: "promo-molida",
    nombre: "Carne Molida Especial",
    desc: "Mezcla vacuno 80/20",
    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80",
    precioNormal: 5990,
    precioPromo: 4490,
    unidad: "/ kg",
    descuento: 25,
    tag: "🥩 Vacuno",
  },
]

// Oferta flash — rota diariamente
const FLASH_OFFERS = [
  {
    id: "flash-entraña",
    nombre: "Entraña",
    desc: "El corte favorito para la parrilla",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
    precioNormal: 15990,
    precioFlash: 10990,
    unidad: "/ kg",
    stock: 8,
    descuento: 31,
  },
  {
    id: "flash-longaniza",
    nombre: "Longaniza Casera",
    desc: "Artesanal, receta tradicional",
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80",
    precioNormal: 3990,
    precioFlash: 2490,
    unidad: "/ un",
    stock: 20,
    descuento: 38,
  },
  {
    id: "flash-plateada",
    nombre: "Plateada",
    desc: "Corte meloso para el horno",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80",
    precioNormal: 8990,
    precioFlash: 6490,
    unidad: "/ kg",
    stock: 5,
    descuento: 28,
  },
]

const BENEFITS = [
  { icon: Truck,  title: "Despacho rápido",    desc: "Entrega a domicilio en Puente Alto" },
  { icon: Shield, title: "Calidad garantizada", desc: "Carnes frescas y de primera" },
  { icon: Zap,    title: "Proceso simple",      desc: "Compra en menos de 2 minutos" },
]

const PAYMENT_METHODS = [
  { name: "Efectivo",      icon: "💵", color: "bg-green-50 border-green-200 text-green-700" },
  { name: "Débito",        icon: "💳", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { name: "Crédito",       icon: "💳", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { name: "Transferencia", icon: "🏦", color: "bg-gray-50 border-gray-200 text-gray-700" },
  { name: "Webpay",        icon: "🔐", color: "bg-red-50 border-red-200 text-red-700" },
  { name: "Amipass",       icon: "🎫", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { name: "Edenred",       icon: "🎫", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  { name: "Pluxee",        icon: "🎫", color: "bg-pink-50 border-pink-200 text-pink-700" },
]

const HORARIOS = [
  { dias: "Lunes",      horas: "09:30 – 19:30" },
  { dias: "Martes",     horas: "09:30 – 19:30" },
  { dias: "Miércoles",  horas: "09:30 – 19:30" },
  { dias: "Jueves",     horas: "09:30 – 19:30" },
  { dias: "Viernes",    horas: "09:30 – 19:30" },
  { dias: "Sábado",     horas: "09:00 – 19:30" },
  { dias: "Domingo",    horas: "09:30 – 15:00" },
]

const WA_NUMBER = "56928239161"

function ComboCard({ combo }: { combo: typeof COMBOS[0] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem({ id: combo.id, name: combo.nombre, price: combo.precioNum, quantity: 1, unit: 'un', image: combo.image })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      {/* Foto + badge */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={combo.image}
          alt={combo.nombre}
          className="w-full h-full object-cover"
          onError={e => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className={`absolute top-3 left-3 ${combo.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
          {combo.badge}
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-black text-lg leading-tight drop-shadow">{combo.nombre}</h3>
          <p className="text-white/80 text-xs mt-0.5">{combo.personas}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 flex-1 flex flex-col">
        <ul className="space-y-2 mb-5 flex-1">
          {combo.items.map((item, j) => (
            <li key={j} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{item.producto}</span>
              </div>
              <span className="text-sm font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg shrink-0">
                {item.cantidad}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">Precio del pack</p>
              <p className="text-2xl font-black text-gray-900">{combo.precio}</p>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
              {combo.ahorro}
            </span>
          </div>
          <button
            onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {added
              ? <><Check className="w-4 h-4" /> ¡Agregado al carrito!</>
              : <><ShoppingCart className="w-4 h-4" /> Agregar al carrito</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function SupplierForm() {
  const [form, setForm] = useState({ nombre: '', empresa: '', telefono: '', email: '', mensaje: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/contact-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch {}
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">✅</div>
        <h4 className="font-black text-white text-xl mb-2">¡Mensaje recibido!</h4>
        <p className="text-gray-400">Nuestro equipo se contactará contigo en las próximas 24 horas.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input required type="text" placeholder="Nombre *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        <input type="text" placeholder="Empresa / Restaurante" value={form.empresa} onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        <input type="tel" placeholder="Teléfono" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
      </div>
      <textarea placeholder="Cuéntanos qué necesitas (volúmenes, cortes, frecuencia...)" value={form.mensaje} onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))} rows={3}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50">
        <Send className="w-4 h-4" />
        {loading ? 'Enviando...' : 'Quiero ser cliente mayorista'}
      </button>
    </form>
  )
}

// ── Countdown hasta medianoche ─────────────────────────────────────────────
function useCountdown() {
  const getRemaining = () => {
    const now  = new Date()
    const end  = new Date(); end.setHours(23, 59, 59, 0)
    const diff = Math.max(0, end.getTime() - now.getTime())
    const h    = Math.floor(diff / 3600000)
    const m    = Math.floor((diff % 3600000) / 60000)
    const s    = Math.floor((diff % 60000) / 1000)
    return { h: String(h).padStart(2,'0'), m: String(m).padStart(2,'0'), s: String(s).padStart(2,'0') }
  }
  const [time, setTime] = useState(getRemaining)
  useEffect(() => {
    const t = setInterval(() => setTime(getRemaining()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

// ── Tarjeta promoción ──────────────────────────────────────────────────────
function PromoCard({ promo }: { promo: typeof PROMOCIONES[0] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const handleAdd = () => {
    addItem({ id: promo.id, name: promo.nombre, price: promo.precioPromo, quantity: 1, unit: 'kg' })
    setAdded(true); setTimeout(() => setAdded(false), 2000)
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img src={promo.image} alt={promo.nombre} className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
          -{promo.descuento}%
        </span>
        <span className="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {promo.tag}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-sm mb-0.5">{promo.nombre}</h3>
        <p className="text-xs text-gray-400 mb-3">{promo.desc}</p>
        <div className="mt-auto">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-xl font-black text-gray-900">${promo.precioPromo.toLocaleString('es-CL')}</span>
            <span className="text-xs text-gray-400 line-through mb-0.5">${promo.precioNormal.toLocaleString('es-CL')}</span>
            <span className="text-xs text-gray-400 mb-0.5">{promo.unidad}</span>
          </div>
          <button onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${added ? 'bg-green-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
            {added ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta oferta flash ───────────────────────────────────────────────────
function FlashCard({ offer }: { offer: typeof FLASH_OFFERS[0] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const handleAdd = () => {
    addItem({ id: offer.id, name: offer.nombre, price: offer.precioFlash, quantity: 1, unit: offer.unidad.includes('kg') ? 'kg' : 'un' })
    setAdded(true); setTimeout(() => setAdded(false), 2000)
  }
  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex flex-col border border-red-500/30 hover:border-red-500/60 transition-colors">
      <div className="relative h-44 overflow-hidden">
        <img src={offer.image} alt={offer.nombre} className="w-full h-full object-cover opacity-70"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
          ⚡ -{offer.descuento}%
        </span>
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-black text-lg leading-tight">{offer.nombre}</p>
          <p className="text-gray-300 text-xs">{offer.desc}</p>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-end gap-2 mb-1">
          <span className="text-2xl font-black text-red-400">${offer.precioFlash.toLocaleString('es-CL')}</span>
          <span className="text-sm text-gray-500 line-through mb-0.5">${offer.precioNormal.toLocaleString('es-CL')}</span>
          <span className="text-xs text-gray-500 mb-0.5">{offer.unidad}</span>
        </div>
        <p className="text-xs text-orange-400 mb-3">🔴 Solo quedan {offer.stock} disponibles</p>
        <button onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${added ? 'bg-green-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
          {added ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar al carrito</>}
        </button>
      </div>
    </div>
  )
}

// ── Sección oferta flash con countdown ────────────────────────────────────
function FlashSection() {
  const { h, m, s } = useCountdown()
  return (
    <section className="bg-gray-950 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
              <Timer className="w-4 h-4 animate-pulse" /> Solo por hoy
            </p>
            <h2 className="text-4xl font-black text-white">⚡ Oferta Flash</h2>
            <p className="text-gray-400 text-sm mt-1">Precios especiales que terminan a medianoche</p>
          </div>
          {/* Countdown */}
          <div className="flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-2xl px-5 py-3">
            <Timer className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex items-center gap-1 font-mono">
              {[{v: h, l: 'H'}, {v: m, l: 'M'}, {v: s, l: 'S'}].map(({v, l}, i) => (
                <span key={l} className="flex items-center gap-1">
                  {i > 0 && <span className="text-red-400 font-black text-xl">:</span>}
                  <span className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white leading-none">{v}</span>
                    <span className="text-xs text-red-400 font-semibold">{l}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FLASH_OFFERS.map(offer => <FlashCard key={offer.id} offer={offer} />)}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <WelcomePopup />
      <Header />
      <main className="min-h-screen bg-white">

        {/* ── HERO ── */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558030006-450675393462?w=900&q=85')" }} />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85')" }} />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-4">🇨🇱 Puente Alto, Chile</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Carne de verdad,<br />
              <span className="text-red-500">sabor de Chile</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto">Cortes seleccionados • Frescura garantizada • Despacho a domicilio</p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition group">
                Ver catálogo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link href="#categorias" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition">
                Ver categorías
              </Link>
            </div>
          </div>
        </section>

        {/* ── OFERTA FLASH ── */}
        <FlashSection />

        {/* ── COMBOS ── */}
        <section id="combos" className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4" /> Packs armados
              </p>
              <h2 className="text-4xl font-black text-gray-900">Combos</h2>
              <p className="text-gray-500 mt-2 text-sm">Todo listo para cocinar · Los mejores cortes juntos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COMBOS.map(combo => <ComboCard key={combo.id} combo={combo} />)}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            * Precios de referencia. Contáctanos para confirmar disponibilidad.
          </p>
        </section>

        {/* ── PROMOCIONES ── */}
        <section id="promociones" className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Descuentos especiales
                </p>
                <h2 className="text-4xl font-black text-gray-900">Promociones</h2>
                <p className="text-gray-500 mt-2 text-sm">Precios rebajados en productos seleccionados · Válido mientras dure el stock</p>
              </div>
              <Link href="/productos?cat=promociones" className="hidden md:flex items-center gap-2 text-green-600 font-semibold hover:gap-3 transition-all text-sm">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PROMOCIONES.map(promo => <PromoCard key={promo.id} promo={promo} />)}
            </div>
          </div>
        </section>

        {/* ── CATEGORÍAS ── */}
        <section id="categorias" className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Nuestro catálogo</p>
              <h2 className="text-4xl font-black text-gray-900">Explora por categoría</h2>
            </div>
            <Link href="/productos" className="hidden md:flex items-center gap-2 text-red-600 font-semibold hover:gap-3 transition-all text-sm">
              Ver todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                style={{ minHeight: i === 0 ? '400px' : '180px' }}
              >
                <img src={cat.image} alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-black text-xl mb-0.5">{cat.name}</h3>
                  <p className="text-gray-300 text-sm">{cat.desc}</p>
                  <div className="flex items-center gap-1 text-red-400 text-sm font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver productos <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── RECETAS PROMO BANNER ── */}
        <section className="bg-amber-50 border-y border-amber-200 py-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-amber-800 font-black text-xl">¿No sabes qué cocinar?</p>
                <p className="text-amber-700 text-sm">Tenemos recetas para casa y para parrilla con nuestros cortes</p>
              </div>
            </div>
            <Link href="/recetas"
              className="shrink-0 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition">
              Ver recetas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── BENEFITS ── */}
        <section className="bg-gray-950 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {BENEFITS.map((b) => {
                const Icon = b.icon
                return (
                  <div key={b.title} className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-red-600/10 rounded-2xl">
                        <Icon className="w-8 h-8 text-red-500" />
                      </div>
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">{b.title}</h3>
                    <p className="text-gray-400 text-sm">{b.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── CALCULADOR + HORARIOS + UBICACIÓN ── */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Para tu asado</p>
              <h2 className="text-3xl font-black text-gray-900 mb-6">¿Cuánta carne necesitas?</h2>
              <AsadoCalculator />
            </div>

            <div className="space-y-6">
              {/* Horarios */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white flex items-center gap-3">
                  <Clock className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-black">Horarios de atención</h3>
                </div>
                <div className="p-5 space-y-2">
                  {HORARIOS.map(h => (
                    <div key={h.dias} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700 font-medium text-sm">{h.dias}</span>
                      <span className="font-black text-sm bg-red-50 text-red-700 px-3 py-1 rounded-lg">{h.horas}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-1">Pedidos online 24/7 · Despachos en horario de atención</p>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-white flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  <h3 className="text-lg font-black">Dónde encontrarnos</h3>
                </div>
                <div className="p-5">
                  <p className="font-bold text-gray-900 mb-0.5">Carnicería El Fundo</p>
                  <p className="text-gray-500 text-sm mb-4">Av. Parque Central 06441, Puente Alto · Frente a Iglesia Ciudad del Este</p>
                  <div className="rounded-xl overflow-hidden h-44 bg-gray-100">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3328.6!2d-70.5948!3d-33.5833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662d08c8b7adf3d%3A0x1!2sAv.+Parque+Central+06441%2C+Puente+Alto%2C+Regi%C3%B3n+Metropolitana!5e0!3m2!1ses!2scl!4v1"
                      width="100%" height="100%" style={{ border: 0 }}
                      allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación Carnicería El Fundo"
                    />
                  </div>
                  <a href="https://www.google.com/maps/search/?api=1&query=Av.+Parque+Central+06441+Puente+Alto"
                    target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition">
                    📍 Cómo llegar — Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MEDIOS DE PAGO ── */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Sin complicaciones</p>
              <h2 className="text-3xl font-black text-gray-900">Medios de pago aceptados</h2>
              <p className="text-gray-500 mt-2">Paga como más te acomode</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_METHODS.map(method => (
                <div key={method.name} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${method.color} font-medium text-sm`}>
                  <span className="text-2xl">{method.icon}</span>
                  {method.name}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              Las transacciones con tarjeta son procesadas de forma segura a través de Webpay Plus.
            </p>
          </div>
        </section>

        {/* ── PROVEEDORES / MAYORISTAS ── */}
        <section className="bg-gray-950 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-600/20 rounded-2xl">
                    <Building2 className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 font-semibold text-sm uppercase tracking-widest">Venta mayorista</p>
                </div>
                <h2 className="text-4xl font-black text-white mb-4">¿Eres restaurante o carnicería?</h2>
                <p className="text-gray-400 mb-6">Trabajamos con restaurantes, hoteles, carnicerías y distribuidores entregando la misma calidad a precios mayoristas.</p>
                <ul className="space-y-3">
                  {["Precios especiales por volumen","Entrega programada a tu local","Cortes a medida según tus necesidades","Facturación disponible"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-gray-300 text-sm">
                      <span className="w-5 h-5 bg-red-600/30 rounded-full flex items-center justify-center text-red-400 text-xs flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-3xl border border-white/10 p-6">
                <h3 className="font-black text-white text-xl mb-5">Contáctanos</h3>
                <SupplierForm />
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="relative py-24 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558030006-450675393462?w=1600&q=80')" }} />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 text-center px-4">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">¿Listo para comprar?</h2>
            <p className="text-gray-300 text-lg mb-8">Descubre nuestro catálogo con los mejores cortes de Puente Alto</p>
            <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition group">
              Ver todos los productos <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
