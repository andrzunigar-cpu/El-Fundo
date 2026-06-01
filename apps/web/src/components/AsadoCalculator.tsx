'use client'

import { useState, useMemo } from 'react'
import { Flame, Users, Calculator, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/store'

// ── Constantes ─────────────────────────────────────────────────────────────
const CARNES = [
  { id: 'vacuno',    label: 'Vacuno',     emoji: '🐄' },
  { id: 'cerdo',     label: 'Cerdo',      emoji: '🐷' },
  { id: 'pollo',     label: 'Pollo/Aves', emoji: '🐔' },
  { id: 'embutidos', label: 'Embutidos',  emoji: '🌭' },
]
const GPP = { hombres: 400, mujeres: 300, ninos: 200, perros: 200 }

// ── Producto por tipo de carne y tier ─────────────────────────────────────
// Cada tier define qué producto usar para cada tipo de carne
type ProductDef = {
  id: string; name: string; price: number
  unit: 'kg' | 'un'; gramsPerUnit?: number
}

const PRODUCTS_BY_TIER: Record<string, Record<string, ProductDef>> = {
  economico: {
    vacuno:    { id: 'prod-vac-004', name: 'Asado de Tira',      price: 8990,  unit: 'kg' },
    cerdo:     { id: 'prod-cer-001', name: 'Pulpa de Cerdo',      price: 5990,  unit: 'kg' },
    pollo:     { id: 'prod-pol-003', name: 'Trutro de Pollo',     price: 3990,  unit: 'kg' },
    embutidos: { id: 'prod-emb-002', name: 'Chorizo Parrillero',  price: 2490,  unit: 'kg' },
    perro:     { id: 'prod-pelet-001', name: 'Pelet Económico',   price: 2490,  unit: 'kg' },
  },
  parrillero: {
    vacuno:    { id: 'prod-vac-001', name: 'Lomo Liso',           price: 11990, unit: 'kg' },
    cerdo:     { id: 'prod-cer-002', name: 'Costillar de Cerdo',  price: 7990,  unit: 'kg' },
    pollo:     { id: 'prod-pol-002', name: 'Pechuga de Pollo',    price: 4990,  unit: 'kg' },
    embutidos: { id: 'prod-emb-001', name: 'Longaniza Casera',    price: 1290,  unit: 'un', gramsPerUnit: 180 },
    perro:     { id: 'prod-pelet-002', name: 'Pelet Medio',       price: 3990,  unit: 'kg' },
  },
  premium: {
    vacuno:    { id: 'prod-vac-002', name: 'Lomo Vetado',         price: 12990, unit: 'kg' },
    cerdo:     { id: 'prod-cer-002', name: 'Costillar de Cerdo',  price: 7990,  unit: 'kg' },
    pollo:     { id: 'prod-pol-002', name: 'Pechuga de Pollo',    price: 4990,  unit: 'kg' },
    embutidos: { id: 'prod-emb-001', name: 'Longaniza Casera',    price: 1290,  unit: 'un', gramsPerUnit: 180 },
    perro:     { id: 'prod-pelet-003', name: 'Pelet Premium',     price: 5990,  unit: 'kg' },
  },
}

const PACK_TIERS = [
  { tier: 'economico',  nombre: 'Pack Económico',   emoji: '🏠', color: 'border-green-400 bg-green-50',  badge: 'bg-green-600'  },
  { tier: 'parrillero', nombre: 'Pack Parrillero',  emoji: '🔥', color: 'border-orange-400 bg-orange-50', badge: 'bg-orange-600' },
  { tier: 'premium',    nombre: 'Pack Premium',     emoji: '⭐', color: 'border-yellow-500 bg-yellow-50', badge: 'bg-yellow-600' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function roundKg(g: number) { return Math.max(0.25, Math.round(g / 1000 / 0.25) * 0.25) }
function roundUn(g: number, gpu: number) { return Math.max(1, Math.round(g / gpu)) }
function fmtQty(q: number, u: 'kg' | 'un') {
  if (u === 'un') return `${q} un`
  return q < 1 ? `${q * 1000} g` : `${q} kg`
}

// ── Tarjeta de pack ─────────────────────────────────────────────────────────
function PackCard({
  tier, nombre, emoji, color, badge,
  selectedCarnes, totalGramos, totalPersonas, totalPerros,
}: {
  tier: string; nombre: string; emoji: string; color: string; badge: string
  selectedCarnes: string[]; totalGramos: number; totalPersonas: number; totalPerros: number
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const gramos    = totalGramos > 0 ? totalGramos : 6 * GPP.hombres
  const isExample = totalPersonas === 0

  // Una porción igual de gramos por cada tipo de carne seleccionado
  const gPerType  = selectedCarnes.length > 0 ? gramos / selectedCarnes.length : gramos

  const items = useMemo(() => {
    const tierProducts = PRODUCTS_BY_TIER[tier]
    return selectedCarnes.map(carneId => {
      const p  = tierProducts[carneId]
      if (!p) return null
      const qty = p.unit === 'kg'
        ? roundKg(gPerType)
        : roundUn(gPerType, p.gramsPerUnit ?? 200)
      return { ...p, quantity: qty }
    }).filter(Boolean) as (ProductDef & { quantity: number })[]
  }, [tier, selectedCarnes, gPerType])

  // Producto para perros según tier
  const tierProducts  = PRODUCTS_BY_TIER[tier]
  const perroDef      = tierProducts['perro']
  const perroItem     = totalPerros > 0 && perroDef
    ? { ...perroDef, quantity: roundKg(totalPerros * GPP.perros) }
    : null

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    + (perroItem ? perroItem.price * perroItem.quantity : 0)

  const handleAdd = () => {
    items.forEach(item => addItem({
      id: item.id, name: item.name,
      price: item.price, quantity: item.quantity, unit: item.unit,
    }))
    if (perroItem) addItem({ id: perroItem.id, name: perroItem.name, price: perroItem.price, quantity: perroItem.quantity, unit: perroItem.unit })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  if (items.length === 0 && !perroItem) return null

  return (
    <div className={`rounded-2xl border-2 p-5 ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-black text-gray-900 text-sm">{nombre}</p>
            {isExample
              ? <p className="text-[10px] text-gray-400">Ejemplo para 6 personas</p>
              : <p className="text-xs text-gray-500">{totalPersonas} persona{totalPersonas !== 1 ? 's' : ''} · {(gramos / 1000).toFixed(2)} kg total</p>
            }
          </div>
        </div>
        <span className={`text-xs font-black text-white px-2.5 py-1 rounded-full shrink-0 ml-2 ${badge}`}>
          ${total.toLocaleString('es-CL')}
        </span>
      </div>

      <ul className="space-y-1.5 mb-4">
        {items.map(item => (
          <li key={item.id} className="flex justify-between items-center text-xs">
            <span className="text-gray-600">• {item.name}</span>
            <span className="font-bold text-gray-900 ml-2 shrink-0">{fmtQty(item.quantity, item.unit)}</span>
          </li>
        ))}
        {perroItem && (
          <li className="flex justify-between items-center text-xs bg-amber-50 rounded-lg px-2 py-1">
            <span className="text-amber-700">🐕 {perroItem.name}</span>
            <span className="font-bold text-amber-800 ml-2 shrink-0">{fmtQty(perroItem.quantity, 'kg')}</span>
          </li>
        )}
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

// ── Componente principal ───────────────────────────────────────────────────
export default function AsadoCalculator() {
  const [hombres, setHombres] = useState('')
  const [mujeres, setMujeres] = useState('')
  const [ninos,   setNinos]   = useState('')
  const [perros,  setPerros]  = useState('')
  const [carnes,  setCarnes]  = useState<Record<string, boolean>>({
    vacuno: false, cerdo: false, pollo: false, embutidos: false,
  })
  const [result, setResult] = useState<null | Record<string, number>>(null)

  const totalPersonas  = (parseInt(hombres) || 0) + (parseInt(mujeres) || 0) + (parseInt(ninos) || 0)
  const totalPerros    = parseInt(perros) || 0
  const gramosPerros   = totalPerros * GPP.perros
  const totalGramos    = useMemo(() =>
    (parseInt(hombres) || 0) * GPP.hombres +
    (parseInt(mujeres) || 0) * GPP.mujeres +
    (parseInt(ninos)   || 0) * GPP.ninos,
  [hombres, mujeres, ninos])
  const selectedCarnes = useMemo(() => CARNES.filter(c => carnes[c.id]).map(c => c.id), [carnes])

  const calcular = () => {
    if (selectedCarnes.length === 0 || totalGramos === 0) return
    const gpc = Math.round(totalGramos / selectedCarnes.length)
    const res: Record<string, number> = {}
    selectedCarnes.forEach(id => { res[id] = gpc })
    if (gramosPerros > 0) res['perro'] = gramosPerros
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

          {/* ── Asistentes humanos ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-500" />
              <h4 className="font-bold text-gray-900 text-sm">¿Cuántos asistentes?</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'hombres', label: 'Hombres', emoji: '👨', val: hombres, set: setHombres, g: 400 },
                { key: 'mujeres', label: 'Mujeres', emoji: '👩', val: mujeres, set: setMujeres, g: 300 },
                { key: 'ninos',   label: 'Niños',   emoji: '👦', val: ninos,   set: setNinos,   g: 200 },
              ].map(p => (
                <div key={p.key} className="text-center">
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{p.label}</label>
                  <input type="number" min="0" placeholder="0" value={p.val}
                    onChange={e => { p.set(e.target.value); setResult(null) }}
                    className="w-full px-2 py-2 border border-gray-200 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{p.g}g c/u</p>
                </div>
              ))}
            </div>
            {totalPersonas > 0 && (
              <p className="text-xs text-gray-500 text-center bg-gray-50 rounded-xl py-2 mt-2">
                👥 <strong>{totalPersonas} personas</strong> · <strong>{totalGramos.toLocaleString('es-CL')} g</strong> de carne para el asado
              </p>
            )}
          </div>

          {/* ── Sección mascotas — separada visualmente ── */}
          <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐾</span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">¿Vendrán mascotas?</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Somos pet friendly 🐕</p>
                </div>
              </div>
              {/* Tooltip informativo */}
              <div className="relative group">
                <button className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs font-black flex items-center justify-center hover:bg-amber-300 transition flex-shrink-0 mt-0.5">
                  i
                </button>
                <div className="absolute right-0 top-7 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity leading-relaxed">
                  No calculamos consumo de carne para mascotas. Solo recomendamos snacks, premios, huesos recreativos u otros productos disponibles para ellas. 🦴
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="text-center">
                <div className="text-2xl mb-1">🐕</div>
                <label className="block text-xs font-medium text-amber-800 mb-1.5">Perros acompañantes</label>
                <input type="number" min="0" placeholder="0" value={perros}
                  onChange={e => { setPerros(e.target.value); setResult(null) }}
                  className="w-full px-2 py-2 border border-amber-300 bg-white rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <p className="text-xs text-amber-700 mt-3 leading-relaxed">
              ⚠️ Las mascotas <strong>no se consideran</strong> en el cálculo de carne del asado.
              Esta información se usa únicamente para sugerir productos pet friendly.
            </p>

            {totalPerros > 0 && (
              <p className="text-xs text-amber-800 text-center bg-amber-100 rounded-xl py-2 mt-2 font-medium">
                🐕 {totalPerros} mascota{totalPerros !== 1 ? 's' : ''} — sugeriremos productos pet friendly en los packs
              </p>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-3">¿Qué tipos de carne?</h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CARNES.map(c => (
                <button key={c.id}
                  onClick={() => { setCarnes(p => ({ ...p, [c.id]: !p[c.id] })); setResult(null) }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    carnes[c.id] ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={calcular}
            disabled={totalPersonas === 0 || selectedCarnes.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4" /> Calcular carne para mi asado
          </button>

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
                {result['perro'] && (
                  <div className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-medium text-amber-800">🐕 Alimento para perros</span>
                    <span className="font-black text-amber-700">{formatKg(result['perro'])}</span>
                  </div>
                )}
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
                · {totalPersonas} persona{totalPersonas !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="space-y-3">
          {PACK_TIERS.map(pt => (
            <PackCard
              key={pt.tier}
              tier={pt.tier}
              nombre={pt.nombre}
              emoji={pt.emoji}
              color={pt.color}
              badge={pt.badge}
              selectedCarnes={selectedCarnes}
              totalGramos={totalGramos}
              totalPersonas={totalPersonas}
              totalPerros={totalPerros}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
