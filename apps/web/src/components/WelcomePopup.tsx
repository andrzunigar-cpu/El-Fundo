'use client'

import { useEffect, useState } from 'react'
import { X, Gift, Tag } from 'lucide-react'

const STORAGE_KEY = 'elfundo_welcome_seen'

export default function WelcomePopup() {
  const [open, setOpen]       = useState(false)
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [discount, setDiscount] = useState(10) // % desde admin

  useEffect(() => {
    // Mostrar siempre al entrar — solo esperar 3s
    const t = setTimeout(() => setOpen(true), 3000)
    // Cargar % de descuento desde configuración
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (typeof d.new_user_discount === 'number') setDiscount(d.new_user_discount) })
      .catch(() => {})
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    setOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, discount_pct: discount }),
      })
    } catch {}
    setSent(true)
    setLoading(false)
    setTimeout(() => setOpen(false), 3500)
  }

  if (!open) return null

  const code = `BIENVENIDO${discount}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[92vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        {/* Header rojo */}
        <div className="relative bg-gradient-to-br from-red-600 to-red-800 px-6 py-6 sm:p-8 text-white text-center">
          <button onClick={dismiss} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 hover:bg-white/20 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Gift className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <p className="text-red-200 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1">Oferta de bienvenida</p>
          <h2 className="text-3xl sm:text-4xl font-black mb-1">{discount}% OFF</h2>
          <p className="text-red-100 text-sm">en tu primera compra</p>
        </div>

        <div className="p-5 sm:p-6">
          {!sent ? (
            <>
              <p className="text-gray-600 text-sm text-center mb-5">
                Regístrate y recibe tu código de descuento al instante
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="email"
                  placeholder="Tu email *"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : `Obtener ${discount}% de descuento`}
                </button>
              </form>
              <button onClick={dismiss} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 py-1 transition">
                No gracias, prefiero pagar precio completo
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-black text-gray-900 text-lg mb-2">¡Listo!</h3>
              <p className="text-gray-500 text-sm mb-4">Tu código de descuento es:</p>
              <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-xl px-6 py-4">
                <p className="text-2xl font-black text-red-600 tracking-widest">{code}</p>
              </div>
              <p className="text-xs text-gray-400 mt-3">Menciona este código al hacer tu pedido 🥩</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
