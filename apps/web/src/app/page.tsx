import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FlashSale } from '@/components/FlashSale'
import { ArrowRight, Mail, Phone } from 'lucide-react'
import WelcomePopup from '@/components/WelcomePopup'
import ContactForm from '@/components/ContactForm'

const CATEGORIES = [
  { id: 'vacuno',    name: 'Vacuno',      desc: 'Cortes premium de res',       image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600&q=80' },
  { id: 'cerdo',     name: 'Cerdo',       desc: 'Carnes selectas',             image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80' },
  { id: 'pollo',     name: 'Aves',        desc: 'Pollo fresco y pavo',         image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80' },
  { id: 'embutidos', name: 'Embutidos',   desc: 'Longanizas y chorizos',       image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80', soon: true },
  { id: 'parrilla',  name: 'Parrilla',    desc: 'Para tu asado perfecto',      image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80', soon: true },
  { id: 'congelados',name: 'Congelados',  desc: 'Listos para cocinar',         image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80' },
  { id: 'bebidas',   name: 'Bebidas',     desc: 'Para acompañar',              image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&q=80' },
  { id: 'quesos',    name: 'Quesos',      desc: 'Selección artesanal',         image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80', soon: true },
  { id: 'mascotas',  name: '🐾 Mascotas', desc: 'Productos para tus perritos', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80', soon: true },
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
        <section id="categorias" className="max-w-7xl mx-auto px-4 py-16">
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
            {CATEGORIES.map((cat, i) => {
              const Wrapper = cat.soon ? 'div' : Link
              const wrapperProps = cat.soon ? {} : { href: cat.id === 'mascotas' ? '/mascotas' : `/categoria/${cat.id}` }
              return (
                <Wrapper
                  key={cat.id}
                  {...(wrapperProps as any)}
                  className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''} ${cat.soon ? 'cursor-default' : ''}`}
                  style={{ minHeight: i === 0 ? '400px' : '180px' }}
                >
                  <img src={cat.image} alt={cat.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${cat.soon ? 'grayscale opacity-60' : 'group-hover:scale-110'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {cat.soon && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 text-gray-800 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Pronto</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-black text-xl mb-0.5">{cat.name}</h3>
                    <p className="text-gray-300 text-sm">{cat.desc}</p>
                    {!cat.soon && (
                      <div className="flex items-center gap-1 text-red-400 text-sm font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver productos <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </Wrapper>
              )
            })}
          </div>
        </section>

        {/* ── Sección Contacto ── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Info */}
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-widest mb-2">Escríbenos</p>
              <h2 className="text-3xl font-black text-gray-900 mb-4">¿Tienes alguna consulta?</h2>
              <p className="text-gray-500 mb-8">Déjanos tu mensaje y te responderemos a la brevedad. También puedes contactarnos directamente.</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">WhatsApp</p>
                    <a href="https://wa.me/56928239161" target="_blank" rel="noopener noreferrer"
                      className="text-sm font-bold text-gray-800 hover:text-green-600 transition">+56 9 2823 9161</a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Email</p>
                    <a href="mailto:contacto@carniceriaelfundo.cl"
                      className="text-sm font-bold text-gray-800 hover:text-red-600 transition">contacto@carniceriaelfundo.cl</a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Teléfono</p>
                    <a href="tel:+56928239161"
                      className="text-sm font-bold text-gray-800 hover:text-gray-600 transition">+56 9 2823 9161</a>
                  </div>
                </li>
              </ul>
            </div>
            {/* Formulario */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h3 className="font-black text-gray-900 text-xl mb-5">Envíanos un mensaje</h3>
              <ContactForm />
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
