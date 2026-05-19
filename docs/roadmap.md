# Roadmap por Fases — Carnicería El Fundo

## Fase 1 — MVP Local (Semanas 1-6)
> Objetivo: La carnicería puede operar completamente con el POS

- [x] Arquitectura y scaffolding del proyecto
- [ ] POS Electron funcional
  - [ ] Pantalla de productos con búsqueda
  - [ ] Carrito y cobro
  - [ ] Apertura/cierre de caja
  - [ ] Impresión de tickets (ESC/POS)
  - [ ] Gestión de stock
  - [ ] Historial de ventas
- [ ] Base de datos SQLite local
- [ ] API NestJS básica (auth, productos, órdenes, sync)
- [ ] PostgreSQL en la nube
- [ ] Sincronización básica local↔cloud

**Entregable**: POS instalado en la carnicería, funcionando offline

---

## Fase 2 — Ecommerce Web (Semanas 7-12)
> Objetivo: Clientes pueden comprar online

- [ ] Web Next.js con catálogo de productos
- [ ] Carrito de compras
- [ ] Checkout con Transbank WebpayPlus
- [ ] Checkout con Mercado Pago
- [ ] Pedidos en tiempo real → POS (WebSocket)
- [ ] Notificación de pedido en POS (sonido + impresión automática)
- [ ] Estado de pedidos para el cliente
- [ ] Emails transaccionales (confirmación, listo para retiro)
- [ ] SEO (metadata, sitemap, structured data)

**Entregable**: Tienda online funcionando con pedidos que llegan al POS

---

## Fase 3 — Panel Admin y Operaciones (Semanas 13-18)
> Objetivo: Gestión completa desde una interfaz centralizada

- [ ] Dashboard admin web
  - [ ] Ventas en tiempo real
  - [ ] Gráficos de producción
  - [ ] Gestión de productos y precios
  - [ ] Gestión de stock con alertas
  - [ ] Reportes exportables (Excel/PDF)
- [ ] Gestión de clientes y fidelización
- [ ] Sistema de promociones y descuentos
- [ ] Gestión de proveedores y órdenes de compra
- [ ] Etiquetas de precio (impresión)

**Entregable**: Dueño gestiona todo desde web

---

## Fase 4 — Multi-Sucursal (Semanas 19-26)
> Objetivo: Segunda sucursal funcionando en paralelo

- [ ] Panel centralizado multi-sucursal
- [ ] Stock por sucursal
- [ ] Transferencias de stock entre sucursales
- [ ] Reportes consolidados
- [ ] Usuarios y roles por sucursal
- [ ] Dashboard analytics comparativo

**Entregable**: Ambas sucursales sincronizadas con panel unificado

---

## Fase 5 — Digital y Delivery (Trimestre 3)
> Objetivo: Canal digital completo con delivery propio

- [ ] App móvil (React Native o Expo)
  - [ ] Catálogo
  - [ ] Pedidos
  - [ ] Push notifications
  - [ ] Tracking de delivery
- [ ] Delivery propio con tracking GPS
- [ ] Bot WhatsApp (pedidos y consultas)
- [ ] Meta Ads integration (catálogo dinámico)
- [ ] Google Shopping feed

---

## Fase 6 — Compliance y Enterprise (Trimestre 4)
> Objetivo: Sistema 100% legalizado y escalable

- [ ] Facturación electrónica SII Chile (DTE)
- [ ] Boleta electrónica
- [ ] Integración con contabilidad
- [ ] Programa de lealtad con puntos
- [ ] Suscripciones mensuales ("caja de carne")
- [ ] API pública para integraciones

---

## Integraciones Pendientes

| Integración | Prioridad | Fase |
|-------------|-----------|------|
| Transbank WebpayPlus | Alta | 2 |
| Mercado Pago | Alta | 2 |
| Impresora ESC/POS | Alta | 1 |
| Resend (emails) | Media | 2 |
| WhatsApp Business API | Media | 5 |
| Meta Ads (catálogo) | Media | 5 |
| SII Chile (DTE) | Alta | 6 |
| Google Analytics 4 | Baja | 3 |
| Sentry (errores) | Media | 1 |
| Balanza digital (peso) | Media | 3 |
