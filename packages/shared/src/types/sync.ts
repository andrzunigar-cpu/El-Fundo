import type { UUID, ISO8601 } from './index'

export type SyncDirection = 'local_to_cloud' | 'cloud_to_local' | 'bidirectional'
export type SyncEntityType = 'product' | 'order' | 'customer' | 'inventory' | 'category' | 'price'
export type SyncOperationType = 'create' | 'update' | 'delete'
export type SyncQueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict'
export type ConflictResolution = 'local_wins' | 'cloud_wins' | 'manual' | 'merge'

export interface SyncQueueItem {
  id: UUID
  entityType: SyncEntityType
  entityId: string          // puede ser UUID o localId
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

export interface SyncConflict {
  id: UUID
  entityType: SyncEntityType
  entityId: string
  localData: Record<string, unknown>
  cloudData: Record<string, unknown>
  localUpdatedAt: ISO8601
  cloudUpdatedAt: ISO8601
  resolution?: ConflictResolution
  resolvedAt?: ISO8601
  resolvedBy?: UUID
  createdAt: ISO8601
}

export interface SyncLog {
  id: UUID
  sessionId: UUID
  entityType: SyncEntityType
  entityId: string
  operation: SyncOperationType
  direction: SyncDirection
  success: boolean
  error?: string
  durationMs: number
  branchId?: UUID
  deviceId: string
  createdAt: ISO8601
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

export interface DeviceInfo {
  deviceId: string
  branchId?: UUID
  hostname: string
  platform: string
  appVersion: string
  lastSyncAt?: ISO8601
  isOnline: boolean
}

// Eventos WebSocket para sincronización en tiempo real
export type RealtimeEvent =
  | { type: 'NEW_ORDER'; payload: { orderId: string; orderNumber: string; total: number } }
  | { type: 'ORDER_STATUS_CHANGED'; payload: { orderId: string; status: string } }
  | { type: 'STOCK_UPDATED'; payload: { productId: string; newStock: number } }
  | { type: 'PRODUCT_UPDATED'; payload: { productId: string } }
  | { type: 'SYNC_COMPLETED'; payload: SyncSession }
  | { type: 'SYNC_CONFLICT'; payload: SyncConflict }
  | { type: 'PRICE_UPDATED'; payload: { productId: string; newPrice: number } }
  | { type: 'PING'; payload: { timestamp: string } }
