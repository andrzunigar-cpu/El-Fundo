export type UUID = string
export type ISO8601 = string

export interface Category {
  id: UUID
  name: string
  slug: string
  sortOrder?: number
  status?: string
}

export interface Product {
  id: UUID
  sku: string
  name: string
  categoryId?: UUID
  meatType?: string
  cut?: string
  priceUnit?: string
  basePrice: number
  onlinePrice?: number
  requiresWeight: boolean
  isAvailableOnline?: boolean
  isFeatured?: boolean
  imageUrls?: string[]
  status?: string
  [key: string]: any
}

export interface Customer {
  id: UUID
  rut?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  loyaltyPoints?: number
  totalSpent?: number
  orderCount?: number
  status?: string
}

export interface StockLevel {
  id: UUID
  productId: UUID
  quantity: number
  reservedQuantity?: number
  minStock?: number
  updatedAt?: ISO8601
}

export interface OrderItem {
  productId: UUID
  productName: string
  productSku: string
  quantity: number
  weightKg?: number
  unitPrice: number
  subtotal: number
  discount?: number
}

export interface Order {
  id: UUID
  orderNumber: string
  source: 'pos' | 'web'
  status: string
  customerId?: UUID
  customerName?: string
  customerPhone?: string
  items?: OrderItem[]
  subtotal: number
  discountTotal?: number
  taxTotal?: number
  total: number
  paymentMethod?: string
  paymentStatus?: string
  deliveryType?: string
  deliveryFee?: number
  notes?: string
  createdAt: ISO8601
  updatedAt: ISO8601
}

export type SyncEntityType = 'product' | 'order' | 'customer' | 'inventory' | 'category' | 'price'
export type SyncOperationType = 'create' | 'update' | 'delete'
export type SyncQueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict'

export interface SyncQueueItem {
  id: UUID
  entityType: SyncEntityType
  entityId: string
  operation: SyncOperationType
  payload: Record<string, unknown>
  direction: string
  status: SyncQueueStatus
  retries: number
  maxRetries: number
  error?: string
  branchId?: UUID
  deviceId: string
  createdAt: ISO8601
}
