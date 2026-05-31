'use client'

import { useState } from 'react'
import { Flame, Users, Calculator, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/store'

const CARNES = [
  { id: 'vacuno',    label: 'Vacuno',    emoji: '🐄', pct: 0 },
  { id: 'cerdo',     label: 'Cerdo',     emoji: '🐷', pct: 0 },
  { id: 'pollo',     label: 'Pollo/Aves',emoji: '🐔', pct: 0 },
  { id: 'cordero',   label: 'Cordero',   emoji: '🐑', pct: 0 },
  { id: 'embutidos', label: 'Embutidos', emoji: '🌭', pct: 0 },
]

const GRAMOS_POR_PERSONA = { hombres: 400, mujeres: 300, ninos: 200 }

// ── Packs recomendados ─────────────────────────────────────────────────────
const PACKS = [
  {
    id:       'pack-familiar',
    nombre:   'Pack Familiar',
    personas: '4–6 personas',
    emoji:    '🏠',
    color:    'border-orange-400 bg-orange-50',
    badge:    'bg-orange-500',
    items: [
      { id: 'prod-vac-004', name: 'Asado de Tira',     price: 8990, quantity: 2,   unit: 'kg' as const },
      { id: 'prod-emb-001', name: 'Longaniza Casera',  price: 1290, quantity: 6,   unit: 'un' as const },
      { id: 'prod-emb-002', name: 'Chorizo Parrillero',price: 2490, quantity: 0.5, unit: 'kg' as const },
    ],
  },
  {
    id:       'pack-parrillero',
    nombre:   'Pack Parrillero',
    personas: '6–8 personas',
    emoji:    '🔥',
    color:    'border-red-500 bg-red-50',
    badge:    'bg-red-600',
    items: [
      { id: 'prod-vac-002', name: 'Lomo Vetado',        price: 12990, quantity: 1.5, unit: 'kg' as const },
      { id: 'prod-vac-005', name: 'Entraña',            price: 13990, quantity: 1,   unit: 'kg' as const },
      { id: 'prod-cer-002', name: 'Costillar de Cerdo', price: 7990,  quantity: 1.5, unit: 'kg' as const },
      { id: 'prod-emb-002', name: 'Chorizo Parrillero', price: 2490,  quantity: 0.5, unit: 'kg' as const },
    ],
  },
  {
    id:       'pack-premium',
    nombre:   'Pack Premium',
    personas: '8–10 personas',
    emoji:    '⭐',
    color:    'border-yellow-500 bg-yellow-50',
    badge:    'bg-yellow-600',
    items: [
      { id: 'prod-vac-001', name: 'Lomo Liso',          price: 11990, quantity: 2,   unit: 'kg' as const },
      { id: 'prod-vac-005', name: 'Entraña',            price: 13990, quantity: 1.5, unit: 'kg' as const },
      { id: 'prod-cer-002', name: 'Costillar de Cerdo', price: 7990,  quantity: 2,   unit: 'kg' as const },
      { id: 'prod-emb-001', name: 'Longaniza Casera',   price: 1290,  quantity: 6,   unit: 'un' as const },
      { id: 'prod-emb-003', name: 'Prieta',             price: 990,   quantity: 4,   unit: 'un' as const },
    ],
  },
]

function PackCard({ pack }: { pack: typeof PACKS[0] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const total = pack.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleAdd = () => {
    pack.items.forEach(item => addItem({ ...item }))
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className={`rounded-2xl border-2 p-5 ${pack.color}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{pack.emoji}</span>
          <div>
            <p className="font-black text-gray-900 text-sm">{pack.nombre}</p>
            <p className="text-xs text-gray-500">{pack.personas}</p>
          </div>
        </div>
        <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-full ${pack.badge}`}>
          ${total.toLocaleString('es-CL')}
        </span>
      </div>

      <ul className="space-y-1 mb-4">
        {pack.items.map(item => (
          <li key={item.id} className="flex justify-between text-xs text-gray-600">
            <span>• {item.name}</span>
            <span className="font-semibold text-gray-800">
              {item.unit === 'kg' ? `${item.quantity} kg` : `${item.quantity} un`}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${
          added ? 'bg-green-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`}
      >
        {added
          ? <><Check className="w-4 h-4" /> ¡Agregado!</>
          : <><ShoppingCart className="w-4 h-4" /> Agregar pack</>
        }
      </button>
    </div>
  )
}

export default function AsadoCalculator() {
  const [hombres, setHombres] = useState('')
  const [mujeres, setMujeres] = useState('')
  const [ninos,   setNinos]   = useState('')
  const [carnes,  setCarnes]  = useState<Record<string, boolean>>({
    vacuno: true, cerdo: false, pollo: false, cordero: false, embutidos: false,
  })
  const [result, setResult] = useState<null | Record<string, number>>(null)

  const totalPersonas = (parseInt(hombres) || 0) + (parseInt(mujeres) || 0) + (parseInt(ninos) || 0)

  const calcular = () => {
    const totalGramos =
      (parseInt(hombres) || 0) * GRAMOS_POR_PERSONA.hombres +
      (parseInt(mujeres) || 0) * GRAMOS_POR_PERSONA.mujeres +
      (parseInt(ninos)   || 0) * GRAMOS_POR_PERSONA.ninos

    const selectedCarnes = CARNES.filter(c => carnes[c.id])
    if (selectedCarnes.length === 0 || totalGramos === 0) return

    const gramosPorCarne = Math.round(totalGramos / selectedCarnes.length)
    const res: Record<string, number> = {}
    selectedCarnes.forEach(c => { res[c.id] = gramosPorCarne })
    setResult(res)
  }

  const formatKg = (g: number) => g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g} g`

  return (
    <div className="space-y-6">
      {/* Calculadora */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <Flame className="w-6 h-6" />
            <h3 className="text-xl font-black">Calculador de Asado</h3>
          </div>
          <p className="text-orange-100 text-sm">¿Cuánta carne necesitas? Te ayudamos a calcularlo</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Personas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-500" />
              <h4 className="font-bold text-gray-900 text-sm">¿Cuántos son?</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'hombres', label: 'Hombres', emoji: '👨', val: hombres, set: setHombres, gramos: 400 },
                { key: 'mujeres', label: 'Mujeres', emoji: '👩', val: mujeres, set: setMujeres, gramos: 300 },
                { key: 'ninos',   label: 'Niños',   emoji: '👦', val: ninos,   set: setNinos,   gramos: 200 },
              ].map(p => (
                <div key={p.key} className="text-center">
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{p.label}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={p.val}
                    onChange={e => p.set(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{p.gramos}g c/u</p>
                </div>
              ))}
            </div>
            {totalPersonas > 0 && (
              <p className="text-xs text-gray-500 text-center mt-2 bg-gray-50 rounded-xl py-2">
                Total: <strong>{totalPersonas} personas</strong>
              </p>
            )}
          </div>

          {/* Tipos de carne */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-3">¿Qué tipos de carne?</h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CARNES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCarnes(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    carnes[c.id]
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botón calcular */}
          <button
            onClick={calcular}
            disabled={totalPersonas === 0 || !Object.values(carnes).some(Boolean)}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4" />
            Calcular carne para mi asado
          </button>

          {/* Resultado */}
          {result && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 animate-in fade-in">
              <p className="font-bold text-orange-900 text-sm mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4" /> Necesitas aproximadamente:
              </p>
              <div className="space-y-2">
                {CARNES.filter(c => result[c.id]).map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5">
                    <span className="text-sm font-medium text-gray-700">{c.emoji} {c.label}</span>
                    <span className="font-black text-orange-700">{formatKg(result[c.id])}</span>
                  </div>
                ))}
                <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-sm text-orange-900">
                  <span>Total</span>
                  <span>{formatKg(Object.values(result).reduce((a, b) => a + b, 0))}</span>
                </div>
              </div>
              <p className="text-xs text-orange-600 mt-3 text-center">
                ¡Agrega estos productos a tu carrito! 🛒
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Packs recomendados */}
      <div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">🛒 Packs listos para el carrito</p>
        <div className="space-y-3">
          {PACKS.map(pack => <PackCard key={pack.id} pack={pack} />)}
        </div>
      </div>
    </div>
  )
}
