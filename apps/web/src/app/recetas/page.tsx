'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ChefHat, Flame, ArrowRight } from 'lucide-react'

const RECETAS_CASA = [
  {
    titulo: "Cazuela de Vacuno",
    desc: "Carne tierna cocida a fuego lento con papas, zapallo, choclo y verduras de temporada.",
    tiempo: "90 min",
    porciones: "4 personas",
    ingredientes: ["500g osobuco o posta negra", "2 papas grandes", "1 trozo zapallo", "1 choclo", "2 zanahorias", "1 rama apio", "Sal, pimienta y orégano"],
    preparacion: [
      "Sella la carne en una olla con aceite caliente por todos los lados.",
      "Agrega 1.5 litros de agua fría, la cebolla y lleva a hervor.",
      "Baja el fuego y cocina 40 minutos. Espuma cuando sea necesario.",
      "Agrega papas, zapallo y zanahoria. Cocina 20 minutos más.",
      "Suma el choclo y el apio. Cocina 15 minutos finales.",
      "Rectifica sal y sirve con arroz graneado.",
    ],
    imagen: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    categoria: "/categoria/vacuno",
    corte: "Osobuco o Posta Negra",
    tag: "Cocina casera",
    tagColor: "bg-amber-600",
  },
  {
    titulo: "Lomo a la Plancha",
    desc: "Filete de lomo sellado en sartén caliente, dorado por fuera y jugoso por dentro.",
    tiempo: "20 min",
    porciones: "2 personas",
    ingredientes: ["2 bifes de lomo (200g c/u)", "Sal de mar y pimienta negra", "Ajo en polvo", "Aceite de oliva", "Limón para servir"],
    preparacion: [
      "Saca la carne del refrigerador 30 minutos antes.",
      "Calienta la sartén o plancha a fuego muy alto hasta que humee.",
      "Seca la carne con papel absorbente. Unta con aceite de oliva.",
      "Sella 3 minutos por lado para término medio.",
      "Reposa 5 minutos sobre una tabla antes de cortar.",
      "Sirve con sal de mar gruesa y jugo de limón.",
    ],
    imagen: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80",
    categoria: "/categoria/vacuno",
    corte: "Lomo Liso",
    tag: "Rápido y fácil",
    tagColor: "bg-green-600",
  },
  {
    titulo: "Estofado de Vacuno",
    desc: "Carne de vacuno en su jugo con papas, zanahorias y aliños a fuego lento.",
    tiempo: "2 horas",
    porciones: "6 personas",
    ingredientes: ["700g plateada o palanca", "3 papas medianas", "2 zanahorias", "1 cebolla", "2 tomates maduros", "½ taza vino tinto", "1 hoja laurel", "Comino, sal y pimienta"],
    preparacion: [
      "Corta la carne en trozos medianos y dora en aceite con la cebolla.",
      "Agrega el tomate rallado, el vino y el laurel.",
      "Cubre con agua y cocina a fuego bajo 1 hora tapado.",
      "Agrega papas y zanahorias en trozos. Cocina 40 minutos más.",
      "Rectifica sazón, espesa la salsa si es necesario.",
      "Sirve con arroz o marraqueta.",
    ],
    imagen: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80",
    categoria: "/categoria/vacuno",
    corte: "Plateada",
    tag: "Plato de invierno",
    tagColor: "bg-blue-600",
  },
  {
    titulo: "Pollo al Jugo",
    desc: "Trutros al horno bañados en su propio jugo con papas doradas y aliños.",
    tiempo: "1 hora",
    porciones: "4 personas",
    ingredientes: ["4 trutros de pollo", "3 papas medianas", "1 cebolla en plumas", "Ajo, orégano, sal", "1 limón", "Aceite de oliva"],
    preparacion: [
      "Macera el pollo con limón, ajo, orégano, sal y aceite 1 hora.",
      "Precalienta el horno a 200°C.",
      "Coloca papas y cebolla en la base de la fuente. Encima el pollo.",
      "Hornea 50 minutos volteando a mitad de cocción.",
      "Los últimos 10 minutos sube a 220°C para dorar la piel.",
      "Sirve con el jugo del fondo de la fuente.",
    ],
    imagen: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80",
    categoria: "/categoria/pollo",
    corte: "Trutro de Pollo",
    tag: "Fácil",
    tagColor: "bg-yellow-600",
  },
]

