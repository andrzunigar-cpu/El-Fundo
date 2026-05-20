"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const electron_1 = require("electron");
const init_1 = require("../database/init");
const crypto_1 = require("crypto");
function setupIpcHandlers() {
    const db = init_1.getDb;
    // ── Productos ─────────────────────────────────────────────
    electron_1.ipcMain.handle('products:getAll', () => {
        return db().prepare(`
      SELECT p.*, sl.quantity, sl.reserved_quantity,
             (sl.quantity - sl.reserved_quantity) as available
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.name
    `).all();
    });
    electron_1.ipcMain.handle('products:search', (_, query) => {
        return db().prepare(`
      SELECT p.*, sl.quantity
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active'
        AND (p.name LIKE ? OR p.sku LIKE ?)
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`);
    });
    electron_1.ipcMain.handle('products:getById', (_, id) => {
        return db().prepare('SELECT * FROM products WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('products:updatePrice', (_, id, price) => {
        db().prepare(`
      UPDATE products SET base_price = ?, sync_status = 'pending', updated_at = datetime('now') WHERE id = ?
    `).run(price, id);
        db().prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, device_id, created_at)
      VALUES (?, 'product', ?, 'update', ?, (SELECT value FROM config WHERE key='device_id'), datetime('now'))
    `).run((0, crypto_1.randomUUID)(), id, JSON.stringify({ id, basePrice: price }));
        return { success: true };
    });
    // ── Inventario ────────────────────────────────────────────
    electron_1.ipcMain.handle('inventory:getAllStock', () => {
        return db().prepare(`
      SELECT p.id, p.name, p.sku, p.requires_weight,
             COALESCE(sl.quantity, 0) as quantity,
             COALESCE(sl.min_stock, 0) as min_stock,
             COALESCE(sl.reserved_quantity, 0) as reserved_quantity
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.name
    `).all();
    });
    electron_1.ipcMain.handle('inventory:adjust', (_, productId, quantity, notes) => {
        const deviceId = db().prepare("SELECT value FROM config WHERE key='device_id'").get().value;
        const current = db().prepare('SELECT quantity FROM stock_levels WHERE product_id = ?').get(productId);
        const before = current?.quantity ?? 0;
        const after = before + quantity;
        db().prepare(`
      INSERT OR REPLACE INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
      VALUES (COALESCE((SELECT id FROM stock_levels WHERE product_id = ?), ?), ?, ?, 0, 0, 'pending', datetime('now'))
    `).run(productId, (0, crypto_1.randomUUID)(), productId, after);
        db().prepare(`
      INSERT INTO stock_movements (id, product_id, type, quantity, quantity_before, quantity_after, notes, user_id, sync_status, created_at)
      VALUES (?, ?, 'adjustment', ?, ?, ?, ?, 'system', 'pending', datetime('now'))
    `).run((0, crypto_1.randomUUID)(), productId, quantity, before, after, notes);
        return { success: true, newQuantity: after };
    });
    // ── Órdenes ───────────────────────────────────────────────
    electron_1.ipcMain.handle('orders:create', (_, orderData) => {
        const id = (0, crypto_1.randomUUID)();
        const localId = `local_${Date.now()}`;
        const deviceId = db().prepare("SELECT value FROM config WHERE key='device_id'").get().value;
        const count = db().prepare("SELECT COUNT(*) as c FROM orders").get().c;
        const orderNumber = `EF-LOCAL-${String(count + 1).padStart(5, '0')}`;
        const insert = db().prepare(`
      INSERT INTO orders (id, local_id, order_number, source, status, customer_name, customer_phone,
        subtotal, discount_total, tax_total, total, payment_method, payment_status,
        delivery_type, delivery_fee, notes, sync_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, 'pending', 1, datetime('now'), datetime('now'))
    `);
        const insertItem = db().prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, weight_kg, unit_price, subtotal, discount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
        const updateStock = db().prepare(`
      UPDATE stock_levels SET quantity = MAX(0, quantity - ?), sync_status='pending', updated_at=datetime('now')
      WHERE product_id = ?
    `);
        db().transaction(() => {
            insert.run(id, localId, orderNumber, orderData.source ?? 'pos', orderData.customerName, orderData.customerPhone, orderData.subtotal, orderData.discountTotal ?? 0, orderData.taxTotal ?? 0, orderData.total, orderData.paymentMethod, orderData.deliveryType, orderData.deliveryFee ?? 0, orderData.notes);
            for (const item of orderData.items) {
                insertItem.run((0, crypto_1.randomUUID)(), id, item.productId, item.productName, item.productSku, item.quantity, item.weightKg, item.unitPrice, item.subtotal);
                updateStock.run(item.weightKg ?? item.quantity, item.productId);
            }
            // Encolar para sync
            db().prepare(`
        INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, device_id, created_at)
        VALUES (?, 'order', ?, 'create', ?, ?, datetime('now'))
      `).run((0, crypto_1.randomUUID)(), id, JSON.stringify({ ...orderData, id, orderNumber }), deviceId);
        })();
        return { id, orderNumber, ...orderData };
    });
    electron_1.ipcMain.handle('orders:getAll', (_, filters) => {
        const { status, limit = 50 } = filters ?? {};
        let query = `SELECT o.*, COUNT(oi.id) as item_count
                 FROM orders o
                 LEFT JOIN order_items oi ON oi.order_id = o.id`;
        if (status)
            query += ` WHERE o.status = '${status}'`;
        query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${limit}`;
        return db().prepare(query).all();
    });
    electron_1.ipcMain.handle('orders:getPendingWeb', () => {
        return db().prepare(`
      SELECT o.*, GROUP_CONCAT(oi.product_name) as product_names
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.source = 'web' AND o.status IN ('pending', 'confirmed', 'preparing')
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `).all();
    });
    electron_1.ipcMain.handle('orders:updateStatus', (_, id, status) => {
        db().prepare(`UPDATE orders SET status=?, sync_status='pending', updated_at=datetime('now') WHERE id=?`).run(status, id);
        return { success: true };
    });
    // ── Clientes ──────────────────────────────────────────────
    electron_1.ipcMain.handle('customers:search', (_, query) => {
        return db().prepare(`
      SELECT * FROM customers
      WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR rut LIKE ?
      LIMIT 10
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    });
    electron_1.ipcMain.handle('customers:create', (_, data) => {
        const id = (0, crypto_1.randomUUID)();
        db().prepare(`
      INSERT INTO customers (id, rut, first_name, last_name, email, phone, loyalty_points, total_spent, status, sync_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'active', 'pending', 1, datetime('now'), datetime('now'))
    `).run(id, data.rut, data.firstName, data.lastName, data.email, data.phone);
        return { id, ...data };
    });
    // ── Sesión de caja ─────────────────────────────────────────
    electron_1.ipcMain.handle('session:open', (_, data) => {
        const id = (0, crypto_1.randomUUID)();
        db().prepare(`
      INSERT INTO sale_sessions (id, cashier_id, register_number, opened_at, opening_cash, total_sales, total_orders)
      VALUES (?, ?, ?, datetime('now'), ?, 0, 0)
    `).run(id, data.cashierId ?? 'system', data.registerNumber ?? 1, data.openingCash);
        db().prepare("UPDATE config SET value=? WHERE key='current_session_id'").run(id);
        return { id, openedAt: new Date().toISOString() };
    });
    electron_1.ipcMain.handle('session:getCurrent', () => {
        const sessionId = db().prepare("SELECT value FROM config WHERE key='current_session_id'").get()?.value;
        if (!sessionId)
            return null;
        return db().prepare('SELECT * FROM sale_sessions WHERE id = ? AND closed_at IS NULL').get(sessionId);
    });
    // ── Sincronización ─────────────────────────────────────────
    electron_1.ipcMain.handle('sync:getStatus', () => {
        const pending = db().prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status='pending'").get().c;
        const failed = db().prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status='failed'").get().c;
        const isOnline = db().prepare("SELECT value FROM config WHERE key='is_online'").get()?.value === 'true';
        return { isOnline, isSyncing: false, pendingItems: pending, failedItems: failed };
    });
    electron_1.ipcMain.handle('sync:getQueue', () => {
        return db().prepare("SELECT * FROM sync_queue WHERE status IN ('pending','failed') ORDER BY created_at ASC LIMIT 100").all();
    });
    electron_1.ipcMain.handle('sync:triggerNow', () => {
        // Trigger manual sync — el SyncManager corre en background, esto solo retorna el estado actual
        const pending = db().prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status='pending'").get().c;
        return { triggered: true, pendingItems: pending };
    });
    electron_1.ipcMain.handle('sync:getLogs', () => {
        return db().prepare("SELECT * FROM sync_queue ORDER BY created_at DESC LIMIT 50").all();
    });
    // ── Handlers complementarios ───────────────────────────────
    electron_1.ipcMain.handle('orders:getById', (_, id) => {
        const order = db().prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!order)
            return null;
        const items = db().prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
        return { ...order, items };
    });
    electron_1.ipcMain.handle('customers:getById', (_, id) => {
        return db().prepare('SELECT * FROM customers WHERE id = ?').get(id);
    });
    electron_1.ipcMain.handle('inventory:getStock', (_, productId) => {
        return db().prepare('SELECT * FROM stock_levels WHERE product_id = ?').get(productId);
    });
    electron_1.ipcMain.handle('session:close', (_, data) => {
        const sessionId = db().prepare("SELECT value FROM config WHERE key='current_session_id'").get()?.value;
        if (!sessionId)
            return { success: false, message: 'No hay sesión abierta' };
        const session = db().prepare('SELECT * FROM sale_sessions WHERE id = ?').get(sessionId);
        const expected = (session?.opening_cash ?? 0) + (session?.total_sales ?? 0);
        const difference = (data.closingCash ?? 0) - expected;
        db().prepare(`
      UPDATE sale_sessions
      SET closed_at = datetime('now'), closing_cash = ?, expected_cash = ?, difference = ?, notes = ?
      WHERE id = ?
    `).run(data.closingCash, expected, difference, data.notes ?? null, sessionId);
        db().prepare("UPDATE config SET value='' WHERE key='current_session_id'").run();
        return { success: true, expected, difference };
    });
    electron_1.ipcMain.handle('printer:test', () => {
        console.log('TEST PRINTER');
        return { success: true, message: 'Test enviado' };
    });
    electron_1.ipcMain.handle('reports:cashClosing', (_, sessionId) => {
        const session = db().prepare('SELECT * FROM sale_sessions WHERE id = ?').get(sessionId);
        const orders = db().prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(total) as total
      FROM orders WHERE session_id = ? AND status = 'completed'
      GROUP BY payment_method
    `).all(sessionId);
        return { session, paymentBreakdown: orders };
    });
    // ── Reportes ──────────────────────────────────────────────
    electron_1.ipcMain.handle('reports:dailySales', (_, date) => {
        const start = `${date}T00:00:00`;
        const end = `${date}T23:59:59`;
        const totals = db().prepare(`
      SELECT COUNT(*) as total_orders, SUM(total) as total_revenue, AVG(total) as avg_ticket
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
    `).get(start, end);
        const topProducts = db().prepare(`
      SELECT oi.product_name, SUM(oi.quantity) as qty, SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status='completed' AND o.created_at BETWEEN ? AND ?
      GROUP BY oi.product_id ORDER BY revenue DESC LIMIT 5
    `).all(start, end);
        return { date, ...totals, topProducts };
    });
    // ── Impresión (placeholder) ────────────────────────────────
    electron_1.ipcMain.handle('printer:printTicket', (_, order) => {
        console.log('IMPRIMIR TICKET:', order.orderNumber ?? order.orderId);
        // TODO: integrar node-escpos o SerialPort para impresora real
        return { success: true, message: 'Ticket enviado a impresora' };
    });
    electron_1.ipcMain.handle('printer:printLabel', (_, product) => {
        console.log('IMPRIMIR ETIQUETA:', product.name);
        return { success: true };
    });
}
//# sourceMappingURL=handlers.js.map