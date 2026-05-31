import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MapPin, Phone, Clock } from 'lucide-react'

export const metadata = { title: 'Cómo Llegar · Carnicería El Fundo' }

const HORARIOS = [
  { dia: 'Lunes',     horas: '09:30 – 19:30', abierto: true },
  { dia: 'Martes',    horas: '09:30 – 19:30', abierto: true },
  { dia: 'Miércoles', horas: '09:30 – 19:30', abierto: true },
  { dia: 'Jueves',    horas: '09:30 – 19:30', abierto: true },
  { dia: 'Viernes',   horas: '09:30 – 19:30', abierto: true },
  { dia: 'Sábado',    horas: '09:00 – 19:30', abierto: true },
  { dia: 'Domingo',   horas: '09:30 – 15:00', abierto: true },
]

export default function ComoLlegarPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gray-950 py-12 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <MapPin className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-black text-white mb-3">Cómo Llegar</h1>
            <p className="text-gray-400 text-lg">Encuéntranos en Puente Alto, Santiago de Chile</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-10">

          {/* Mapa */}
          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200 h-[420px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.0!2d-70.6106!3d-33.6169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAv.+Parque+Central+06441%2C+Puente+Alto%2C+Regi%C3%B3n+Metropolitana%2C+Chile!5e0!3m2!1ses!2scl!4v1700000000000&q=Av+Parque+Central+06441+Puente+Alto+Chile"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Carnicería El Fundo"
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Dirección */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg mb-1">Dirección</h3>
                  <p className="text-gray-600 font-medium">Av. Parque Central 06441, Local 5</p>
                  <p className="text-gray-500 text-sm">Puente Alto, Región Metropolitana</p>
                  <p className="text-gray-400 text-xs mt-1">Frente a Iglesia Ciudad del Este</p>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Av+Parque+Central+06441+Puente+Alto+Chile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-red-600 hover:text-red-700 transition"
                  >
                    <MapPin className="w-4 h-4" /> Abrir en Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg mb-1">Contacto</h3>
                  <a href="tel:+56928239161" className="text-gray-600 font-medium hover:text-red-600 transition">
                    +56 9 2823 9161
                  </a>
                  <p className="text-gray-400 text-sm mt-1">WhatsApp disponible</p>
                  <a
                    href="https://wa.me/56928239161"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-green-600 hover:text-green-700 transition"
                  >
                    💬 Escribir por WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Horarios rápidos */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-black text-gray-900 text-lg">Horarios</h3>
              </div>
              <div className="space-y-2">
                {HORARIOS.map(h => (
                  <div key={h.dia} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{h.dia}</span>
                    <span className="text-gray-900 font-semibold">{h.horas}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
