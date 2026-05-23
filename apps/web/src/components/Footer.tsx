import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-2">🥩 El Fundo</h3>
            <p className="text-gray-400 text-sm">Calidad y tradición en cada corte</p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white">Inicio</Link></li>
              <li><Link href="/productos" className="text-gray-400 hover:text-white">Productos</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Quiénes somos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-gray-400 hover:text-white">Privacidad</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Términos</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Devoluciones</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="text-gray-400">+56 400 000 000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-gray-400">info@carnicerielfundo.cl</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-gray-400">Santiago, Chile</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 Carnicería El Fundo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}