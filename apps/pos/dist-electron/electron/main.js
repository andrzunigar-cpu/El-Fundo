"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWindow = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const init_1 = require("../src/database/init");
const handlers_1 = require("../src/ipc/handlers");
const SyncManager_1 = require("../src/sync/SyncManager");
const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
exports.mainWindow = mainWindow;
let syncManager = null;
function createWindow() {
    exports.mainWindow = mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        title: 'El Fundo POS',
        icon: path.join(__dirname, '../../public/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        autoHideMenuBar: true,
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }
    mainWindow.on('closed', () => { exports.mainWindow = mainWindow = null; });
}
electron_1.app.whenReady().then(async () => {
    // Inicializar SQLite local
    await (0, init_1.initDatabase)();
    // Configurar handlers IPC
    (0, handlers_1.setupIpcHandlers)();
    createWindow();
    // Iniciar manager de sincronización
    syncManager = new SyncManager_1.SyncManager(mainWindow);
    syncManager.start();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    syncManager?.stop();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// Prevenir navegación externa
electron_1.app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, url) => {
        if (!url.startsWith('http://localhost')) {
            event.preventDefault();
            electron_1.shell.openExternal(url);
        }
    });
});
//# sourceMappingURL=main.js.map