'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, Building2, Send } from 'lucide-react'

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

export default function MayoristasPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition mb-10">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-600/20 rounded-2xl">
                  <Building2 className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-400 font-semibold text-sm uppercase tracking-widest">Venta mayorista</p>
              </div>
              <h1 className="text-4xl font-black text-white mb-4">¿Eres restaurante o carnicería?</h1>
              <p className="text-gray-400 mb-6">Trabajamos con restaurantes, hoteles, carnicerías y distribuidores entregando la misma calidad a precios mayoristas.</p>
              <ul className="space-y-3">
                {[
                  'Precios especiales por volumen',
                  'Entrega programada a tu local',
                  'Cortes a medida según tus necesidades',
                  'Facturación disponible',
                ].map(item => (
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
      </main>
      <Footer />
    </>
  )
}
