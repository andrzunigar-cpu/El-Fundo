import type { UUID, ISO8601, CLP } from './index'

export interface DailySalesReport {
  branchId?: UUID
  date: string
  totalOrders: number
  totalRevenue: CLP
  avgTicket: CLP
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: CLP }>
  salesByHour: Array<{ hour: number; orders: number; revenue: CLP }>
  paymentMethodBreakdown: Record<string, CLP>
  cancelledOrders: number
  refundedAmount: CLP
}

export interface InventoryReport {
  branchId?: UUID
  generatedAt: ISO8601
  lowStockItems: Array<{ productId: string; name: string; current: number; minimum: number }>
  outOfStockItems: Array<{ productId: string; name: string }>
  topMovingProducts: Array<{ productId: string; name: string; soldKg: number }>
}
