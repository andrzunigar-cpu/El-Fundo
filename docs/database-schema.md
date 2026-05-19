# Modelo de Base de Datos — Carnicería El Fundo

## PostgreSQL (Cloud)

### Schema: catalog

```sql
-- Categorías de productos
CREATE TABLE catalog.categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) UNIQUE NOT NULL,
  description  TEXT,
  image_url    TEXT,
  parent_id    UUID REFERENCES catalog.categories(id),
  sort_order   INTEGER DEFAULT 0,
  status       VARCHAR(20) DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE catalog.products (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_id              VARCHAR(50) UNIQUE,
  sku                   VARCHAR(50) UNIQUE NOT NULL,
  name                  VARCHAR(200) NOT NULL,
  slug                  VARCHAR(200) UNIQUE NOT NULL,
  description           TEXT,
  category_id           UUID REFERENCES catalog.categories(id),
  meat_type             VARCHAR(30) NOT NULL,
  cut                   VARCHAR(50),
  origin                VARCHAR(100),
  aging_days            INTEGER,
  is_featured           BOOLEAN DEFAULT false,
  is_available_online   BOOLEAN DEFAULT true,
  requires_weight       BOOLEAN DEFAULT false,
  price_unit            VARCHAR(20) DEFAULT 'kg',
  base_price            INTEGER NOT NULL,   -- CLP
  online_price          INTEGER,
  image_urls            TEXT[] DEFAULT '{}',
  tags                  TEXT[] DEFAULT '{}',
  status                VARCHAR(20) DEFAULT 'active',
  sync_status           VARCHAR(20) DEFAULT 'synced',
  version               INTEGER DEFAULT 1,
  branch_id             UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON catalog.products(category_id);
CREATE INDEX idx_products_status ON catalog.products(status);
CREATE INDEX idx_products_name_trgm ON catalog.products USING gin(name gin_trgm_ops);

-- Historial de precios
CREATE TABLE catalog.price_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES catalog.products(id),
  price       INTEGER NOT NULL,
  changed_by  UUID NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema: inventory

```sql
-- Niveles de stock
CREATE TABLE inventory.stock_levels (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES catalog.products(id),
  branch_id           VARCHAR(50) DEFAULT 'main',
  quantity            DECIMAL(10,3) DEFAULT 0,
  reserved_quantity   DECIMAL(10,3) DEFAULT 0,
  available_quantity  DECIMAL(10,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  min_stock           DECIMAL(10,3) DEFAULT 0,
  max_stock           DECIMAL(10,3),
  last_count_at       TIMESTAMPTZ,
  sync_status         VARCHAR(20) DEFAULT 'synced',
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, branch_id)
);

-- Movimientos de stock (trazabilidad completa)
CREATE TABLE inventory.stock_movements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES catalog.products(id),
  branch_id        VARCHAR(50) DEFAULT 'main',
  type             VARCHAR(30) NOT NULL,
  quantity         DECIMAL(10,3) NOT NULL,
  quantity_before  DECIMAL(10,3) NOT NULL,
  quantity_after   DECIMAL(10,3) NOT NULL,
  reference_id     UUID,
  reference_type   VARCHAR(30),
  notes            TEXT,
  cost_per_unit    INTEGER,
  user_id          UUID NOT NULL,
  sync_status      VARCHAR(20) DEFAULT 'pending',
  local_id         VARCHAR(50) UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movements_product ON inventory.stock_movements(product_id);
CREATE INDEX idx_movements_created ON inventory.stock_movements(created_at);
```

### Schema: sales

```sql
-- Sesiones de caja
CREATE TABLE sales.sale_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id        VARCHAR(50) NOT NULL,
  cashier_id       UUID NOT NULL,
  register_number  INTEGER DEFAULT 1,
  opened_at        TIMESTAMPTZ NOT NULL,
  closed_at        TIMESTAMPTZ,
  opening_cash     INTEGER NOT NULL,
  closing_cash     INTEGER,
  expected_cash    INTEGER,
  difference       INTEGER,
  total_sales      INTEGER DEFAULT 0,
  total_orders     INTEGER DEFAULT 0,
  notes            TEXT
);

