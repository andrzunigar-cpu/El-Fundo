import React, { useState, useEffect, useRef } from 'react'
import { Search, Package } from 'lucide-react'
import { clsx } from 'clsx'

const CATS = [
  { id: '',                label: 'Todos',      color: 'gray'   },
  { id: 'cat-vacuno',      label: 'Vacuno',     color: 'red'    },
  { id: 'cat-cerdo',       label: 'Cerdo',      color: 'orange' },
  { id: 'cat-cordero',     label: 'Cordero',    color: 'amber'  },
  { id: 'cat-pollo',       label: 'Pollo',      color: 'yellow' },
  { id: 'cat-embutidos',   label: 'Embutidos',  color: 'pink'   },
  { id: 'cat-parrilla',    label: 'Parrilla',   color: 'rose'   },
  { id: 'cat-congelados',  label: 'Congelados', color: 'cyan'   },
  { id: 'cat-bebidas',     label: 'Bebidas',    color: 'sky'    },
  { id: 'cat-otros',       label: 'Otros',      color: 'slate'  },
]

const CAT_ACTIVE: Record<string, string> = {
  gray:   'bg-gray-600 text-white',
  red:    'bg-red-600 text-white',
  orange: 'bg-orange-600 text-white',
  amber:  'bg-amber-500 text-white',
  yellow: 'bg-yellow-500 text-black',
  pink:   'bg-pink-600 text-white',
  rose:   'bg-rose-600 text-white',
  cyan:   'bg-cyan-600 text-white',
  sky:    'bg-sky-500 text-white',
  blue:   'bg-blue-600 text-white',
  slate:  'bg-slate-600 text-white',
}

const CAT_INACTIVE = 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'

interface ProductGridProps {
  onSelect: (product: any) => void
  selectedId: string | null
}

export function ProductGrid({ onSelect, selectedId }: ProductGridProps) {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [loading, setLoading] = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadProducts = () => {
    const api = (window as any).posAPI
    api.products.getAll().then((data: any[]) => {
      setProducts(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadProducts()
    // Recargar cuando el stock cambie desde otro módulo (ej: reset)
    const api = (window as any).posAPI
    api.on('stock-updated', loadProducts)
    return () => api.off('stock-updated', loadProducts)
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      const api = (window as any).posAPI
      api.products.getAll().then(setProducts)
      return
    }
    const t = setTimeout(() => {
      const api = (window as any).posAPI
      api.products.search(search).then(setProducts)
    }, 180)
    return () => clearTimeout(t)
  }, [search])

  const filtered = products.filter(p =>
    (!activeCat || p.category_id === activeCat)
  )

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto, SKU..."
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 placeholder:text-gray-500"
        />
      </div>

      {/* Filtros por categoría */}
      <div className="flex gap-2 flex-wrap">
        {CATS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeCat === cat.id ? CAT_ACTIVE[cat.color] : CAT_INACTIVE
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin productos{activeCat ? ' en esta categoría' : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(product => {
            const stock = product.available ?? product.quantity ?? 0
            const isOut = stock <= 0
            const isSelected = selectedId === product.id
            return (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className={clsx(
                  'relative text-left rounded-xl p-3 transition-all border-2',
                  isSelected
                    ? 'bg-red-950 border-red-500 scale-[1.02] shadow-lg shadow-red-900/40'
                    : 'bg-gray-800 hover:bg-gray-700 hover:scale-[1.02] cursor-pointer border-transparent hover:border-gray-600'
                )}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                )}
                {!isSelected && isOut && (
                  <span className="absolute top-1.5 right-1.5 bg-gray-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    Sin stock
                  </span>
                )}
                {!isSelected && !isOut && stock <= 2 && (
                  <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    ¡Último!
                  </span>
                )}
                <p className="font-semibold text-sm text-white leading-tight break-words pr-6">{product.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{product.sku}</p>
                <p className={clsx('font-bold text-sm mt-2', isSelected ? 'text-red-300' : 'text-red-400')}>
                  {formatPrice(product.base_price)}
                  <span className="text-gray-500 font-normal text-xs">/{product.price_unit ?? 'kg'}</span>
                </p>
                <p className={clsx('text-[10px] mt-0.5', isOut ? 'text-orange-500' : 'text-emerald-500')}>
                  Stock: {Number(stock).toFixed(product.requires_weight ? 1 : 0)}
                  {product.requires_weight ? ' kg' : ' un.'}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
