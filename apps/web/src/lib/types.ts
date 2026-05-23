export interface Product {
  id: string
  sku?: string
  name: string
  category_id: string
  meat_type?: string
  cut?: string
  price_unit?: string
  base_price: number
  online_price?: number
  requires_weight?: boolean
  is_available_online?: boolean
  is_featured?: boolean
  image_urls?: string[] | string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  status: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone?: string
  subtotal: number
  discount_total: number
  tax_total: number
  total: number
  payment_method: string
  payment_status: string
  delivery_type: string
  status: string
  created_at: string
}