-- Órdenes / Ventas
CREATE TABLE sales.orders (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_id           VARCHAR(50) UNIQUE,
  order_number       VARCHAR(20) UNIQUE NOT NULL,
  source             VARCHAR(20) DEFAULT 'pos',
  status             VARCHAR(30) DEFAULT 'pending',
  branch_id          VARCHAR(50),
  session_id         UUID REFERENCES sales.sale_sessions(id),
  customer_id        UUID REFERENCES customers.customers(id),
  customer_name      VARCHAR(200),
  customer_phone     VARCHAR(20),
  customer_email     VARCHAR(200),
  subtotal           INTEGER NOT NULL,
  discount_total     INTEGER DEFAULT 0,
  tax_total          INTEGER DEFAULT 0,
  total              INTEGER NOT NULL,
  payment_method     VARCHAR(30),
  payment_status     VARCHAR(20) DEFAULT 'pending',
  payment_reference  VARCHAR(200),
  delivery_type      VARCHAR(20) DEFAULT 'pickup',
  delivery_address   JSONB,
  delivery_fee       INTEGER DEFAULT 0,
  notes              TEXT,
  internal_notes     TEXT,
  cancel_reason      TEXT,
  printed_at         TIMESTAMPTZ,
  confirmed_at       TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  sync_status        VARCHAR(20) DEFAULT 'synced',
  version            INTEGER DEFAULT 1,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON sales.orders(status);
CREATE INDEX idx_orders_source ON sales.orders(source);
CREATE INDEX idx_orders_created ON sales.orders(created_at DESC);
CREATE INDEX idx_orders_customer ON sales.orders(customer_id);

-- Ítems de órdenes
CREATE TABLE sales.order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES catalog.products(id),
  product_name   VARCHAR(200) NOT NULL,
  product_sku    VARCHAR(50) NOT NULL,
  quantity       DECIMAL(10,3) NOT NULL,
  weight_kg      DECIMAL(10,3),
  unit_price     INTEGER NOT NULL,
  subtotal       INTEGER NOT NULL,
  discount       INTEGER DEFAULT 0,
  notes          TEXT
);

CREATE INDEX idx_order_items_order ON sales.order_items(order_id);
```

### Schema: sync

```sql
-- Cola de sincronización (registro de todos los cambios)
CREATE TABLE sync.sync_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     VARCHAR(30) NOT NULL,
  entity_id       VARCHAR(50) NOT NULL,
  operation       VARCHAR(10) NOT NULL,
  payload         JSONB NOT NULL,
  direction       VARCHAR(30) DEFAULT 'local_to_cloud',
  status          VARCHAR(20) DEFAULT 'pending',
  retries         INTEGER DEFAULT 0,
  max_retries     INTEGER DEFAULT 3,
  error           TEXT,
  branch_id       VARCHAR(50),
  device_id       VARCHAR(50) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  next_retry_at   TIMESTAMPTZ
);

-- Conflictos de sincronización
CREATE TABLE sync.sync_conflicts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type      VARCHAR(30) NOT NULL,
  entity_id        VARCHAR(50) NOT NULL,
  local_data       JSONB NOT NULL,
  cloud_data       JSONB NOT NULL,
  local_updated_at TIMESTAMPTZ,
  cloud_updated_at TIMESTAMPTZ,
  resolution       VARCHAR(20),
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de sincronización
CREATE TABLE sync.sync_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id        VARCHAR(50),
  device_id        VARCHAR(50) NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ,
  direction        VARCHAR(30) NOT NULL,
  total_items      INTEGER DEFAULT 0,
  processed_items  INTEGER DEFAULT 0,
  failed_items     INTEGER DEFAULT 0,
  conflict_items   INTEGER DEFAULT 0,
  status           VARCHAR(20) DEFAULT 'running'
);
```

---

## Relaciones Principales

```
categories ──< products ──< order_items >── orders >── customers
                  │
                  └──< stock_levels
                  └──< stock_movements
                  └──< price_history

orders >── sale_sessions

sync_queue (refleja cambios de todas las entidades)
```

---

## Índices de Performance Críticos

```sql
-- Búsqueda de productos por nombre (autocompletar POS)
CREATE INDEX CONCURRENTLY idx_products_search
  ON catalog.products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Dashboard ventas del día
CREATE INDEX CONCURRENTLY idx_orders_daily
  ON sales.orders(created_at, status, total)
  WHERE status = 'completed';

-- Sync queue procesamiento
CREATE INDEX CONCURRENTLY idx_sync_pending
  ON sync.sync_queue(status, created_at)
  WHERE status IN ('pending', 'failed');
```
