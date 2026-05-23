import React, { useState, useEffect } from 'react'
import { Printer, Cloud, Database, Info, CreditCard, AlertTriangle, Trash2, RefreshCw, PackageX, Tag, Users } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { PaymentMethodsPanel } from './settings/PaymentMethodsPanel'
import { CategoriesPanel } from './settings/CategoriesPanel'
import { UsersPanel } from './settings/UsersPanel'

const TABS = [
  { id: 'payments',   label: 'Medios de pago', icon: CreditCard },
  { id: 'categories', label: 'Categorías',     icon: Tag        },
  { id: 'users',      label: 'Usuarios',       icon: Users      },
  { id: 'printer',    label: 'Impresora',      icon: Printer    },
  { id: 'sync',       label: 'Sincronización', icon: Cloud      },
  { id: 'system',     label: 'Sistema',        icon: Database   },
  { id: 'about',      label: 'Acerca de',      icon: Info       },
]

export function SettingsView() {
  const [tab, setTab] = useState('payments')
  const [stats, setStats] = useState<any>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resettingStock, setResettingStock] = useState(false)

  useEffect(() => {
    if (tab === 'system') {
      (window as any).posAPI.system.getStats().then(setStats)
    }
  }, [tab])

  const testPrint = async () => {
    const api = (window as any).posAPI
    await api.printer.testPrint()
    toast.success('Test enviado a impresora')
  }

  const doReset = async () => {
    setResetting(true)
    try {
      await (window as any).posAPI.system.resetData()
      toast.success('✓ Datos reseteados — sistema listo para reporte inicial', { duration: 5000 })
      setConfirmReset(false)
      const newStats = await (window as any).posAPI.system.getStats()
      setStats(newStats)
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    }
    setResetting(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-gray-800 px-5 pt-4">
        <div className="flex items-center gap-1">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2',
                  tab === t.id
                    ? 'bg-gray-900 text-white border-red-500'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-900/50'
                )}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl mx-auto">

          {tab === 'payments' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-0.5">Medios de pago</h2>
                <p className="text-xs text-gray-500">
                  Configura los métodos disponibles en caja y sus comisiones para reportes de rentabilidad.
                </p>
              </div>
              <PaymentMethodsPanel />
            </div>
          )}

          {tab === 'categories' && <CategoriesPanel />}

          {tab === 'users' && <UsersPanel />}

          {tab === 'printer' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Impresora térmica</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Printer className="w-4 h-4 text-red-500" />
                  <h3 className="font-bold">Impresora ESC/POS</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">Imprime tickets de venta en impresora térmica (USB o IP).</p>
                <button onClick={testPrint} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Imprimir test
                </button>
                <p className="text-xs text-gray-500 mt-2">Configuración avanzada disponible en próxima versión.</p>
              </div>
            </div>
          )}

          {tab === 'sync' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Sincronización con la nube</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Cloud className="w-4 h-4 text-red-500" />
                  <h3 className="font-bold">Estado de sincronización</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Cada 5 minutos el sistema intenta enviar las ventas al servidor de la nube.
                  Si no hay internet, las ventas quedan en cola y se envían cuando vuelve la conexión.
                </p>
                <p className="text-xs text-gray-500">Estado: Modo local activo</p>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Sistema</h2>

              {/* Stats actuales */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-red-500" />
                  <h3 className="font-bold">Estado actual de datos</h3>
                </div>
                {stats ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Órdenes / ventas',     val: stats.orders },
                      { label: 'Movimientos de stock', val: stats.moves },
                      { label: 'Sesiones de caja',     val: stats.sessions },
                      { label: 'Productos activos',    val: stats.products },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-gray-800 rounded-lg px-4 py-3">
                        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                        <p className={clsx('text-2xl font-black', val > 0 ? 'text-white' : 'text-gray-600')}>{val}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Cargando...</p>
                )}
              </div>

              {/* Reset stock a cero */}
              <div className="bg-orange-950/20 border border-orange-900/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <PackageX className="w-4 h-4 text-orange-400" />
                  <h3 className="font-bold text-orange-400">Poner todo el stock en 0</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Deja todos los productos con stock cero y borra los movimientos de inventario.
                  Los productos, precios y datos de venta <strong className="text-white">no se tocan</strong>.
                </p>
                <button
                  onClick={async () => {
                    setResettingStock(true)
                    try {
                      await (window as any).posAPI.inventory.resetAllStock()
                      toast.success('✓ Stock de todos los productos en 0', { duration: 4000 })
                      const newStats = await (window as any).posAPI.system.getStats()
                      setStats(newStats)
                    } catch (e: any) {
                      toast.error(`Error: ${e.message}`)
                    }
                    setResettingStock(false)
                  }}
                  disabled={resettingStock}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-900/50 border border-orange-700 text-orange-300 text-sm font-semibold hover:bg-orange-900 transition-all disabled:opacity-50">
                  {resettingStock
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Reseteando...</>
                    : <><PackageX className="w-4 h-4" /> Resetear stock a cero</>}
                </button>
              </div>

              {/* Reset zona peligrosa */}
              <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="font-bold text-red-400">Reset de datos</h3>
                </div>

                <p className="text-sm text-gray-400 mb-1">
                  Borra <strong className="text-white">toda la actividad transaccional</strong> y deja el sistema en cero para comenzar a tomar reportes desde hoy.
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Se eliminan: ventas, movimientos de stock, sesiones de caja, facturas, mermas, vencimientos.<br />
                  Se conservan: productos, categorías, formatos y medios de pago.
                </p>

                {!confirmReset ? (
                  <button onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm font-semibold hover:bg-red-900 transition-all">
                    <Trash2 className="w-4 h-4" />
                    Resetear datos transaccionales
                  </button>
                ) : (
                  <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-300 text-sm">¿Confirmas el reset?</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Esta acción <strong className="text-red-400">no se puede deshacer</strong>.
                          Se borrarán {stats?.orders ?? 0} órdenes y {stats?.moves ?? 0} movimientos de stock permanentemente.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmReset(false)}
                        className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700">
                        Cancelar
                      </button>
                      <button onClick={doReset} disabled={resetting}
                        className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2">
                        {resetting
                          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Reseteando...</>
                          : <><Trash2 className="w-4 h-4" /> Sí, resetear todo</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'about' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Acerca de</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-red-500" />
                  <h3 className="font-bold">El Fundo POS</h3>
                </div>
                <p className="text-sm text-gray-400">v1.0.0</p>
                <p className="text-xs text-gray-500 mt-1">Sistema offline-first para carnicería · Carnicería El Fundo</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
