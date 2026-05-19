import React, { useState, useEffect, useCallback } from 'react'
import { Search, Package } from 'lucide-react'
import { usePOSStore } from '../../stores/posStore'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

export function ProductGrid() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { addToCart } = usePOSStore()

  useEffect(() => {
    const api = (window as any).posAPI
    api.products.getAll().then((data: any[]) => {
      setProducts(data)
      setLoading(false)
    })
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
    }, 200)
    return () => clearTimeout(t)
  }, [search])

  const handleAdd = useCallback((product: any) => {
    if (product.requires_weight) {
      // Para productos por kg, abrir modal de peso (simplificado: 0.5 kg por defecto)
      addToCart({ ...product, id: product.id, requiresWeight: true, basePrice: product.base_price, sku: product.sku, name: product.name }, 1, 0.5)
    } else {
      addToCart({ ...product, id: product.id, requiresWeight: false, basePrice: product.base_price, sku: product.sku, name: product.name }, 1)
    }
    toast.success(`${product.name} agregado`, { duration: 1000, position: 'bottom-right' })
  }, [addToCart])

  const formatPrice = (price: number) => `$${price.toLocaleString('es-CL')}`

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto, SKU..."
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 placeholder:text-gray-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Package className="w-12 h-12 mx-auto mb-2" />
          <p>Sin resultados</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {products.map(product => {
            const stock = product.available ?? product.quantity ?? 0
            const isOut = stock <= 0
            return (
              <button
                key={product.id}
                onClick={() => !isOut && handleAdd(product)}
                disabled={isOut}
                className={clsx(
                  'relative text-left rounded-xl p-3 transition-all',
                  isOut
                    ? 'bg-gray-800 opacity-40 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 hover:scale-[1.02] active:scale-100 cursor-pointer'
                )}
              >
                {stock <= 2 && stock > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-xs font-bold px-1.5 rounded-full">
                    ¡Último!
                  </span>
                )}
                <p className="font-semibold text-sm text-white truncate">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                <p className="text-red-400 font-bold text-sm mt-2">
                  {formatPrice(product.base_price)}
                  <span className="text-gray-500 font-normal text-xs">/{product.price_unit ?? 'kg'}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Stock: {Number(stock).toFixed(product.requires_weight ? 1 : 0)} {product.requires_weight ? 'kg' : 'un.'}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
