import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { getDb } from '../database/init'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

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
    const id = `prod-${data.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const deviceId = (db().prepare("SELECT value FROM config WHERE key='device_id'").get() as any).value
    try {
      db().prepare(`
        INSERT INTO products (id, sku, name, category_id, meat_type, cut, price_unit, base_price,
          requires_weight, format_id, format_label, format_weight_kg, additional_tax_pct,
          is_available_online, is_featured, image_urls, status, sync_status, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, '[]', 'active', 'pending', 1, datetime('now'), datetime('now'))
      `).run(id, data.sku, data.name, data.categoryId, data.meatType, data.cut || null,
             data.priceUnit, data.basePrice, data.requiresWeight ? 1 : 0,
             data.formatId || null, data.formatLabel || null, data.formatWeightKg ?? null,
             data.additionalTaxPct ?? 0)

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

  ipcMain.handle('products:toggleStatus', (_, id: string) => {
    const p = db().prepare('SELECT status FROM products WHERE id = ?').get(id) as any
    if (!p) throw new Error('Producto no encontrado')
    const next = p.status === 'active' ? 'inactive' : 'active'
    db().prepare(`UPDATE products SET status=?, sync_status='pending', updated_at=datetime('now') WHERE id=?`).run(next, id)
    return { status: next }
  })

  ipcMain.handle('products:update', (_, id: string, data: any) => {
    const existing = db().prepare('SELECT id FROM products WHERE id = ?').get(id) as any
    if (!existing) throw new Error('Producto no encontrado')
    db().prepare(`
      UPDATE products SET
        name = ?, category_id = ?, meat_type = ?, base_price = ?, cost_price = ?,
        requires_weight = ?, price_unit = ?, format_id = ?, format_label = ?, format_weight_kg = ?,
        ila_amount = ?, flete_amount = ?, additional_tax_pct = ?,
        sync_status = 'pending', updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.name, data.categoryId, data.meatType, data.basePrice, data.costPrice ?? 0,
      data.requiresWeight ? 1 : 0, data.priceUnit,
      data.formatId || null, data.formatLabel || null, data.formatWeightKg ?? null,
      data.ilaAmount ?? 0, data.fleteAmount ?? 0,
      data.additionalTaxPct ?? 0,
      id
    )
    return { success: true }
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

  // ── Formatos de producto ──────────────────────────────────
  ipcMain.handle('formats:getAll', () => {
    return db().prepare('SELECT * FROM product_formats ORDER BY sort_order, name').all()
  })

  ipcMain.handle('formats:create', (_, data: any) => {
    const id = `fmt-${Date.now()}`
    const count = (db().prepare('SELECT COUNT(*) as c FROM product_formats').get() as any).c
    db().prepare(`
      INSERT INTO product_formats (id, name, unit, weight_kg, is_variable, is_active, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
    `).run(id, data.name, data.unit ?? 'kg', data.weightKg ?? 0, data.isVariable ?? 0, count + 1)
    return db().prepare('SELECT * FROM product_formats WHERE id = ?').get(id)
  })

  ipcMain.handle('formats:update', (_, id: string, data: any) => {
    const fields: string[] = []
    const vals: any[] = []
    if (data.name     !== undefined) { fields.push('name = ?');       vals.push(data.name) }
    if (data.unit     !== undefined) { fields.push('unit = ?');       vals.push(data.unit) }
    if (data.weightKg !== undefined) { fields.push('weight_kg = ?');  vals.push(data.weightKg) }
    if (data.isActive !== undefined) { fields.push('is_active = ?');  vals.push(data.isActive) }
    if (fields.length === 0) return { success: false }
    vals.push(id)
    db().prepare(`UPDATE product_formats SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
    return { success: true }
  })

  // ── Inventario ────────────────────────────────────────────
  ipcMain.handle('inventory:getAllStock', () => {
    return db().prepare(`
      SELECT p.id, p.name, p.sku, p.requires_weight, p.category_id, p.format_label,
             COALESCE(sl.quantity, 0)            as quantity,
             COALESCE(sl.min_stock, 0)           as min_stock,
             COALESCE(sl.reserved_quantity, 0)   as reserved_quantity,
             COALESCE(mc.movement_count, 0)      as movement_count,
             COALESCE(mc.last_movement_at, NULL) as last_movement_at,
             COALESCE(mv.mov_in,  0)             as mov_in,
             COALESCE(mv.mov_out, 0)             as mov_out
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      LEFT JOIN (
        SELECT product_id,
               COUNT(*)        as movement_count,
               MAX(created_at) as last_movement_at
        FROM stock_movements
        GROUP BY product_id
      ) mc ON mc.product_id = p.id
      LEFT JOIN (
        SELECT product_id,
               SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END)       as mov_in,
               ABS(SUM(CASE WHEN quantity < 0 THEN quantity ELSE 0 END))  as mov_out
        FROM stock_movements
        GROUP BY product_id
      ) mv ON mv.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.category_id, p.name
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
      INSERT INTO purchase_invoices (id, invoice_number, supplier_name, supplier_rut, invoice_date, subtotal, tax, total, notes, document_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
    const insertExpiry = db().prepare(`
      INSERT INTO product_expiry (id, product_id, quantity, expiry_date, lot_number, supplier_name, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)

    const tx = db().transaction(() => {
      insertInvoice.run(invoiceId, data.invoiceNumber, data.supplierName, data.supplierRut || null,
        data.invoiceDate, subtotal, data.tax || 0, data.total || subtotal + (data.tax || 0),
        data.notes || null, data.documentType || 'factura')

      for (const item of data.items) {
        const itemId = randomUUID()
        insertItem.run(itemId, invoiceId, item.productId, item.productName, item.quantity, item.unitCost, item.subtotal)
        const before = (db().prepare('SELECT quantity FROM stock_levels WHERE product_id = ?').get(item.productId) as any)?.quantity ?? 0
        upsertStock.run(randomUUID(), item.productId, item.quantity)
        insertMov.run(randomUUID(), item.productId, item.quantity, before, before + item.quantity,
          invoiceId, `Compra ${data.invoiceNumber} - ${data.supplierName}`, item.unitCost)
        // Registrar vencimiento obligatorio
        if (item.expiryDate) {
          insertExpiry.run(randomUUID(), item.productId, item.quantity,
            item.expiryDate, item.lotNumber || null, data.supplierName || null, null)
        }
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
      SELECT ci.*, p.requires_weight, p.category_id
      FROM inventory_count_items ci LEFT JOIN products p ON p.id = ci.product_id
      WHERE count_id = ? ORDER BY p.category_id, product_name
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

    // Pagos: puede venir como array (multipago) o método único
    const payments: Array<{ method: string; amount: number }> =
      Array.isArray(orderData.payments) && orderData.payments.length > 0
        ? orderData.payments
        : [{ method: orderData.paymentMethod ?? 'cash', amount: orderData.total }]

    const primaryMethod = payments[0].method
    const totalPaid     = payments.reduce((s, p) => s + p.amount, 0)
    const changeGiven   = Math.max(0, totalPaid - orderData.total)

    const insert = db().prepare(`
      INSERT INTO orders (id, local_id, order_number, source, status, customer_name, customer_phone,
        subtotal, discount_total, tax_total, total, payment_method, payment_status,
        delivery_type, delivery_fee, notes, change_given, sync_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?, 'pending', 1, datetime('now','localtime'), datetime('now','localtime'))
    `)

    const insertItem = db().prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, weight_kg, unit_price, subtotal, discount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `)

    const insertPayment = db().prepare(`
      INSERT INTO order_payments (id, order_id, payment_method, amount, created_at)
      VALUES (?, ?, ?, ?, datetime('now','localtime'))
    `)

    const updateStock = db().prepare(`
      UPDATE stock_levels SET quantity = quantity - ?, sync_status='pending', updated_at=datetime('now')
      WHERE product_id = ?
    `)

    const getStock = db().prepare(`SELECT COALESCE(quantity, 0) as quantity FROM stock_levels WHERE product_id = ?`)

    const insertMovement = db().prepare(`
      INSERT INTO stock_movements
        (id, product_id, type, quantity, quantity_before, quantity_after, reference_id, reference_type, notes, user_id, sync_status, created_at)
      VALUES (?, ?, 'sale', ?, ?, ?, ?, 'order', ?, 'cajero', 'pending', datetime('now'))
    `)

    db().transaction(() => {
      insert.run(id, localId, orderNumber, orderData.source ?? 'pos',
        orderData.customerName, orderData.customerPhone,
        orderData.subtotal, orderData.discountTotal ?? 0, orderData.taxTotal ?? 0, orderData.total,
        primaryMethod, orderData.deliveryType, orderData.deliveryFee ?? 0, orderData.notes, changeGiven)

      for (const item of orderData.items) {
        insertItem.run(randomUUID(), id, item.productId, item.productName, item.productSku,
          item.quantity, item.weightKg, item.unitPrice, item.subtotal)

        const deduct = item.weightKg ?? item.quantity
        const before = ((getStock.get(item.productId) as any)?.quantity ?? 0)
        const after  = before - deduct
        updateStock.run(deduct, item.productId)
        insertMovement.run(randomUUID(), item.productId, -deduct, before, after, id, `Venta ${orderNumber}`)
      }

      for (const p of payments) {
        insertPayment.run(randomUUID(), id, p.method, p.amount)
      }

      // Encolar para sync
      db().prepare(`
        INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, device_id, created_at)
        VALUES (?, 'order', ?, 'create', ?, ?, datetime('now'))
      `).run(randomUUID(), id, JSON.stringify({ ...orderData, id, orderNumber, payments }), deviceId)
    })()

    // Notificar a todas las ventanas que el stock cambió
    BrowserWindow.getAllWindows().forEach(w => {
      w.webContents.send('stock-updated')
      w.webContents.send('new-order', { id, orderNumber })
    })

    return { id, orderNumber, total: orderData.total, changeGiven, payments, ...orderData }
  })

  ipcMain.handle('orders:getAll', (_, filters: any) => {
    const { status, limit = 200, from, to } = filters ?? {}
    const where: string[] = []
    if (status) where.push(`o.status = '${status}'`)
    if (from)   where.push(`o.created_at >= '${from}T00:00:00'`)
    if (to)     where.push(`o.created_at <= '${to}T23:59:59'`)
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    return db().prepare(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereSql}
      GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${limit}
    `).all()
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
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status='completed' AND o.created_at BETWEEN ? AND ?
      GROUP BY oi.product_id ORDER BY revenue DESC LIMIT 8
    `).all(start, end)

    const paymentBreakdown = db().prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(total) as total
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
      GROUP BY payment_method ORDER BY total DESC
    `).all(start, end)

    return { date, ...totals, topProducts, paymentBreakdown }
  })

  ipcMain.handle('reports:periodSales', (_, from: string, to: string) => {
    const start = `${from}T00:00:00`
    const end = `${to}T23:59:59`
    const totals = db().prepare(`
      SELECT COUNT(*) as total_orders, SUM(total) as total_revenue, AVG(total) as avg_ticket
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
    `).get(start, end) as any

    const topProducts = db().prepare(`
      SELECT oi.product_name, SUM(oi.quantity) as qty, SUM(oi.subtotal) as revenue
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status='completed' AND o.created_at BETWEEN ? AND ?
      GROUP BY oi.product_id ORDER BY revenue DESC LIMIT 8
    `).all(start, end)

    const paymentBreakdown = db().prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(total) as total
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
      GROUP BY payment_method ORDER BY total DESC
    `).all(start, end)

    const dailySeries = db().prepare(`
      SELECT substr(created_at,1,10) as day, COUNT(*) as orders, SUM(total) as revenue
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
      GROUP BY day ORDER BY day ASC
    `).all(start, end)

    return { from, to, ...totals, topProducts, paymentBreakdown, dailySeries }
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

  // ── Medios de pago: CRUD completo ────────────────────────
  ipcMain.handle('paymentSettings:getAll', () => {
    return db().prepare('SELECT * FROM payment_method_settings ORDER BY sort_order, method').all()
  })

  // Métodos agrupados para el selector en caja (sólo activos)
  ipcMain.handle('paymentSettings:getForPos', () => {
    const all = db().prepare('SELECT * FROM payment_method_settings WHERE is_active = 1 ORDER BY sort_order, method').all() as any[]
    const offline         = all.filter((m: any) => m.category === 'offline')
    const online_web      = all.filter((m: any) => m.category === 'online_web')
    const online_delivery = all.filter((m: any) => m.category === 'online_delivery')
    // show_online: métodos presenciales que también aplican online
    const offline_online  = all.filter((m: any) => m.category === 'offline' && m.show_online === 1)
    return { offline, online_web, online_delivery, offline_online }
  })

  ipcMain.handle('paymentSettings:update', (_, method: string, commissionPct: number) => {
    db().prepare('UPDATE payment_method_settings SET commission_pct = ? WHERE method = ?').run(commissionPct, method)
    return { success: true }
  })

  ipcMain.handle('paymentSettings:updateFull', (_, data: {
    method: string; label: string; commission_pct: number;
    category: string; channel: string | null; is_active: number; sort_order: number; show_online?: number
  }) => {
    db().prepare(`
      UPDATE payment_method_settings
      SET label = ?, commission_pct = ?, category = ?, channel = ?, is_active = ?, sort_order = ?, show_online = ?
      WHERE method = ?
    `).run(data.label, data.commission_pct, data.category, data.channel ?? null, data.is_active, data.sort_order, data.show_online ?? 0, data.method)
    return { success: true }
  })

  ipcMain.handle('paymentSettings:create', (_, data: {
    method: string; label: string; commission_pct: number;
    category: string; channel?: string | null; sort_order?: number
  }) => {
    // Sanitize method key: lowercase, no spaces, only alphanumeric + underscore
    const key = data.method.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const sort = data.sort_order ?? 99
    db().prepare(`
      INSERT INTO payment_method_settings (method, label, commission_pct, is_active, category, channel, sort_order)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `).run(key, data.label, data.commission_pct, data.category, data.channel ?? null, sort)
    return { success: true, method: key }
  })

  ipcMain.handle('paymentSettings:delete', (_, method: string) => {
    // Prevent deleting core methods
    const core = ['cash', 'debit_card', 'credit_card', 'transfer']
    if (core.includes(method)) return { success: false, message: 'No se puede eliminar un método principal' }
    db().prepare('DELETE FROM payment_method_settings WHERE method = ?').run(method)
    return { success: true }
  })

  ipcMain.handle('paymentSettings:toggleActive', (_, method: string) => {
    db().prepare(`
      UPDATE payment_method_settings SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE method = ?
    `).run(method)
    return { success: true }
  })

  // ── Categorías: CRUD ──────────────────────────────────────
  // Migración: columna color (idempotente)
  try { db().exec("ALTER TABLE categories ADD COLUMN color TEXT DEFAULT 'gray'") } catch {}

  ipcMain.handle('categories:getAll', () => {
    return db().prepare('SELECT * FROM categories ORDER BY sort_order ASC, name ASC').all()
  })

  ipcMain.handle('categories:create', (_, data: { name: string; slug?: string; sort_order?: number; color?: string }) => {
    const id   = `cat-${(data.slug ?? data.name).toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const slug = (data.slug ?? data.name).toLowerCase().replace(/[^a-z0-9]/g, '-')
    const sort = data.sort_order ?? 99
    const color = data.color ?? 'gray'
    const now  = new Date().toISOString()
    db().prepare(`
      INSERT OR IGNORE INTO categories (id, name, slug, sort_order, color, status, sync_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', 'pending', 1, ?, ?)
    `).run(id, data.name, slug, sort, color, now, now)
    return { success: true, id }
  })

  ipcMain.handle('categories:update', (_, id: string, data: { name?: string; sort_order?: number; color?: string }) => {
    const now = new Date().toISOString()
    if (data.name !== undefined)
      db().prepare("UPDATE categories SET name = ?, updated_at = ? WHERE id = ?").run(data.name, now, id)
    if (data.sort_order !== undefined)
      db().prepare("UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?").run(data.sort_order, now, id)
    if (data.color !== undefined)
      db().prepare("UPDATE categories SET color = ?, updated_at = ? WHERE id = ?").run(data.color, now, id)
    return { success: true }
  })

  ipcMain.handle('categories:toggleStatus', (_, id: string) => {
    const cat = db().prepare('SELECT status FROM categories WHERE id = ?').get(id) as any
    if (!cat) return { success: false }
    const next = cat.status === 'active' ? 'inactive' : 'active'
    db().prepare("UPDATE categories SET status = ?, updated_at = datetime('now') WHERE id = ?").run(next, id)
    return { success: true, status: next }
  })

  ipcMain.handle('categories:delete', (_, id: string) => {
    const core = ['cat-vacuno','cat-cerdo','cat-cordero','cat-pollo','cat-embutidos']
    if (core.includes(id)) return { success: false, message: 'No se puede eliminar una categoría principal' }
    db().prepare("DELETE FROM categories WHERE id = ?").run(id)
    return { success: true }
  })

  // ── Reset de datos transaccionales ───────────────────────
  ipcMain.handle('system:resetData', () => {
    const reset = db().transaction(() => {
      // 1. Borrar toda la actividad transaccional
      db().exec(`
        DELETE FROM order_items;
        DELETE FROM orders;
        DELETE FROM stock_movements;
        DELETE FROM sale_sessions;
        DELETE FROM inventory_count_items;
        DELETE FROM inventory_counts;
        DELETE FROM purchase_invoice_items;
        DELETE FROM purchase_invoices;
        DELETE FROM product_expiry;
        DELETE FROM sync_queue;
      `)
      // 2. Poner stock en 0
      db().exec(`UPDATE stock_levels SET quantity = 0, reserved_quantity = 0`)
      // 3. Limpiar sesión de caja activa
      db().exec(`UPDATE config SET value = '' WHERE key = 'current_session_id'`)
    })
    reset()
    return { success: true }
  })

  ipcMain.handle('inventory:resetAllStock', (event) => {
    // 1. Crear fila en stock_levels para cada producto activo que no tenga una
    db().prepare(`
      INSERT OR IGNORE INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
      SELECT 'stock-' || p.id, p.id, 0, 0, 0, 'pending', datetime('now')
      FROM products p WHERE p.status = 'active'
    `).run()
    // 2. Poner todos en 0
    db().prepare(`
      UPDATE stock_levels
      SET quantity = 0, reserved_quantity = 0, sync_status = 'pending', updated_at = datetime('now')
    `).run()
    // 3. Borrar movimientos
    db().prepare(`DELETE FROM stock_movements`).run()
    // 4. Notificar a TODAS las ventanas para que recarguen
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('stock-updated'))
    return { ok: true }
  })

  ipcMain.handle('system:getStats', () => {
    const orders  = (db().prepare('SELECT COUNT(*) as c FROM orders').get() as any).c
    const moves   = (db().prepare('SELECT COUNT(*) as c FROM stock_movements').get() as any).c
    const sessions = (db().prepare('SELECT COUNT(*) as c FROM sale_sessions').get() as any).c
    const products = (db().prepare("SELECT COUNT(*) as c FROM products WHERE status='active'").get() as any).c
    return { orders, moves, sessions, products }
  })

  // ── Precio de costo de productos ──────────────────────────
  ipcMain.handle('products:updateCost', (_, id: string, costPrice: number) => {
    db().prepare(`UPDATE products SET cost_price = ?, updated_at = datetime('now') WHERE id = ?`).run(costPrice, id)
    return { success: true }
  })

  // ── Vencimientos ──────────────────────────────────────────
  ipcMain.handle('expiry:getAll', () => {
    return db().prepare(`
      SELECT pe.*, p.name as product_name, p.sku as product_sku, p.base_price, p.cost_price
      FROM product_expiry pe
      JOIN products p ON p.id = pe.product_id
      ORDER BY pe.expiry_date ASC
    `).all()
  })

  ipcMain.handle('expiry:create', (_, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO product_expiry (id, product_id, quantity, expiry_date, lot_number, supplier_name, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, data.productId, data.quantity, data.expiryDate, data.lotNumber || null,
           data.supplierName || null, data.notes || null)
    return { id }
  })

  ipcMain.handle('expiry:delete', (_, id: string) => {
    db().prepare('DELETE FROM product_expiry WHERE id = ?').run(id)
    return { success: true }
  })

  // ── REPORTES AVANZADOS ────────────────────────────────────

  // Helper para construir rango de fechas
  function dateRange(from: string, to: string) {
    return { start: `${from}T00:00:00`, end: `${to}T23:59:59` }
  }

  // 1. Resumen con comparativo
  ipcMain.handle('reports:summary', (_, from: string, to: string, cFrom?: string, cTo?: string) => {
    const { start, end } = dateRange(from, to)
    const base = db().prepare(`
      SELECT COUNT(*) as orders, COALESCE(SUM(total),0) as revenue, COALESCE(AVG(total),0) as avg_ticket
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
    `).get(start, end) as any

    const series = db().prepare(`
      SELECT substr(created_at,1,10) as day, COUNT(*) as orders, SUM(total) as revenue
      FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
      GROUP BY day ORDER BY day
    `).all(start, end)

    let compare = null
    if (cFrom && cTo) {
      const { start: cs, end: ce } = dateRange(cFrom, cTo)
      compare = db().prepare(`
        SELECT COUNT(*) as orders, COALESCE(SUM(total),0) as revenue, COALESCE(AVG(total),0) as avg_ticket
        FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
      `).get(cs, ce) as any
    }

    return { from, to, ...base, series, compare }
  })

  // 2. Por medio de pago
  ipcMain.handle('reports:byPaymentMethod', (_, from: string, to: string, cFrom?: string, cTo?: string) => {
    const { start, end } = dateRange(from, to)
    const rows = db().prepare(`
      SELECT o.payment_method,
             COUNT(*) as orders,
             COALESCE(SUM(o.total),0) as revenue,
             COALESCE(AVG(o.total),0) as avg_ticket,
             COALESCE(pms.commission_pct, 0) as commission_pct,
             pms.label
      FROM orders o
      LEFT JOIN payment_method_settings pms ON pms.method = o.payment_method
      WHERE o.status='completed' AND o.created_at BETWEEN ? AND ?
      GROUP BY o.payment_method
      ORDER BY revenue DESC
    `).all(start, end) as any[]

    const total = rows.reduce((s, r) => s + r.revenue, 0)
    const result = rows.map(r => ({
      ...r,
      net_revenue: Math.round(r.revenue * (1 - r.commission_pct / 100)),
      commission_amount: Math.round(r.revenue * r.commission_pct / 100),
      participation_pct: total > 0 ? Math.round((r.revenue / total) * 1000) / 10 : 0,
    }))

    let compare = null
    if (cFrom && cTo) {
      const { start: cs, end: ce } = dateRange(cFrom, cTo)
      compare = db().prepare(`
        SELECT payment_method, COALESCE(SUM(total),0) as revenue, COUNT(*) as orders
        FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
        GROUP BY payment_method
      `).all(cs, ce)
    }

    return { from, to, total, rows: result, compare }
  })

  // 3 y 4. Ranking de productos (revenue / órdenes / rentabilidad bruta y neta)
  ipcMain.handle('reports:productRanking', (_, from: string, to: string, sortBy: string = 'neto_margin') => {
    const { start, end } = dateRange(from, to)
    const validSort: Record<string, string> = {
      revenue:     'total_revenue DESC',
      orders:      'order_count DESC',
      qty:         'total_qty DESC',
      profit:      'gross_profit DESC',
      margin:      'margin_pct DESC',
      neto_profit: 'neto_profit DESC',
      neto_margin: 'neto_margin_pct DESC',
    }
    const orderSql = validSort[sortBy] ?? 'neto_margin_pct DESC'

    return db().prepare(`
      SELECT
        oi.product_id,
        oi.product_name,
        MAX(oi.product_sku)                  as product_sku,
        COALESCE(MAX(p.cost_price), 0)       as cost_price,
        COALESCE(MAX(p.requires_weight), 0)  as requires_weight,
        COUNT(DISTINCT oi.order_id)          as order_count,
        SUM(oi.quantity)                     as total_qty,
        SUM(oi.subtotal)                     as total_revenue,

        -- ── Bruto (precio con IVA) ──────────────────────────
        ROUND(SUM(oi.subtotal) - SUM(oi.quantity * COALESCE(p.cost_price, 0))) as gross_profit,
        CASE WHEN SUM(oi.subtotal) > 0
          THEN ROUND(100.0 * (SUM(oi.subtotal) - SUM(oi.quantity * COALESCE(p.cost_price, 0)))
               / SUM(oi.subtotal), 1)
          ELSE 0 END as margin_pct,

        -- ── Neto (precio sin IVA 19% — costo ya es neto de factura) ──
        ROUND(SUM(oi.subtotal) / 1.19)       as neto_revenue,
        ROUND(SUM(oi.subtotal) / 1.19
              - SUM(oi.quantity * COALESCE(p.cost_price, 0))) as neto_profit,
        CASE WHEN SUM(oi.subtotal) > 0
          THEN ROUND(100.0 * (SUM(oi.subtotal) / 1.19
               - SUM(oi.quantity * COALESCE(p.cost_price, 0)))
               / (SUM(oi.subtotal) / 1.19), 1)
          ELSE 0 END as neto_margin_pct

      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.status='completed' AND o.created_at BETWEEN ? AND ?
      GROUP BY oi.product_id
      ORDER BY ${orderSql}
      LIMIT 100
    `).all(start, end)
  })

  // 6. Inventario teórico vs real
  ipcMain.handle('reports:inventoryDiff', () => {
    // Teórico = acumulado de todos los movimientos
    // Real = stock_levels.quantity (que se actualiza con movimientos)
    // Último conteo = del último inventory_count completado
    const products = db().prepare(`
      SELECT
        p.id, p.name, p.sku, p.requires_weight,
        COALESCE(sl.quantity, 0) as current_stock,
        COALESCE((
          SELECT SUM(sm2.quantity) FROM stock_movements sm2
          WHERE sm2.product_id = p.id
        ), 0) as theoretical_stock,
        COALESCE((
          SELECT SUM(sm3.quantity) FROM stock_movements sm3
          WHERE sm3.product_id = p.id AND sm3.quantity > 0
        ), 0) as total_entradas,
        COALESCE((
          SELECT SUM(ABS(sm4.quantity)) FROM stock_movements sm4
          WHERE sm4.product_id = p.id AND sm4.quantity < 0
        ), 0) as total_salidas,
        COALESCE((
          SELECT ici.counted_quantity
          FROM inventory_count_items ici
          JOIN inventory_counts ic ON ic.id = ici.count_id
          WHERE ici.product_id = p.id AND ic.status = 'completed'
          ORDER BY ic.completed_at DESC LIMIT 1
        ), NULL) as last_counted,
        COALESCE((
          SELECT ic.completed_at
          FROM inventory_count_items ici
          JOIN inventory_counts ic ON ic.id = ici.count_id
          WHERE ici.product_id = p.id AND ic.status = 'completed'
          ORDER BY ic.completed_at DESC LIMIT 1
        ), NULL) as last_count_date
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.name
    `).all() as any[]

    // Por proveedor: productos por facturas de compra
    const bySupplier = db().prepare(`
      SELECT pi.supplier_name,
             COUNT(DISTINCT pii.product_id) as product_count,
             SUM(pii.quantity) as total_qty,
             SUM(pii.subtotal) as total_cost
      FROM purchase_invoice_items pii
      JOIN purchase_invoices pi ON pi.id = pii.invoice_id
      GROUP BY pi.supplier_name
      ORDER BY total_cost DESC
    `).all()

    return {
      products: products.map(p => ({
        ...p,
        diff: Number(p.current_stock) - Number(p.theoretical_stock),
        total_entradas: Number(p.total_entradas),
        total_salidas:  Number(p.total_salidas),
      })),
      bySupplier,
    }
  })

  // 7a. Mermas
  ipcMain.handle('reports:mermas', (_, from: string, to: string) => {
    const { start, end } = dateRange(from, to)
    const byProduct = db().prepare(`
      SELECT p.name as product_name, p.sku, p.requires_weight, p.base_price,
             COALESCE(p.cost_price, 0) as cost_price,
             m.notes as reason,
             SUM(ABS(m.quantity)) as total_qty,
             ROUND(SUM(ABS(m.quantity)) * COALESCE(p.cost_price, p.base_price), 0) as value_lost
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      WHERE m.type = 'consumption' AND m.created_at BETWEEN ? AND ?
      GROUP BY m.product_id, m.notes
      ORDER BY value_lost DESC
    `).all(start, end)

    const byReason = db().prepare(`
      SELECT m.notes as reason,
             COUNT(*) as records,
             SUM(ABS(m.quantity)) as total_qty,
             ROUND(SUM(ABS(m.quantity)) * COALESCE(p.cost_price, p.base_price), 0) as value_lost
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      WHERE m.type = 'consumption' AND m.created_at BETWEEN ? AND ?
      GROUP BY m.notes
      ORDER BY value_lost DESC
    `).all(start, end)

    const totals = db().prepare(`
      SELECT SUM(ABS(m.quantity)) as total_qty,
             ROUND(SUM(ABS(m.quantity)) * COALESCE(p.cost_price, p.base_price), 0) as total_value
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      WHERE m.type = 'consumption' AND m.created_at BETWEEN ? AND ?
    `).get(start, end) as any

    return { from, to, byProduct, byReason, ...totals }
  })

  // 7b. Vencimientos
  ipcMain.handle('reports:expiring', (_, days: number = 30) => {
    return db().prepare(`
      SELECT pe.*, p.name as product_name, p.sku as product_sku,
             p.base_price, COALESCE(p.cost_price, 0) as cost_price,
             julianday(pe.expiry_date) - julianday('now') as days_remaining
      FROM product_expiry pe
      JOIN products p ON p.id = pe.product_id
      ORDER BY pe.expiry_date ASC
    `).all()
  })

  // 8. Reporte caja (sesiones)
  ipcMain.handle('reports:cashSessions', (_, from: string, to: string) => {
    const { start, end } = dateRange(from, to)
    const sessions = db().prepare(`
      SELECT ss.*,
        COALESCE((SELECT COUNT(*) FROM orders WHERE session_id = ss.id AND status='completed'), 0) as order_count,
        COALESCE((SELECT SUM(total) FROM orders WHERE session_id = ss.id AND status='completed'), 0) as total_revenue,
        COALESCE((SELECT SUM(CASE WHEN payment_method='cash' THEN total ELSE 0 END)
                  FROM orders WHERE session_id = ss.id AND status='completed'), 0) as cash_revenue
      FROM sale_sessions ss
      WHERE ss.opened_at BETWEEN ? AND ?
      ORDER BY ss.opened_at DESC
    `).all(start, end) as any[]

    // Enrich each session with payment breakdown
    const payBreakStmt = db().prepare(`
      SELECT o.payment_method,
             COALESCE(pms.label, o.payment_method) as label,
             COUNT(*) as orders,
             SUM(o.total) as revenue
      FROM orders o
      LEFT JOIN payment_method_settings pms ON pms.method = o.payment_method
      WHERE o.session_id = ? AND o.status = 'completed'
      GROUP BY o.payment_method
    `)
    const enriched = sessions.map((s: any) => ({
      ...s,
      payment_breakdown: payBreakStmt.all(s.id),
    }))

    return { from, to, sessions: enriched }
  })

  // 9. Facturas y guías
  ipcMain.handle('reports:invoicesReport', (_, from: string, to: string) => {
    const rawInvoices = db().prepare(`
      SELECT pi.*,
        pi.total as total_cost,
        (SELECT COUNT(*) FROM purchase_invoice_items WHERE invoice_id = pi.id) as product_count,
        COALESCE((SELECT SUM(pii.quantity) FROM purchase_invoice_items pii WHERE pii.invoice_id = pi.id), 0) as total_qty
      FROM purchase_invoices pi
      WHERE pi.invoice_date BETWEEN ? AND ?
      ORDER BY pi.invoice_date DESC
    `).all(from, to) as any[]

    // Attach items to each invoice
    const itemsStmt = db().prepare(`
      SELECT pii.*, p.sku, COALESCE(p.requires_weight, 0) as requires_weight,
             pii.unit_cost as cost_per_unit
      FROM purchase_invoice_items pii
      LEFT JOIN products p ON p.id = pii.product_id
      WHERE pii.invoice_id = ?
      ORDER BY pii.product_name ASC
    `)
    const invoices = rawInvoices.map((inv: any) => ({
      ...inv,
      items: itemsStmt.all(inv.id),
    }))

    const bySupplier = db().prepare(`
      SELECT pi.supplier_name,
             COUNT(*) as invoice_count,
             COALESCE(SUM(pii_agg.product_count), 0) as product_count,
             COALESCE(SUM(pii_agg.total_qty), 0) as total_qty,
             SUM(pi.total) as total_cost
      FROM purchase_invoices pi
      LEFT JOIN (
        SELECT invoice_id,
               COUNT(*) as product_count,
               SUM(quantity) as total_qty
        FROM purchase_invoice_items
        GROUP BY invoice_id
      ) pii_agg ON pii_agg.invoice_id = pi.id
      WHERE pi.invoice_date BETWEEN ? AND ?
      GROUP BY pi.supplier_name
      ORDER BY total_cost DESC
    `).all(from, to)

    const totals = db().prepare(`
      SELECT COUNT(*) as invoice_count,
             COALESCE(SUM(total), 0) as total_cost,
             COALESCE((SELECT SUM(quantity) FROM purchase_invoice_items pii
               JOIN purchase_invoices pi2 ON pi2.id = pii.invoice_id
               WHERE pi2.invoice_date BETWEEN ? AND ?), 0) as total_qty
      FROM purchase_invoices WHERE invoice_date BETWEEN ? AND ?
    `).get(from, to, from, to) as any

    return { from, to, invoices, bySupplier, ...totals }
  })

  // 10. Ventas por hora
  ipcMain.handle('reports:byHour', (_, from: string, to: string, cFrom?: string, cTo?: string) => {
    const { start, end } = dateRange(from, to)
    const rows = db().prepare(`
      SELECT
        CAST(substr(created_at, 12, 2) AS INTEGER) as hour,
        COUNT(*) as orders,
        SUM(total) as revenue,
        AVG(total) as avg_ticket
      FROM orders
      WHERE status='completed' AND created_at BETWEEN ? AND ?
      GROUP BY hour ORDER BY hour ASC
    `).all(start, end)

    let compare = null
    if (cFrom && cTo) {
      const { start: cs, end: ce } = dateRange(cFrom, cTo)
      compare = db().prepare(`
        SELECT CAST(substr(created_at, 12, 2) AS INTEGER) as hour,
               COUNT(*) as orders, SUM(total) as revenue
        FROM orders WHERE status='completed' AND created_at BETWEEN ? AND ?
        GROUP BY hour ORDER BY hour ASC
      `).all(cs, ce)
    }

    // Rellenar horas vacías 0-23
    const full = Array.from({ length: 24 }, (_, h) => {
      const found = (rows as any[]).find(r => r.hour === h)
      return found ?? { hour: h, orders: 0, revenue: 0, avg_ticket: 0 }
    })
    return { from, to, rows: full, compare }
  })

  // ── 11. Pre-IVA ────────────────────────────────────────────
  ipcMain.handle('reports:preIva', (_, from: string, to: string, ppmRate: number = 1.5) => {
    const { start, end } = dateRange(from, to)
    const IVA = 0.19

    // Ventas del período (excluir canceladas)
    const salesRaw = db().prepare(`
      SELECT COUNT(*) as order_count,
             COALESCE(SUM(total), 0) as total_bruto
      FROM orders
      WHERE status != 'cancelled'
        AND created_at BETWEEN ? AND ?
    `).get(start, end) as any

    const totalBruto    = Math.round(salesRaw.total_bruto || 0)
    const netoVentas    = Math.round(totalBruto / (1 + IVA))
    const ivaDebito     = totalBruto - netoVentas

    // Ventas por día (para tabla)
    const salesByDay = db().prepare(`
      SELECT date(created_at) as day,
             COUNT(*) as orders,
             COALESCE(SUM(total), 0) as bruto
      FROM orders
      WHERE status != 'cancelled'
        AND created_at BETWEEN ? AND ?
      GROUP BY day ORDER BY day
    `).all(start, end) as any[]

    // Compras con factura del período (solo facturas afectan el IVA crédito)
    const purchasesRaw = db().prepare(`
      SELECT COUNT(*) as invoice_count,
             COALESCE(SUM(total), 0) as total_facturas
      FROM purchase_invoices
      WHERE invoice_date BETWEEN ? AND ?
        AND (document_type = 'factura' OR document_type IS NULL)
    `).get(from, to) as any

    const totalFacturas  = Math.round(purchasesRaw.total_facturas || 0)
    const netoCompras    = Math.round(totalFacturas / (1 + IVA))
    const ivaCredito     = totalFacturas - netoCompras

    // Detalle facturas (solo document_type = 'factura')
    const facturas = db().prepare(`
      SELECT invoice_number, supplier_name, invoice_date,
             total as total_factura,
             ROUND(total / 1.19) as neto,
             ROUND(total - total / 1.19) as iva
      FROM purchase_invoices
      WHERE invoice_date BETWEEN ? AND ?
        AND (document_type = 'factura' OR document_type IS NULL)
      ORDER BY invoice_date ASC
    `).all(from, to) as any[]

    // PPM
    const ppm = Math.round(netoVentas * (ppmRate / 100))

    // Resultado IVA
    const ivaPagar = Math.max(0, ivaDebito - ivaCredito)
    const ivaFavor = ivaCredito > ivaDebito ? ivaCredito - ivaDebito : 0

    return {
      period: { from, to },
      ventas: {
        orderCount: salesRaw.order_count,
        totalBruto,
        netoVentas,
        ivaDebito,
        byDay: salesByDay.map(r => ({
          day: r.day,
          orders: r.orders,
          bruto: Math.round(r.bruto),
          neto: Math.round(r.bruto / 1.19),
          iva: Math.round(r.bruto - r.bruto / 1.19),
        })),
      },
      compras: {
        invoiceCount: purchasesRaw.invoice_count,
        totalFacturas,
        netoCompras,
        ivaCredito,
        facturas,
      },
      ppm: {
        rate: ppmRate,
        netoBase: netoVentas,
        amount: ppm,
      },
      resumen: {
        ivaDebito,
        ivaCredito,
        ivaPagar,
        ivaFavor,
        ppm,
        totalObligaciones: ivaPagar + ppm,
      },
    }
  })

  // ── Proveedores ───────────────────────────────────────────
  ipcMain.handle('suppliers:getAll', () => {
    return db().prepare("SELECT * FROM suppliers WHERE status = 'active' ORDER BY name").all()
  })

  ipcMain.handle('suppliers:create', (_, data: any) => {
    const id  = `sup-${Date.now()}`
    const now = new Date().toISOString()
    db().prepare(`
      INSERT INTO suppliers (id, name, rut, phone, email, address, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(id, data.name, data.rut || null, data.phone || null,
           data.email || null, data.address || null, data.notes || null, now, now)
    return { success: true, id }
  })

  ipcMain.handle('suppliers:update', (_, id: string, data: any) => {
    const now = new Date().toISOString()
    const fields = ['updated_at = ?']
    const vals: any[] = [now]
    const cols = ['name','rut','phone','email','address','notes'] as const
    for (const col of cols) {
      if (data[col] !== undefined) { fields.push(`${col} = ?`); vals.push(data[col]) }
    }
    vals.push(id)
    db().prepare(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
    return { success: true }
  })

  ipcMain.handle('suppliers:delete', (_, id: string) => {
    db().prepare("UPDATE suppliers SET status='inactive', updated_at=datetime('now') WHERE id=?").run(id)
    return { success: true }
  })

  // ── Exportar archivo Excel ─────────────────────────────────
  ipcMain.handle('export:saveExcel', async (_, { data, filename }: { data: number[]; filename: string }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar reporte Excel',
      defaultPath: path.join(app.getPath('documents'), filename),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (canceled || !filePath) return { success: false }
    fs.writeFileSync(filePath, Buffer.from(data))
    return { success: true, filePath }
  })

  // ══════════════════════════════════════════════════════════
  // ── RESULTADO (P&L) ───────────────────────────────────────
  // ══════════════════════════════════════════════════════════

  ipcMain.handle('resultado:getSummary', (_, year: number, month: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const ym  = `${year}-${pad(month)}`                    // '2026-05'
    const ymStart = `${ym}-01`
    const lastDay  = new Date(year, month, 0).getDate()
    const ymEnd    = `${ym}-${pad(lastDay)}`

    // 0. Venta bruta
    const ventaBruta: number = (db().prepare(`
      SELECT COALESCE(SUM(total),0) as t FROM orders
      WHERE status='completed' AND substr(created_at,1,7)=?
    `).get(ym) as any).t

    // 1. Ingresos por categoría (revenue + costo teórico de productos vendidos)
    const porCategoria: any[] = db().prepare(`
      SELECT
        COALESCE(c.name,'Sin categoría') as cat,
        COALESCE(SUM(oi.subtotal),0)                               as revenue,
        COALESCE(SUM(
          CASE WHEN p.requires_weight=1
               THEN COALESCE(oi.weight_kg,1)*COALESCE(p.cost_price,0)
               ELSE oi.quantity*COALESCE(p.cost_price,0)
          END
        ),0)                                                        as costo_vendido
      FROM order_items oi
      JOIN orders o     ON o.id = oi.order_id
      LEFT JOIN products   p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.status='completed' AND substr(o.created_at,1,7)=?
      GROUP BY c.id ORDER BY revenue DESC
    `).all(ym)

    // 2. Comisiones por método de pago (usando tabla order_payments)
    const comisiones: any[] = db().prepare(`
      SELECT
        op.payment_method,
        COALESCE(pms.label, op.payment_method)  as label,
        COALESCE(pms.commission_pct,0)           as commission_pct,
        COALESCE(SUM(op.amount),0)               as revenue
      FROM order_payments op
      JOIN orders o ON o.id = op.order_id
      LEFT JOIN payment_method_settings pms ON pms.method = op.payment_method
      WHERE o.status='completed' AND substr(o.created_at,1,7)=? AND op.amount>0
      GROUP BY op.payment_method ORDER BY revenue DESC
    `).all(ym)

    // 3. Facturas del mes
    const facturas: any = db().prepare(`
      SELECT
        COALESCE(SUM(total),0)    as total,
        COALESCE(SUM(subtotal),0) as subtotal,
        COALESCE(SUM(tax),0)      as tax,
        COUNT(*)                  as count
      FROM purchase_invoices
      WHERE invoice_date>=? AND invoice_date<=? AND status!='cancelled'
    `).get(ymStart, ymEnd)

    // Flujo de caja: efectivo del mes
    const efectivoMes: number = (db().prepare(`
      SELECT COALESCE(SUM(op.amount),0) as t
      FROM order_payments op JOIN orders o ON o.id=op.order_id
      WHERE o.status='completed' AND substr(o.created_at,1,7)=?
        AND op.payment_method='cash'
    `).get(ym) as any).t

    // Flujo de caja: total facturas sin pagar (todas las pendientes, no solo del mes)
    const cuentasPorPagar: number = (db().prepare(`
      SELECT COALESCE(SUM(total),0) as t FROM purchase_invoices WHERE status='received'
    `).get() as any).t

    // Flujo proyectado: promedio mensual últimos 3 meses
    const proyMeses: any[] = db().prepare(`
      SELECT substr(created_at,1,7) as m, COALESCE(SUM(total),0) as t
      FROM orders WHERE status='completed'
      GROUP BY m ORDER BY m DESC LIMIT 4
    `).all()
    const proyBase = proyMeses.filter((r: any) => r.m !== ym).slice(0, 3)
    const flujoProyectado = proyBase.length
      ? Math.round(proyBase.reduce((s: number, r: any) => s + r.t, 0) / proyBase.length)
      : 0

    return {
      ventaBruta,
      porCategoria,
      comisiones,
      facturas,
      efectivoMes,
      cuentasPorPagar,
      flujoProyectado,
    }
  })

  ipcMain.handle('resultado:getExpenses', (_, year: number, month: number) => {
    const row: any = db().prepare(
      'SELECT * FROM monthly_expenses WHERE year=? AND month=?'
    ).get(year, month) ?? null
    if (!row) return null
    // Deserializar JSON
    try { row.invoices = JSON.parse(row.invoices ?? '{}') } catch { row.invoices = {} }
    try { row.salaries = JSON.parse(row.salaries ?? '[]') } catch { row.salaries = [] }
    return row
  })

  ipcMain.handle('resultado:saveExpenses', (_, year: number, month: number, data: any) => {
    const now = new Date().toISOString()
    const invoicesJson = JSON.stringify(data.invoices ?? {})
    const salariesJson = JSON.stringify(data.salaries ?? [])
    const existing: any = db().prepare(
      'SELECT id FROM monthly_expenses WHERE year=? AND month=?'
    ).get(year, month)
    if (existing) {
      db().prepare(`
        UPDATE monthly_expenses SET
          rent=?, common_expenses=?, electricity=?, water=?,
          advertising=?, maintenance=?, other=?, notes=?,
          invoices=?, salaries=?, updated_at=?
        WHERE year=? AND month=?
      `).run(
        data.rent??0, data.commonExpenses??0, data.electricity??0, data.water??0,
        data.advertising??0, data.maintenance??0, data.other??0, data.notes??null,
        invoicesJson, salariesJson, now, year, month
      )
    } else {
      db().prepare(`
        INSERT INTO monthly_expenses
          (id,year,month,rent,common_expenses,electricity,water,advertising,maintenance,other,notes,invoices,salaries,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        randomUUID(), year, month,
        data.rent??0, data.commonExpenses??0, data.electricity??0, data.water??0,
        data.advertising??0, data.maintenance??0, data.other??0, data.notes??null,
        invoicesJson, salariesJson, now
      )
    }
    return { success: true }
  })

  // ── PROMOCIONES ───────────────────────────────────────────────
  ipcMain.handle('products:getPromotions', () => {
    return db().prepare(`
      SELECT p.*, sl.quantity,
             ROUND(p.base_price * (1 - p.promotion_pct / 100.0)) as promo_price
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.promotion_active = 1 AND p.status = 'active'
      ORDER BY p.name
    `).all()
  })

  ipcMain.handle('products:updatePromotion', (_, id: string, data: any) => {
    db().prepare(`
      UPDATE products
      SET promotion_active = ?, promotion_pct = ?, promotion_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.active ? 1 : 0, data.pct ?? 0, data.name ?? '', id)
    return { success: true }
  })

  // ── CÓDIGOS DE DESCUENTO ──────────────────────────────────────
  ipcMain.handle('discountCodes:getAll', () => {
    return db().prepare(`SELECT * FROM discount_codes ORDER BY created_at DESC`).all()
  })

  ipcMain.handle('discountCodes:create', (_, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO discount_codes
        (id, code, name, type, value, free_product_id, free_product_name, active, max_uses, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, datetime('now'))
    `).run(
      id, data.code.toUpperCase(), data.name ?? '',
      data.type, data.value ?? 0,
      data.freeProductId ?? null, data.freeProductName ?? null,
      data.maxUses ?? 0, data.expiresAt ?? null
    )
    return { id, ...data }
  })

  ipcMain.handle('discountCodes:validate', (_, code: string) => {
    const dc = db().prepare(`SELECT * FROM discount_codes WHERE code = ? COLLATE NOCASE AND active = 1`).get(code) as any
    if (!dc) return { valid: false, reason: 'Código no encontrado' }
    if (dc.max_uses > 0 && dc.uses_count >= dc.max_uses)
      return { valid: false, reason: 'Código agotado' }
    if (dc.expires_at && dc.expires_at < new Date().toISOString().slice(0, 10))
      return { valid: false, reason: 'Código expirado' }
    return { valid: true, ...dc }
  })

  ipcMain.handle('discountCodes:use', (_, id: string) => {
    db().prepare(`UPDATE discount_codes SET uses_count = uses_count + 1 WHERE id = ?`).run(id)
    return { success: true }
  })

  ipcMain.handle('discountCodes:delete', (_, id: string) => {
    db().prepare('DELETE FROM discount_codes WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('discountCodes:toggleActive', (_, id: string) => {
    db().prepare(`UPDATE discount_codes SET active = CASE WHEN active=1 THEN 0 ELSE 1 END WHERE id = ?`).run(id)
    return { success: true }
  })

  // ── ANULACIÓN DE ORDEN ────────────────────────────────────────
  ipcMain.handle('orders:void', (_, id: string) => {
    const order = db().prepare('SELECT * FROM orders WHERE id = ?').get(id) as any
    if (!order) throw new Error('Orden no encontrada')
    if (order.voided) throw new Error('Orden ya anulada')

    const items = db().prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as any[]

    db().transaction(() => {
      // Marcar como anulada
      db().prepare(`UPDATE orders SET voided=1, status='voided', sync_status='pending', updated_at=datetime('now') WHERE id=?`).run(id)

      // Revertir stock (sumar lo que se descontó)
      const getStock = db().prepare('SELECT COALESCE(quantity,0) as q FROM stock_levels WHERE product_id = ?')
      const updStock  = db().prepare(`UPDATE stock_levels SET quantity = quantity + ?, sync_status='pending', updated_at=datetime('now') WHERE product_id = ?`)
      const insMov    = db().prepare(`
        INSERT INTO stock_movements (id, product_id, type, quantity, quantity_before, quantity_after, reference_id, reference_type, notes, user_id, sync_status, created_at)
        VALUES (?, ?, 'adjustment', ?, ?, ?, ?, 'order_void', ?, 'cajero', 'pending', datetime('now'))
      `)
      for (const item of items) {
        const deduct = item.weight_kg ?? item.quantity
        const before = ((getStock.get(item.product_id) as any)?.q ?? 0)
        updStock.run(deduct, item.product_id)
        insMov.run(randomUUID(), item.product_id, deduct, before, before + deduct, id, `Anulación ${order.order_number}`)
      }
    })()

    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('stock-updated'))
    return { success: true }
  })

  // ── USUARIOS ───────────────────────────────────────────────
  ipcMain.handle('users:authenticate', (_, username: string, password: string) => {
    const user = db().prepare(
      'SELECT * FROM pos_users WHERE username = ? AND is_active = 1'
    ).get(username) as any
    if (!user || user.password !== password) return null
    const { password: _pw, ...safe } = user
    return safe
  })

  ipcMain.handle('users:getAll', () => {
    return db().prepare(
      'SELECT id, username, display_name, role, is_active, created_at FROM pos_users ORDER BY created_at ASC'
    ).all()
  })

  ipcMain.handle('users:create', (_, data: any) => {
    const id = `user-${randomUUID()}`
    db().prepare(`
      INSERT INTO pos_users (id, username, display_name, password, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, data.username.trim(), data.display_name.trim(), data.password, data.role ?? 'cajero')
    return { success: true, id }
  })

  ipcMain.handle('users:update', (_, id: string, data: any) => {
    if (data.password && data.password.trim()) {
      db().prepare(`
        UPDATE pos_users SET username=?, display_name=?, role=?, is_active=?, password=?
        WHERE id=?
      `).run(data.username.trim(), data.display_name.trim(), data.role, data.is_active ? 1 : 0, data.password, id)
    } else {
      db().prepare(`
        UPDATE pos_users SET username=?, display_name=?, role=?, is_active=?
        WHERE id=?
      `).run(data.username.trim(), data.display_name.trim(), data.role, data.is_active ? 1 : 0, id)
    }
    return { success: true }
  })

  ipcMain.handle('users:delete', (_, id: string) => {
    const user = db().prepare('SELECT role FROM pos_users WHERE id = ?').get(id) as any
    if (!user) throw new Error('Usuario no encontrado')
    if (user.role === 'admin') {
      const adminCount = (db().prepare(
        "SELECT COUNT(*) as c FROM pos_users WHERE role='admin' AND is_active=1"
      ).get() as any).c
      if (adminCount <= 1) throw new Error('No se puede eliminar el único administrador')
    }
    db().prepare('DELETE FROM pos_users WHERE id = ?').run(id)
    return { success: true }
  })
}
