'use client'

import { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'

export default function ContactForm() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.mensaje) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError('Hubo un problema al enviar. Intenta de nuevo.')
      }
    } catch {
      setError('Hubo un problema al enviar. Intenta de nuevo.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-black text-xl text-gray-900 mb-1">¡Mensaje enviado!</h3>
        <p className="text-gray-500 text-sm">Te responderemos a la brevedad.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
          <input
            required type="text" value={form.nombre}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            placeholder="Tu nombre"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
          <input
            type="tel" value={form.telefono}
            onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
            placeholder="+56 9 XXXX XXXX"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
        <input
          type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="tu@email.cl"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Mensaje *</label>
        <textarea
          required value={form.mensaje}
          onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))}
          placeholder="¿En qué te podemos ayudar?"
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Enviando...' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
