import { contextBridge, ipcRenderer } from 'electron'

// API expuesta de forma segura al renderer (React)
contextBridge.exposeInMainWorld('posAPI', {
  // ── Productos ────────────────────────────────────────────
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    getById: (id: string) => ipcRenderer.invoke('products:getById', id),
    search: (query: string) => ipcRenderer.invoke('products:search', query),
    create: (data: any) => ipcRenderer.invoke('products:create', data),
    updatePrice: (id: string, price: number) => ipcRenderer.invoke('products:updatePrice', id, price),
  },

  // ── Órdenes / Ventas ─────────────────────────────────────
  orders: {
    create: (order: any) => ipcRenderer.invoke('orders:create', order),
    getAll: (filters: any) => ipcRenderer.invoke('orders:getAll', filters),
    getById: (id: string) => ipcRenderer.invoke('orders:getById', id),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke('orders:updateStatus', id, status),
    getPendingWeb: () => ipcRenderer.invoke('orders:getPendingWeb'),
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
    dailySales: (date: string) => ipcRenderer.invoke('reports:dailySales', date),
    cashClosing: (sessionId: string) => ipcRenderer.invoke('reports:cashClosing', sessionId),
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
