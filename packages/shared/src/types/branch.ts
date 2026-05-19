import type { UUID, ISO8601, EntityStatus } from './index'

export interface Branch {
  id: UUID
  name: string
  code: string           // "SUC001"
  address: string
  commune: string
  city: string
  phone?: string
  email?: string
  managerId?: UUID
  isMainBranch: boolean
  acceptsOnlineOrders: boolean
  deliveryRadiusKm?: number
  lat?: number
  lng?: number
  openingHours?: OpeningHours
  status: EntityStatus
  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface OpeningHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  open: string    // "08:00"
  close: string   // "20:00"
  isClosed: boolean
}
