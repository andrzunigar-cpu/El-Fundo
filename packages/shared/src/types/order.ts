import type { UUID, ISO8601, CLP, SyncStatus } from './index'
import type { Product } from './product'
import type { Customer } from './customer'

export type OrderSource = 'pos' | 'web' | 'phone' | 'whatsapp'
export type OrderStatus =
  | 'pending'          // recibido, esperando confirmación
  | 'confirmed'        // confirmado por carnicería
  | 'preparing'        // en preparación
  | 'ready'            // listo para retiro/despacho
  | 'in_delivery'      // en camino (delivery)
  | 'completed'        // entregado
  | 'cancelled'        // cancelado
  | 'refunded'         // reembolsado

export type PaymentMethod =
  // ── Online ───────────────────────────────────────────────
  | 'webpay'          // Transbank WebpayPlus (débito, crédito, prepago)
  | 'amipass'         // Sodexo Amipass (voucher alimentación)
  | 'edenred'         // Edenred Ticket Restaurant (voucher alimentación)
  | 'pluxee'          // Pluxee (ex-Sodexo Benefits, voucher alimentación)
  // ── Contra entrega / en tienda ───────────────────────────
  | 'cash'            // Efectivo al entregar
  | 'debit_card'      // Débito con terminal en domicilio/tienda
  | 'credit_card'     // Crédito con terminal en domicilio/tienda

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
export type DeliveryType = 'pickup' | 'delivery'

export interface OrderItem {
  id: UUID
  orderId: UUID
  productId: UUID
  product?: Product
  productName: string    // snapshot al momento de la venta
  productSku: string
  quantity: number
  weightKg?: number      // para productos por kg
  unitPrice: CLP
  subtotal: CLP
  discount: CLP
  notes?: string
}

export interface Order {
  id: UUID
  orderNumber: string     // "EF-2024-00001"
  source: OrderSource
  status: OrderStatus
  branchId?: UUID

  customerId?: UUID
  customer?: Customer
  customerName?: string   // para clientes sin cuenta
  customerPhone?: string
  customerEmail?: string

  items: OrderItem[]
  subtotal: CLP
  discountTotal: CLP
  taxTotal: CLP           // IVA 19% si factura
  total: CLP

  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentReference?: string  // token Transbank / ID Mercado Pago

  deliveryType: DeliveryType
  deliveryAddress?: DeliveryAddress
  deliveryFee: CLP
  scheduledAt?: ISO8601   // pedido programado

  notes?: string
  internalNotes?: string
  cancelReason?: string

  printedAt?: ISO8601
  confirmedAt?: ISO8601
  completedAt?: ISO8601

  syncStatus: SyncStatus
  localId?: string
  version: number

  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface DeliveryAddress {
  street: string
  number: string
  apartment?: string
  commune: string
  city: string
  region: string
  zipCode?: string
  lat?: number
  lng?: number
  instructions?: string
}

export interface SaleSession {
  id: UUID
  branchId: UUID
  cashierId: UUID
  registerNumber: number
  openedAt: ISO8601
  closedAt?: ISO8601
  openingCash: CLP
  closingCash?: CLP
  expectedCash?: CLP
  difference?: CLP
  totalSales: CLP
  totalOrders: number
  notes?: string
}

export type CreateOrderDto = Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>
