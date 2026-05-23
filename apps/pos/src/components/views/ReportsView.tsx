import React, { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import {
  TrendingUp, CreditCard, Trophy, Package, Scissors,
  CalendarX, Wallet, FileText, Clock,
} from 'lucide-react'
import { SummaryTab }   from './reports/SummaryTab'
import { PaymentTab }   from './reports/PaymentTab'
import { RankingTab }   from './reports/RankingTab'
import { InventoryTab } from './reports/InventoryTab'
import { MermasTab }    from './reports/MermasTab'
import { ExpiryTab }    from './reports/ExpiryTab'
import { CashTab }      from './reports/CashTab'
import { InvoicesTab }  from './reports/InvoicesTab'
import { HourlyTab }    from './reports/HourlyTab'

const TABS = [
  { id: 'summary',   label: 'Resumen',      icon: TrendingUp,  component: SummaryTab },
  { id: 'payment',   label: 'Pago',         icon: CreditCard,  component: PaymentTab },
  { id: 'ranking',   label: 'Ranking',      icon: Trophy,      component: RankingTab },
  { id: 'inventory', label: 'Inventario',   icon: Package,     component: InventoryTab },
  { id: 'mermas',    label: 'Mermas',       icon: Scissors,    component: MermasTab },
  { id: 'expiry',    label: 'Vencimientos', icon: CalendarX,   component: ExpiryTab },
  { id: 'cash',      label: 'Caja',         icon: Wallet,      component: CashTab },
  { id: 'invoices',  label: 'Facturas',     icon: FileText,    component: InvoicesTab },
  { id: 'hourly',    label: 'Por hora',     icon: Clock,       component: HourlyTab },
]

export function ReportsView() {
  const [activeTab, setActiveTab] = useState('summary')
  const [reloadKey, setReloadKey] = useState(0)

  const bump = useCallback(() => setReloadKey(k => k + 1), [])

  useEffect(() => {
    // Recargar cuando llega una nueva venta
    const api = (window as any).posAPI
    api.on('new-order', bump)

    // Recargar cuando el usuario vuelve a la ventana
    const onVisible = () => { if (document.visibilityState === 'visible') bump() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      api.off('new-order', bump)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [bump])

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? SummaryTab

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-gray-800 px-5 pt-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all border-b-2',
                  isActive
                    ? 'bg-gray-900 text-white border-red-500'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-900/50'
                )}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-5xl mx-auto">
          <ActiveComponent key={`${activeTab}-${reloadKey}`} />
        </div>
      </div>
    </div>
  )
}
