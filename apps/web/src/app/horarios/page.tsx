import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Clock, CheckCircle, XCircle, Phone } from 'lucide-react'

export const metadata = { title: 'Horarios · Carnicería El Fundo' }

const HORARIOS = [
  { dia: 'Lunes',     horas: '09:30 – 19:30', abierto: true },
  { dia: 'Martes',    horas: '09:30 – 19:30', abierto: true },
  { dia: 'Miércoles', horas: '09:30 – 19:30', abierto: true },
  { dia: 'Jueves',    horas: '09:30 – 19:30', abierto: true },
  { dia: 'Viernes',   horas: '09:30 – 19:30', abierto: true },
  { dia: 'Sábado',    horas: '09:00 – 19:30', abierto: true },
  { dia: 'Domingo',   horas: '09:30 – 15:00', abierto: true },
  { dia: 'Festivos',  horas: '10:00 – 14:00', abierto: true },
]

function isOpenNow() {
  const now = new Date()
  const day = now.getDay() // 0=Dom, 1=Lun..6=Sab
  const hour = now.getHours() + now.getMinutes() / 60

  if (day === 0) return hour >= 9.5 && hour < 15      // Domingo
  if (day === 6) return hour >= 9.0 && hour < 19.5    // Sábado
  return hour >= 9.5 && hour < 19.5                   // Lun-Vie
}

export default function HorariosPage() {
  const abierto = isOpenNow()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* Hero */}
        <section className="bg-gray-950 py-14 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <Clock className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-black text-white mb-3">Horarios de Atención</h1>
            <p className="text-gray-400">Estamos aquí para servirte toda la semana</p>
          </div>
        </section>

        <section className="max-w-2xl mx-auto px-4 py-12">

          {/* Estado actual */}
          <div className={`rounded-2xl p-5 mb-8 flex items-center gap-4 ${abierto ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {abierto
              ? <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              : <XCircle    className="w-8 h-8 text-red-500 flex-shrink-0" />
            }
            <div>
              <p className={`font-black text-lg ${abierto ? 'text-green-700' : 'text-red-700'}`}>
                {abierto ? '¡Estamos abiertos ahora! 🟢' : 'Estamos cerrados en este momento 🔴'}
              </p>
              <p className={`text-sm ${abierto ? 'text-green-600' : 'text-red-500'}`}>
                {abierto ? 'Puedes venir o hacer tu pedido online.' : 'Revisa nuestros horarios y vuelve pronto.'}
              </p>
            </div>
          </div>

          {/* Tabla horarios */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="bg-gray-950 px-6 py-4">
              <h2 className="text-white font-black text-lg">Horario semanal</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {HORARIOS.map((h, i) => (
                <div
                  key={h.dia}
                  className={`flex items-center justify-between px-6 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${h.abierto ? 'bg-green-500' : 'bg-red-400'}`} />
                    <span className="font-semibold text-gray-800">{h.dia}</span>
                  </div>
                  <span className={`font-black text-sm px-3 py-1 rounded-full ${
                    h.abierto
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {h.abierto ? h.horas : 'Cerrado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8">
            <p className="text-yellow-800 font-semibold text-sm">
              📌 Los horarios de festivos pueden variar según la fecha. Te recomendamos confirmar por WhatsApp antes de venir en días festivos importantes (Navidad, Año Nuevo, Fiestas Patrias).
            </p>
          </div>

          {/* CTA */}
          <div className="bg-gray-950 rounded-2xl p-6 text-center">
            <Phone className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-white font-black text-lg mb-2">¿Tienes dudas?</h3>
            <p className="text-gray-400 text-sm mb-4">Contáctanos y te respondemos de inmediato</p>
            <a
              href="https://wa.me/56928239161"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              💬 Escribir por WhatsApp
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
