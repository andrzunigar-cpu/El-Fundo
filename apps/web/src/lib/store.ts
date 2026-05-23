import { create } from 'zustand'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.id === item.id)
    if (existing) {
      return {
        items: state.items.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        ),
      }
    }
    return { items: [...state.items, item] }
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id),
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(i =>
      i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
    ).filter(i => i.quantity > 0),
  })),
  clearCart: () => set({ items: [] }),
  total: () => {
    const { items } = get()
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  },
}))
