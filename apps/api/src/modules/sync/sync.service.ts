import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue, Worker, Job } from 'bullmq'
import { ConfigService } from '@nestjs/config'
import { DatabaseService } from '../../database/database.service'
import { OrdersGateway } from '../../websocket/orders.gateway'
import type { SyncQueueItem, SyncSession } from '@elfundo/shared'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: OrdersGateway,
    @InjectQueue('sync') private readonly syncQueue: Queue,
    private readonly config: ConfigService,
  ) {}

  /**
   * Recibe un lote de cambios del POS local y los aplica en la nube.
   * Maneja conflictos con last-write-wins + versión optimista.
   */
  async processBatch(items: SyncQueueItem[], deviceId: string) {
    const session = await this.createSyncSession(deviceId, 'local_to_cloud', items.length)
    let processed = 0, failed = 0, conflicts = 0

    for (const item of items) {
      try {
        await this.processItem(item)
        processed++
      } catch (err: any) {
        if (err.code === 'CONFLICT') {
          conflicts++
          await this.logConflict(item, err.localData, err.cloudData)
        } else {
          failed++
          this.logger.error(`Sync error ${item.entityType}:${item.entityId} — ${err.message}`)
        }
      }
    }

    await this.completeSyncSession(session.id, { processed, failed, conflicts })
    this.gateway.emitSyncCompleted({ ...session, processedItems: processed, failedItems: failed })

    return { sessionId: session.id, processed, failed, conflicts }
  }

  /**
   * Obtiene cambios cloud desde lastSyncAt para descargar al POS local.
   */
  async getCloudChanges(deviceId: string, lastSyncAt: string, branchId?: string) {
    const since = new Date(lastSyncAt)

    const [products, orders, customers, stockLevels] = await Promise.all([
      this.db.product.findMany({
        where: { updatedAt: { gt: since }, ...(branchId ? { branchId } : {}) },
        take: 500,
      }),
      this.db.order.findMany({
        where: {
          updatedAt: { gt: since },
          source: 'web',
          ...(branchId ? { branchId } : {}),
        },
        include: { items: true },
        take: 200,
      }),
      this.db.customer.findMany({
        where: { updatedAt: { gt: since } },
        take: 500,
      }),
      this.db.stockLevel.findMany({
        where: { updatedAt: { gt: since }, ...(branchId ? { branchId } : {}) },
        take: 1000,
      }),
    ])

    const newSyncAt = new Date().toISOString()
    return { products, orders, customers, stockLevels, syncedAt: newSyncAt }
  }

  private async processItem(item: SyncQueueItem) {
    switch (item.entityType) {
      case 'order':
        return this.syncOrder(item)
      case 'product':
        return this.syncProduct(item)
      case 'customer':
        return this.syncCustomer(item)
      case 'inventory':
        return this.syncInventory(item)
      default:
        this.logger.warn(`Tipo de entidad desconocido: ${item.entityType}`)
    }
  }

  private async syncOrder(item: SyncQueueItem) {
    const { entityId, operation, payload } = item

    if (operation === 'create') {
      const existing = await this.db.order.findFirst({
        where: { OR: [{ id: entityId }, { localId: entityId }] },
      })
      if (existing) return // idempotente

      return this.db.order.create({ data: { ...payload as any, syncStatus: 'synced' } })
    }

    if (operation === 'update') {
      const current = await this.db.order.findUnique({ where: { id: entityId } })
      if (!current) return

      // Conflict detection: si ambos lados cambiaron después del último sync
      if (current.version > (payload as any).version) {
        const err: any = new Error('CONFLICT')
        err.code = 'CONFLICT'
        err.localData = payload
        err.cloudData = current
        throw err
      }

      return this.db.order.update({
        where: { id: entityId },
        data: { ...(payload as any), syncStatus: 'synced', version: { increment: 1 } },
      })
    }
  }

  private async syncProduct(item: SyncQueueItem) {
    const { entityId, operation, payload } = item
    if (operation === 'update') {
      return this.db.product.upsert({
        where: { id: entityId },
        create: { ...payload as any, syncStatus: 'synced' },
        update: { ...payload as any, syncStatus: 'synced' },
      })
    }
  }

  private async syncCustomer(item: SyncQueueItem) {
    return this.db.customer.upsert({
      where: { id: item.entityId },
      create: { ...item.payload as any, syncStatus: 'synced' },
      update: { ...item.payload as any, syncStatus: 'synced' },
    })
  }

  private async syncInventory(item: SyncQueueItem) {
    const { productId, branchId, quantity } = item.payload as any
    return this.db.stockLevel.upsert({
      where: { productId_branchId: { productId, branchId: branchId ?? 'main' } },
      create: { productId, branchId: branchId ?? 'main', quantity, reservedQuantity: 0, minStock: 0 },
      update: { quantity },
    })
  }

  private async createSyncSession(deviceId: string, direction: string, totalItems: number): Promise<SyncSession> {
    return this.db.syncSession.create({
      data: {
        deviceId,
        direction: direction as any,
        startedAt: new Date().toISOString(),
        totalItems,
        processedItems: 0,
        failedItems: 0,
        conflictItems: 0,
        status: 'running',
      },
    }) as any
  }

  private async completeSyncSession(sessionId: string, stats: { processed: number; failed: number; conflicts: number }) {
    return this.db.syncSession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date().toISOString(),
        processedItems: stats.processed,
        failedItems: stats.failed,
        conflictItems: stats.conflicts,
        status: stats.failed === 0 ? 'completed' : 'partial',
      },
    })
  }

  private async logConflict(item: SyncQueueItem, localData: any, cloudData: any) {
    return this.db.syncConflict.create({
      data: {
        entityType: item.entityType,
        entityId: item.entityId,
        localData,
        cloudData,
        localUpdatedAt: localData.updatedAt,
        cloudUpdatedAt: cloudData.updatedAt,
      },
    })
  }
}
