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
  console.log(`SQLite inicializado: ${dbPath}`)
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
  `)
}
