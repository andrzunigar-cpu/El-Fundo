import type { UUID, ISO8601, CLP, EntityStatus, SyncStatus } from './index'

export interface Customer {
  id: UUID
  rut?: string           // RUT chileno para facturación
  firstName: string
  lastName: string
  email?: string
  phone?: string
  birthDate?: ISO8601
  addresses: CustomerAddress[]
  loyaltyPoints: number
  totalSpent: CLP
  orderCount: number
  notes?: string
  tags: string[]
  status: EntityStatus
  syncStatus: SyncStatus
  localId?: string
  version: number
  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface CustomerAddress {
  id: UUID
  customerId: UUID
  label: string          // "Casa", "Trabajo"
  street: string
  number: string
  apartment?: string
  commune: string
  city: string
  region: string
  isDefault: boolean
  lat?: number
  lng?: number
}

export type CreateCustomerDto = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version' | 'loyaltyPoints' | 'totalSpent' | 'orderCount'>
