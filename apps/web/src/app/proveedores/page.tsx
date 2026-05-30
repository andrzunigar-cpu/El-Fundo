'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Truck, Store, ChefHat, ArrowRight, CheckCircle } from 'lucide-react'
import { useState } from 'react'

type FormType = 'proveedor' | 'cliente' | null

export default function ProveedoresPage() {
  const [tab, setTab]         = useState<FormType>(null)
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    nombre: '', empresa: '', telefono: '', email: '', mensaje: '', tipo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Enviar por WhatsApp como mensaje formateado
    const tipo  = tab === 'proveedor' ? '🏭 PROVEEDOR' : '🏪 CARNICERÍA/RESTAURANTE'
    const texto = encodeURIComponent(
      `${tipo}\n\nNombre: ${form.nombre}\nEmpresa: ${form.empresa}\nTeléfono: ${form.telefono}\nEmail: ${form.email}\n\nMensaje:\n${form.mensaje}`
    )
    window.open(`https://wa.me/56964181081?text=${texto}`, '_blank')
    setLoading(false)
    setSent(true)
  }

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* Hero */}
        <section className="bg-gray-950 py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Truck className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-black text-white mb-3">Proveedores & B2B</h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              ¿Tienes productos para ofrecernos? ¿Eres carnicería o restaurante y quieres comprar al por mayor?
              Aquí es el lugar.
            </p>
          </div>
        </section>

        {/* Selector */}
        {!tab && (
          <section className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-2xl font-black text-gray-900 text-center mb-10">¿Qué eres tú?</h2>
            <div className="grid md:grid-cols-2 gap-6">

              {/* Proveedor */}
              <button
                onClick={() => setTab('proveedor')}
                className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-red-500 shadow-sm hover:shadow-xl transition-all text-left"
              >
                <div className="bg-red-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-600 transition">
                  <Truck className="w-7 h-7 text-red-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Soy Proveedor</h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                  Tengo carnes, embutidos, quesos u otros productos para ofrecer a Carnicería El Fundo.
                </p>
                <div className="space-y-2">
                  {['Carnes de vacuno, cerdo, pollo o cordero', 'Embutidos artesanales', 'Quesos y lácteos', 'Otros productos afines'].map(b => (
                    <div key={b} className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {b}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-6 text-red-600 font-bold text-sm group-hover:gap-3 transition-all">
                  Contactar ahora <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Cliente B2B */}
              <button
                onClick={() => setTab('cliente')}
                className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-red-500 shadow-sm hover:shadow-xl transition-all text-left"
              >
                <div className="bg-orange-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-600 transition">
                  <ChefHat className="w-7 h-7 text-orange-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Soy Carnicería / Restaurante</h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                  Quiero comprar carnes al por mayor para mi negocio con precios preferenciales y despacho regular.
                </p>
                <div className="space-y-2">
                  {['Precios mayoristas', 'Despacho programado', 'Cortes a pedido', 'Factura disponible'].map(b => (
                    <div key={b} className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {b}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-6 text-red-600 font-bold text-sm group-hover:gap-3 transition-all">
                  Solicitar cotización <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </section>
        )}

        {/* Formulario */}
        {tab && !sent && (
          <section className="max-w-xl mx-auto px-4 py-12">
            <button
              onClick={() => setTab(null)}
              className="text-sm text-gray-500 hover:text-red-600 transition mb-6 flex items-center gap-1"
            >
              ← Volver
            </button>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                {tab === 'proveedor'
                  ? <Truck className="w-7 h-7 text-red-600" />
                  : <ChefHat className="w-7 h-7 text-orange-600" />
                }
                <h2 className="text-2xl font-black text-gray-900">
                  {tab === 'proveedor' ? 'Ofrece tus productos' : 'Solicita cotización'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre *</label>
                    <input required className={inputCls} placeholder="Tu nombre" value={form.nombre} onChange={e => update('nombre', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Empresa</label>
                    <input className={inputCls} placeholder="Nombre empresa" value={form.empresa} onChange={e => update('empresa', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Teléfono *</label>
                    <input required className={inputCls} placeholder="+56 9 XXXX XXXX" value={form.telefono} onChange={e => update('telefono', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                    <input type="email" className={inputCls} placeholder="correo@email.cl" value={form.email} onChange={e => update('email', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {tab === 'proveedor' ? '¿Qué productos ofreces? *' : '¿Qué necesitas y en qué cantidades? *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    className={inputCls}
                    placeholder={tab === 'proveedor'
                      ? 'Ej: Vacuno angus, 200 kg semanales, certificación sanitaria...'
                      : 'Ej: Vacuno asado 50 kg/semana, lomo vetado 20 kg/mes...'
                    }
                    value={form.mensaje}
                    onChange={e => update('mensaje', e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  💬 Enviar por WhatsApp
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Tu mensaje se enviará directamente por WhatsApp a nuestro equipo.
                </p>
              </form>
            </div>
          </section>
        )}

        {/* Enviado */}
        {sent && (
          <section className="max-w-xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-gray-900 mb-2">¡Mensaje enviado!</h2>
              <p className="text-gray-500 mb-6">Nos pondremos en contacto contigo a la brevedad. Gracias por tu interés en trabajar con El Fundo.</p>
              <button
                onClick={() => { setSent(false); setTab(null); setForm({ nombre:'',empresa:'',telefono:'',email:'',mensaje:'',tipo:'' }) }}
                className="text-red-600 font-semibold hover:underline"
              >
                Volver al inicio
              </button>
            </div>
          </section>
        )}

        {/* Clientes actuales */}
        {!tab && (
          <section className="bg-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Store className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white mb-3">Ya trabajamos con restaurantes y carnicerías de Puente Alto</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Contáctanos y te ofrecemos condiciones especiales, cortes a medida y despacho programado para tu negocio.
              </p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
