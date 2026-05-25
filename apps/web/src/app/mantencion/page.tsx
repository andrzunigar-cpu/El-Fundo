export default function MantencionPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">

      {/* Fondo: foto de carne a la parrilla */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=1600&q=90')" }}
      />

      {/* Overlay oscuro con tono cálido */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-red-950/60" />

      {/* Contenido centrado */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">

        {/* Logo / ícono */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <span className="text-4xl">🥩</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600/80 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-6 border border-red-400/30">
          <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          En mantención
        </div>

        {/* Título */}
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
          Volvemos<br />
          <span className="text-red-400">muy pronto</span>
        </h1>

        {/* Bajada */}
        <p className="text-gray-300 text-lg mb-2">
          Estamos preparando algo aún mejor para ti.
        </p>
        <p className="text-gray-400 text-base mb-10">
          Mientras tanto, puedes llamarnos o escribirnos por WhatsApp.
        </p>

        {/* Botones de contacto */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:+56928239161"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-base hover:bg-gray-100 transition"
          >
            📞 Llamar ahora
          </a>
          <a
            href="https://wa.me/56928239161"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition"
          >
            💬 WhatsApp
          </a>
        </div>

        {/* Pie */}
        <p className="mt-12 text-gray-500 text-sm">
          Carnicería El Fundo · Av. Parque Central 06441, Puente Alto
        </p>
      </div>
    </div>
  )
}
