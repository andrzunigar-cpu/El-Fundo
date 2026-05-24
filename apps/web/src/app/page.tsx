import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ArrowRight, Truck, Shield, Zap, CreditCard } from "lucide-react"

const CATEGORIES = [
  { id: "vacuno",    name: "Vacuno",    desc: "Cortes premium de res",    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80" },
  { id: "cerdo",     name: "Cerdo",     desc: "Carnes selectas",          image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80" },
  { id: "pollo",     name: "Aves",      desc: "Pollo fresco y pavo",      image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80" },
  { id: "embutidos", name: "Embutidos", desc: "Longanizas y chorizos",    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80" },
  { id: "parrilla",  name: "Parrilla",  desc: "Para tu asado perfecto",   image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80" },
  { id: "congelados",name: "Congelados",desc: "Listos para cocinar",      image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80" },
  { id: "bebidas",   name: "Bebidas",   desc: "Para acompañar",           image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80" },
  { id: "quesos",    name: "Quesos",    desc: "Selección artesanal",      image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80" },
]

const BENEFITS = [
  { icon: Truck,  title: "Despacho rápido",      desc: "Entrega a domicilio en Santiago" },
  { icon: Shield, title: "Calidad garantizada",   desc: "Carnes frescas y de primera" },
  { icon: Zap,    title: "Proceso simple",        desc: "Compra en menos de 2 minutos" },
]

const PAYMENT_METHODS = [
  { name: "Efectivo",      icon: "💵", color: "bg-green-50 border-green-200 text-green-700" },
  { name: "Débito",        icon: "💳", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { name: "Crédito",       icon: "💳", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { name: "Transferencia", icon: "🏦", color: "bg-gray-50 border-gray-200 text-gray-700" },
  { name: "Webpay",        icon: "🔐", color: "bg-red-50 border-red-200 text-red-700" },
  { name: "Amipass",       icon: "🎫", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { name: "Edenred",       icon: "🎫", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  { name: "Pluxee",        icon: "🎫", color: "bg-pink-50 border-pink-200 text-pink-700" },
]

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">

        {/* Hero */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          {/* Split background — izquierda: asado, derecha: cazuela */}
          <div className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558030006-450675393462?w=900&q=85')" }} />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85')" }} />
          {/* Overlay oscuro uniforme */}
          <div className="absolute inset-0 bg-black/65" />
          {/* Línea divisoria central sutil */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
          <div className="relative z-10 max-w-5xl mx-auto px-4">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-4">🇨🇱 Santiago de Chile</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Carne de verdad,<br />
              <span className="text-red-500">sabor de Chile</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-xl">Cortes seleccionados • Frescura garantizada • Despacho a domicilio</p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition group">
                Ver catálogo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link href="#categorias" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition">
                Ver categorías
              </Link>
            </div>
          </div>
        </section>

        {/* ───── SECCIÓN LIFESTYLE: Cazuela + Asado ───── */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Inspiración culinaria</p>
            <h2 className="text-4xl font-black text-gray-900">Del local a tu mesa</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Nuestras carnes están pensadas para los momentos más especiales: una cazuela casera o un asado con amigos.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Cazuela */}
            <div className="group relative overflow-hidden rounded-3xl h-80 cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85"
                alt="Señora cocinando cazuela"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">Cocina casera</span>
                <h3 className="text-2xl font-black text-white mb-2">La cazuela perfecta</h3>
                <p className="text-gray-300 text-sm">Carne tierna, verduras frescas y el sabor de la tradición chilena en cada cucharada.</p>
              </div>
            </div>

            {/* Asado */}
            <div className="group relative overflow-hidden rounded-3xl h-80 cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=85"
                alt="Señor haciendo asado a la parrilla"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="inline-block bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">Parrilla</span>
                <h3 className="text-2xl font-black text-white mb-2">El asado de los campeones</h3>
                <p className="text-gray-300 text-sm">Cortes seleccionados para una parrilla memorable con familia y amigos.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/productos" className="inline-flex items-center gap-2 text-red-600 font-semibold hover:gap-3 transition-all">
              Explorar todos los cortes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Categorías */}
        <section id="categorias" className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Nuestro catálogo</p>
              <h2 className="text-4xl font-black text-gray-900">Explora por categoría</h2>
            </div>
            <Link href="/productos" className="hidden md:flex items-center gap-2 text-red-600 font-semibold hover:gap-3 transition-all">
              Ver todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                style={{ minHeight: i === 0 ? '400px' : '180px' }}
              >
                <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-black text-xl mb-0.5">{cat.name}</h3>
                  <p className="text-gray-300 text-sm">{cat.desc}</p>
                  <div className="flex items-center gap-1 text-red-400 text-sm font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver productos <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-gray-950 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {BENEFITS.map((b) => {
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
        </section>

        {/* ───── MEDIOS DE PAGO ───── */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
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
        </section>

        {/* CTA final */}
        <section className="relative py-24 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558030006-450675393462?w=1600&q=80')" }} />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 text-center px-4">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">¿Listo para comprar?</h2>
            <p className="text-gray-300 text-lg mb-8">Descubre nuestro catálogo con los mejores cortes de Santiago</p>
            <Link href="/productos" className="inline-flex items-center gap-2 bg-red-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition group">
              Ver todos los productos <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}