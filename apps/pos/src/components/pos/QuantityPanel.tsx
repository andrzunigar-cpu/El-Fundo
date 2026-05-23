import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Minus, Plus, ShoppingCart, X, Scale, Package } from 'lucide-react'

interface QuantityPanelProps {
  product: any | null
  onAdd: (product: any, quantity: number, weightKg?: number) => void
  onCancel: () => void
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

export function QuantityPanel({ product, onAdd, onCancel }: QuantityPanelProps) {
  const [value, setValue] = useState<string>('1')
  const inputRef = useRef<HTMLInputElement>(null)

  const isWeight = !!product?.requires_weight

  // Reset cuando cambia el producto
  useEffect(() => {
    if (product) {
      setValue(isWeight ? '1.000' : '1')
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 30)
    }
  }, [product?.id])

  const numValue = Math.max(0, parseFloat(value) || 0)
  const price = product?.base_price ?? 0
  const total = isWeight
    ? Math.round(price * numValue)
    : price * Math.max(0, Math.round(numValue))

  const adjust = useCallback((delta: number) => {
    const current = parseFloat(value) || 0
    const next = Math.max(isWeight ? 0.001 : 1, current + delta)
    setValue(isWeight ? next.toFixed(3) : String(Math.round(next)))
  }, [value, isWeight])

  const handleAdd = useCallback(() => {
    const n = parseFloat(value)
    if (isNaN(n) || n <= 0) return
    if (isWeight) {
      onAdd(product, 1, parseFloat(n.toFixed(3)))
    } else {
      onAdd(product, Math.max(1, Math.round(n)))
    }
  }, [product, value, isWeight, onAdd])

  // Teclado: Enter = agregar, Escape = cancelar
  useEffect(() => {
    if (!product) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [product, handleAdd, onCancel])

  // ── Estado vacío ────────────────────────────────────────────
  if (!product) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-r border-gray-800 flex flex-col items-center justify-center bg-gray-950 text-gray-600 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-800/60 flex items-center justify-center">
          <ShoppingCart className="w-7 h-7 opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Selecciona un producto</p>
          <p className="text-xs mt-0.5 opacity-60">del panel izquierdo</p>
        </div>
      </div>
    )
  }

  // ── Panel activo ────────────────────────────────────────────
  return (
    <div className="w-72 flex-shrink-0 border-l border-r border-gray-800 flex flex-col bg-gray-950">

      {/* Cabecera del producto */}
      <div className="p-4 border-b border-gray-800 flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-bold text-white leading-tight">{product.name}</p>
          <p className="text-xs text-gray-500 font-mono mt-1">{product.sku}</p>
          {product.format_label && (
            <span className="inline-block mt-1.5 text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {product.format_label}
            </span>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-300 transition-colors mt-0.5 flex-shrink-0"
          title="Cancelar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Precio unitario */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 text-sm text-gray-400">
        {isWeight
          ? <Scale className="w-4 h-4 text-blue-400" />
          : <Package className="w-4 h-4 text-green-400" />}
        <span>
          {formatCLP(price)}
          <span className="text-gray-600 text-xs">
            &nbsp;/ {product.price_unit || (isWeight ? 'kg' : 'un')}
          </span>
        </span>
      </div>

      {/* Input de cantidad/peso */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 gap-5">

        <p className="text-[10px] uppercase tracking-widest text-gray-500">
          {isWeight ? 'Peso (kilogramos)' : 'Cantidad (unidades)'}
        </p>

        {/* Campo numérico grande */}
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={e => e.target.select()}
            min={isWeight ? 0.001 : 1}
            step={isWeight ? 0.001 : 1}
            className="w-full text-center text-4xl font-black bg-gray-900 border-2 border-gray-700 focus:border-red-500 rounded-2xl py-4 px-2 text-white focus:outline-none transition-colors"
          />
          {isWeight && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
              kg
            </span>
          )}
        </div>

        {/* Botones de ajuste rápido — solo unidades */}
        {isWeight ? null : (
          <div className="w-full">
            {/* Fila -/+ grandes */}
            <div className="flex items-center gap-3 justify-center mb-3">
              <button
                onClick={() => adjust(-1)}
                className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {[1, 2, 5, 10].map(v => (
                  <button
                    key={v}
                    onClick={() => setValue(String(v))}
                    className={`w-11 h-11 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                      Math.round(numValue) === v
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => adjust(1)}
                className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Total + botón Agregar */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-400 text-sm">Total</span>
          <span className="text-2xl font-black text-white">{formatCLP(total)}</span>
        </div>
        <button
          onClick={handleAdd}
          disabled={numValue <= 0}
          className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          Agregar al carrito
        </button>
        <p className="text-center text-[10px] text-gray-600">Enter para agregar · Esc para cancelar</p>
      </div>
    </div>
  )
}
