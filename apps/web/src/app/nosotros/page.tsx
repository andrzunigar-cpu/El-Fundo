import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, Truck, Shield, Zap, Clock, MapPin } from 'lucide-react'
import AsadoCalculator from '@/components/AsadoCalculator'

const BENEFITS = [
  { icon: Truck,  title: 'Despacho rápido',    desc: 'Entrega a domicilio en Puente Alto' },
  { icon: Shield, title: 'Calidad garantizada', desc: 'Carnes frescas y de primera' },
  { icon: Zap,    title: 'Proceso simple',      desc: 'Compra en menos de 2 minutos' },
]

const PAYMENT_METHODS = [
  { name: 'Efectivo',      icon: '💵', color: 'bg-green-50 border-green-200 text-green-700' },
  { name: 'Débito',        icon: '💳', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'Crédito',       icon: '💳', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'Transferencia', icon: '🏦', color: 'bg-gray-50 border-gray-200 text-gray-700' },
  { name: 'Webpay',        icon: '🔐', color: 'bg-red-50 border-red-200 text-red-700' },
  { name: 'Amipass',       icon: '🎫', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'Edenred',       icon: '🎫', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { name: 'Pluxee',        icon: '🎫', color: 'bg-pink-50 border-pink-200 text-pink-700' },
]

const HORARIOS = [
  { dias: 'Lunes',     horas: '09:30 – 19:30' },
  { dias: 'Martes',    horas: '09:30 – 19:30' },
  { dias: 'Miércoles', horas: '09:30 – 19:30' },
  { dias: 'Jueves',    horas: '09:30 – 19:30' },
  { dias: 'Viernes',   horas: '09:30 – 19:30' },
  { dias: 'Sábado',    horas: '09:00 – 19:30' },
  { dias: 'Domingo',   horas: '09:30 – 15:00' },
]

export default function NosotrosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Nosotros</h1>
          <p className="text-gray-500 mb-12">Carnicería El Fundo · Puente Alto, Chile</p>

          {/* Beneficios */}
          <div className="bg-gray-950 rounded-3xl p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-8">
              {BENEFITS.map(b => {
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

          {/* Calculador + Horarios + Ubicación */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Para tu asado</p>
              <h2 className="text-3xl font-black text-gray-900 mb-6">¿Cuánta carne necesitas?</h2>
              <AsadoCalculator />
            </div>

            <div className="space-y-6">
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

              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-white flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  <h3 className="text-lg font-black">Dónde encontrarnos</h3>
                </div>
                <div className="p-5">
                  <p className="font-bold text-gray-900 mb-0.5">Carnicería El Fundo</p>
                  <a href="https://maps.google.com/maps?q=Av+Parque+Central+06441+Puente+Alto+Chile"
                    target="_blank" rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 text-sm font-medium mb-4 inline-flex items-center gap-1 transition">
                    <MapPin className="w-3.5 h-3.5" /> Av. Parque Central 06441, Puente Alto
                  </a>
                  <p className="text-gray-400 text-xs mb-4">Frente a Iglesia Ciudad del Este</p>
                  <div className="rounded-xl overflow-hidden h-48 bg-gray-100 mb-4">
                    <iframe
                      src="https://maps.google.com/maps?q=Av+Parque+Central+06441+Puente+Alto+Chile&output=embed&z=17"
                      width="100%" height="100%" style={{ border: 0 }}
                      allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación Carnicería El Fundo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=Av+Parque+Central+06441+Puente+Alto+Chile"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition">
                      🧭 Cómo llegar
                    </a>
                    <a href="https://maps.google.com/maps?q=Av+Parque+Central+06441+Puente+Alto+Chile"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold text-sm transition">
                      📍 Ver en Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Medios de pago */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-center mb-8">
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
        </div>
      </main>
      <Footer />
    </>
  )
}
