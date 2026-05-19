export type UUID = string
export type ISO8601 = string

export type UserRole = 'superadmin' | 'admin' | 'cashier' | 'butcher' | 'delivery' | 'customer'

export interface User {
  id: UUID
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  branchId?: UUID
  isActive: boolean
  lastLoginAt?: ISO8601
  createdAt: ISO8601
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface JwtPayload {
  sub: UUID
  email: string
  role: UserRole
  branchId?: UUID
  iat: number
  exp: number
}

export interface LoginDto {
  email: string
  password: string
  deviceId?: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: UserRole
}

export type SyncDirection = 'local_to_cloud' | 'cloud_to_local' | 'bidirectional'
export type SyncEntityType = 'product' | 'order' | 'customer' | 'inventory' | 'category' | 'price'
export type SyncOperationType = 'create' | 'update' | 'delete'
export type SyncQueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict'

export interface SyncQueueItem {
  id: UUID
  entityType: SyncEntityType
  entityId: string
  operation: SyncOperationType
  payload: Record<string, unknown>
  direction: SyncDirection
  status: SyncQueueStatus
  retries: number
  maxRetries: number
  error?: string
  branchId?: UUID
  deviceId: string
  createdAt: ISO8601
  processedAt?: ISO8601
  nextRetryAt?: ISO8601
}

export interface SyncSession {
  id: UUID
  branchId?: UUID
  deviceId: string
  startedAt: ISO8601
  completedAt?: ISO8601
  direction: SyncDirection
  totalItems: number
  processedItems: number
  failedItems: number
  conflictItems: number
  status: 'running' | 'completed' | 'failed' | 'partial'
}
