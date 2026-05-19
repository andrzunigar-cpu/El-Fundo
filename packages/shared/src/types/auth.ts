import type { UUID, ISO8601 } from './index'

export type UserRole =
  | 'superadmin'    // acceso total multi-sucursal
  | 'admin'         // admin de una sucursal
  | 'cashier'       // cajero POS
  | 'butcher'       // carnicero (gestión de productos)
  | 'delivery'      // repartidor
  | 'customer'      // cliente web

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
