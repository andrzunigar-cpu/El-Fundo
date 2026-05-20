import { ipcMain } from 'electron'
import { getDb } from '../database/init'
import { randomUUID } from 'crypto'

export function setupIpcHandlers() {
  const db = getDb

  // ── Productos ─────────────────────────────────────────────
  ipcMain.handle('products:getAll', () => {
    return db().prepare(`
      SELECT p.*, sl.quantity, sl.reserved_quantity,
             (sl.quantity - sl.reserved_quantity) as available
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.name
    `).all()
  })

  ipcMain.handle('products:search', (_, query: string) => {
    return db().prepare(`
      SELECT p.*, sl.quantity
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active'
        AND (p.name LIKE ? OR p.sku LIKE ?)
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`)
  })

  ipcMain.handle('products:getById', (_, id: string) => {
    return db().prepare('SELECT * FROM products WHERE id = ?').get(id)
  })

  ipcMain.handle('products:create', (_, data: any) => {
    const id = `prod-${data.sku.toLowerCase()}`
    const deviceId = (db().prepare("SELECT value FROM config WHERE key='device_id'").get() as any).value
    try {
      db().prepare(`
        INSERT INTO products (id, sku, name, category_id, meat_type, cut, price_unit, base_price,
          requires_weight, is_available_online, is_featured, image_urls, status, sync_status, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, '[]', 'active', 'pending', 1, datetime('now'), datetime('now'))
      `).run(id, data.sku, data.name, data.categoryId, data.meatType, data.cut || null,
             data.priceUnit, data.basePrice, data.requiresWeight ? 1 : 0)

      db().prepare(`
        INSERT INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
        VALUES (?, ?, 0, 0, 0, 'pending', datetime('now'))
      `).run(`stock-${id}`, id)

      db().prepare(`
        INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, device_id, created_at)
        VALUES (?, 'product', ?, 'create', ?, ?, datetime('now'))
      `).run(randomUUID(), id, JSON.stringify({ id, ...data }), deviceId)

      return { id, ...data }
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) throw new Error('SKU ya existe')
      throw err
    }
  })

  ipcMain.handle('products:updatePrice', (_, id: string, price: number) => {
    db().prepare(`
      UPDATE products SET base_price = ?, sync_status = 'pending', updated_at = datetime('now') WHERE id = ?
    `).run(price, id)
    db().prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, device_id, created_at)
      VALUES (?, 'product', ?, 'update', ?, (SELECT value FROM config WHERE key='device_id'), datetime('now'))
    `).run(randomUUID(), id, JSON.stringify({ id, basePrice: price }))
    return { success: true }
  })

  // ── Inventario ────────────────────────────────────────────
  ipcMain.handle('inventory:getAllStock', () => {
    return db().prepare(`
      SELECT p.id, p.name, p.sku, p.requires_weight,
             COALESCE(sl.quantity, 0) as quantity,
             COALESCE(sl.min_stock, 0) as min_stock,
             COALESCE(sl.reserved_quantity, 0) as reserved_quantity
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.name
    `).all()
  })

  // ── Operaciones de Inventario ──────────────────────────────

  // Log unificado de movimientos con filtros
  ipcMain.handle('inventory:getMovements', (_, filters: any = {}) => {
    const { from, to, type, productId, limit = 200 } = filters
    const where: string[] = []
    const params: any[] = []
    if (from)      { where.push('m.created_at >= ?'); params.push(from + 'T00:00:00') }
    if (to)        { where.push('m.created_at <= ?'); params.push(to + 'T23:59:59') }
    if (type)      { where.push('m.type = ?');        params.push(type) }
    if (productId) { where.push('m.product_id = ?');  params.push(productId) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    return db().prepare(`
      SELECT m.*, p.name as product_name, p.sku as product_sku, p.requires_weight
      FROM stock_movements m
      LEFT JOIN products p ON p.id = m.product_id
      ${whereSql}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `).all(...params)
  })

  // Resumen del inventario (KPIs)
  ipcMain.handle('inventory:getSummary', (_, filters: any = {}) => {
    const { from, to } = filters
    const dateFilter = from && to ? `WHERE m.created_at BETWEEN '${from}T00:00:00' AND '${to}T23:59:59'` : ''
    const products = (db().prepare("SELECT COUNT(*) as c FROM products WHERE status='active'").get() as any).c
    const outOfStock = (db().prepare("SELECT COUNT(*) as c FROM stock_levels WHERE quantity <= 0").get() as any).c
    const lowStock = (db().prepare("SELECT COUNT(*) as c FROM stock_levels WHERE quantity > 0 AND quantity < min_stock").get() as any).c
    const purchases = (db().prepare(`SELECT COUNT(*) as c, COALESCE(SUM(total),0) as t FROM purchase_invoices ${dateFilter ? dateFilter.replace('m.created_at','invoice_date') : ''}`).get() as any)
    const consumption = (db().prepare(`SELECT COALESCE(SUM(ABS(quantity)),0) as q FROM stock_movements m WHERE type='consumption' ${dateFilter ? 'AND ' + dateFilter.slice(6) : ''}`).get() as any)
    const counts = (db().prepare("SELECT COUNT(*) as c FROM inventory_counts WHERE status='completed'").get() as any).c
    return {
      activeProducts: products,
      outOfStock,
      lowStock,
      purchasesCount: purchases.c,
      purchasesTotal: purchases.t,
      consumptionQuantity: consumption.q,
      completedCounts: counts,
    }
  })

  // ── Inventario inicial (bulk set) ─────────────────────────
  ipcMain.handle('inventory:setInitial', (_, items: any[]) => {
    const deviceId = (db().prepare("SELECT value FROM config WHERE key='device_id'").get() as any).value
    const upsertStock = db().prepare(`
      INSERT INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
      VALUES (COALESCE((SELECT id FROM stock_levels WHERE product_id = ?), ?), ?, ?, 0, 0, 'pending', datetime('now'))
      ON CONFLICT(product_id) DO UPDATE SET quantity = excluded.quantity, sync_status='pending', updated_at=datetime('now')
    `)
    const insertMov = db().prepare(`
      INSERT INTO stock_movements (id, product_id, type, quantity, quantity_before, quantity_after, notes, user_id, sync_status, created_at)
      VALUES (?, ?, 'initial', ?, ?, ?, ?, 'admin', 'pending', datetime('now'))
    `)
    let count = 0
    const tx = db().transaction(() => {
      for (const it of items) {
        const before = (db().prepare('SELECT quantity FROM stock_levels WHERE product_id = ?').get(it.productId) as any)?.quantity ?? 0
        upsertStock.run(it.productId, randomUUID(), it.productId, it.quantity)
        insertMov.run(randomUUID(), it.productId, it.quantity - before, before, it.quantity, 'Inventario inicial')
        count++
      }
    })
    tx()
    return { success: true, productsUpdated: count }
  })

  // ── Compras (facturas de proveedor) ───────────────────────
  ipcMain.handle('inventory:registerPurchase', (_, data: any) => {
    const invoiceId = randomUUID()
    const deviceId = (db().prepare("SELECT value FROM config WHERE key='device_id'").get() as any).value
    const subtotal = data.items.reduce((s: number, i: any) => s + i.subtotal, 0)

    const insertInvoice = db().prepare(`
      INSERT INTO purchase_invoices (id, invoice_number, supplier_name, supplier_rut, invoice_date, subtotal, tax, total, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    const insertItem = db().prepare(`
      INSERT INTO purchase_invoice_items (id, invoice_id, product_id, product_name, quantity, unit_cost, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const upsertStock = db().prepare(`
      INSERT INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
      VALUES (?, ?, ?, 0, 0, 'pending', datetime('now'))
      ON CONFLICT(product_id) DO UPDATE SET quantity = quantity + excluded.quantity, sync_status='pending', updated_at=datetime('now')
    `)
    const insertMov = db().prepare(`
      INSERT INTO stock_movements (id, product_id, type, quantity, quantity_before, quantity_after, reference_id, reference_type, notes, user_id, cost_per_unit, sync_status, created_at)
      VALUES (?, ?, 'purchase', ?, ?, ?, ?, 'purchase_invoice', ?, 'admin', ?, 'pending', datetime('now'))
    `)

    const tx = db().transaction(() => {
      insertInvoice.run(invoiceId, data.invoiceNumber, data.supplierName, data.supplierRut || null,
        data.invoiceDate, subtotal, data.tax || 0, data.total || subtotal + (data.tax || 0), data.notes || null)

      for (const item of data.items) {
        const itemId = randomUUID()
        insertItem.run(itemId, invoiceId, item.productId, item.productName, item.quantity, item.unitCost, item.subtotal)
        const before = (db().prepare('SELECT quantity FROM stock_levels WHERE product_id = ?').get(item.productId) as any)?.quantity ?? 0
        upsertStock.run(randomUUID(), item.productId, item.quantity)
        insertMov.run(randomUUID(), item.productId, item.quantity, before, before + item.quantity,
          invoiceId, `Compra ${data.invoiceNumber} - ${data.supplierName}`, item.unitCost)
      }

      db().prepare(`
        INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, device_id, created_at)
        VALUES (?, 'purchase_invoice', ?, 'create', ?, ?, datetime('now'))
      `).run(randomUUID(), invoiceId, JSON.stringify({ id: invoiceId, ...data }), deviceId)
    })
    tx()

    return { id: invoiceId, ...data }
  })

  ipcMain.handle('inventory:listPurchases', (_, filters: any = {}) => {
    const { from, to, limit = 100 } = filters
    const where: string[] = []
    const params: any[] = []
    if (from) { where.push('invoice_date >= ?'); params.push(from) }
    if (to)   { where.push('invoice_date <= ?'); params.push(to) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    return db().prepare(`
      SELECT i.*, (SELECT COUNT(*) FROM purchase_invoice_items WHERE invoice_id = i.id) as item_count
      FROM purchase_invoices i ${whereSql}
      ORDER BY invoice_date DESC, created_at DESC LIMIT ${limit}
    `).all(...params)
  })

  ipcMain.handle('inventory:getPurchase', (_, id: string) => {
    const invoice = db().prepare('SELECT * FROM purchase_invoices WHERE id = ?').get(id) as any
    if (!invoice) return null
    const items = db().prepare('SELECT * FROM purchase_invoice_items WHERE invoice_id = ?').all(id)
    return { ...invoice, items }
  })

  // ── Consumos / Mermas ─────────────────────────────────────
  ipcMain.handle('inventory:registerConsumption', (_, data: any) => {
    const deviceId = (db().prepare("SELECT value FROM config WHERE key='device_id'").get() as any).value
    const upsertStock = db().prepare(`UPDATE stock_levels SET quantity = MAX(0, quantity - ?), sync_status='pending', updated_at=datetime('now') WHERE product_id = ?`)
    const insertMov = db().prepare(`
      INSERT INTO stock_movements (id, product_id, type, quantity, quantity_before, quantity_after, notes, user_id, sync_status, created_at)
      VALUES (?, ?, 'consumption', ?, ?, ?, ?, 'admin', 'pending', datetime('now'))
    `)
    let total = 0
    const tx = db().transaction(() => {
      for (const item of data.items) {
        const before = (db().prepare('SELECT quantity FROM stock_levels WHERE product_id = ?').get(item.productId) as any)?.quantity ?? 0
        const after = Math.max(0, before - item.quantity)
        upsertStock.run(item.quantity, item.productId)
        insertMov.run(randomUUID(), item.productId, -item.quantity, before, after, item.reason || data.reason || 'Consumo/merma')
        total += item.quantity
      }
    })
    tx()
    return { success: true, totalConsumed: total, items: data.items.length }
  })

  ipcMain.handle('inventory:listConsumptions', (_, filters: any = {}) => {
    const { from, to, limit = 200 } = filters
    const where: string[] = ["m.type = 'consumption'"]
    const params: any[] = []
    if (from) { where.push('m.created_at >= ?'); params.push(from + 'T00:00:00') }
    if (to)   { where.push('m.created_at <= ?'); params.push(to + 'T23:59:59') }
    return db().prepare(`
      SELECT m.*, p.name as product_name, p.sku as product_sku, p.requires_weight
      FROM stock_movements m
      LEFT JOIN products p ON p.id = m.product_id
      WHERE ${where.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `).all(...params)
  })

  // ── Toma de inventario ────────────────────────────────────
  ipcMain.handle('inventory:countStart', () => {
    const id = randomUUID()
    const count = (db().prepare('SELECT COUNT(*) as c FROM inventory_counts').get() as any).c
    const reference = `TOMA-${String(count + 1).padStart(4, '0')}`
    db().prepare(`
      INSERT INTO inventory_counts (id, reference, status, user_id, created_at)
      VALUES (?, ?, 'draft', 'admin', datetime('now'))
    `).run(id, reference)

    // Pre-populate with all active products and current quantity
    const products = db().prepare(`
      SELECT p.id, p.name, p.sku, COALESCE(sl.quantity, 0) as quantity
      FROM products p LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active' ORDER BY p.name
    `).all() as any[]

    const insertItem = db().prepare(`
      INSERT INTO inventory_count_items (id, count_id, product_id, product_name, product_sku, system_quantity, counted_quantity, difference)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `)
    const tx = db().transaction(() => {
      for (const p of products) insertItem.run(randomUUID(), id, p.id, p.name, p.sku, p.quantity, p.quantity)
    })
    tx()
    return { id, reference, productsCount: products.length }
  })

  ipcMain.handle('inventory:countGetItems', (_, countId: string) => {
    const count = db().prepare('SELECT * FROM inventory_counts WHERE id = ?').get(countId) as any
    if (!count) return null
    const items = db().prepare(`
      SELECT ci.*, p.requires_weight
      FROM inventory_count_items ci LEFT JOIN products p ON p.id = ci.product_id
      WHERE count_id = ? ORDER BY product_name
    `).all(countId)
    return { ...count, items }
  })

  ipcMain.handle('inventory:countUpdateItem', (_, countId: string, productId: string, countedQty: number, notes?: string) => {
    const item = db().prepare('SELECT * FROM inventory_count_items WHERE count_id = ? AND product_id = ?').get(countId, productId) as any
    if (!item) throw new Error('Item no encontrado')
    const diff = countedQty - Number(item.system_quantity)
    db().prepare(`
      UPDATE inventory_count_items SET counted_quantity = ?, difference = ?, notes = ? WHERE id = ?
    `).run(countedQty, diff, notes || null, item.id)
    return { success: true, difference: diff }
  })

  ipcMain.handle('inventory:countComplete', (_, countId: string, notes?: string) => {
    const count = db().prepare('SELECT * FROM inventory_counts WHERE id = ?').get(countId) as any
    if (!count) throw new Error('Toma no encontrada')
    if (count.status !== 'draft') throw new Error('Toma ya cerrada')
    const items = db().prepare('SELECT * FROM inventory_count_items WHERE count_id = ?').all(countId) as any[]

    const itemsWithDiff = items.filter(i => Number(i.difference) !== 0)
    const upsertStock = db().prepare(`UPDATE stock_levels SET quantity = ?, sync_status='pending', updated_at=datetime('now') WHERE product_id = ?`)
    const insertMov = db().prepare(`
      INSERT INTO stock_movements (id, product_id, type, quantity, quantity_before, quantity_after, reference_id, reference_type, notes, user_id, sync_status, created_at)
      VALUES (?, ?, 'count_adjustment', ?, ?, ?, ?, 'inventory_count', ?, 'admin', 'pending', datetime('now'))
    `)
    const tx = db().transaction(() => {
      for (const it of itemsWithDiff) {
        upsertStock.run(it.counted_quantity, it.product_id)
        insertMov.run(randomUUID(), it.product_id, it.difference, it.system_quantity, it.counted_quantity, countId,
          `Toma ${count.reference}${it.notes ? ' - ' + it.notes : ''}`)
      }
      db().prepare(`
        UPDATE inventory_counts SET status='completed', completed_at=datetime('now'),
        total_products = ?, total_differences = ?, notes = COALESCE(?, notes) WHERE id = ?
      `).run(items.length, itemsWithDiff.length, notes || null, countId)
    })
    tx()
    return { success: true, productsAdjusted: itemsWithDiff.length }
  })

  ipcMain.handle('inventory:countCancel', (_, countId: string) => {
    db().prepare("UPDATE inventory_counts SET status='cancelled' WHERE id = ?").run(countId)
    return { success: true }
  })

  ipcMain.handle('inventory:listCounts', (_, filters: any = {}) => {
    const { from, to, limit = 100 } = filters
    const where: string[] = []
    const params: any[] = []
    if (from) { where.push('created_at >= ?'); params.push(from + 'T00:00:00') }
    if (to)   { where.push('created_at <= ?'); params.push(to + 'T23:59:59') }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    return db().prepare(`SELECT * FROM inventory_counts ${whereSql} ORDER BY created_at DESC LIMIT ${limit}`).all(...params)
  })

  ipcMain.handle('inventory:adjust', (_, productId: string, quantity: number, notes: string) => {
    const deviceId = (db().prepare("SELECT value FROM config WHERE key='device_id'").get() as any).value
    const current = db().prepare('SELECT quantity FROM stock_levels WHERE product_id = ?').get(productId) as any
    const before = current?.quantity ?? 0
    const after = before + quantity

    db().prepare(`
      INSERT OR REPLACE INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
      VALUES (COALESCE((SELECT id FROM stock_levels WHERE product_id = ?), ?), ?, ?, 0, 0, 'pending', datetime('now'))
    `).run(productId, randomUUID(), productId, after)

    db().prepare(`
      INSERT INTO stock_movements (id, product_id, type, quantity, quantity_before, quantity_after, notes, user_id, sync_status, created_at)
      VALUES (?, ?, 'adjustment', ?, ?, ?, ?, 'system', 'pending', datetime('now'))
    `).run(randomUUID(), productId, quantity, before, after, notes)

    return { success: true, newQuantity: after }
  })

  // ── Órdenes ───────────────────────────────────────────────
  ipcMain.handle('orders:create', (_, orderData: any) => {
    const id = randomUUID()
    const localId = `local_${Date.now()}`
    const deviceId = (db().prepare("SELECT value FROM config WHERE key='device_id'").get() as any).value

    const count = (db().prepare("SELECT COUNT(*) as c FROM orders").get() as any).c
    const orderNumber = `EF-LOCAL-${String(count + 1).padStart(5, '0')}`

    const insert = db().prepare(`
      INSERT INTO orders (id, local_id, order_number, source, status, customer_name, customer_phone,
        subtotal, discount_total, tax_total, total, payment_method, payment_status,
        delivery_type, delivery_fee, notes, sync_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, 'pending', 1, datetime('now'), datetime('now'))
    `)

    const insertItem = db().prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, weight_kg, unit_price, subtotal, discount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `)

    const updateStock = db().prepare(`
      UPDATE stock_levels SET quantity = MAX(0, quantity - ?), sync_status='pending', updated_at=datetime('now')
      WHERE product_id = ?
    `)

    db().transaction(() => {
      insert.run(id, localId, orderNumber, orderData.source ?? 'pos',
        orderData.customerName, orderData.customerPhone,
        orderData.subtotal, orderData.discountTotal ?? 0, orderData.taxTotal ?? 0, orderData.total,
        orderData.paymentMethod, orderData.deliveryType, orderData.deliveryFee ?? 0, orderData.notes)

      for (const item of orderData.items) {
        insertItem.run(randomUUID(), id, item.productId, item.productName, item.productSku,
          item.quantity, item.weightKg, item.unitPrice, item.subtotal)
        updateStock.run(item.weightKg ?? item.quantity, item.productId)
      }

      // Encolar para sync
      db().prepare(`
        INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, device_id, created_at)
        VALUES (?, 'order', ?, 'create', ?, ?, datetime('now'))
      `).run(randomUUID(), id, JSON.stringify({ ...orderData, id, orderNumber }), deviceId)
    })()

    return { id, orderNumber, ...orderData }
  })

  ipcMain.handle('orders:getAll', (_, filters: any) => {
    const { status, limit = 50 } = filters ?? {}
    let query = `SELECT o.*, COUNT(oi.id) as item_count
                 FROM orders o
                 LEFT JOIN order_items oi ON oi.order_id = o.id`
    if (status) query += ` WHERE o.status = '${status}'`
    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${limit}`
    return db().prepare(query).all()
  })

  ipcMain.handle('orders:getPendingWeb', () => {
    return db().prepare(`
      SELECT o.*, GROUP_CONCAT(oi.product_name) as product_names
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.source = 'web' AND o.status IN ('pending', 'confirmed', 'preparing')
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `).all()
  })

  ipcMain.handle('orders:updateStatus', (_, id: string, status: string) => {
    db().prepare(`UPDATE orders SET status=?, sync_status='pending', updated_at=datetime('now') WHERE id=?`).run(status, id)
    return { success: true }
  })

  // ── Clientes ──────────────────────────────────────────────
  ipcMain.handle('customers:search', (_, query: string) => {
    return db().prepare(`
      SELECT * FROM customers
      WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR rut LIKE ?
      LIMIT 10
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`)
  })

  ipcMain.handle('customers:create', (_, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO customers (id, rut, first_name, last_name, email, phone, loyalty_points, total_spent, status, sync_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'active', 'pending', 1, datetime('now'), datetime('now'))
    `).run(id, data.rut, data.firstName, data.lastName, data.email, data.phone)
    return { id, ...data }
  })

  // ── Sesión de caja ─────────────────────────────────────────
  ipcMain.handle('session:open', (_, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO sale_sessions (id, cashier_id, register_number, opened_at, opening_cash, total_sales, total_orders)
      VALUES (?, ?, ?, datetime('now'), ?, 0, 0)
    `).run(id, data.cashierId ?? 'system', data.registerNumber ?? 1, data.openingCash)
    db().prepare("UPDATE config SET value=? WHERE key='current_session_id'").run(id)
    return { id, openedAt: new Date().toISOString() }
  })

  ipcMain.handle('session:getCurrent', () => {
    const sessionId = (db().prepare("SELECT value FROM config WHERE key='current_session_id'").get() as any)?.value
    if (!sessionId) return null
    return db().prepare('SELECT * FROM sale_sessions WHERE id = ? AND closed_at IS NULL').get(sessionId)
  })

  // ── Sincronización ─────────────────────────────────────────
  ipcMain.handle('sync:getStatus', () => {
    const pending = (db().prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status='pending'").get() as any).c
    const failed = (db().prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status='failed'").get() as any).c
    const isOnline = (db().prepare("SELECT value FROM config WHERE key='is_online'").get() as any)?.value === 'true'
    return { isOnline, isSyncing: false, pendingItems: pending, failedItems: failed }
  })

  ipcMain.handle('sync:getQueue', () => {
    return db().prepare("SELECT * FROM sync_queue WHERE status IN ('pending','failed') ORDER BY created_at ASC LIMIT 100").all()
  })

  ipcMain.handle('sync:triggerNow', () => {
    // Trigger manual sync — el SyncManager corre en background, esto solo retorna el estado actual
    const pending = (db().prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status='pending'").get() as any).c
    return { triggered: true, pendingItems: pending }
  })

  ipcMain.handle('sync:getLogs', () => {
    return db().prepare("SELECT * FROM sync_queue ORDER BY created_at DESC LIMIT 50").all()
  })

  // ── Handlers complementarios ───────────────────────────────
  ipcMain.handle('orders:getById', (_, id: string) => {
    const order = db().prepare('SELECT * FROM orders WHERE id = ?').get(id) as any
    if (!order) return null
    const items = db().prepare('SELECT * FROM order_items WHERE order_id = ?').all(id)
    return { ...order, items }
  })

  ipcMain.handle('customers:getById', (_, id: string) => {
    return db().prepare('SELECT * FROM customers WHERE id = ?').get(id)
  })

  ipcMain.handle('inventory:getStock', (_, productId: string) => {
    return db().prepare('SELECT * FROM stock_levels WHERE product_id = ?').get(productId)
  })

  ipcMain.handle('session:close', (_, data: any) => {
    const sessionId = (db().prepare("SELECT value FROM config WHERE key='current_session_id'").get() as any)?.value
    if (!sessionId) return { success: false, message: 'No hay sesión abierta' }
    const session = db().prepare('SELECT * FROM sale_sessions WHERE id = ?').get(sessionId) as any
    const expected = (session?.opening_cash ?? 0) + (session?.total_sales ?? 0)
    const difference = (data.closingCash ?? 0) - expected
    db().prepare(`
      UPDATE sale_sessions
      SET closed_at = datetime('now'), closing_cash = ?, expected_cash = ?, difference = ?, notes = ?
      WHERE id = ?
    `).run(data.closingCash, expected, difference, data.notes ?? null, sessionId)
    db().prepare("UPDATE config SET value='' WHERE key='current_session_id'").run()
    return { success: true, expected, difference }
  })

  ipcMain.handle('printer:test', () => {
    console.log('TEST PRINTER')
    return { success: true, message: 'Test enviado' }
  })

  ipcMain.handle('reports:cashClosing', (_, sessionId: string) => {
    const session = db().prepare('SELECT * FROM sale_sessions WHERE id = ?').get(sessionId)
    const orders = db().prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(total) as total
      FROM orders WHERE session_id = ? AND status = 'completed'
      GROUP BY payment_method
    `).all(sessionId)
    return { session, paymentBreakdown: orders }
  })

  // ── Reportes ──────────────────────────────────────────────
  ipcMain.handle('reports:dailySales', (_, date: string) => {
    const start = `${date}T00:00:00`
    const end = `${date}T23:59:59`
    const totals = db().prepare(`
      SELECT COUNT(*) as total_orders, SUM(total) as total_revenue, AVG(total) as avg_ticket
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
    `).get(start, end) as any

    const topProducts = db().prepare(`
      SELECT oi.product_name, SUM(oi.quantity) as qty, SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status='completed' AND o.created_at BETWEEN ? AND ?
      GROUP BY oi.product_id ORDER BY revenue DESC LIMIT 5
    `).all(start, end)

    return { date, ...totals, topProducts }
  })

  // ── Impresión (placeholder) ────────────────────────────────
  ipcMain.handle('printer:printTicket', (_, order: any) => {
    console.log('IMPRIMIR TICKET:', order.orderNumber ?? order.orderId)
    // TODO: integrar node-escpos o SerialPort para impresora real
    return { success: true, message: 'Ticket enviado a impresora' }
  })

  ipcMain.handle('printer:printLabel', (_, product: any) => {
    console.log('IMPRIMIR ETIQUETA:', product.name)
    return { success: true }
  })
}
