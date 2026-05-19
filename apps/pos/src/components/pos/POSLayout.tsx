import React, { useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, Bell, ShoppingCart, Package, Users, BarChart2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePOSStore } from '../../stores/posStore'
import { ProductGrid } from '../products/ProductGrid'
import { CartPanel } from './CartPanel'
import { WebOrdersPanel } from '../orders/WebOrdersPanel'
import { clsx } from 'clsx'

export function POSLayout() {
  const {
    isOnline, isSyncing, pendingSyncItems, hasNewOrders,
    setOnlineStatus, setSyncStatus, addWebOrder, updateWebOrderStatus,
  } = usePOSStore()

  useEffect(() => {
    const api = (window as any).posAPI

    api.on('connection-status', ({ online }: { online: boolean }) => {
      setOnlineStatus(online)
      if (online) toast.success('Conectado al servidor', { id: 'conn' })
      else toast.error('Sin conexión al servidor', { id: 'conn' })
    })

    api.on('new-order', (payload: any) => {
      toast.custom(
        (t) => (
          <div className={clsx('bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3', t.visible ? 'animate-bounce' : '')}>
            <Bell className="w-6 h-6" />
            <div>
              <p className="font-bold text-lg">¡Nuevo pedido web!</p>
              <p>#{payload.orderNumber} — ${payload.total?.toLocaleString('es-CL')}</p>
            </div>
          </div>
        ),
        { duration: 8000, position: 'top-right' }
      )
      addWebOrder(payload)
      // Imprimir automáticamente
      api.printer.printTicket(payload)
    })

    api.on('stock-updated', (payload: any) => {
      if (payload.newStock <= 0) {
        toast.error(`Stock agotado: ${payload.productId}`, { duration: 4000 })
      }
    })

    api.on('sync-completed', (session: any) => {
      setSyncStatus(false, 0)
      if (session.failedItems > 0) {
        toast.error(`Sync: ${session.failedItems} ítems fallidos`)
      }
    })

    // Estado inicial de sincronización
    api.sync.getStatus().then((status: any) => {
      setOnlineStatus(status.isOnline)
      setSyncStatus(status.isSyncing, status.pendingItems)
    })

    return () => {
      api.off('connection-status', () => {})
      api.off('new-order', () => {})
    }
  }, [])

  const handleSyncNow = useCallback(async () => {
    const api = (window as any).posAPI
    setSyncStatus(true, pendingSyncItems)
    await api.sync.triggerNow()
    toast.success('Sincronización completada')
  }, [pendingSyncItems])

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Barra superior */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 h-14">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="El Fundo" className="h-8" />
          <span className="font-bold text-lg text-red-500">El Fundo POS</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Estado de conexión */}
          <div className={clsx('flex items-center gap-1.5 text-sm font-medium', isOnline ? 'text-green-400' : 'text-red-400')}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? 'En línea' : 'Sin conexión'}
          </div>

          {/* Sync */}
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={clsx('w-4 h-4', isSyncing && 'animate-spin')} />
            {pendingSyncItems > 0 && (
              <span className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingSyncItems}
              </span>
            )}
          </button>

          {/* Alerta pedidos web */}
          {hasNewOrders && (
            <button className="flex items-center gap-1.5 text-sm text-green-400 animate-pulse font-semibold">
              <Bell className="w-4 h-4" />
              Pedidos web
            </button>
          )}

          <span className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Barra lateral de navegación */}
        <nav className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-4">
          {[
            { icon: ShoppingCart, label: 'POS' },
            { icon: Bell, label: 'Pedidos', badge: hasNewOrders },
            { icon: Package, label: 'Stock' },
            { icon: Users, label: 'Clientes' },
            { icon: BarChart2, label: 'Reportes' },
            { icon: Settings, label: 'Config' },
          ].map(({ icon: Icon, label, badge }) => (
            <button
              key={label}
              title={label}
              className="relative p-3 rounded-xl hover:bg-gray-800 transition-colors group"
            >
              <Icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
              {badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Grilla de productos */}
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-4">
            <ProductGrid />
          </div>

          {/* Panel del carrito */}
          <aside className="w-96 border-l border-gray-800">
            <CartPanel />
          </aside>
        </main>
      </div>
    </div>
  )
}
