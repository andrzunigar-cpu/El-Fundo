import React, { useState } from 'react'
import { Boxes, ClipboardList, FileText, Trash2, History, LayoutDashboard } from 'lucide-react'
import { clsx } from 'clsx'
import { InventorySummaryTab } from './inventory/InventorySummaryTab'
import { InventoryStockTab } from './inventory/InventoryStockTab'
import { InventoryCountsTab } from './inventory/InventoryCountsTab'
import { InventoryPurchasesTab } from './inventory/InventoryPurchasesTab'
import { InventoryConsumptionsTab } from './inventory/InventoryConsumptionsTab'
import { InventoryMovementsTab } from './inventory/InventoryMovementsTab'

type Tab = 'summary' | 'stock' | 'counts' | 'purchases' | 'consumptions' | 'movements'

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'summary',      label: 'Resumen',      icon: LayoutDashboard },
  { id: 'stock',        label: 'Stock actual', icon: Boxes },
  { id: 'counts',       label: 'Tomas',        icon: ClipboardList },
  { id: 'purchases',    label: 'Compras',      icon: FileText },
  { id: 'consumptions', label: 'Consumos',     icon: Trash2 },
  { id: 'movements',    label: 'Movimientos',  icon: History },
]

export function InventoryView() {
  const [tab, setTab] = useState<Tab>('summary')

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Inventario</h1>
      </div>

      <div className="flex border-b border-gray-800 bg-gray-900/40">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all',
              tab === id
                ? 'border-red-500 text-white bg-gray-900'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-900/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'summary'      && <InventorySummaryTab />}
        {tab === 'stock'        && <InventoryStockTab />}
        {tab === 'counts'       && <InventoryCountsTab />}
        {tab === 'purchases'    && <InventoryPurchasesTab />}
        {tab === 'consumptions' && <InventoryConsumptionsTab />}
        {tab === 'movements'    && <InventoryMovementsTab />}
      </div>
    </div>
  )
}
