import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, Order, Customer, StockLevel } from '../types'

interface CartItem {
  product: Product
  quantity: number
  weightKg?: number
  subtotal: number
}

interface POSStore {
  // ── Estado de la caja ────────────────────────────────────
  isOnline: boolean
  isSyncing: boolean
  pendingSyncItems: number
  sessionId: string | null
  cashierId: string | null

  // ── Carrito actual ───────────────────────────────────────
  cart: CartItem[]
  selectedCustomer: Customer | null
  paymentMethod: string
  notes: string

  // ── Pedidos web pendientes ───────────────────────────────
  pendingWebOrders: Order[]
  hasNewOrders: boolean

  // ── Alertas de stock bajo ────────────────────────────────
  lowStockAlerts: Array<{ productId: string; name: string; current: number; minimum: number }>

  // ── Acciones carrito ─────────────────────────────────────
  addToCart: (product: Product, quantity: number, weightKg?: number) => void
  removeFromCart: (productId: string) => void
  updateCartItem: (productId: string, quantity: number, weightKg?: number) => void
  clearCart: () => void
  setCustomer: (customer: Customer | null) => void
  setPaymentMethod: (method: string) => void
  setNotes: (notes: string) => void

  // ── Acciones sincronización ──────────────────────────────
  setOnlineStatus: (online: boolean) => void
  setSyncStatus: (syncing: boolean, pending: number) => void

  // ── Acciones pedidos web ─────────────────────────────────
  addWebOrder: (order: Order) => void
  dismissNewOrders: () => void
  updateWebOrderStatus: (orderId: string, status: string) => void

  // ── Computados ───────────────────────────────────────────
  cartTotal: () => number
  cartItemCount: () => number
  cartSubtotal: () => number
}

export const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      isOnline: false,
      isSyncing: false,
      pendingSyncItems: 0,
      sessionId: null,
      cashierId: null,
      cart: [],
      selectedCustomer: null,
      paymentMethod: 'cash',
      notes: '',
      pendingWebOrders: [],
      hasNewOrders: false,
      lowStockAlerts: [],

      addToCart: (product, quantity, weightKg) => {
        set((state) => {
          const existing = state.cart.find(i => i.product.id === product.id)
          const price = product.basePrice
          const subtotal = product.requiresWeight
            ? Math.round(price * (weightKg ?? quantity))
            : price * quantity

          if (existing) {
            return {
              cart: state.cart.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity, weightKg: (i.weightKg ?? 0) + (weightKg ?? 0), subtotal: i.subtotal + subtotal }
                  : i
              ),
            }
          }
          return { cart: [...state.cart, { product, quantity, weightKg, subtotal }] }
        })
      },

      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter(i => i.product.id !== productId) })),

      updateCartItem: (productId, quantity, weightKg) =>
        set((state) => ({
          cart: state.cart.map(i => {
            if (i.product.id !== productId) return i
            const price = i.product.basePrice
            const subtotal = i.product.requiresWeight
              ? Math.round(price * (weightKg ?? quantity))
              : price * quantity
            return { ...i, quantity, weightKg, subtotal }
          }),
        })),

      clearCart: () => set({ cart: [], selectedCustomer: null, notes: '', paymentMethod: 'cash' }),
      setCustomer: (customer) => set({ selectedCustomer: customer }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setNotes: (notes) => set({ notes }),

      setOnlineStatus: (online) => set({ isOnline: online }),
      setSyncStatus: (syncing, pending) => set({ isSyncing: syncing, pendingSyncItems: pending }),

      addWebOrder: (order) =>
        set((state) => ({
          pendingWebOrders: [order, ...state.pendingWebOrders.filter(o => o.id !== order.id)],
          hasNewOrders: true,
        })),

      dismissNewOrders: () => set({ hasNewOrders: false }),

      updateWebOrderStatus: (orderId, status) =>
        set((state) => ({
          pendingWebOrders: state.pendingWebOrders.map(o =>
            o.id === orderId ? { ...o, status: status as any } : o
          ),
        })),

      cartTotal: () => get().cart.reduce((sum, i) => sum + i.subtotal, 0),
      cartItemCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),
      cartSubtotal: () => get().cart.reduce((sum, i) => sum + i.subtotal, 0),
    }),
    {
      name: 'elfundo-pos-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        cashierId: state.cashierId,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
)
