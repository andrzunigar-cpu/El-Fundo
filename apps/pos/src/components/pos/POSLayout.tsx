import React, { useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, Bell, ShoppingCart, Package, Boxes, Wallet, BarChart3, History, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { usePOSStore, type POSView } from '../../stores/posStore'
import { SalesView } from '../views/SalesView'
import { ProductsView } from '../views/ProductsView'
import { StockView } from '../views/StockView'
import { CashSessionView } from '../views/CashSessionView'
import { ReportsView } from '../views/ReportsView'
import { HistoryView } from '../views/HistoryView'
import { SettingsView } from '../views/SettingsView'

const NAV_ITEMS: Array<{ id: POSView; icon: any; label: string }> = [
  { id: 'sales',    icon: ShoppingCart, label: 'Venta' },
  { id: 'products', icon: Package,      label: 'Productos' },
  { id: 'stock',    icon: Boxes,        label: 'Stock' },
  { id: 'cash',     icon: Wallet,       label: 'Caja' },
  { id: 'history',  icon: History,      label: 'Ventas' },
  { id: 'reports',  icon: BarChart3,    label: 'Reportes' },
  { id: 'settings', icon: Settings,     label: 'Config' },
]

export function POSLayout() {
  const {
    currentView, setView,
    isOnline, isSyncing, pendingSyncItems,
    setOnlineStatus, setSyncStatus,
  } = usePOSStore()

  useEffect(() => {
    const api = (window as any).posAPI
    if (!api) return

    api.on('connection-status', ({ online }: { online: boolean }) => {
      setOnlineStatus(online)
    })

    api.on('sync-completed', () => {
      setSyncStatus(false, 0)
    })

    // Estado inicial
    api.sync.getStatus().then((status: any) => {
      setOnlineStatus(status.isOnline)
      setSyncStatus(status.isSyncing, status.pendingItems)
    })

    return () => {
      api.off('connection-status', () => {})
      api.off('sync-completed', () => {})
    }
  }, [])

  const handleSyncNow = useCallback(async () => {
    const api = (window as any).posAPI
    setSyncStatus(true, pendingSyncItems)
    await api.sync.triggerNow()
    toast.success('Sincronización solicitada')
    setSyncStatus(false, 0)
  }, [pendingSyncItems])

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 h-14 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center font-black text-lg">EF</div>
          <span className="font-bold text-lg">El Fundo POS</span>
          <span className="text-xs text-gray-500 ml-2">Local · {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className={clsx('flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full',
            isOnline ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400')}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'En línea' : 'Modo local'}
          </div>

          <button onClick={handleSyncNow} disabled={isSyncing}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800"
            title="Sincronizar ahora">
            <RefreshCw className={clsx('w-4 h-4', isSyncing && 'animate-spin')} />
            {pendingSyncItems > 0 && (
              <span className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                {pendingSyncItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <nav className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-stretch py-3 gap-1 flex-shrink-0">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={clsx(
                'flex flex-col items-center gap-1 py-3 mx-2 rounded-lg transition-all',
                currentView === id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* View container */}
        <main className="flex-1 overflow-hidden">
          {currentView === 'sales'    && <SalesView />}
          {currentView === 'products' && <ProductsView />}
          {currentView === 'stock'    && <StockView />}
          {currentView === 'cash'     && <CashSessionView />}
          {currentView === 'history'  && <HistoryView />}
          {currentView === 'reports'  && <ReportsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  )
}