const RECETAS_PARRILLA = [
  {
    titulo: "Asado de Tira Clásico",
    desc: "El corte favorito de los chilenos. A fuego medio, vuelta y vuelta, con chimichurri casero.",
    tiempo: "45 min",
    porciones: "4 personas",
    ingredientes: ["1.2 kg asado de tira", "Sal gruesa", "Para chimichurri: 1 taza perejil fresco, 4 dientes ajo, ½ taza aceite, ¼ taza vinagre, 1 cdta orégano, sal, ají"],
    preparacion: [
      "Prende las brasas con anticipación (30-40 min antes).",
      "Salar generosamente el asado por ambos lados con sal gruesa.",
      "Espera brasas uniformes sin llama directa.",
      "Cocina 15 min por lado a fuego medio. El hueso siempre hacia arriba.",
      "Para el chimichurri: pica el perejil y ajo finamente, mezcla con el resto.",
      "Reposa 5 minutos antes de servir. Corta entre los huesos.",
    ],
    imagen: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80",
    categoria: "/categoria/vacuno",
    corte: "Asado de Tira",
    tag: "Clásico chileno",
    tagColor: "bg-red-600",
  },
  {
    titulo: "Costillas BBQ a las Brasas",
    desc: "Costillas de cerdo marinadas con salsa BBQ casera, cocinadas lentamente sobre brasas.",
    tiempo: "2.5 horas",
    porciones: "4 personas",
    ingredientes: ["1.5 kg costillas de cerdo", "½ taza salsa BBQ", "2 cdas miel", "1 cda mostaza", "2 dientes ajo", "Paprika ahumada", "Sal y pimienta"],
    preparacion: [
      "Mezcla BBQ, miel, mostaza, ajo rallado y paprika para la marinada.",
      "Unta bien las costillas y deja marinar mínimo 2 horas (mejor de un día para otro).",
      "Cocina a fuego BAJO por 1.5 horas cubiertas con papel aluminio.",
      "Destapa, sube el fuego y sella 15 min por lado glaseando con más salsa.",
      "Las costillas están listas cuando la carne se separa del hueso fácilmente.",
      "Sirve con papas al rescoldo o ensalada chilena.",
    ],
    imagen: "https://images.unsplash.com/photo-1544025162-d76538485696?w=800&q=80",
    categoria: "/categoria/cerdo",
    corte: "Costillar de Cerdo",
    tag: "Parrilla",
    tagColor: "bg-orange-600",
  },
  {
    titulo: "Lomo Vetado a las Brasas",
    desc: "El rey de la parrilla. Con su marmoleo natural, queda jugoso y con un sabor único.",
    tiempo: "30 min",
    porciones: "3 personas",
    ingredientes: ["700g lomo vetado entero", "Sal gruesa", "Pimienta negra recién molida", "50g mantequilla", "2 ramas tomillo", "2 dientes ajo"],
    preparacion: [
      "Temperatura ambiente: saca la carne 1 hora antes del refrigerador.",
      "Sella el lomo a fuego ALTO 5 minutos por cada lado hasta dorar.",
      "Baja a fuego medio, cocina 15 min más rotando para término.",
      "Saltea ajo en mantequilla con tomillo hasta aromar.",
      "Baña el lomo repetidamente con la mantequilla en los últimos minutos.",
      "Reposa 10 minutos tapado con papel aluminio. Corta en láminas gruesas.",
    ],
    imagen: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80",
    categoria: "/categoria/vacuno",
    corte: "Lomo Vetado",
    tag: "Premium",
    tagColor: "bg-gray-800",
  },
  {
    titulo: "Longanizas y Chorizos a la Parrilla",
    desc: "El clásico picoteo de inicio. Bien sellados, sin reventar, con mostaza y marraqueta.",
    tiempo: "20 min",
    porciones: "6 personas",
    ingredientes: ["6 longanizas caseras", "6 chorizos parrilleros", "Marraqueta o pan", "Mostaza y mayonesa", "Pebre opcional"],
    preparacion: [
      "Pincha las longanizas levemente con un tenedor (los chorizos NO).",
      "Parrilla a fuego MEDIO-ALTO. Coloca los embutidos.",
      "Rota cada 5 minutos para dorar parejo por todos los lados.",
      "Las longanizas están listas cuando la piel se ve dorada y firme.",
      "Sirve de inmediato sobre marraqueta con mostaza.",
      "Acompaña con pebre chileno para los más atrevidos.",
    ],
    imagen: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80",
    categoria: "/categoria/embutidos",
    corte: "Longanizas y Chorizos",
    tag: "Aperitivo",
    tagColor: "bg-yellow-700",
  },
]

