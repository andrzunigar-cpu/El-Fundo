"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManager = void 0;
const socket_io_client_1 = require("socket.io-client");
const axios_1 = __importDefault(require("axios"));
const init_1 = require("../database/init");
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const BATCH_SIZE = 50;
class SyncManager {
    window;
    socket = null;
    syncInterval = null;
    isOnline = false;
    isSyncing = false;
    constructor(window) {
        this.window = window;
    }
    start() {
        this.connectWebSocket();
        this.syncInterval = setInterval(() => this.sync(), SYNC_INTERVAL_MS);
        // Sincronización inicial después de 10 segundos
        setTimeout(() => this.sync(), 10_000);
    }
    stop() {
        this.socket?.disconnect();
        if (this.syncInterval)
            clearInterval(this.syncInterval);
    }
    connectWebSocket() {
        const db = (0, init_1.getDb)();
        const apiUrl = db.prepare("SELECT value FROM config WHERE key = 'api_url'").get();
        const deviceId = db.prepare("SELECT value FROM config WHERE key = 'device_id'").get();
        const branchId = db.prepare("SELECT value FROM config WHERE key = 'branch_id'").get();
        this.socket = (0, socket_io_client_1.io)(`${apiUrl.value}/pos`, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 3000,
            reconnectionAttempts: Infinity,
        });
        this.socket.on('connect', () => {
            this.isOnline = true;
            this.socket.emit('register-device', {
                deviceId: deviceId.value,
                branchId: branchId.value,
            });
            this.notifyRenderer('connection-status', { online: true });
            // Sincronizar inmediatamente al reconectar
            this.sync();
        });
        this.socket.on('disconnect', () => {
            this.isOnline = false;
            this.notifyRenderer('connection-status', { online: false });
        });
        this.socket.on('new-order', (data) => {
            this.handleIncomingOrder(data.payload);
            this.notifyRenderer('new-order', data.payload);
        });
        this.socket.on('stock-updated', (data) => {
            this.updateLocalStock(data.payload);
            this.notifyRenderer('stock-updated', data.payload);
        });
        this.socket.on('product-updated', (data) => {
            this.notifyRenderer('product-updated', data.payload);
        });
    }
    async sync() {
        if (!this.isOnline || this.isSyncing)
            return;
        this.isSyncing = true;
        try {
            await this.pushLocalChanges();
            await this.pullCloudChanges();
        }
        catch (err) {
            console.error('Sync error:', err.message);
        }
        finally {
            this.isSyncing = false;
        }
    }
    async pushLocalChanges() {
        const db = (0, init_1.getDb)();
        const deviceId = db.prepare("SELECT value FROM config WHERE key = 'device_id'").get().value;
        const apiUrl = db.prepare("SELECT value FROM config WHERE key = 'api_url'").get().value;
        const token = db.prepare("SELECT value FROM config WHERE key = 'auth_token'").get()?.value;
        const pendingItems = db.prepare(`
      SELECT * FROM sync_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ?
    `).all(BATCH_SIZE);
        if (pendingItems.length === 0)
            return;
        const items = pendingItems.map(row => ({
            ...row,
            payload: JSON.parse(row.payload),
        }));
        try {
            const response = await axios_1.default.post(`${apiUrl}/api/v1/sync/push`, { items }, {
                headers: { Authorization: `Bearer ${token}`, 'x-device-id': deviceId },
                timeout: 30_000,
            });
            const stmt = db.prepare(`
        UPDATE sync_queue SET status = 'completed', processed_at = datetime('now')
        WHERE id = ?
      `);
            const update = db.transaction((ids) => {
                for (const id of ids)
                    stmt.run(id);
            });
            update(pendingItems.map(i => i.id));
            console.log(`Sync push: ${response.data.processed} procesados, ${response.data.failed} fallados`);
        }
        catch (err) {
            // Incrementar reintentos en ítems fallados
            const stmt = db.prepare(`
        UPDATE sync_queue
        SET retries = retries + 1,
            status = CASE WHEN retries + 1 >= max_retries THEN 'failed' ELSE 'pending' END,
            error = ?,
            next_retry_at = datetime('now', '+5 minutes')
        WHERE id = ?
      `);
            const update = db.transaction(() => {
                for (const item of pendingItems)
                    stmt.run(err.message, item.id);
            });
            update();
        }
    }
    async pullCloudChanges() {
        const db = (0, init_1.getDb)();
        const deviceId = db.prepare("SELECT value FROM config WHERE key = 'device_id'").get().value;
        const apiUrl = db.prepare("SELECT value FROM config WHERE key = 'api_url'").get().value;
        const lastSyncAt = db.prepare("SELECT value FROM config WHERE key = 'last_sync_at'").get().value;
        const branchId = db.prepare("SELECT value FROM config WHERE key = 'branch_id'").get().value;
        const token = db.prepare("SELECT value FROM config WHERE key = 'auth_token'").get()?.value;
        const response = await axios_1.default.get(`${apiUrl}/api/v1/sync/pull`, {
            params: { lastSyncAt, branchId },
            headers: { Authorization: `Bearer ${token}`, 'x-device-id': deviceId },
            timeout: 30_000,
        });
        const { products, orders, customers, stockLevels, syncedAt } = response.data;
        this.applyCloudProducts(db, products);
        this.applyCloudOrders(db, orders);
        this.applyCloudCustomers(db, customers);
        this.applyCloudStockLevels(db, stockLevels);
        db.prepare("UPDATE config SET value = ?, updated_at = datetime('now') WHERE key = 'last_sync_at'").run(syncedAt);
        console.log(`Sync pull: ${products.length}p ${orders.length}o ${customers.length}c ${stockLevels.length}s`);
    }
    applyCloudProducts(db, products) {
        const upsert = db.prepare(`
      INSERT INTO products (id, sku, name, category_id, meat_type, cut, price_unit, base_price,
        online_price, requires_weight, is_available_online, is_featured, status, sync_status, version, created_at, updated_at)
      VALUES (@id, @sku, @name, @categoryId, @meatType, @cut, @priceUnit, @basePrice,
        @onlinePrice, @requiresWeight, @isAvailableOnline, @isFeatured, @status, 'synced', @version, @createdAt, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, base_price = excluded.base_price,
        online_price = excluded.online_price, status = excluded.status,
        sync_status = 'synced', version = excluded.version, updated_at = excluded.updated_at
    `);
        const tx = db.transaction((items) => {
            for (const p of items)
                upsert.run(p);
        });
        tx(products);
    }
    applyCloudOrders(db, orders) {
        const upsert = db.prepare(`
      INSERT OR REPLACE INTO orders
        (id, order_number, source, status, customer_name, subtotal, discount_total, total, payment_method, payment_status, sync_status, version, created_at, updated_at)
      VALUES (@id, @orderNumber, @source, @status, @customerName, @subtotal, @discountTotal, @total, @paymentMethod, @paymentStatus, 'synced', @version, @createdAt, @updatedAt)
    `);
        const tx = db.transaction((items) => {
            for (const o of items)
                upsert.run(o);
        });
        tx(orders);
    }
    applyCloudCustomers(db, customers) {
        const upsert = db.prepare(`
      INSERT OR REPLACE INTO customers
        (id, rut, first_name, last_name, email, phone, loyalty_points, total_spent, status, sync_status, version, created_at, updated_at)
      VALUES (@id, @rut, @firstName, @lastName, @email, @phone, @loyaltyPoints, @totalSpent, @status, 'synced', @version, @createdAt, @updatedAt)
    `);
        const tx = db.transaction((items) => {
            for (const c of items)
                upsert.run(c);
        });
        tx(customers);
    }
    applyCloudStockLevels(db, levels) {
        const upsert = db.prepare(`
      INSERT OR REPLACE INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
      VALUES (@id, @productId, @quantity, @reservedQuantity, @minStock, 'synced', @updatedAt)
    `);
        const tx = db.transaction((items) => {
            for (const s of items)
                upsert.run(s);
        });
        tx(levels);
    }
    handleIncomingOrder(payload) {
        const db = (0, init_1.getDb)();
        // Los pedidos web llegan por WebSocket y se almacenan localmente
        const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(payload.orderId);
        if (!existing) {
            // El pedido completo se bajará en el próximo pull
            this.sync();
        }
    }
    updateLocalStock(payload) {
        const db = (0, init_1.getDb)();
        db.prepare(`
      UPDATE stock_levels SET quantity = ?, sync_status = 'synced', updated_at = datetime('now')
      WHERE product_id = ?
    `).run(payload.newStock, payload.productId);
    }
    notifyRenderer(channel, data) {
        if (!this.window.isDestroyed()) {
            this.window.webContents.send(channel, data);
        }
    }
    getStatus() {
        const db = (0, init_1.getDb)();
        const pending = db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'").get().count;
        const failed = db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'failed'").get().count;
        return { isOnline: this.isOnline, isSyncing: this.isSyncing, pendingItems: pending, failedItems: failed };
    }
}
exports.SyncManager = SyncManager;
//# sourceMappingURL=SyncManager.js.map