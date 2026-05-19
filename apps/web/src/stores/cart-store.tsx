'use client'

import { createContext, useContext, useRef } from 'react'
import { create, useStore } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@elfundo/shared'

interface CartItem {
  product: Product
  quantity: number
  weightKg?: number
  subtotal: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity: number, weightKg?: number) => void
  removeItem: (productId: string) => void
  updateItem: (productId: string, quantity: number, weightKg?: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

const createCartStore = () =>
  create<CartState>()(
    persist(
      (set, get) => ({
        items: [],

        addItem: (product, quantity, weightKg) => {
          const price = product.onlinePrice ?? product.basePrice
          const subtotal = product.requiresWeight
            ? Math.round(price * (weightKg ?? quantity))
            : price * quantity

          set(state => {
            const existing = state.items.find(i => i.product.id === product.id)
            if (existing) {
              return {
                items: state.items.map(i =>
                  i.product.id === product.id
                    ? { ...i, quantity: i.quantity + quantity, weightKg: (i.weightKg ?? 0) + (weightKg ?? 0), subtotal: i.subtotal + subtotal }
                    : i
                ),
              }
            }
            return { items: [...state.items, { product, quantity, weightKg, subtotal }] }
          })
        },

        removeItem: (productId) =>
          set(state => ({ items: state.items.filter(i => i.product.id !== productId) })),

        updateItem: (productId, quantity, weightKg) =>
          set(state => ({
            items: state.items.map(i => {
              if (i.product.id !== productId) return i
              const price = i.product.onlinePrice ?? i.product.basePrice
              const subtotal = i.product.requiresWeight
                ? Math.round(price * (weightKg ?? quantity))
                : price * quantity
              return { ...i, quantity, weightKg, subtotal }
            }),
          })),

        clearCart: () => set({ items: [] }),
        total: () => get().items.reduce((s, i) => s + i.subtotal, 0),
        itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
      }),
      { name: 'elfundo-cart' }
    )
  )

type CartStore = ReturnType<typeof createCartStore>
const CartContext = createContext<CartStore | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<CartStore>()
  if (!storeRef.current) storeRef.current = createCartStore()
  return <CartContext.Provider value={storeRef.current}>{children}</CartContext.Provider>
}

export function useCartStore<T>(selector: (state: CartState) => T): T {
  const store = useContext(CartContext)
  if (!store) throw new Error('useCartStore must be inside CartProvider')
  return useStore(store, selector)
}
