'use client'

import { useState, useMemo } from 'react'
import { Flame, Users, Calculator, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/store'

// ── Constantes ─────────────────────────────────────────────────────────────
const CARNES = [
  { id: 'vacuno',    label: 'Vacuno',     emoji: '🐄' },
  { id: 'cerdo',     label: 'Cerdo',      emoji: '🐷' },
  { id: 'pollo',     label: 'Pollo/Aves', emoji: '🐔' },
  { id: 'cordero',   label: 'Cordero',    emoji: '🐑' },
  { id: 'embutidos', label: 'Embutidos',  emoji: '🌭' },
]
const GPP = { hombres: 400, mujeres: 300, ninos: 200 } // gramos por persona

// ── Definición de packs ────────────────────────────────────────────────────
// pct = porcentaje del total de gramos que va a este producto
// gramsPerUnit = gramos que pesa cada unidad (para productos en 'un')
type PackProduct = {
  id: string; name: string; price: number
  unit: 'kg' | 'un'; pct: number; gramsPerUnit?: number
}

const PACK_DEFS: {
  id: string; nombre: string; desc: string; emoji: string
  colorBorder: string; colorBg: string; colorBadge: string
  products: PackProduct[]
}[] = [
  {
    id: 'pack-vacuno',
    nombre: 'Pack Vacuno',
    desc: 'Solo cortes de res, ideal para los amantes del vacuno',
    emoji: '🐄',
    colorBorder: 'border-red-400',
    colorBg:     'bg-red-50',
    colorBadge:  'bg-red-600',
    products: [
      { id: 'prod-vac-004', name: 'Asado de Tira',  price: 8990,  unit: 'kg', pct: 0.55 },
      { id: 'prod-vac-001', name: 'Lomo Liso',       price: 11990, unit: 'kg', pct: 0.45 },
    ],
  },
  {
    id: 'pack-mixto',
    nombre: 'Pack Mixto',
    desc: 'Vacuno, cerdo y embutidos para una parrilla variada',
    emoji: '🔥',
    colorBorder: 'border-orange-400',
    colorBg:     'bg-orange-50',
    colorBadge:  'bg-orange-600',
    products: [
      { id: 'prod-vac-004', name: 'Asado de Tira',      price: 8990, unit: 'kg', pct: 0.40 },
      { id: 'prod-cer-002', name: 'Costillar de Cerdo',  price: 7990, unit: 'kg', pct: 0.35 },
      { id: 'prod-emb-001', name: 'Longaniza Casera',    price: 1290, unit: 'un', pct: 0.15, gramsPerUnit: 180 },
      { id: 'prod-emb-002', name: 'Chorizo Parrillero',  price: 2490, unit: 'kg', pct: 0.10 },
    ],
  },
  {
    id: 'pack-premium',
    nombre: 'Pack Completo',
    desc: 'Los mejores cortes para una parrilla de lujo',
    emoji: '⭐',
    colorBorder: 'border-yellow-500',
    colorBg:     'bg-yellow-50',
    colorBadge:  'bg-yellow-600',
    products: [
      { id: 'prod-vac-002', name: 'Lomo Vetado',          price: 12990, unit: 'kg', pct: 0.30 },
      { id: 'prod-vac-005', name: 'Entraña',              price: 13990, unit: 'kg', pct: 0.25 },
      { id: 'prod-cer-002', name: 'Costillar de Cerdo',   price: 7990,  unit: 'kg', pct: 0.25 },
      { id: 'prod-emb-001', name: 'Longaniza Casera',     price: 1290,  unit: 'un', pct: 0.12, gramsPerUnit: 180 },
      { id: 'prod-emb-003', name: 'Prieta',               price: 990,   unit: 'un', pct: 0.08, gramsPerUnit: 150 },
    ],
  },
]

// Redondea a múltiplo de 0.25 con mínimo 0.25
function roundKg(grams: number): number {
  const kg = grams / 1000
  return Math.max(0.25, Math.round(kg / 0.25) * 0.25)
}

function roundUn(grams: number, gramsPerUnit: number): number {
  return Math.max(1, Math.round(grams / gramsPerUnit))
}

function calcPackItems(totalGramos: number, products: PackProduct[]) {
  return products.map(p => {
    const g = totalGramos * p.pct
    const quantity = p.unit === 'kg'
      ? roundKg(g)
      : roundUn(g, p.gramsPerUnit ?? 200)
    return { ...p, quantity }
  })
}

function fmtQty(qty: number, unit: 'kg' | 'un') {
  if (unit === 'un') return `${qty} un`
  return qty < 1 ? `${qty * 1000} g` : `${qty} kg`
}

// ── Tarjeta de pack ─────────────────────────────────────────────────────────
function PackCard({
  pack, totalGramos, totalPersonas,
}: {
  pack: typeof PACK_DEFS[0]
  totalGramos: number
  totalPersonas: number
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  // Usa los gramos calculados; si no hay input, muestra ejemplo para 6 personas
  const gramos = totalGramos > 0 ? totalGramos : 6 * GPP.hombres
  const items  = useMemo(() => calcPackItems(gramos, pack.products), [gramos])
  const total  = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const isExample = totalPersonas === 0

  const handleAdd = () => {
    items.forEach(item => addItem({
      id:       item.id,
      name:     item.name,
      price:    item.price,
      quantity: item.quantity,
      unit:     item.unit,
    }))
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className={`rounded-2xl border-2 p-5 ${pack.colorBorder} ${pack.colorBg}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{pack.emoji}</span>
          <div>
            <p className="font-black text-gray-900 text-sm">{pack.nombre}</p>
            <p className="text-xs text-gray-500 leading-tight">{pack.desc}</p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <span className={`text-xs font-black text-white px-2.5 py-1 rounded-full ${pack.colorBadge}`}>
            ${total.toLocaleString('es-CL')}
          </span>
          {isExample && (
            <p className="text-[10px] text-gray-400 mt-0.5">ej. 6 personas</p>
          )}
        </div>
      </div>

      {/* Productos con cantidades calculadas */}
      <ul className="space-y-1 mb-4">
        {items.map(item => (
          <li key={item.id} className="flex justify-between items-center text-xs">
            <span className="text-gray-600">• {item.name}</span>
            <span className="font-bold text-gray-900 ml-2 shrink-0">
              {fmtQty(item.quantity, item.unit)}
            </span>
          </li>
        ))}
      </ul>

      {/* Aviso si es ejemplo */}
      {isExample && (
        <p className="text-[10px] text-gray-400 italic mb-3">
          * Cantidades para 6 personas. Ingresa tus datos para ajustarlas.
        </p>
      )}

      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${
          added ? 'bg-green-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`}
      >
        {added
          ? <><Check className="w-4 h-4" /> ¡Agregado al carrito!</>
          : <><ShoppingCart className="w-4 h-4" /> Agregar pack</>
        }
      </button>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AsadoCalculator() {
  const [hombres, setHombres] = useState('')
  const [mujeres, setMujeres] = useState('')
  const [ninos,   setNinos]   = useState('')
  const [carnes,  setCarnes]  = useState<Record<string, boolean>>({
    vacuno: true, cerdo: false, pollo: false, cordero: false, embutidos: false,
  })
  const [result, setResult] = useState<null | Record<string, number>>(null)

  const totalPersonas = (parseInt(hombres) || 0) + (parseInt(mujeres) || 0) + (parseInt(ninos) || 0)
  const totalGramos   = useMemo(() =>
    (parseInt(hombres) || 0) * GPP.hombres +
    (parseInt(mujeres) || 0) * GPP.mujeres +
    (parseInt(ninos)   || 0) * GPP.ninos,
  [hombres, mujeres, ninos])

  const calcular = () => {
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
      {/* ── Calculadora ── */}
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
                    type="number" min="0" placeholder="0"
                    value={p.val}
                    onChange={e => { p.set(e.target.value); setResult(null) }}
                    className="w-full px-2 py-2 border border-gray-200 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{p.gramos}g c/u</p>
                </div>
              ))}
            </div>
            {totalPersonas > 0 && (
              <p className="text-xs text-gray-500 text-center mt-2 bg-gray-50 rounded-xl py-2">
                Total: <strong>{totalPersonas} personas</strong> · <strong>{totalGramos.toLocaleString('es-CL')} g</strong> de carne
              </p>
            )}
          </div>

          {/* Tipos de carne */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-3">¿Qué tipos de carne?</h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CARNES.map(c => (
                <button key={c.id}
                  onClick={() => setCarnes(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    carnes[c.id] ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{c.emoji}</span>{c.label}
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
            </div>
          )}
        </div>
      </div>

      {/* ── Packs recomendados ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Packs listos para el carrito
            {totalPersonas > 0 && (
              <span className="ml-2 text-red-600 normal-case tracking-normal font-semibold">
                · calculados para {totalPersonas} persona{totalPersonas !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="space-y-3">
          {PACK_DEFS.map(pack => (
            <PackCard
              key={pack.id}
              pack={pack}
              totalGramos={totalGramos}
              totalPersonas={totalPersonas}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
