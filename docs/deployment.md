# Guía de Despliegue — Carnicería El Fundo

## Fase 1: Infraestructura Base (Desarrollo)

```bash
# 1. Clonar y configurar
cd "Carniceria El Fundo"
cp .env.example .env
# → Editar .env con tus credenciales

# 2. Levantar DB y Redis local
docker-compose up -d postgres redis

# 3. Instalar dependencias (monorepo)
npm install -g pnpm@9
pnpm install

# 4. Ejecutar migraciones
pnpm --filter @elfundo/api db:migrate

# 5. Poblar datos de prueba
pnpm --filter @elfundo/api db:seed

# 6. Iniciar todos los servicios
pnpm dev
```

## Fase 2: POS Local (Producción en tienda)

```bash
# Compilar instalador Windows
pnpm --filter @elfundo/pos build:win

# El instalador queda en:
# apps/pos/release/El Fundo POS Setup 1.0.0.exe

# Instalar en el PC de caja
# Al primera ejecución: configurar API URL y credenciales
```

## Fase 3: Web + API (Cloud)

### Opción A: Vercel (Web) + Railway (API)

```bash
# Web → Vercel
cd apps/web
vercel --prod

# API → Railway
# 1. Crear proyecto en railway.app
# 2. Conectar repo GitHub
# 3. Set variables de entorno
# 4. Deploy automático en cada push a main
```

### Opción B: VPS Ubuntu (todo en uno)

```bash
# En el VPS (Ubuntu 22.04)
git clone <repo>
cd "Carniceria El Fundo"
cp .env.example .env
# → Editar .env con IPs y credenciales de producción

# Levantar todo con Docker Compose
docker-compose -f docker-compose.prod.yml --profile production up -d

# Configurar SSL con Certbot
certbot --nginx -d carniceriaelfundo.cl -d www.carniceriaelfundo.cl
```

## Variables de Entorno por Ambiente

| Variable | Desarrollo | Producción |
|----------|-----------|------------|
| NODE_ENV | development | production |
| TRANSBANK_ENV | integration | production |
| TRANSBANK_COMMERCE_CODE | 597055555532 (test) | código real |
| DATABASE_URL | localhost | VPS/Railway host |
| API_URL | http://localhost:3001 | https://api.carniceriaelfundo.cl |

## CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml (a crear)
on:
  push:
    branches: [main]
jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm --filter @elfundo/api build
      - run: pnpm --filter @elfundo/api db:migrate:prod
      # Deploy a Railway via CLI
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## Checklist Pre-Producción

- [ ] Cambiar JWT_SECRET (mín 64 caracteres)
- [ ] Configurar Transbank en modo `production`
- [ ] Configurar Mercado Pago con credenciales reales
- [ ] Configurar dominio en Vercel
- [ ] Configurar SSL en Nginx
- [ ] Habilitar backups automáticos PostgreSQL
- [ ] Configurar Sentry DSN
- [ ] Probar flujo completo de pedido web → POS
- [ ] Probar modo offline (desconectar internet, hacer ventas, reconectar)
- [ ] Configurar impresora ESC/POS en POS
- [ ] Configurar alertas de monitoreo (uptime)

## Backups

```bash
# Backup automático PostgreSQL (cron diario a las 3am)
0 3 * * * pg_dump $DATABASE_URL | gzip > /backups/elfundo_$(date +%Y%m%d).sql.gz

# Sincronizar a S3/R2
0 4 * * * aws s3 sync /backups/ s3://elfundo-backups/postgres/
```
