import { contextBridge, ipcRenderer } from 'electron'

// API expuesta de forma segura al renderer (React)
contextBridge.exposeInMainWorld('posAPI', {
  // ── Productos ────────────────────────────────────────────
  products: {
    getAll:          () => ipcRenderer.invoke('products:getAll'),
    getById:         (id: string) => ipcRenderer.invoke('products:getById', id),
    search:          (query: string) => ipcRenderer.invoke('products:search', query),
    create:          (data: any) => ipcRenderer.invoke('products:create', data),
    update:          (id: string, data: any) => ipcRenderer.invoke('products:update', id, data),
    updatePrice:     (id: string, price: number) => ipcRenderer.invoke('products:updatePrice', id, price),
    updateCost:      (id: string, cost: number) => ipcRenderer.invoke('products:updateCost', id, cost),
    toggleStatus:    (id: string) => ipcRenderer.invoke('products:toggleStatus', id),
    getPromotions:   () => ipcRenderer.invoke('products:getPromotions'),
    updatePromotion: (id: string, data: any) => ipcRenderer.invoke('products:updatePromotion', id, data),
  },

  // ── Formatos de producto ──────────────────────────────────
  formats: {
    getAll: () => ipcRenderer.invoke('formats:getAll'),
    create: (data: any) => ipcRenderer.invoke('formats:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('formats:update', id, data),
  },

  // ── Órdenes / Ventas ─────────────────────────────────────
  orders: {
    create:       (order: any) => ipcRenderer.invoke('orders:create', order),
    getAll:       (filters: any) => ipcRenderer.invoke('orders:getAll', filters),
    getById:      (id: string) => ipcRenderer.invoke('orders:getById', id),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke('orders:updateStatus', id, status),
    getPendingWeb:() => ipcRenderer.invoke('orders:getPendingWeb'),
    void:         (id: string) => ipcRenderer.invoke('orders:void', id),
  },

  discountCodes: {
    getAll:       () => ipcRenderer.invoke('discountCodes:getAll'),
    create:       (data: any) => ipcRenderer.invoke('discountCodes:create', data),
    validate:     (code: string) => ipcRenderer.invoke('discountCodes:validate', code),
    use:          (id: string) => ipcRenderer.invoke('discountCodes:use', id),
    delete:       (id: string) => ipcRenderer.invoke('discountCodes:delete', id),
    toggleActive: (id: string) => ipcRenderer.invoke('discountCodes:toggleActive', id),
  },

  // ── Stock & Inventario ────────────────────────────────────
  inventory: {
    getStock: (productId: string) => ipcRenderer.invoke('inventory:getStock', productId),
    getAllStock: () => ipcRenderer.invoke('inventory:getAllStock'),
    adjust: (productId: string, quantity: number, reason: string) =>
      ipcRenderer.invoke('inventory:adjust', productId, quantity, reason),

    // Resumen + movimientos
    getSummary: (filters?: any)  => ipcRenderer.invoke('inventory:getSummary', filters),
    getMovements: (filters?: any) => ipcRenderer.invoke('inventory:getMovements', filters),

    // Inventario inicial
    setInitial: (items: any[]) => ipcRenderer.invoke('inventory:setInitial', items),

    // Compras
    registerPurchase: (data: any) => ipcRenderer.invoke('inventory:registerPurchase', data),
    listPurchases: (filters?: any) => ipcRenderer.invoke('inventory:listPurchases', filters),
    getPurchase: (id: string) => ipcRenderer.invoke('inventory:getPurchase', id),

    // Consumos
    registerConsumption: (data: any) => ipcRenderer.invoke('inventory:registerConsumption', data),
    listConsumptions: (filters?: any) => ipcRenderer.invoke('inventory:listConsumptions', filters),

    // Reset stock
    resetAllStock: () => ipcRenderer.invoke('inventory:resetAllStock'),

    // Tomas de inventario
    countStart:       () => ipcRenderer.invoke('inventory:countStart'),
    countGetItems:    (id: string) => ipcRenderer.invoke('inventory:countGetItems', id),
    countUpdateItem:  (id: string, productId: string, qty: number, notes?: string) =>
                      ipcRenderer.invoke('inventory:countUpdateItem', id, productId, qty, notes),
    countComplete:    (id: string, notes?: string) => ipcRenderer.invoke('inventory:countComplete', id, notes),
    countCancel:      (id: string) => ipcRenderer.invoke('inventory:countCancel', id),
    listCounts:       (filters?: any) => ipcRenderer.invoke('inventory:listCounts', filters),
  },

  // ── Clientes ─────────────────────────────────────────────
  customers: {
    search: (query: string) => ipcRenderer.invoke('customers:search', query),
    getById: (id: string) => ipcRenderer.invoke('customers:getById', id),
    create: (customer: any) => ipcRenderer.invoke('customers:create', customer),
  },

  // ── Caja ─────────────────────────────────────────────────
  session: {
    open: (data: any) => ipcRenderer.invoke('session:open', data),
    close: (data: any) => ipcRenderer.invoke('session:close', data),
    getCurrent: () => ipcRenderer.invoke('session:getCurrent'),
  },

  // ── Impresión ─────────────────────────────────────────────
  printer: {
    printTicket: (order: any) => ipcRenderer.invoke('printer:printTicket', order),
    printLabel: (product: any) => ipcRenderer.invoke('printer:printLabel', product),
    testPrint: () => ipcRenderer.invoke('printer:test'),
  },

  // ── Sincronización ────────────────────────────────────────
  sync: {
    triggerNow: () => ipcRenderer.invoke('sync:triggerNow'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    getQueue: () => ipcRenderer.invoke('sync:getQueue'),
    getLogs: () => ipcRenderer.invoke('sync:getLogs'),
  },

  // ── Reportes ──────────────────────────────────────────────
  reports: {
    dailySales:       (date: string) => ipcRenderer.invoke('reports:dailySales', date),
    periodSales:      (from: string, to: string) => ipcRenderer.invoke('reports:periodSales', from, to),
    cashClosing:      (id: string) => ipcRenderer.invoke('reports:cashClosing', id),
    summary:          (from: string, to: string, cf?: string, ct?: string) => ipcRenderer.invoke('reports:summary', from, to, cf, ct),
    byPaymentMethod:  (from: string, to: string, cf?: string, ct?: string) => ipcRenderer.invoke('reports:byPaymentMethod', from, to, cf, ct),
    productRanking:   (from: string, to: string, sortBy: string) => ipcRenderer.invoke('reports:productRanking', from, to, sortBy),
    inventoryDiff:    () => ipcRenderer.invoke('reports:inventoryDiff'),
    mermas:           (from: string, to: string) => ipcRenderer.invoke('reports:mermas', from, to),
    expiring:         (days?: number) => ipcRenderer.invoke('reports:expiring', days),
    cashSessions:     (from: string, to: string) => ipcRenderer.invoke('reports:cashSessions', from, to),
    invoicesReport:   (from: string, to: string) => ipcRenderer.invoke('reports:invoicesReport', from, to),
    byHour:           (from: string, to: string, cf?: string, ct?: string) => ipcRenderer.invoke('reports:byHour', from, to, cf, ct),
    preIva:           (from: string, to: string, ppmRate?: number) => ipcRenderer.invoke('reports:preIva', from, to, ppmRate),
  },

  // ── Medios de pago ────────────────────────────────────────
  paymentSettings: {
    getAll:        () => ipcRenderer.invoke('paymentSettings:getAll'),
    getForPos:     () => ipcRenderer.invoke('paymentSettings:getForPos'),
    update:        (method: string, pct: number) => ipcRenderer.invoke('paymentSettings:update', method, pct),
    updateFull:    (data: any) => ipcRenderer.invoke('paymentSettings:updateFull', data),
    create:        (data: any) => ipcRenderer.invoke('paymentSettings:create', data),
    delete:        (method: string) => ipcRenderer.invoke('paymentSettings:delete', method),
    toggleActive:  (method: string) => ipcRenderer.invoke('paymentSettings:toggleActive', method),
  },

  // ── Categorías ────────────────────────────────────────────
  categories: {
    getAll:        () => ipcRenderer.invoke('categories:getAll'),
    create:        (data: any) => ipcRenderer.invoke('categories:create', data),
    update:        (id: string, data: any) => ipcRenderer.invoke('categories:update', id, data),
    toggleStatus:  (id: string) => ipcRenderer.invoke('categories:toggleStatus', id),
    delete:        (id: string) => ipcRenderer.invoke('categories:delete', id),
  },

  // ── Proveedores ───────────────────────────────────────────
  suppliers: {
    getAll:  () => ipcRenderer.invoke('suppliers:getAll'),
    create:  (data: any) => ipcRenderer.invoke('suppliers:create', data),
    update:  (id: string, data: any) => ipcRenderer.invoke('suppliers:update', id, data),
    delete:  (id: string) => ipcRenderer.invoke('suppliers:delete', id),
  },

  // ── Resultado (P&L) ──────────────────────────────────────
  resultado: {
    getSummary:   (year: number, month: number) => ipcRenderer.invoke('resultado:getSummary', year, month),
    getExpenses:  (year: number, month: number) => ipcRenderer.invoke('resultado:getExpenses', year, month),
    saveExpenses: (year: number, month: number, data: any) => ipcRenderer.invoke('resultado:saveExpenses', year, month, data),
  },

  // ── Exportar ──────────────────────────────────────────────
  export: {
    saveExcel: (data: number[], filename: string) => ipcRenderer.invoke('export:saveExcel', { data, filename }),
  },

  // ── Sistema ───────────────────────────────────────────────
  system: {
    resetData: () => ipcRenderer.invoke('system:resetData'),
    getStats:  () => ipcRenderer.invoke('system:getStats'),
  },

  // ── Usuarios ──────────────────────────────────────────────
  users: {
    authenticate: (username: string, password: string) => ipcRenderer.invoke('users:authenticate', username, password),
    getAll:        () => ipcRenderer.invoke('users:getAll'),
    create:        (data: any) => ipcRenderer.invoke('users:create', data),
    update:        (id: string, data: any) => ipcRenderer.invoke('users:update', id, data),
    delete:        (id: string) => ipcRenderer.invoke('users:delete', id),
  },

  // ── Vencimientos ──────────────────────────────────────────
  expiry: {
    getAll:  () => ipcRenderer.invoke('expiry:getAll'),
    create:  (data: any) => ipcRenderer.invoke('expiry:create', data),
    delete:  (id: string) => ipcRenderer.invoke('expiry:delete', id),
  },

  // ── Eventos en tiempo real (WebSocket) ───────────────────
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = [
      'new-order', 'order-status-changed', 'stock-updated',
      'sync-completed', 'sync-conflict', 'connection-status',
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args))
    }
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
})
