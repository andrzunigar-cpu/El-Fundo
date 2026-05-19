'use client'

import { useState } from 'react'
import { ShoppingCart, Scale } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '../../stores/cart-store'

interface Props { product: any }

export function ProductCard({ product }: Props) {
  const [kg, setKg] = useState(0.5)
  const addItem = useCartStore(s => s.addItem)
  const formatCLP = (n: number) => `$${n.toLocaleString('es-CL')}`

  const price = product.onlinePrice ?? product.basePrice
  const isLowStock = (product.stockLevel?.quantity ?? 99) < 3

  const handleAdd = () => {
    addItem(product, product.requiresWeight ? 1 : 1, product.requiresWeight ? kg : undefined)
    toast.success(`${product.name} agregado`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* Imagen */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 h-40 flex items-center justify-center relative">
        {isLowStock && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            ¡Últimas unidades!
          </span>
        )}
        <span className="text-6xl">🥩</span>
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{product.meatType}</p>
        <h3 className="font-bold text-gray-900 mb-1 leading-tight">{product.name}</h3>

        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xl font-black text-red-600">{formatCLP(price)}</span>
          <span className="text-xs text-gray-500">/{product.priceUnit === 'kg' ? 'kg' : 'unidad'}</span>
        </div>

        {product.requiresWeight && (
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-3 h-3 text-gray-400" />
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={kg}
              onChange={e => setKg(parseFloat(e.target.value) || 0.5)}
              className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1 text-center"
            />
            <span className="text-xs text-gray-500">kg</span>
            <span className="text-xs font-semibold text-gray-700 ml-auto">
              {formatCLP(Math.round(price * kg))}
            </span>
          </div>
        )}

        <button
          onClick={handleAdd}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Agregar
        </button>
      </div>
    </div>
  )
}
