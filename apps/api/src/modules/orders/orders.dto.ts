import { IsString, IsArray, IsNumber, IsOptional, IsEnum } from 'class-validator'

export class CreateOrderDto {
  @IsString() source: string
  @IsArray() items: any[]
  @IsNumber() subtotal: number
  @IsNumber() total: number
  @IsString() paymentMethod: string
  @IsString() paymentStatus: string
  @IsString() deliveryType: string
  @IsNumber() deliveryFee: number
  @IsNumber() discountTotal: number
  @IsNumber() taxTotal: number
  @IsOptional() @IsString() customerId?: string
  @IsOptional() @IsString() customerName?: string
  @IsOptional() @IsString() customerPhone?: string
  @IsOptional() @IsString() customerEmail?: string
  @IsOptional() @IsString() branchId?: string
  @IsOptional() @IsString() notes?: string
  @IsOptional() deliveryAddress?: any
}

export class UpdateOrderStatusDto {
  @IsString() status: string
  @IsOptional() @IsString() notes?: string
}
