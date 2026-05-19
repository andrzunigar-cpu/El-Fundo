import type { UUID, ISO8601, SyncStatus } from './index'

export type MovementType =
  | 'purchase'       // compra a proveedor
  | 'sale'           // venta POS
  | 'online_sale'    // venta web
  | 'adjustment'     // ajuste manual
  | 'waste'          // merma
  | 'transfer'       // transferencia entre sucursales
  | 'return'         // devolución

export interface StockLevel {
  id: UUID
  productId: UUID
  branchId?: UUID
  quantity: number           // en kg si requiresWeight, unidades si no
  reservedQuantity: number   // comprometido por pedidos pendientes
  availableQuantity: number  // quantity - reservedQuantity
  minStock: number           // alerta de stock mínimo
  maxStock?: number
  lastCountAt?: ISO8601
  syncStatus: SyncStatus
  updatedAt: ISO8601
}

export interface StockMovement {
  id: UUID
  productId: UUID
  branchId?: UUID
  type: MovementType
  quantity: number           // positivo = entrada, negativo = salida
  quantityBefore: number
  quantityAfter: number
  referenceId?: string       // orderId, purchaseId, etc.
  referenceType?: string
  notes?: string
  costPerUnit?: number
  userId: UUID
  syncStatus: SyncStatus
  localId?: string
  createdAt: ISO8601
}

export interface Supplier {
  id: UUID
  name: string
  rut?: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  status: 'active' | 'inactive'
  createdAt: ISO8601
}

export interface PurchaseOrder {
  id: UUID
  supplierId: UUID
  branchId?: UUID
  items: PurchaseOrderItem[]
  total: number
  status: 'draft' | 'sent' | 'received' | 'cancelled'
  expectedAt?: ISO8601
  receivedAt?: ISO8601
  notes?: string
  createdBy: UUID
  createdAt: ISO8601
}

export interface PurchaseOrderItem {
  id: UUID
  purchaseOrderId: UUID
  productId: UUID
  quantity: number
  unitCost: number
  receivedQuantity?: number
}
