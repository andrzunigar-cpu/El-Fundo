import type { UUID, ISO8601, CLP, EntityStatus, SyncStatus } from './index'

export type MeatCut =
  | 'lomo_liso'
  | 'lomo_vetado'
  | 'posta_negra'
  | 'posta_rosada'
  | 'punta_paleta'
  | 'abastero'
  | 'asado_carnicero'
  | 'huachalomo'
  | 'entraña'
  | 'plateada'
  | 'osobuco'
  | 'chuleta'
  | 'costilla'
  | 'pollo_ganso'
  | 'sobrecostilla'
  | 'malaya'
  | 'tapapecho'
  | 'cazuela'
  | 'otro'

export type MeatType = 'vacuno' | 'cerdo' | 'cordero' | 'pollo' | 'pavo' | 'otro'
export type WeightUnit = 'kg' | 'g' | 'unidad'
export type PriceUnit = 'kg' | 'unidad' | '100g'

export interface Category {
  id: UUID
  name: string
  slug: string
  description?: string
  imageUrl?: string
  parentId?: UUID
  sortOrder: number
  status: EntityStatus
  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface Product {
  id: UUID
  sku: string
  name: string
  slug: string
  description?: string
  categoryId: UUID
  category?: Category

  meatType: MeatType
  cut?: MeatCut
  origin?: string            // "Vacuno nacional", "Wagyu importado", etc.
  aging?: number             // días de maduración
  isFeatured: boolean
  isAvailableOnline: boolean
  requiresWeight: boolean    // si se vende por kg

  priceUnit: PriceUnit
  basePrice: CLP             // precio base por unidad de precio
  onlinePrice?: CLP          // precio web (puede diferir del local)

  imageUrls: string[]
  tags: string[]
  nutritionInfo?: NutritionInfo

  status: EntityStatus
  syncStatus: SyncStatus
  localId?: string           // ID local SQLite para reconciliación
  version: number            // control de conflictos optimistic locking
  branchId?: UUID

  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface NutritionInfo {
  calories?: number
  protein?: number
  fat?: number
  saturatedFat?: number
  sodium?: number
}

export interface ProductVariant {
  id: UUID
  productId: UUID
  name: string
  sku: string
  price: CLP
  weightGrams?: number
  stock: number
  status: EntityStatus
}

export interface PriceHistory {
  id: UUID
  productId: UUID
  price: CLP
  changedBy: UUID
  reason?: string
  createdAt: ISO8601
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>
export type UpdateProductDto = Partial<CreateProductDto>
