import { BrowserWindow, ipcMain } from 'electron'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { getDb } from '../database/init'
import type { SyncQueueItem } from '../types'

const SYNC_INTERVAL_MS = 5 * 60 * 1000  // 5 minutos
const BATCH_SIZE = 50

export class SyncManager {
  private socket: Socket | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private isOnline = false
  private isSyncing = false

  constructor(private readonly window: BrowserWindow) {}

  start() {
    this.connectWebSocket()
    this.syncInterval = setInterval(() => this.sync(), SYNC_INTERVAL_MS)
    // Sincronización inicial después de 10 segundos
    setTimeout(() => this.sync(), 10_000)
  }

  stop() {
    this.socket?.disconnect()
    if (this.syncInterval) clearInterval(this.syncInterval)
  }

  private connectWebSocket() {
    const db = getDb()
    const apiUrl = db.prepare("SELECT value FROM config WHERE key = 'api_url'").get() as any
    const deviceId = db.prepare("SELECT value FROM config WHERE key = 'device_id'").get() as any
    const branchId = db.prepare("SELECT value FROM config WHERE key = 'branch_id'").get() as any

    this.socket = io(`${apiUrl.value}/pos`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: Infinity,
    })

    this.socket.on('connect', () => {
      this.isOnline = true
      this.socket!.emit('register-device', {
        deviceId: deviceId.value,
        branchId: branchId.value,
      })
      this.notifyRenderer('connection-status', { online: true })
      // Sincronizar inmediatamente al reconectar
      this.sync()
    })

    this.socket.on('disconnect', () => {
      this.isOnline = false
      this.notifyRenderer('connection-status', { online: false })
    })

    this.socket.on('new-order', (data) => {
      this.handleIncomingOrder(data.payload)
      this.notifyRenderer('new-order', data.payload)
    })

    this.socket.on('stock-updated', (data) => {
      this.updateLocalStock(data.payload)
      this.notifyRenderer('stock-updated', data.payload)
    })

