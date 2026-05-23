import { Product, Category } from './types'

const base = () => process.env.NEXT_PUBLIC_API_URL || ''

export const apiClient = {
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${base()}/api/products`)
    return res.json()
  },
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const res = await fetch(`${base()}/api/products?category_id=${categoryId}`)
    return res.json()
  },
  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${base()}/api/products/${id}`)
    return res.json()
  },
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${base()}/api/categories`)
    return res.json()
  },
  async createOrder(orderData: Record<string, unknown>) {
    const res = await fetch(`${base()}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })
    return res.json()
  },
}