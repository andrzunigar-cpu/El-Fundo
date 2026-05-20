import React from 'react'
import { ProductGrid } from '../products/ProductGrid'
import { CartPanel } from '../pos/CartPanel'

export function SalesView() {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <ProductGrid />
      </div>
      <aside className="w-[420px] border-l border-gray-800 flex-shrink-0">
        <CartPanel />
      </aside>
    </div>
  )
}
