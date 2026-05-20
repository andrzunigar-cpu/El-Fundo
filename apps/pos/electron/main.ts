import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import * as path from 'path'
import { initDatabase } from '../src/database/init'
import { setupIpcHandlers } from '../src/ipc/handlers'
import { SyncManager } from '../src/sync/SyncManager'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow: BrowserWindow | null = null
let syncManager: SyncManager | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
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
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  // Inicializar SQLite local
  await initDatabase()

  // Configurar handlers IPC
  setupIpcHandlers()

  createWindow()

  // Iniciar manager de sincronización
  syncManager = new SyncManager(mainWindow!)
  syncManager.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  syncManager?.stop()
  if (process.platform !== 'darwin') app.quit()
})

// Prevenir navegación externa
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
})

// Exportar mainWindow para uso en handlers
export { mainWindow }
