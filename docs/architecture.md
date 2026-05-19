# Arquitectura del Sistema — Carnicería El Fundo

## Principios de Diseño

1. **Offline-First**: el POS funciona completamente sin internet
2. **Eventual Consistency**: sincronización asíncrona con resolución de conflictos
3. **Event-Driven**: pedidos web notificados vía WebSocket en tiempo real
4. **Separación de dominios**: monorepo con paquetes independientes
5. **Escalabilidad horizontal**: diseñado para multi-sucursal desde el día 1

---

## Flujo de Pedido Web → POS

```
Cliente web                Cloud API               POS Local
     │                         │                       │
     │ POST /orders             │                       │
     │─────────────────────────►│                       │
     │                         │ Crea orden en DB       │
     │                         │ Descuenta stock        │
     │                         │                        │
     │                         │ socket.emit(           │
     │                         │   'new-order',         │
     │                         │   { orderId, ... }     │
     │                         │──────────────────────►│
     │                         │                       │ Suena alarma
     │                         │                       │ Imprime ticket
     │                         │                       │ Guarda local
     │ HTTP 201 (orderId)       │                       │
     │◄─────────────────────────│                       │
     │                         │                       │
     │ Redirect → pago          │                       │
     │                         │                       │
     │ Pago confirmado          │                       │
     │─────────────────────────►│                       │
     │                         │ UPDATE order SET       │
     │                         │ status='confirmed'     │
     │                         │──────────────────────►│
     │                         │                       │ Actualiza estado
```

---

## Estrategia de Sincronización

### Push (Local → Cloud)
- Cada cambio local genera un registro en `sync_queue`
- `SyncManager` procesa la cola cada 5 minutos o al reconectar
- Lotes de máximo 50 ítems por request
- Reintentos automáticos con backoff exponencial (3 intentos)

### Pull (Cloud → Local)
- Descarga cambios desde `lastSyncAt` (timestamp guardado local)
- Entidades: productos, pedidos web, clientes, stock
- Operación idempotente con `INSERT OR REPLACE`

### Resolución de conflictos
- Estrategia: **Optimistic Locking con campo `version`**
- Si `cloud.version > local.version`: cloud gana
- Si `local.version > cloud.version`: conflicto → se registra en `sync_conflicts`
- Conflictos se resuelven manualmente desde el panel admin

---

## Modelo de Datos

### PostgreSQL (Cloud)
```
schemas:
  catalog:    products, categories, price_history
  sales:      orders, order_items, sale_sessions, payments
  inventory:  stock_levels, stock_movements, suppliers
  customers:  customers, addresses
  sync:       sync_queue, sync_conflicts, sync_sessions, sync_logs
  branches:   branches, users
```

### SQLite (Local POS)
```
tables:
  products, categories
  stock_levels, stock_movements
  customers
  orders, order_items
  sale_sessions
  sync_queue
  config
```

---

## Seguridad

| Capa | Mecanismo |
|------|-----------|
| Auth API | JWT (15min) + Refresh Token (7 días) |
| POS → API | JWT con rol `cashier`/`admin` |
| Web → API | JWT con rol `customer` |
| Passwords | bcrypt rounds=12 |
| HTTPS | TLS 1.3 vía Nginx |
| Rate limit | 30 req/s general, 5 req/min auth |
| SQLite | Archivo encriptado en userData (futuro) |

---

## Escalabilidad Multi-Sucursal

Cada `order`, `product`, `stockLevel` tiene `branchId`.

```
Branch A (sucursal principal)
  ├── POS device 1  (cajaId: REG-001)
  ├── POS device 2  (cajaId: REG-002)
  └── Stock propio

Branch B (sucursal nueva)
  ├── POS device 1
  └── Stock propio
      └── Transferencias entre sucursales vía API
```

El admin centralizado ve todas las sucursales agregadas.

---

## Stack Completo

```
┌────────────────────────────────────────────────────────┐
│                       FRONTEND                         │
│                                                        │
│  Next.js 14 (App Router + RSC + Streaming)             │
│  ├── Tailwind CSS 3 (JIT)                              │
│  ├── React Query v5 (server state)                     │
│  ├── Zustand (client state: carrito, auth)             │
│  ├── React Hook Form + Zod (validación)                │
│  └── Socket.io-client (pedidos en tiempo real)         │
│                                                        │
│  POS: Electron 31 + Vite + React 18                    │
│  ├── better-sqlite3 (DB local)                         │
│  ├── node-escpos (impresión ESC/POS)                   │
│  ├── Socket.io-client (WebSocket cloud)                │
│  └── Zustand (estado global POS)                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                        BACKEND                         │
│                                                        │
│  NestJS 10 (módulos, DI, guards, pipes)                │
│  ├── Fastify adapter (40% más rápido que Express)      │
│  ├── Prisma ORM (type-safe queries)                    │
│  ├── Socket.io (WebSocket server)                      │
│  ├── BullMQ (colas: sync, notificaciones, emails)      │
│  ├── Passport.js (JWT strategy)                        │
│  └── Swagger (documentación auto-generada)             │
│                                                        │
│  PostgreSQL 16                                         │
│  ├── Schemas por dominio                               │
│  ├── pg_trgm (búsqueda full-text)                      │
│  └── Migraciones vía Prisma Migrate                    │
│                                                        │
│  Redis 7                                               │
│  ├── BullMQ backend                                    │
│  ├── Session cache                                     │
│  └── Pub/Sub para multi-instancia                      │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   INFRAESTRUCTURA                      │
│                                                        │
│  Web: Vercel (CDN global, Edge Functions)              │
│  API: Railway / VPS Ubuntu 22.04                       │
│  DB: Supabase (PostgreSQL managed) o self-hosted       │
│  Storage: Cloudflare R2 (imágenes productos)           │
│  Email: Resend                                         │
│  Errores: Sentry                                       │
│  CI/CD: GitHub Actions                                 │
└────────────────────────────────────────────────────────┘
```
