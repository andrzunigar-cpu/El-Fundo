import Database from 'better-sqlite3'
import * as path from 'path'
import { app } from 'electron'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) throw new Error('Database no inicializada. Llama initDatabase() primero.')
  return db
}

export async function initDatabase(): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), 'elfundo-pos.db')
  db = new Database(dbPath)

  // Optimizaciones SQLite para POS de alto rendimiento
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')
  db.pragma('cache_size = -64000')    // 64MB cache
  db.pragma('temp_store = MEMORY')
  db.pragma('mmap_size = 268435456')  // 256MB mmap

  runMigrations(db)
  seedInitialData(db)
  console.log(`SQLite inicializado: ${dbPath}`)
}

function seedInitialData(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c
  if (count > 0) return

  const now = new Date().toISOString()
  const cats = [
    { id: 'cat-vacuno',     name: 'Vacuno',     slug: 'vacuno',     sort: 1 },
    { id: 'cat-cerdo',      name: 'Cerdo',      slug: 'cerdo',      sort: 2 },
    { id: 'cat-pollo',      name: 'Pollo',      slug: 'pollo',      sort: 3 },
    { id: 'cat-embutidos',  name: 'Embutidos',  slug: 'embutidos',  sort: 4 },
    { id: 'cat-parrilla',   name: 'Parrilla',   slug: 'parrilla',   sort: 5 },
    { id: 'cat-congelados', name: 'Congelados', slug: 'congelados', sort: 6 },
    { id: 'cat-bebidas',    name: 'Bebidas',    slug: 'bebidas',    sort: 7 },
    { id: 'cat-otros',      name: 'Otros',      slug: 'otros',      sort: 8 },
  ]
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, sort_order, status, sync_status, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', 'synced', 1, ?, ?)
  `)
  for (const c of cats) insertCat.run(c.id, c.name, c.slug, c.sort, now, now)

  const products = [
    // Vacuno
    { sku: 'VAC-001', name: 'Lomo Liso',         cat: 'cat-vacuno',  type: 'vacuno',  cut: 'lomo_liso',       price: 14990, weight: 1 },
    { sku: 'VAC-002', name: 'Lomo Vetado',       cat: 'cat-vacuno',  type: 'vacuno',  cut: 'lomo_vetado',     price: 12990, weight: 1 },
    { sku: 'VAC-003', name: 'Posta Negra',       cat: 'cat-vacuno',  type: 'vacuno',  cut: 'posta_negra',     price: 9990,  weight: 1 },
    { sku: 'VAC-004', name: 'Asado de Tira',     cat: 'cat-vacuno',  type: 'vacuno',  cut: 'asado_carnicero', price: 8990,  weight: 1 },
    { sku: 'VAC-005', name: 'Entraña',           cat: 'cat-vacuno',  type: 'vacuno',  cut: 'entraña',         price: 11990, weight: 1 },
    { sku: 'VAC-006', name: 'Plateada',          cat: 'cat-vacuno',  type: 'vacuno',  cut: 'plateada',        price: 7990,  weight: 1 },
    { sku: 'VAC-007', name: 'Osobuco',           cat: 'cat-vacuno',  type: 'vacuno',  cut: 'osobuco',         price: 5990,  weight: 1 },
    { sku: 'VAC-008', name: 'Carne Molida',      cat: 'cat-vacuno',  type: 'vacuno',  cut: 'otro',            price: 7490,  weight: 1 },
    // Cerdo
    { sku: 'CER-001', name: 'Pulpa de Cerdo',    cat: 'cat-cerdo',   type: 'cerdo',   cut: 'otro',            price: 6990,  weight: 1 },
    { sku: 'CER-002', name: 'Costillar de Cerdo',cat: 'cat-cerdo',   type: 'cerdo',   cut: 'costilla',        price: 7990,  weight: 1 },
    { sku: 'CER-003', name: 'Chuleta Centro',    cat: 'cat-cerdo',   type: 'cerdo',   cut: 'chuleta',         price: 5990,  weight: 1 },
    // Pollo
    { sku: 'POL-001', name: 'Pollo Entero',      cat: 'cat-pollo',   type: 'pollo',   cut: 'otro',            price: 3490,  weight: 1 },
    { sku: 'POL-002', name: 'Pechuga de Pollo',  cat: 'cat-pollo',   type: 'pollo',   cut: 'otro',            price: 5990,  weight: 1 },
    { sku: 'POL-003', name: 'Trutro de Pollo',   cat: 'cat-pollo',   type: 'pollo',   cut: 'otro',            price: 3990,  weight: 1 },
    // Embutidos (unidad)
    { sku: 'EMB-001', name: 'Longaniza Casera',   cat: 'cat-embutidos',   type: 'cerdo', cut: 'otro', price: 2990, weight: 0 },
    { sku: 'EMB-002', name: 'Chorizo Parrillero', cat: 'cat-embutidos',   type: 'cerdo', cut: 'otro', price: 3490, weight: 0 },
    { sku: 'EMB-003', name: 'Prieta',             cat: 'cat-embutidos',   type: 'cerdo', cut: 'otro', price: 2490, weight: 0 },
  ]

  // ── Seed formatos por defecto ──────────────────────────────
  const fmtCount = (db.prepare('SELECT COUNT(*) as c FROM product_formats').get() as any).c
  if (fmtCount === 0) {
    const insertFmt = db.prepare(`
      INSERT INTO product_formats (id, name, unit, weight_kg, is_variable, is_active, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `)
    const formats = [
      { id: 'fmt-granel',   name: 'Granel',        unit: 'kg', weight: 0,    variable: 1, sort: 1 },
      { id: 'fmt-caja5',    name: 'Caja 5 kg',     unit: 'kg', weight: 5.0,  variable: 0, sort: 2 },
      { id: 'fmt-caja10',   name: 'Caja 10 kg',    unit: 'kg', weight: 10.0, variable: 0, sort: 3 },
      { id: 'fmt-bolsa1',   name: 'Bolsa 1 kg',    unit: 'kg', weight: 1.0,  variable: 0, sort: 4 },
      { id: 'fmt-bolsa500', name: 'Bolsa 500 g',   unit: 'kg', weight: 0.5,  variable: 0, sort: 5 },
      { id: 'fmt-unidad',   name: 'Unidad',        unit: 'un', weight: 0,    variable: 0, sort: 6 },
      { id: 'fmt-bot1',     name: 'Botella 1 L',   unit: 'L',  weight: 1.0,  variable: 0, sort: 7 },
      { id: 'fmt-bot15',    name: 'Botella 1.5 L', unit: 'L',  weight: 1.5,  variable: 0, sort: 8 },
      { id: 'fmt-lata',     name: 'Lata 355 ml',   unit: 'ml', weight: 355,  variable: 0, sort: 9 },
    ]
    const txFmt = db.transaction(() => {
      for (const f of formats)
        insertFmt.run(f.id, f.name, f.unit, f.weight, f.variable, f.sort, now)
    })
    txFmt()
  }

  const insertProd = db.prepare(`
    INSERT INTO products (id, sku, name, category_id, meat_type, cut, price_unit, base_price,
      requires_weight, is_available_online, is_featured, image_urls, status, sync_status, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, '[]', 'active', 'synced', 1, ?, ?)
  `)
  const insertStock = db.prepare(`
    INSERT INTO stock_levels (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
    VALUES (?, ?, ?, 0, ?, 'synced', ?)
  `)
  const tx = db.transaction(() => {
    for (const p of products) {
      const id = `prod-${p.sku.toLowerCase()}`
      insertProd.run(id, p.sku, p.name, p.cat, p.type, p.cut, p.weight ? 'kg' : 'unidad', p.price, p.weight, now, now)
      insertStock.run(`stock-${id}`, id, 0, 0, now)
    }
  })
  tx()

  console.log(`Seed: ${cats.length} categorías, ${products.length} productos`)
}

function runMigrations(db: Database.Database) {
  db.exec(`
    -- ── Categorías ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      sync_status TEXT DEFAULT 'synced',
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ── Formatos de producto ─────────────────────────────────
    CREATE TABLE IF NOT EXISTS product_formats (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,        -- "Caja 5kg", "Bolsa 1kg", "Granel", "Botella 1.5L"
      unit TEXT NOT NULL DEFAULT 'kg',  -- kg | L | un | g
      weight_kg REAL NOT NULL DEFAULT 0,-- peso/contenido en kg (0 = variable/granel)
      is_variable INTEGER DEFAULT 0,    -- 1 = pedir peso en cada venta (granel)
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- ── Productos ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      local_id TEXT UNIQUE,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      meat_type TEXT NOT NULL,
      cut TEXT,
      price_unit TEXT DEFAULT 'kg',
      base_price INTEGER NOT NULL,
      online_price INTEGER,
      requires_weight INTEGER DEFAULT 0,
      format_id TEXT REFERENCES product_formats(id),
      format_label TEXT,                -- cached: "Caja 5kg"
      format_weight_kg REAL,            -- cached del formato
      is_available_online INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      image_urls TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      sync_status TEXT DEFAULT 'synced',
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);

    -- ── Stock ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS stock_levels (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity REAL DEFAULT 0,
      reserved_quantity REAL DEFAULT 0,
      min_stock REAL DEFAULT 0,
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT NOT NULL,
      UNIQUE(product_id)
    );

    -- ── Clientes ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      local_id TEXT UNIQUE,
      rut TEXT UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      loyalty_points INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      sync_status TEXT DEFAULT 'synced',
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_rut ON customers(rut);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);

    -- ── Sesiones de caja ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS sale_sessions (
      id TEXT PRIMARY KEY,
      cashier_id TEXT NOT NULL,
      register_number INTEGER DEFAULT 1,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opening_cash INTEGER NOT NULL,
      closing_cash INTEGER,
      expected_cash INTEGER,
      difference INTEGER,
      total_sales INTEGER DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      notes TEXT
    );

    -- ── Órdenes ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      local_id TEXT UNIQUE,
      order_number TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'pos',
      status TEXT DEFAULT 'pending',
      session_id TEXT REFERENCES sale_sessions(id),
      customer_id TEXT REFERENCES customers(id),
      customer_name TEXT,
      customer_phone TEXT,
      subtotal INTEGER NOT NULL,
      discount_total INTEGER DEFAULT 0,
      tax_total INTEGER DEFAULT 0,
      total INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      payment_status TEXT DEFAULT 'pending',
      delivery_type TEXT DEFAULT 'pickup',
      delivery_fee INTEGER DEFAULT 0,
      notes TEXT,
      printed_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

    -- ── Ítems de órdenes ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      quantity REAL NOT NULL,
      weight_kg REAL,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      discount INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    -- ── Movimientos de stock ──────────────────────────────────
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      quantity_before REAL NOT NULL,
      quantity_after REAL NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      notes TEXT,
      user_id TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    -- ── Tomas de inventario ──────────────────────────────────
    CREATE TABLE IF NOT EXISTS inventory_counts (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',  -- draft | completed | cancelled
      user_id TEXT,
      notes TEXT,
      total_products INTEGER DEFAULT 0,
      total_differences INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_count_items (
      id TEXT PRIMARY KEY,
      count_id TEXT NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      system_quantity REAL NOT NULL,
      counted_quantity REAL NOT NULL,
      difference REAL NOT NULL,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_count_items_count ON inventory_count_items(count_id);

    -- ── Facturas de compra ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      supplier_rut TEXT,
      invoice_date TEXT NOT NULL,
      subtotal INTEGER DEFAULT 0,
      tax INTEGER DEFAULT 0,
      total INTEGER NOT NULL,
      status TEXT DEFAULT 'received',  -- received | cancelled
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_date ON purchase_invoices(invoice_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON purchase_invoices(supplier_name);

    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost INTEGER NOT NULL,
      subtotal INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON purchase_invoice_items(invoice_id);

    -- Index movimientos por fecha (para filtros)
    CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);
    CREATE INDEX IF NOT EXISTS idx_movements_type ON stock_movements(type);

    -- ── Cola de sincronización ───────────────────────────────
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      direction TEXT DEFAULT 'local_to_cloud',
      status TEXT DEFAULT 'pending',
      retries INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      error TEXT,
      device_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      next_retry_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);

    -- ── Configuración local ──────────────────────────────────
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO config VALUES ('device_id', lower(hex(randomblob(16))), datetime('now'));
    INSERT OR IGNORE INTO config VALUES ('branch_id', 'main', datetime('now'));
    INSERT OR IGNORE INTO config VALUES ('last_sync_at', '2024-01-01T00:00:00.000Z', datetime('now'));
    INSERT OR IGNORE INTO config VALUES ('api_url', 'http://localhost:3001', datetime('now'));
    INSERT OR IGNORE INTO config VALUES ('current_session_id', '', datetime('now'));

    -- ── Medios de pago ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS payment_method_settings (
      method         TEXT PRIMARY KEY,
      label          TEXT NOT NULL,
      commission_pct REAL DEFAULT 0,
      is_active      INTEGER DEFAULT 1
    );
    -- Métodos base (4 columnas — compatibles con DB existente y nueva)
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('cash',        'Efectivo',       0,   1);
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('debit_card',  'Débito',         0.8, 1);
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('credit_card', 'Crédito',        1.5, 1);
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('transfer',    'Transferencia',  0,   1);
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('amipass',     'Amipass',        3.5, 1);
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('edenred',     'Edenred',        3.5, 1);
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('pluxee',      'Pluxee',         3.5, 1);
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active)
      VALUES ('webpay',      'Webpay',         1.2, 1);

    -- ── Control de vencimientos ───────────────────────────────
    CREATE TABLE IF NOT EXISTS product_expiry (
      id          TEXT PRIMARY KEY,
      product_id  TEXT NOT NULL REFERENCES products(id),
      quantity    REAL NOT NULL DEFAULT 0,
      expiry_date TEXT NOT NULL,
      lot_number  TEXT,
      supplier_name TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_expiry_date      ON product_expiry(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_expiry_product   ON product_expiry(product_id);

    -- ── Pagos por orden (multipago) ───────────────────────────
    CREATE TABLE IF NOT EXISTS order_payments (
      id             TEXT PRIMARY KEY,
      order_id       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      payment_method TEXT NOT NULL,
      amount         INTEGER NOT NULL,
      created_at     TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(order_id);
  `)

  // ── Migraciones incrementales (idempotentes) ──────────────
  const migrations: Array<[string, string]> = [
    ['cost_per_unit en stock_movements',
     'ALTER TABLE stock_movements ADD COLUMN cost_per_unit INTEGER DEFAULT 0'],
    ['format_id en products',
     'ALTER TABLE products ADD COLUMN format_id TEXT REFERENCES product_formats(id)'],
    ['format_label en products',
     'ALTER TABLE products ADD COLUMN format_label TEXT'],
    ['format_weight_kg en products',
     'ALTER TABLE products ADD COLUMN format_weight_kg REAL'],
    ['cost_price en products',
     'ALTER TABLE products ADD COLUMN cost_price INTEGER DEFAULT 0'],
    ['category en payment_method_settings',
     "ALTER TABLE payment_method_settings ADD COLUMN category TEXT DEFAULT 'offline'"],
    ['channel en payment_method_settings',
     'ALTER TABLE payment_method_settings ADD COLUMN channel TEXT DEFAULT NULL'],
    ['sort_order en payment_method_settings',
     'ALTER TABLE payment_method_settings ADD COLUMN sort_order INTEGER DEFAULT 0'],
    ['show_online en payment_method_settings',
     'ALTER TABLE payment_method_settings ADD COLUMN show_online INTEGER DEFAULT 0'],
    ['change_given en orders',
     'ALTER TABLE orders ADD COLUMN change_given INTEGER DEFAULT 0'],
    ['document_type en purchase_invoices',
     "ALTER TABLE purchase_invoices ADD COLUMN document_type TEXT DEFAULT 'factura'"],
    ['ila_amount en products',
     'ALTER TABLE products ADD COLUMN ila_amount INTEGER DEFAULT 0'],
    ['flete_amount en products',
     'ALTER TABLE products ADD COLUMN flete_amount INTEGER DEFAULT 0'],
    ['tax_type en products',
     "ALTER TABLE products ADD COLUMN tax_type TEXT DEFAULT 'afecto_iva'"],
    ['additional_tax_pct en products',
     'ALTER TABLE products ADD COLUMN additional_tax_pct REAL DEFAULT 0'],
  ]
  for (const [, sql] of migrations) {
    try { db.exec(sql) } catch { /* columna ya existe */ }
  }

  // ── Seed nuevas categorías (idempotente) ──────────────────
  const now2 = new Date().toISOString()
  const newCats = [
    { id: 'cat-congelados', name: 'Congelados', slug: 'congelados', sort: 8  },
    { id: 'cat-bebidas',    name: 'Bebidas',    slug: 'bebidas',    sort: 9  },
    { id: 'cat-parrilla',   name: 'Parrilla',   slug: 'parrilla',   sort: 10 },
  ]
  const insertCatMig = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, slug, sort_order, status, sync_status, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', 'synced', 1, ?, ?)
  `)
  for (const c of newCats) insertCatMig.run(c.id, c.name, c.slug, c.sort, now2, now2)

  // ── Seed nuevos medios de pago online (idempotente, post-migración) ──
  const newMethods = [
    ['uber_reparto',      'Uber Eats Reparto',  30,  1, 'online_delivery', 'reparto', 20],
    ['uber_local',        'Uber Eats Local',    15,  1, 'online_delivery', 'local',   21],
    ['rappi_reparto',     'Rappi Reparto',      28,  1, 'online_delivery', 'reparto', 22],
    ['rappi_local',       'Rappi Local',        15,  1, 'online_delivery', 'local',   23],
    ['pedidosya_reparto', 'Pedidos Ya Reparto', 30,  1, 'online_delivery', 'reparto', 24],
    ['pedidosya_local',   'Pedidos Ya Local',   15,  1, 'online_delivery', 'local',   25],
  ]
  const insertMethod = db.prepare(`
    INSERT OR IGNORE INTO payment_method_settings (method, label, commission_pct, is_active, category, channel, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (const m of newMethods) insertMethod.run(...(m as any))

  // Actualizar categoría/sort de métodos existentes que no tienen categoría asignada
  db.exec(`
    UPDATE payment_method_settings SET category = 'offline',    sort_order = 1  WHERE method = 'cash'        AND (category IS NULL OR category = '');
    UPDATE payment_method_settings SET category = 'offline',    sort_order = 2  WHERE method = 'debit_card'  AND (category IS NULL OR category = '');
    UPDATE payment_method_settings SET category = 'offline',    sort_order = 3  WHERE method = 'credit_card' AND (category IS NULL OR category = '');
    UPDATE payment_method_settings SET category = 'offline',    sort_order = 4  WHERE method = 'transfer'    AND (category IS NULL OR category = '');
    UPDATE payment_method_settings SET category = 'offline',    sort_order = 5  WHERE method = 'amipass'     AND (category IS NULL OR category = '');
    UPDATE payment_method_settings SET category = 'offline',    sort_order = 6  WHERE method = 'edenred'     AND (category IS NULL OR category = '');
    UPDATE payment_method_settings SET category = 'offline',    sort_order = 7  WHERE method = 'pluxee'      AND (category IS NULL OR category = '');
    UPDATE payment_method_settings SET category = 'online_web', sort_order = 10 WHERE method = 'webpay';
    -- Amipass, Edenred, Pluxee también aparecen en el tab Online
    UPDATE payment_method_settings SET show_online = 1 WHERE method IN ('amipass','edenred','pluxee');
  `)

  // ── v2: orden definitivo de medios de pago (fuerza actualización) ──
  db.exec(`
    UPDATE payment_method_settings SET sort_order = 1  WHERE method = 'cash';
    UPDATE payment_method_settings SET sort_order = 2  WHERE method = 'debit_card';
    UPDATE payment_method_settings SET sort_order = 3  WHERE method = 'credit_card';
    UPDATE payment_method_settings SET sort_order = 4  WHERE method = 'pluxee';
    UPDATE payment_method_settings SET sort_order = 5  WHERE method = 'edenred';
    UPDATE payment_method_settings SET sort_order = 6  WHERE method = 'amipass';
    UPDATE payment_method_settings SET sort_order = 99 WHERE method = 'transfer';
    UPDATE payment_method_settings SET sort_order = 10 WHERE method = 'webpay';
    UPDATE payment_method_settings SET sort_order = 11 WHERE method = 'uber_local';
    UPDATE payment_method_settings SET sort_order = 12 WHERE method = 'uber_reparto';
    UPDATE payment_method_settings SET sort_order = 13 WHERE method = 'rappi_local';
    UPDATE payment_method_settings SET sort_order = 14 WHERE method = 'rappi_reparto';
    UPDATE payment_method_settings SET sort_order = 15 WHERE method = 'pedidosya_local';
    UPDATE payment_method_settings SET sort_order = 16 WHERE method = 'pedidosya_reparto';
  `)

  // ── Tabla gastos mensuales (idempotente) ─────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS monthly_expenses (
      id              TEXT PRIMARY KEY,
      year            INTEGER NOT NULL,
      month           INTEGER NOT NULL,
      rent            INTEGER DEFAULT 0,
      common_expenses INTEGER DEFAULT 0,
      electricity     INTEGER DEFAULT 0,
      water           INTEGER DEFAULT 0,
      advertising     INTEGER DEFAULT 0,
      maintenance     INTEGER DEFAULT 0,
      other           INTEGER DEFAULT 0,
      notes           TEXT,
      updated_at      TEXT NOT NULL,
      UNIQUE(year, month)
    )
  `)

  // Migraciones monthly_expenses
  try { db.exec("ALTER TABLE monthly_expenses ADD COLUMN invoices TEXT DEFAULT '{}'") } catch {}
  try { db.exec("ALTER TABLE monthly_expenses ADD COLUMN salaries TEXT DEFAULT '[]'") } catch {}

  // ── Tabla proveedores (idempotente) ──────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      rut        TEXT,
      phone      TEXT,
      email      TEXT,
      address    TEXT,
      notes      TEXT,
      status     TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // ── Migraciones: promociones en productos ───────────────────
  try { db.exec("ALTER TABLE products ADD COLUMN promotion_pct REAL DEFAULT 0") } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN promotion_active INTEGER DEFAULT 0") } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN promotion_name TEXT DEFAULT ''") } catch {}

  // ── Migraciones: campos extra en orders ─────────────────────
  try { db.exec("ALTER TABLE orders ADD COLUMN voided INTEGER DEFAULT 0") } catch {}
  try { db.exec("ALTER TABLE orders ADD COLUMN discount_code TEXT") } catch {}
  try { db.exec("ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0") } catch {}

  // ── Tabla códigos de descuento ───────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id               TEXT PRIMARY KEY,
      code             TEXT UNIQUE NOT NULL COLLATE NOCASE,
      name             TEXT,
      type             TEXT NOT NULL,
      value            REAL DEFAULT 0,
      free_product_id  TEXT,
      free_product_name TEXT,
      active           INTEGER DEFAULT 1,
      uses_count       INTEGER DEFAULT 0,
      max_uses         INTEGER DEFAULT 0,
      created_at       TEXT NOT NULL,
      expires_at       TEXT
    )
  `)

  // ── Garantizar registro stock_levels para productos nuevos (NO resetea stock) ──
  db.prepare(`
    INSERT OR IGNORE INTO stock_levels
      (id, product_id, quantity, reserved_quantity, min_stock, sync_status, updated_at)
    SELECT 'stock-' || p.id, p.id, 0, 0, 0, 'pending', datetime('now')
    FROM products p WHERE p.status = 'active'
  `).run()

  // ── Tabla usuarios POS ───────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS pos_users (
      id           TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password     TEXT NOT NULL,
      role         TEXT NOT NULL DEFAULT 'cajero',
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  // Seed admin por defecto (solo si no existe)
  const adminExists = db.prepare("SELECT id FROM pos_users WHERE username = 'admin'").get()
  if (!adminExists) {
    db.prepare(`INSERT INTO pos_users (id, username, display_name, password, role) VALUES (?, ?, ?, ?, ?)`)
      .run('user-admin', 'admin', 'Administrador', '1091', 'admin')
  }
}
