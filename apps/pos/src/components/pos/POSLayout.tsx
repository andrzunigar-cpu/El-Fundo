import React, { useEffect, useCallback, useState, useRef } from 'react'
import { Wifi, WifiOff, RefreshCw, ShoppingCart, Package, Boxes, Wallet, BarChart3, History, Settings, TrendingUp, FileText, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { usePOSStore, type POSView } from '../../stores/posStore'
import { SalesView } from '../views/SalesView'
import { ProductsView } from '../views/ProductsView'
import { InventoryView } from '../views/InventoryView'
import { CashSessionView } from '../views/CashSessionView'
import { ReportsView } from '../views/ReportsView'
import { HistoryView } from '../views/HistoryView'
import { SettingsView } from '../views/SettingsView'
import { ResultadoView } from '../views/ResultadoView'

const NAV_ITEMS: Array<{ id: POSView; icon: any; label: string }> = [
  { id: 'sales',        icon: ShoppingCart, label: 'Venta' },
  { id: 'products',     icon: Package,      label: 'Productos' },
  { id: 'inventory',    icon: Boxes,        label: 'Inventario' },
  { id: 'new-purchase', icon: FileText,     label: 'Compra' },
  { id: 'cash',         icon: Wallet,       label: 'Caja' },
  { id: 'history',      icon: History,      label: 'Ventas' },
  { id: 'reports',      icon: BarChart3,    label: 'Reportes' },
  { id: 'resultado',    icon: TrendingUp,   label: 'Resultado' },
  { id: 'settings',     icon: Settings,     label: 'Config' },
]

export function POSLayout() {
  const {
    currentView, setView,
    isOnline, isSyncing, pendingSyncItems,
    setOnlineStatus, setSyncStatus,
  } = usePOSStore()

  // ── Auth para Config ──────────────────────────────────────
  const [configAuthed, setConfigAuthed] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authUser, setAuthUser] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const passRef = useRef<HTMLInputElement>(null)

  const handleNavClick = (id: POSView) => {
    if (id === 'settings' && !configAuthed) {
      setAuthUser('')
      setAuthPass('')
      setAuthError('')
      setShowPwd(false)
      setShowAuthModal(true)
    } else {
      setView(id)
    }
  }

  const handleAuthSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!authUser.trim() || !authPass.trim()) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const user = await (window as any).posAPI.users.authenticate(authUser.trim(), authPass)
      if (!user) {
        setAuthError('Usuario o contraseña incorrectos')
      } else if (user.role !== 'admin') {
        setAuthError('Solo administradores pueden acceder a la configuración')
      } else {
        setConfigAuthed(true)
        setShowAuthModal(false)
        setView('settings')
        toast.success(`Bienvenido, ${user.display_name}`)
      }
    } catch {
      setAuthError('Error al autenticar')
    } finally {
      setAuthLoading(false)
    }
  }

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
              onClick={() => handleNavClick(id)}
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
          {currentView === 'sales'        && <SalesView />}
          {currentView === 'products'     && <ProductsView />}
          {currentView === 'inventory'    && <InventoryView />}
          {currentView === 'new-purchase' && <InventoryView initialTab="purchases" autoOpenNew />}
          {currentView === 'cash'         && <CashSessionView />}
          {currentView === 'history'      && <HistoryView />}
          {currentView === 'reports'      && <ReportsView />}
          {currentView === 'resultado'    && <ResultadoView />}
          {currentView === 'settings'     && <SettingsView />}
        </main>
      </div>

      {/* Modal autenticación Config */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setShowAuthModal(false)}>
          <form onSubmit={handleAuthSubmit}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-80 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base">Acceso a Configuración</h2>
                <p className="text-xs text-gray-500">Solo administradores</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Usuario</label>
                <input
                  autoFocus
                  value={authUser}
                  onChange={e => setAuthUser(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && passRef.current?.focus()}
                  placeholder="admin"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    ref={passRef}
                    type={showPwd ? 'text' : 'password'}
                    value={authPass}
                    onChange={e => setAuthPass(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:border-red-500" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {authError && (
              <p className="text-xs text-red-400 mt-3">{authError}</p>
            )}

            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setShowAuthModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={authLoading || !authUser || !authPass}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
