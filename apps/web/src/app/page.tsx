import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FlashSale } from '@/components/FlashSale'
import { ArrowRight } from 'lucide-react'
import WelcomePopup from '@/components/WelcomePopup'

const CATEGORIES = [
  { id: 'vacuno',    name: 'Vacuno',     desc: 'Cortes premium de res',   image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600&q=80' },
  { id: 'cerdo',     name: 'Cerdo',      desc: 'Carnes selectas',          image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80' },
  { id: 'pollo',     name: 'Aves',       desc: 'Pollo fresco y pavo',      image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80' },
  { id: 'embutidos', name: 'Embutidos',  desc: 'Longanizas y chorizos',    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80' },
  { id: 'parrilla',  name: 'Parrilla',   desc: 'Para tu asado perfecto',   image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80' },
  { id: 'congelados',name: 'Congelados', desc: 'Listos para cocinar',      image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80' },
  { id: 'bebidas',   name: 'Bebidas',    desc: 'Para acompañar',           image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&q=80' },
  { id: 'quesos',    name: 'Quesos',     desc: 'Selección artesanal',      image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80' },
  { id: 'mascotas',  name: '🐾 Mascotas', desc: 'Productos para tus perritos', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80' },
]

export default function Home() {
  return (
    <>
      <Header />
      <WelcomePopup />
      <main className="min-h-screen bg-white">

        {/* Hero */}
        <section className="relative h-[520px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558030006-450675393462?w=900&q=85')" }} />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85')" }} />
          <div className="absolute inset-0 bg-black/65" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-4">🇨🇱 Puente Alto, Chile</p>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Carne de verdad,<br />
              <span className="text-red-500">sabor de Chile</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto">
              Cortes seleccionados · Frescura garantizada · Despacho a domicilio
            </p>
            <Link href="/productos"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition group">
              Ver todos los productos <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </section>

        {/* Ofertas Flash — entre el menú/hero y categorías */}
        <FlashSale />

        {/* Categorías */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Nuestro catálogo</p>
              <h2 className="text-4xl font-black text-gray-900">Explora por categoría</h2>
            </div>
            <Link href="/productos" className="hidden md:flex items-center gap-2 text-red-600 font-semibold hover:gap-3 transition-all text-sm">
              Ver todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                href={cat.id === 'mascotas' ? '/mascotas' : `/categoria/${cat.id}`}
                className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                style={{ minHeight: i === 0 ? '400px' : '180px' }}
              >
                <img src={cat.image} alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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

      </main>
      <Footer />
    </>
  )
}
