import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Guía de Cortes · Carnicería El Fundo' }

const CORTES = [
  { nombre: 'Abastero',         olla: true,  parrilla: true,  horno: true,  sarten: false },
  { nombre: 'Asado Carnicero',  olla: true,  parrilla: false, horno: true,  sarten: false },
  { nombre: 'Asado de Tira',    olla: true,  parrilla: true,  horno: false, sarten: false },
  { nombre: 'Asiento',          olla: true,  parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Choclillo',        olla: true,  parrilla: true,  horno: true,  sarten: false },
  { nombre: 'Entraña',          olla: false, parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Filete',           olla: false, parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Huachalomo',       olla: true,  parrilla: false, horno: true,  sarten: false },
  { nombre: 'Lomo Liso',        olla: false, parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Lomo Vetado',      olla: false, parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Osobuco Paleta',   olla: true,  parrilla: false, horno: false, sarten: false },
  { nombre: 'Osobuco de Pierna',olla: true,  parrilla: false, horno: false, sarten: false },
  { nombre: 'Palanca',          olla: true,  parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Plateada',         olla: true,  parrilla: true,  horno: true,  sarten: false },
  { nombre: 'Pollo Ganso',      olla: true,  parrilla: false, horno: false, sarten: false },
  { nombre: 'Posta Negra',      olla: true,  parrilla: false, horno: false, sarten: true  },
  { nombre: 'Posta Paleta',     olla: true,  parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Posta Rosada',     olla: true,  parrilla: false, horno: false, sarten: true  },
  { nombre: 'Punta de Paleta',  olla: true,  parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Punta de Ganso',   olla: true,  parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Punta Picana',     olla: true,  parrilla: true,  horno: true,  sarten: true  },
  { nombre: 'Sobrecostilla',    olla: true,  parrilla: true,  horno: false, sarten: false },
  { nombre: 'Tapapecho',        olla: true,  parrilla: false, horno: false, sarten: false },
  { nombre: 'Tapabarriga',      olla: true,  parrilla: true,  horno: true,  sarten: false },
]

const METODOS = [
  { key: 'olla',     emoji: '🍲', label: 'Olla / Guiso' },
  { key: 'parrilla', emoji: '🔥', label: 'Parrilla' },
  { key: 'horno',    emoji: '🫕', label: 'Horno' },
  { key: 'sarten',   emoji: '🍳', label: 'Sartén / Plancha' },
]

export default function GuiaCortesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* Hero */}
        <section className="bg-gray-950 py-10 px-4 text-center">
          <h1 className="text-4xl font-black text-white mb-2">🥩 Guía de Cortes</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Descubre el mejor método de preparación para cada corte de vacuno
          </p>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-950">
                  {/* Celda diagonal */}
                  <th className="w-44 px-5 py-4 text-left relative">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs font-semibold text-right">Preparación</span>
                      <div className="border-t border-gray-600 my-1.5" />
                      <span className="text-gray-400 text-xs font-semibold">Corte</span>
                    </div>
                  </th>
                  {METODOS.map(m => (
                    <th key={m.key} className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-white text-[11px] font-bold leading-tight hidden sm:block">{m.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {CORTES.map((corte, i) => (
                  <tr key={corte.nombre} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-800">{corte.nombre}</td>
                    {METODOS.map(m => (
                      <td key={m.key} className="px-3 py-3 text-center">
                        {corte[m.key as keyof typeof corte] ? (
                          <span className="inline-block w-3 h-3 rounded-full bg-red-600" />
                        ) : (
                          <span className="inline-block w-3 h-3" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            {METODOS.map(m => (
              <div key={m.key} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xl">{m.emoji}</span>
                <span>{m.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link href="/productos?cat=cat-vacuno"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition">
              Ver cortes disponibles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
