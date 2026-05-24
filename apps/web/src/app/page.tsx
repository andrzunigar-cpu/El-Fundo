'use client'

import Link from "next/link"
import { useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ArrowRight, Truck, Shield, Zap, Clock, MapPin, ChefHat, Flame, Building2, Send } from "lucide-react"
import AsadoCalculator from "@/components/AsadoCalculator"
import WelcomePopup from "@/components/WelcomePopup"

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

const BENEFITS = [
  { icon: Truck,  title: "Despacho rápido",      desc: "Entrega a domicilio en Santiago" },
  { icon: Shield, title: "Calidad garantizada",   desc: "Carnes frescas y de primera" },
  { icon: Zap,    title: "Proceso simple",        desc: "Compra en menos de 2 minutos" },
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

const RECETAS_CASA = [
  {
    titulo: "Cazuela de Vacuno",
    desc: "Carne tierna cocida a fuego lento con papas, zapallo, choclo y verduras de temporada.",
    tiempo: "90 min",
    porciones: "4 personas",
    ingredientes: ["500g osobuco o posta negra", "2 papas grandes", "1 trozo zapallo", "1 choclo", "2 zanahorias", "1 rama apio", "Sal, pimienta y orégano"],
    imagen: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
    tag: "Cocina casera",
    tagColor: "bg-amber-600",
  },
  {
    titulo: "Lomo a la Plancha con Ensalada",
    desc: "Filete de lomo sellado en sartén caliente, dorado por fuera y jugoso por dentro.",
    tiempo: "20 min",
    porciones: "2 personas",
    ingredientes: ["2 bifes de lomo (200g c/u)", "Sal de mar y pimienta negra", "Ajo en polvo", "Aceite de oliva", "Limón para servir"],
    imagen: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
    tag: "Rápido y fácil",
    tagColor: "bg-green-600",
  },
  {
    titulo: "Estofado de Vacuno",
    desc: "Carne de vacuno en su jugo con papas, zanahorias y aliños a fuego lento. Reconfortante.",
    tiempo: "2 horas",
    porciones: "6 personas",
    ingredientes: ["700g plateada o palanca", "3 papas medianas", "2 zanahorias", "1 cebolla", "Tomate natural", "Vino tinto", "Laurel"],
    imagen: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80",
    tag: "Plato de invierno",
    tagColor: "bg-blue-600",
  },
]

const RECETAS_PARRILLA = [
  {
    titulo: "Asado de Tira Clásico",
    desc: "El corte favorito de los chilenos. A fuego medio, vuelta y vuelta, con chimichurri casero.",
    tiempo: "45 min",
    porciones: "4 personas",
    ingredientes: ["1.2 kg asado de tira", "Sal gruesa", "Para chimichurri: perejil, ajo, vinagre, aceite"],
    imagen: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80",
    tag: "Clásico chileno",
    tagColor: "bg-red-600",
  },
  {
    titulo: "Costillas BBQ a las Brasas",
    desc: "Costillas de cerdo marinadas con salsa BBQ casera, cocinadas lentamente sobre brasas.",
    tiempo: "2.5 horas",
    porciones: "4 personas",
    ingredientes: ["1.5 kg costillas de cerdo", "Salsa BBQ", "Miel", "Mostaza", "Ajo y cebolla", "Paprika ahumada"],
    imagen: "https://images.unsplash.com/photo-1544025162-d76538485696?w=600&q=80",
    tag: "Parrilla",
    tagColor: "bg-orange-600",
  },
  {
    titulo: "Lomo Vetado a las Brasas",
    desc: "El rey de la parrilla. Con su marmoleo natural, queda jugoso y con un sabor único.",
    tiempo: "30 min",
    porciones: "3 personas",
    ingredientes: ["700g lomo vetado entero", "Sal gruesa", "Pimienta negra recién molida", "Mantequilla con hierbas para servir"],
    imagen: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
    tag: "Premium",
    tagColor: "bg-gray-800",
  },
]

const HORARIOS = [
  { dias: "Lunes a Viernes", horas: "09:00 – 20:00" },
  { dias: "Sábado",          horas: "09:00 – 18:00" },
  { dias: "Domingo",         horas: "10:00 – 14:00" },
]

function RecetaCard({ r }: { r: typeof RECETAS_CASA[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="relative h-52 overflow-hidden">
        <img src={r.imagen} alt={r.titulo} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        <span className={`absolute top-3 left-3 ${r.tagColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>{r.tag}</span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h4 className="font-black text-gray-900 text-lg mb-1">{r.titulo}</h4>
        <p className="text-gray-500 text-sm mb-3 flex-1">{r.desc}</p>
        <div className="flex gap-4 text-xs text-gray-400 mb-4">
          <span>⏱ {r.tiempo}</span>
          <span>👥 {r.porciones}</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-sm font-semibold text-red-600 hover:text-red-700 text-left flex items-center gap-1 transition"
        >
          {open ? '▲ Ocultar ingredientes' : '▼ Ver ingredientes'}
        </button>
        {open && (
          <ul className="mt-3 space-y-1">
            {r.ingredientes.map(ing => (
              <li key={ing} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>{ing}
              </li>
            ))}
          </ul>
        )}
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
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

export default function Home() {
  return (
    <>
      <WelcomePopup />
      <Header />
      <main className="min-h-screen bg-white">

        {/* Hero */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558030006-450675393462?w=900&q=85')" }} />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85')" }} />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
          <div className="relative z-10 max-w-5xl mx-auto px-4">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-4">🇨🇱 Santiago de Chile</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Carne de verdad,<br />
              <span className="text-red-500">sabor de Chile</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-xl">Cortes seleccionados • Frescura garantizada • Despacho a domicilio</p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition group">
                Ver catálogo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link href="#categorias" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition">
                Ver categorías
              </Link>
            </div>
          </div>
        </section>

        {/* ───── RECETAS PARA CASA ───── */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-center gap-3 mb-3">
            <ChefHat className="w-6 h-6 text-amber-600" />
            <p className="text-amber-600 font-semibold text-sm uppercase tracking-widest">Recetas para casa</p>
          </div>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-4xl font-black text-gray-900">Cocina en casa</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {RECETAS_CASA.map(r => <RecetaCard key={r.titulo} r={r} />)}
          </div>
        </section>

        {/* ───── RECETAS PARA PARRILLA ───── */}
        <section className="bg-gray-950 py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="w-6 h-6 text-orange-500" />
              <p className="text-orange-400 font-semibold text-sm uppercase tracking-widest">Recetas para parrilla</p>
            </div>
            <h2 className="text-4xl font-black text-white mb-8">Maestros del fuego</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {RECETAS_PARRILLA.map(r => <RecetaCard key={r.titulo} r={r} />)}
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section id="categorias" className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Nuestro catálogo</p>
              <h2 className="text-4xl font-black text-gray-900">Explora por categoría</h2>
            </div>
            <Link href="/productos" className="hidden md:flex items-center gap-2 text-red-600 font-semibold hover:gap-3 transition-all">
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
                <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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

        {/* Benefits */}
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

        {/* ───── CALCULADOR DE ASADO + HORARIOS + UBICACIÓN ───── */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Calculador */}
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Para tu asado</p>
              <h2 className="text-3xl font-black text-gray-900 mb-6">¿Cuánta carne necesitas?</h2>
              <AsadoCalculator />
            </div>

            {/* Horarios + Ubicación */}
            <div className="space-y-8">
              {/* Horarios */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white flex items-center gap-3">
                  <Clock className="w-5 h-5 text-red-400" />
                  <h3 className="text-xl font-black">Horarios de atención</h3>
                </div>
                <div className="p-6 space-y-3">
                  {HORARIOS.map(h => (
                    <div key={h.dias} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700 font-medium text-sm">{h.dias}</span>
                      <span className="font-black text-gray-900 text-sm bg-red-50 text-red-700 px-3 py-1 rounded-lg">{h.horas}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-1">
                    Pedidos online disponibles 24/7 · Despachos en horario de atención
                  </p>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  <h3 className="text-xl font-black">Dónde encontrarnos</h3>
                </div>
                <div className="p-6">
                  <p className="font-bold text-gray-900 mb-1">Carnicería El Fundo</p>
                  <p className="text-gray-500 text-sm mb-4">Santiago, Chile</p>
                  <div className="rounded-xl overflow-hidden h-48 bg-gray-100 flex items-center justify-center">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.8!2d-70.6483!3d-33.4569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDI3JzI0LjgiUyA3MMKwMzgnNTMuOSJX!5e0!3m2!1ses!2scl!4v1"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación Carnicería El Fundo"
                    />
                  </div>
                  <a
                    href="https://wa.me/56912345678?text=Hola,%20quisiera%20saber%20cómo%20llegar%20a%20la%20carnicería"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm transition"
                  >
                    <span>📍</span> Cómo llegar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── MEDIOS DE PAGO ───── */}
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

        {/* ───── SECCIÓN PROVEEDORES / MAYORISTAS ───── */}
        <section className="bg-gray-950 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Texto */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-600/20 rounded-2xl">
                    <Building2 className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 font-semibold text-sm uppercase tracking-widest">Venta mayorista</p>
                </div>
                <h2 className="text-4xl font-black text-white mb-4">
                  ¿Eres restaurante o carnicería?
                </h2>
                <p className="text-gray-400 mb-6">
                  Carnicería El Fundo es tu proveedor de confianza. Trabajamos con restaurantes, hoteles, carnicerías y distribuidores entregando la misma calidad a precios mayoristas.
                </p>
                <ul className="space-y-3">
                  {[
                    "Precios especiales por volumen",
                    "Entrega programada a tu local",
                    "Cortes a medida según tus necesidades",
                    "Facturación disponible",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-gray-300 text-sm">
                      <span className="w-5 h-5 bg-red-600/30 rounded-full flex items-center justify-center text-red-400 text-xs flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Formulario */}
              <div>
                <div className="bg-white/5 backdrop-blur rounded-3xl border border-white/10 p-6">
                  <h3 className="font-black text-white text-xl mb-5">Contáctanos</h3>
                  <SupplierForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative py-24 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558030006-450675393462?w=1600&q=80')" }} />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 text-center px-4">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">¿Listo para comprar?</h2>
            <p className="text-gray-300 text-lg mb-8">Descubre nuestro catálogo con los mejores cortes de Santiago</p>
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