    this.socket.on('product-updated', (data) => {
      this.notifyRenderer('product-updated', data.payload)
    })
  }

  async sync() {
    if (!this.isOnline || this.isSyncing) return
    this.isSyncing = true

    try {
      await this.pushLocalChanges()
      await this.pullCloudChanges()
    } catch (err: any) {
      console.error('Sync error:', err.message)
    } finally {
      this.isSyncing = false
    }
  }

  private async pushLocalChanges() {
    const db = getDb()
    const deviceId = (db.prepare("SELECT value FROM config WHERE key = 'device_id'").get() as any).value
    const apiUrl = (db.prepare("SELECT value FROM config WHERE key = 'api_url'").get() as any).value
    const token = (db.prepare("SELECT value FROM config WHERE key = 'auth_token'").get() as any)?.value

    const pendingItems = db.prepare(`
      SELECT * FROM sync_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ?
    `).all(BATCH_SIZE) as any[]

    if (pendingItems.length === 0) return

    const items: SyncQueueItem[] = pendingItems.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
    }))

    try {
      const response = await axios.post(`${apiUrl}/api/v1/sync/push`, { items }, {
        headers: { Authorization: `Bearer ${token}`, 'x-device-id': deviceId },
        timeout: 30_000,
      })

      const stmt = db.prepare(`
        UPDATE sync_queue SET status = 'completed', processed_at = datetime('now')
        WHERE id = ?
      `)
      const update = db.transaction((ids: string[]) => {
        for (const id of ids) stmt.run(id)
      })
      update(pendingItems.map(i => i.id))

      console.log(`Sync push: ${response.data.processed} procesados, ${response.data.failed} fallados`)
    } catch (err: any) {
      // Incrementar reintentos en ítems fallados
      const stmt = db.prepare(`
        UPDATE sync_queue
        SET retries = retries + 1,
            status = CASE WHEN retries + 1 >= max_retries THEN 'failed' ELSE 'pending' END,
            error = ?,
            next_retry_at = datetime('now', '+5 minutes')
        WHERE id = ?
      `)
      const update = db.transaction(() => {
        for (const item of pendingItems) stmt.run(err.message, item.id)
      })
      update()
    }
  }

  private async pullCloudChanges() {
    const db = getDb()
    const deviceId = (db.prepare("SELECT value FROM config WHERE key = 'device_id'").get() as any).value
    const apiUrl = (db.prepare("SELECT value FROM config WHERE key = 'api_url'").get() as any).value
    const lastSyncAt = (db.prepare("SELECT value FROM config WHERE key = 'last_sync_at'").get() as any).value
    const branchId = (db.prepare("SELECT value FROM config WHERE key = 'branch_id'").get() as any).value
    const token = (db.prepare("SELECT value FROM config WHERE key = 'auth_token'").get() as any)?.value

    const response = await axios.get(`${apiUrl}/api/v1/sync/pull`, {
      params: { lastSyncAt, branchId },
      headers: { Authorization: `Bearer ${token}`, 'x-device-id': deviceId },
      timeout: 30_000,
    })

    const { products, orders, customers, stockLevels, syncedAt } = response.data

    this.applyCloudProducts(db, products)
    this.applyCloudOrders(db, orders)
    this.applyCloudCustomers(db, customers)
    this.applyCloudStockLevels(db, stockLevels)

    db.prepare("UPDATE config SET value = ?, updated_at = datetime('now') WHERE key = 'last_sync_at'").run(syncedAt)

    console.log(`Sync pull: ${products.length}p ${orders.length}o ${customers.length}c ${stockLevels.length}s`)
  }

  private applyCloudProducts(db: any, products: any[]) {
    const upsert = db.prepare(`
      INSERT INTO products (id, sku, name, category_id, meat_type, cut, price_unit, base_price,
        online_price, requires_weight, is_available_online, is_featured, status, sync_status, version, created_at, updated_at)
      VALUES (@id, @sku, @name, @categoryId, @meatType, @cut, @priceUnit, @basePrice,
        @onlinePrice, @requiresWeight, @isAvailableOnline, @isFeatured, @status, 'synced', @version, @createdAt, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, base_price = excluded.base_price,
        online_price = excluded.online_price, status = excluded.status,
        sync_status = 'synced', version = excluded.version, updated_at = excluded.updated_at
    `)
    const tx = db.transaction((items: any[]) => {
      for (const p of items) upsert.run(p)
    })
    tx(products)
  }

  private applyCloudOrders(db: any, orders: any[]) {
    const upsert = db.prepare(`
      INSERT OR REPLACE INTO orders
        (id, order_number, source, status, customer_name, subtotal, discount_total, total, payment_method, payment_status, sync_status, version, created_at, updated_at)
      VALUES (@id, @orderNumber, @source, @status, @customerName, @subtotal, @discountTotal, @total, @paymentMethod, @paymentStatus, 'synced', @version, @createdAt, @updatedAt)
    `)
    const tx = db.transaction((items: any[]) => {
      for (const o of items) upsert.run(o)
    })
    tx(orders)
  }

  private applyCloudCustomers(db: any, customers: any[]) {
    const upsert = db.prepare(`
      INSERT OR REPLACE INTO customers
        (id, rut, first_name, last_name, email, phone, loyalty_points, total_spent, status, sync_status, version, created_at, updated_at)
      VALUES (@id, @rut, @firstName, @lastName, @email, @phone, @loyaltyPoints, @totalSpent, @status, 'synced', @version, @createdAt, @updatedAt)
    `)
    const tx = db.transaction((items: any[]) => {
      for (const c of items) upsert.run(c)
    })
    tx(customers)
  }

  private applyCloudStockLevels(db: any, levels: any[]) {
    const upsert = db.prepare(`
      INSERT OR REPLACE INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
      VALUES (@id, @productId, @quantity, @reservedQuantity, @minStock, 'synced', @updatedAt)
    `)
    const tx = db.transaction((items: any[]) => {
      for (const s of items) upsert.run(s)
    })
    tx(levels)
  }

  private handleIncomingOrder(payload: any) {
    const db = getDb()
    // Los pedidos web llegan por WebSocket y se almacenan localmente
    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(payload.orderId)
    if (!existing) {
      // El pedido completo se bajará en el próximo pull
      this.sync()
    }
  }

  private updateLocalStock(payload: { productId: string; newStock: number }) {
    const db = getDb()
    db.prepare(`
      UPDATE stock_levels SET quantity = ?, sync_status = 'synced', updated_at = datetime('now')
      WHERE product_id = ?
    `).run(payload.newStock, payload.productId)
  }

  private notifyRenderer(channel: string, data: any) {
    if (!this.window.isDestroyed()) {
      this.window.webContents.send(channel, data)
    }
  }

  getStatus() {
    const db = getDb()
    const pending = (db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'").get() as any).count
    const failed = (db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'failed'").get() as any).count
    return { isOnline: this.isOnline, isSyncing: this.isSyncing, pendingItems: pending, failedItems: failed }
  }
}
