"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// API expuesta de forma segura al renderer (React)
electron_1.contextBridge.exposeInMainWorld('posAPI', {
    // ── Productos ────────────────────────────────────────────
    products: {
        getAll: () => electron_1.ipcRenderer.invoke('products:getAll'),
        getById: (id) => electron_1.ipcRenderer.invoke('products:getById', id),
        search: (query) => electron_1.ipcRenderer.invoke('products:search', query),
        updatePrice: (id, price) => electron_1.ipcRenderer.invoke('products:updatePrice', id, price),
    },
    // ── Órdenes / Ventas ─────────────────────────────────────
    orders: {
        create: (order) => electron_1.ipcRenderer.invoke('orders:create', order),
        getAll: (filters) => electron_1.ipcRenderer.invoke('orders:getAll', filters),
        getById: (id) => electron_1.ipcRenderer.invoke('orders:getById', id),
        updateStatus: (id, status) => electron_1.ipcRenderer.invoke('orders:updateStatus', id, status),
        getPendingWeb: () => electron_1.ipcRenderer.invoke('orders:getPendingWeb'),
    },
    // ── Stock ─────────────────────────────────────────────────
    inventory: {
        getStock: (productId) => electron_1.ipcRenderer.invoke('inventory:getStock', productId),
        getAllStock: () => electron_1.ipcRenderer.invoke('inventory:getAllStock'),
        adjust: (productId, quantity, reason) => electron_1.ipcRenderer.invoke('inventory:adjust', productId, quantity, reason),
    },
    // ── Clientes ─────────────────────────────────────────────
    customers: {
        search: (query) => electron_1.ipcRenderer.invoke('customers:search', query),
        getById: (id) => electron_1.ipcRenderer.invoke('customers:getById', id),
        create: (customer) => electron_1.ipcRenderer.invoke('customers:create', customer),
    },
    // ── Caja ─────────────────────────────────────────────────
    session: {
        open: (data) => electron_1.ipcRenderer.invoke('session:open', data),
        close: (data) => electron_1.ipcRenderer.invoke('session:close', data),
        getCurrent: () => electron_1.ipcRenderer.invoke('session:getCurrent'),
    },
    // ── Impresión ─────────────────────────────────────────────
    printer: {
        printTicket: (order) => electron_1.ipcRenderer.invoke('printer:printTicket', order),
        printLabel: (product) => electron_1.ipcRenderer.invoke('printer:printLabel', product),
        testPrint: () => electron_1.ipcRenderer.invoke('printer:test'),
    },
    // ── Sincronización ────────────────────────────────────────
    sync: {
        triggerNow: () => electron_1.ipcRenderer.invoke('sync:triggerNow'),
        getStatus: () => electron_1.ipcRenderer.invoke('sync:getStatus'),
        getQueue: () => electron_1.ipcRenderer.invoke('sync:getQueue'),
        getLogs: () => electron_1.ipcRenderer.invoke('sync:getLogs'),
    },
    // ── Reportes ──────────────────────────────────────────────
    reports: {
        dailySales: (date) => electron_1.ipcRenderer.invoke('reports:dailySales', date),
        cashClosing: (sessionId) => electron_1.ipcRenderer.invoke('reports:cashClosing', sessionId),
    },
    // ── Eventos en tiempo real (WebSocket) ───────────────────
    on: (channel, callback) => {
        const validChannels = [
            'new-order', 'order-status-changed', 'stock-updated',
            'sync-completed', 'sync-conflict', 'connection-status',
        ];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, (_, ...args) => callback(...args));
        }
    },
    off: (channel, callback) => {
        electron_1.ipcRenderer.removeListener(channel, callback);
    },
});
//# sourceMappingURL=preload.js.map