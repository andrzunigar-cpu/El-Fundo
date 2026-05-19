# Carnicería El Fundo — Sistema Empresarial Híbrido

Sistema ERP/POS híbrido local-cloud para carnicería moderna en Chile.
Arquitectura tipo Square POS / Toast POS con ecommerce propio.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUD (Vercel / VPS)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Web Next.js │  │  API NestJS  │  │  Admin Dashboard     │  │
│  │  (Ecommerce) │  │  (REST+WS)   │  │  (Multi-sucursal)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│  ┌──────▼─────────────────▼────────────────────────┐           │
│  │         PostgreSQL + Redis (Cloud DB)            │           │
│  └─────────────────────────┬────────────────────────┘           │
└────────────────────────────┼────────────────────────────────────┘
                             │ WebSocket / REST Sync
                    ┌────────▼────────┐
                    │  SYNC SERVICE   │
                    │  (Cola + Queue) │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    LOCAL (Carnicería)                            │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │              POS Electron App                               │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │ │
│  │  │  Ventas │ │  Stock   │ │ Pedidos  │ │   Reportes    │  │ │
│  │  │   POS   │ │ Productos│ │   Web    │ │   Cajas       │  │ │
│  │  └─────────┘ └──────────┘ └──────────┘ └───────────────┘  │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │              SQLite Local DB                                │ │
│  │         (Offline-first, sync queue)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

| Capa              | Tecnología                          |
|-------------------|-------------------------------------|
| Web Ecommerce     | Next.js 14 (App Router) + TypeScript |
| API Backend       | NestJS + TypeScript + Fastify adapter|
| POS Local         | Electron + React + TypeScript        |
| DB Cloud          | PostgreSQL 16 + Redis 7              |
| DB Local          | SQLite (better-sqlite3)              |
| Tiempo Real       | Socket.io (WebSockets)               |
| Auth              | JWT + Refresh Tokens                 |
| Cola de Sync      | BullMQ + Redis                       |
| Pagos             | Transbank WebpayPlus + Mercado Pago  |
| Impresión         | ESC/POS (node-escpos)                |
| Monorepo          | Turborepo + pnpm workspaces          |
| Contenedores      | Docker + Docker Compose              |
| CI/CD             | GitHub Actions                       |
| Infraestructura   | Vercel (web) + Railway/VPS (API)     |

## Estructura del Monorepo

```
carniceria-el-fundo/
├── apps/
│   ├── api/          # Backend NestJS (REST + WebSocket)
│   ├── web/          # Ecommerce Next.js
│   └── pos/          # POS Electron
├── packages/
│   └── shared/       # Tipos, utilidades, validadores compartidos
├── services/
│   ├── sync-engine/  # Motor de sincronización
│   └── notifications/ # Alertas y notificaciones
├── infra/
│   ├── nginx/        # Reverse proxy config
│   ├── postgres/     # Init scripts
│   └── redis/        # Config
├── docs/             # Documentación técnica
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Inicio Rápido (Desarrollo)

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Levantar infraestructura (PostgreSQL + Redis)
docker-compose up -d postgres redis

# Ejecutar migraciones
pnpm --filter @elfundo/api db:migrate

# Iniciar todos los servicios en paralelo
pnpm dev

# Solo el POS local
pnpm --filter @elfundo/pos dev

# Solo el ecommerce web
pnpm --filter @elfundo/web dev
```

## Roadmap

- **Fase 1** — POS Local + SQLite + sync básico
- **Fase 2** — Ecommerce web + pagos + pedidos en tiempo real
- **Fase 3** — Multi-sucursal + admin centralizado
- **Fase 4** — App móvil + delivery + WhatsApp bot
- **Fase 5** — Analytics + BI + facturación electrónica SII Chile

## Documentación

- [Arquitectura Detallada](docs/architecture.md)
- [Modelo de Base de Datos](docs/database-schema.md)
- [API Reference](docs/api-reference.md)
- [Estrategia de Sincronización](docs/sync-strategy.md)
- [Guía de Despliegue](docs/deployment.md)
