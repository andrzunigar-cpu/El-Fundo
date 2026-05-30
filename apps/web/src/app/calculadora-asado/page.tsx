import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import AsadoCalculator from '@/components/AsadoCalculator'
import { Flame } from 'lucide-react'

export const metadata = { title: 'Calculadora de Asado · Carnicería El Fundo' }

export default function CalculadoraAsadoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gray-950 py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-orange-500" />
              <h1 className="text-4xl font-black text-white">Calculadora de Asado</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Dinos cuántos invitados tendrás y te decimos exactamente cuánta carne necesitas.
              Sin desperdicios, sin que falte nada.
            </p>
          </div>
        </section>

        {/* Calculadora */}
        <section className="max-w-2xl mx-auto px-4 py-12">
          <AsadoCalculator />
        </section>

        {/* Tips */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Consejos para tu asado 🔥</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🌡️', title: 'Temperatura', tip: 'La parrilla debe estar a 200–220°C antes de poner la carne. Espera que las brasas estén blancas.' },
              { emoji: '🧂', title: 'Sazón', tip: 'Sal gruesa justo antes de la parrilla o durante la cocción. Nunca antes de tiempo — pierde jugos.' },
              { emoji: '⏱️', title: 'Tiempos', tip: 'Vacuno: 12–20 min por lado. Pollo: 25–35 min. Cerdo: 15–20 min. Siempre deja reposar 5 min.' },
              { emoji: '🔥', title: 'Fuego', tip: 'Usa carbón de buena calidad o leña de espino. El carbón de bolsa puede dar sabores extraños.' },
              { emoji: '🥩', title: 'Temperatura interna', tip: 'Vacuno a punto: 60°C. Cerdo bien cocido: 71°C. Pollo completamente: 74°C.' },
              { emoji: '🛒', title: 'Compra fresco', tip: 'Compra la carne el mismo día o máximo un día antes. En El Fundo la tienes fresca y de primera.' },
            ].map(t => (
              <div key={t.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{t.emoji}</div>
                <h3 className="font-black text-gray-900 mb-2">{t.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