function RecetaCard({ r }: { r: typeof RECETAS_CASA[0] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="relative h-56 overflow-hidden shrink-0">
        <img src={r.imagen} alt={r.titulo} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        <span className={`absolute top-3 left-3 ${r.tagColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>{r.tag}</span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h4 className="font-black text-gray-900 text-lg mb-1">{r.titulo}</h4>
        <p className="text-gray-500 text-sm mb-3">{r.desc}</p>
        <div className="flex gap-4 text-xs text-gray-400 mb-3">
          <span>⏱ {r.tiempo}</span>
          <span>👥 {r.porciones}</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Corte ideal:</span>
          <Link href={r.categoria} className="text-xs font-bold text-red-600 hover:underline">{r.corte} →</Link>
        </div>

        <button onClick={() => setOpen(!open)}
          className="text-sm font-semibold text-red-600 hover:text-red-700 text-left flex items-center gap-1 transition mb-1">
          {open ? '▲ Ocultar receta' : '▼ Ver receta completa'}
        </button>

        {open && (
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ingredientes</p>
              <ul className="space-y-1">
                {r.ingredientes.map(ing => (
                  <li key={ing} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span>{ing}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Preparación</p>
              <ol className="space-y-1.5">
                {r.preparacion.map((paso, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-red-500 font-bold shrink-0 w-4">{i + 1}.</span>{paso}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecetasPage() {
  const [tab, setTab] = useState<'casa' | 'parrilla'>('casa')

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">

        {/* Header */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-3">Inspiración culinaria</p>
            <h1 className="text-5xl font-black mb-4">Recetas El Fundo</h1>
            <p className="text-gray-400 max-w-xl">Del corte correcto a la mesa perfecta. Recetas probadas para que saques el máximo sabor a nuestra carne.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[60px] z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 py-3">
            <button onClick={() => setTab('casa')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${tab === 'casa' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <ChefHat className="w-4 h-4" /> Cocina en casa
            </button>
            <button onClick={() => setTab('parrilla')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${tab === 'parrilla' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Flame className="w-4 h-4" /> Para la parrilla
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {tab === 'casa' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <ChefHat className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-black text-gray-900">Recetas para cocinar en casa</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {RECETAS_CASA.map(r => <RecetaCard key={r.titulo} r={r} />)}
              </div>
            </>
          )}
          {tab === 'parrilla' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-black text-gray-900">Recetas para la parrilla</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {RECETAS_PARRILLA.map(r => <RecetaCard key={r.titulo} r={r} />)}
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="bg-red-50 border-t border-red-100 py-12 text-center">
          <p className="text-gray-600 mb-2">¿Tienes los ingredientes?</p>
          <h3 className="text-2xl font-black text-gray-900 mb-6">Pide tus cortes ahora y los tenemos en tu puerta</h3>
          <Link href="/productos"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition group">
            Ver catálogo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

      </main>
      <Footer />
    </>
  )
}
