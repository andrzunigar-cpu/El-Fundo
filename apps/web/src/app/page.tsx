import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-700 to-red-900 text-white py-24 px-6 text-center">
        <h1 className="text-5xl font-black mb-4">Carnicería El Fundo</h1>
        <p className="text-xl text-red-200 mb-8 max-w-lg mx-auto">
          Los mejores cortes de carne vacuna, cerdo y cordero. Frescos cada día.
        </p>
        <Link href="/products" className="bg-white text-red-700 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-red-50 transition-colors inline-block">
          Ver catálogo
        </Link>
      </section>

      {/* Categorías */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Nuestros Cortes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Vacuno', 'Cerdo', 'Cordero', 'Pollo'].map((cat) => (
            <Link key={cat} href={`/products?category=${cat.toLowerCase()}`}
              className="bg-white rounded-2xl p-6 text-center shadow-sm border hover:border-red-300 hover:shadow-md transition-all">
              <div className="text-4xl mb-2">🥩</div>
              <p className="font-semibold">{cat}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA despacho */}
      <section className="bg-red-50 border-y border-red-100 py-12 text-center">
        <p className="text-lg font-semibold text-red-800">Despacho a domicilio en Santiago · Retiro en tienda</p>
        <p className="text-red-600 mt-1">Pedidos hasta las 18:00 hrs para entrega el mismo día</p>
      </section>
    </main>
  )
}
