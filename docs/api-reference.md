# API Reference — Carnicería El Fundo

Base URL: `https://api.carniceriaelfundo.cl/api/v1`
Swagger UI: `https://api.carniceriaelfundo.cl/api/docs`

Todas las rutas protegidas requieren:
```
Authorization: Bearer <access_token>
```

---

## Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login con email/password |
| POST | `/auth/register` | Registro de cliente |
| POST | `/auth/refresh` | Renovar access token |
| GET | `/auth/me` | Perfil del usuario autenticado |
| POST | `/auth/logout` | Invalidar refresh token |

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "secret", "deviceId": "optional" }

// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900
}
```

---

## Productos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/products` | Público | Catálogo (con filtros) |
| GET | `/products/:id` | Público | Producto por ID |
| GET | `/products/:slug/slug` | Público | Producto por slug |
| POST | `/products` | admin | Crear producto |
| PUT | `/products/:id` | admin | Actualizar producto |
| DELETE | `/products/:id` | admin | Desactivar producto |
| GET | `/products/:id/stock` | cashier+ | Stock actual |

### GET /products (query params)
```
?category=vacuno
?search=lomo
?sort=price_asc|price_desc|name|featured
?page=1&limit=20
?available=true       # solo con stock > 0
?featured=true
```

---

## Pedidos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/orders` | auth | Crear pedido |
| GET | `/orders` | cashier+ | Listar pedidos |
| GET | `/orders/:id` | auth | Pedido por ID |
| PATCH | `/orders/:id/status` | cashier+ | Cambiar estado |
| POST | `/orders/:id/print` | cashier+ | Marcar como impreso |
| GET | `/orders/pending-web` | cashier+ | Pedidos web pendientes |
| POST | `/orders/pos/session/open` | cashier+ | Abrir sesión de caja |
| POST | `/orders/pos/session/:id/close` | cashier+ | Cerrar sesión |

### Estados válidos (transitions)
```
pending → confirmed → preparing → ready → completed
                               ↘ cancelled
pending → cancelled
```

---

## Inventario

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/inventory/stock` | cashier+ | Stock de todos los productos |
| GET | `/inventory/stock/:productId` | cashier+ | Stock de un producto |
| POST | `/inventory/adjust` | admin | Ajuste manual de stock |
| GET | `/inventory/movements` | admin | Historial de movimientos |
| GET | `/inventory/low-stock` | cashier+ | Alertas stock mínimo |

---

## Clientes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/customers` | cashier+ | Listar clientes |
| GET | `/customers/search?q=...` | cashier+ | Buscar por nombre/rut/teléfono |
| GET | `/customers/:id` | auth | Perfil cliente |
| POST | `/customers` | auth | Crear cliente |
| PUT | `/customers/:id` | auth | Actualizar cliente |
| GET | `/customers/:id/orders` | auth | Historial de pedidos |

---

## Sincronización (POS)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/sync/push` | device | POS sube cambios locales |
| GET | `/sync/pull` | device | Descarga cambios cloud |
| GET | `/sync/status` | device | Estado de sincronización |
| GET | `/sync/conflicts` | admin | Conflictos pendientes |
| PATCH | `/sync/conflicts/:id` | admin | Resolver conflicto |

Headers especiales para sync:
```
X-Device-ID: <uuid del dispositivo>
```

---

## Pagos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/payments/transbank/init` | auth | Iniciar pago Webpay |
| GET | `/payments/transbank/return` | público | Callback Transbank |
| POST | `/payments/mercadopago/init` | auth | Iniciar pago MP |
| POST | `/payments/mercadopago/webhook` | público | Webhook MP |

---

## Reportes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/reports/daily-sales?date=2024-01-15` | admin | Ventas del día |
| GET | `/reports/cash-closing/:sessionId` | admin | Cierre de caja |
| GET | `/reports/top-products?from=&to=` | admin | Productos más vendidos |
| GET | `/reports/inventory` | admin | Reporte de inventario |

---

## WebSocket

URL: `wss://api.carniceriaelfundo.cl/pos`

```javascript
// Conectar
const socket = io('wss://api.carniceriaelfundo.cl', { namespace: '/pos' })

// Registrar dispositivo
socket.emit('register-device', { deviceId: 'uuid', branchId: 'branch-uuid' })

// Escuchar eventos
socket.on('new-order', (data) => { /* nuevo pedido web */ })
socket.on('order-status-changed', (data) => { /* estado cambió */ })
socket.on('stock-updated', (data) => { /* stock actualizado */ })
socket.on('sync-completed', (data) => { /* sync terminó */ })
```
