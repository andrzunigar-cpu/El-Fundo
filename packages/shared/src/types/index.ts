// ============================================================
//  Carnicería El Fundo — Tipos Compartidos
// ============================================================

export * from './product'
export * from './order'
export * from './customer'
export * from './inventory'
export * from './sync'
export * from './auth'
export * from './branch'
export * from './report'

// ── Primitivos comunes ──────────────────────────────────────

export type UUID = string
export type ISO8601 = string
export type CLP = number  // Pesos chilenos en entero

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: ISO8601
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error'
export type EntityStatus = 'active' | 'inactive' | 'deleted'
