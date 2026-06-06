import Link from 'next/link'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">

          {/* Marca */}
          <div>
            <h3 className="text-xl font-bold mb-2">🥩 El Fundo</h3>
            <p className="text-gray-400 text-sm mb-4">Calidad y tradición en cada corte</p>
            <a
              href="https://wa.me/56928239161"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition mb-2"
            >
              💬 WhatsApp +56 9 2823 9161
            </a>
            <a
              href="mailto:contacto@carniceriaelfundo.cl"
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
            >
              <Mail className="w-3.5 h-3.5" /> contacto@carniceriaelfundo.cl
            </a>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="font-bold mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white">Inicio</Link></li>
              <li><Link href="/productos" className="text-gray-400 hover:text-white">Productos</Link></li>
              <li><Link href="/recetas" className="text-gray-400 hover:text-white">Recetas</Link></li>
              <li><Link href="/carrito" className="text-gray-400 hover:text-white">Mi carrito</Link></li>
            </ul>
          </div>

          {/* Horarios */}
          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-red-400" /> Horarios</h4>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between gap-4">
                <span className="text-gray-400">Lun – Vie</span>
                <span className="text-white font-semibold">9:30 – 19:30</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-gray-400">Sábado</span>
                <span className="text-white font-semibold">9:00 – 19:30</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-gray-400">Domingo</span>
                <span className="text-white font-semibold">9:30 – 15:00</span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-bold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <a href="tel:+56928239161" className="text-gray-400 hover:text-white">+56 9 2823 9161</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <a href="mailto:contacto@carniceriaelfundo.cl" className="text-gray-400 hover:text-white break-all">contacto@carniceriaelfundo.cl</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Av+Parque+Central+06441+Puente+Alto+Chile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  Av. Parque Central 06441, Local 5<br />
                  Puente Alto, RM<br />
                  <span className="text-gray-500 text-xs">Frente a Iglesia Ciudad del Este</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>© 2026 Carnicería El Fundo · Puente Alto, Región Metropolitana</p>
          <p>Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  )
}