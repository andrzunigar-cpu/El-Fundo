# Carnicería El Fundo - API

API Node.js/Express para la web de Carnicería El Fundo.

## Setup

```bash
cd api
npm install
```

## Configuración

Crea un archivo `.env.local` en la carpeta `api/`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PORT=3001
```

## Desarrollo

```bash
npm run dev
```

Servidor en: http://localhost:3001

## Endpoints

- `GET /health` - Health check
- `GET /api/products` - Obtener todos los productos
- `GET /api/products?category_id=cat-vacuno` - Productos por categoría
- `GET /api/products/:id` - Producto específico
- `GET /api/categories` - Obtener categorías
- `GET /api/stock/:productId` - Stock disponible
- `POST /api/orders` - Crear orden
- `GET /api/orders/:id` - Obtener orden

## CORS

Configurado para aceptar requests de:
- http://localhost:3000 (desarrollo)
- http://localhost:3001 (API)
- carniceriaelfundo.cl (producción)

## Notas

- Usa Supabase como BD
- Datos sincronizados con POS local
- Producción-ready