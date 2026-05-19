import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { OrdersGateway } from '../../websocket/orders.gateway'
import { DatabaseService } from '../../database/database.service'
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto'
import type { User } from '../../types'

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: OrdersGateway,
    @InjectQueue('sync') private readonly syncQueue: Queue,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
  ) {}

  async create(dto: CreateOrderDto, user: User) {
    const orderNumber = await this.generateOrderNumber()

    const order = await this.db.order.create({
      data: {
        ...dto,
        orderNumber,
        status: dto.source === 'web' ? 'pending' : 'confirmed',
        syncStatus: 'pending',
        version: 1,
      } as any,
      include: { items: true, customer: true },
    })

    // Descontar stock en tiempo real
    for (const item of order.items) {
      await this.db.stockLevel.update({
        where: { productId_branchId: { productId: item.productId, branchId: dto.branchId ?? 'main' } },
        data: { reservedQuantity: { increment: item.weightKg ?? item.quantity } },
      })
    }

    // Emitir evento WebSocket al POS local
    if (dto.source === 'web') {
      this.gateway.emitNewOrder(order)

      // Cola para imprimir en el POS
      await this.notifQueue.add('print-order', { orderId: order.id }, {
        priority: 1,
        attempts: 3,
      })
    }

    // Cola de sincronización cloud
    await this.syncQueue.add('sync-entity', {
      entityType: 'order',
      entityId: order.id,
      operation: 'create',
      direction: 'cloud_to_local',
    })

    return order
  }

  async findAll(filters: {
    status?: string
    source?: string
    branchId?: string
    page: number
    limit: number
    from?: string
    to?: string
  }) {
    const { page, limit, ...where } = filters
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.db.order.findMany({
        where: this.buildWhereClause(where),
        include: { items: true, customer: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.order.count({ where: this.buildWhereClause(where) }),
    ])

    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) }
  }

  async getPendingWebOrders(branchId?: string) {
    return this.db.order.findMany({
      where: {
        source: 'web',
        status: { in: ['pending', 'confirmed', 'preparing'] },
        ...(branchId ? { branchId } : {}),
      },
      include: { items: { include: { product: true } }, customer: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findOne(id: string) {
    const order = await this.db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true },
    })
    if (!order) throw new NotFoundException(`Pedido ${id} no encontrado`)
    return order
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, user: User) {
    const order = await this.findOne(id)

    const updated = await this.db.order.update({
      where: { id },
      data: {
        status: dto.status,
        internalNotes: dto.notes,
        completedAt: dto.status === 'completed' ? new Date().toISOString() : undefined,
        syncStatus: 'pending',
        version: { increment: 1 },
      },
    })

    // Si se completa: descontar stock definitivamente
    if (dto.status === 'completed') {
      await this.finalizeStockDeduction(order)
    }

    // Si se cancela: liberar stock reservado
    if (dto.status === 'cancelled') {
      await this.releaseReservedStock(order)
    }

    this.gateway.emitOrderStatusChange(id, dto.status)

    await this.syncQueue.add('sync-entity', {
      entityType: 'order',
      entityId: id,
      operation: 'update',
      direction: 'cloud_to_local',
    })

    return updated
  }

  async markPrinted(id: string) {
    return this.db.order.update({
      where: { id },
      data: { printedAt: new Date().toISOString() },
    })
  }

  async openSession(body: { openingCash: number; registerNumber: number }, user: User) {
    return this.db.saleSession.create({
      data: {
        branchId: user.branchId ?? 'main',
        cashierId: user.id,
        registerNumber: body.registerNumber,
        openingCash: body.openingCash,
        openedAt: new Date().toISOString(),
        totalSales: 0,
        totalOrders: 0,
      },
    })
  }

  async closeSession(sessionId: string, body: { closingCash: number; notes?: string }, user: User) {
    const session = await this.db.saleSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Sesión no encontrada')

    const difference = body.closingCash - (session.expectedCash ?? 0)

    return this.db.saleSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date().toISOString(),
        closingCash: body.closingCash,
        difference,
        notes: body.notes,
      },
    })
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.db.order.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`).toISOString() } },
    })
    return `EF-${year}-${String(count + 1).padStart(5, '0')}`
  }

  private buildWhereClause(filters: Record<string, unknown>) {
    const where: Record<string, unknown> = {}
    if (filters.status) where.status = filters.status
    if (filters.source) where.source = filters.source
    if (filters.branchId) where.branchId = filters.branchId
    if (filters.from || filters.to) {
      where.createdAt = {}
      if (filters.from) (where.createdAt as any).gte = filters.from
      if (filters.to) (where.createdAt as any).lte = filters.to
    }
    return where
  }

  private async finalizeStockDeduction(order: any) {
    for (const item of order.items) {
      await this.db.$executeRaw`
        UPDATE stock_levels
        SET quantity = quantity - ${item.weightKg ?? item.quantity},
            reserved_quantity = GREATEST(0, reserved_quantity - ${item.weightKg ?? item.quantity}),
            updated_at = NOW()
        WHERE product_id = ${item.productId}
      `
    }
  }

  private async releaseReservedStock(order: any) {
    for (const item of order.items) {
      await this.db.stockLevel.update({
        where: { productId_branchId: { productId: item.productId, branchId: order.branchId ?? 'main' } },
        data: { reservedQuantity: { decrement: item.weightKg ?? item.quantity } },
      })
    }
  }
}
