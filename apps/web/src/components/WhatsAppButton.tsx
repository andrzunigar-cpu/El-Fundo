'use client'

import { useState } from 'react'

const WA_NUMBER = '56928239161'
const WA_MESSAGE = 'Hola%2C%20me%20gustar%C3%ADa%20hacer%20un%20pedido%20%F0%9F%A5%A9'

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group"
    >
      {/* Tooltip */}
      <span className={`
        bg-gray-900 text-white text-sm font-semibold px-3 py-2 rounded-xl shadow-lg
        transition-all duration-200 whitespace-nowrap
        ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
      `}>
        💬 Escríbenos
      </span>

      {/* Botón */}
      <div className="relative w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center">
        {/* Pulso animado */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        {/* Ícono WhatsApp SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-8 h-8 fill-white relative z-10"
        >
          <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.84.74 5.52 2.04 7.86L.5 31.5l7.84-2.06A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.3a13.3 13.3 0 0 1-6.8-1.87l-.49-.29-5.06 1.33 1.35-4.93-.32-.51A13.26 13.26 0 0 1 2.7 16C2.7 9.15 8.15 3.7 16 3.7S29.3 9.15 29.3 16 23.85 28.8 16 28.8zm7.27-9.93c-.4-.2-2.35-1.16-2.72-1.29-.36-.13-.63-.2-.89.2s-1.02 1.29-1.25 1.56c-.23.26-.46.3-.86.1a10.84 10.84 0 0 1-3.19-1.97 11.96 11.96 0 0 1-2.21-2.75c-.23-.4-.02-.61.17-.81.18-.18.4-.46.6-.69.2-.23.26-.4.4-.66.13-.26.06-.5-.03-.69-.1-.2-.89-2.15-1.22-2.94-.32-.77-.65-.67-.89-.68l-.76-.01c-.26 0-.69.1-1.05.5s-1.38 1.35-1.38 3.3 1.41 3.82 1.61 4.08c.2.27 2.78 4.24 6.73 5.95.94.4 1.67.65 2.24.83.94.3 1.8.26 2.47.16.75-.11 2.35-.96 2.68-1.89.33-.93.33-1.72.23-1.89-.1-.16-.36-.26-.76-.46z"/>
        </svg>
      </div>
    </a>
  )
}
