import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Section, EmptyState, fmt, fmtN } from './shared'

export function InventoryTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'products' | 'supplier'>('products')

  useEffect(() => {
    const api = (window as any).posAPI
    api.reports.inventoryDiff().then((r: any) => { setData(r); setLoading(false) })
  }, [])

  const products: any[] = data?.products ?? []
  const bySupplier: any[] = data?.bySupplier ?? []
  const withDiff = products.filter(p => Math.abs(p.diff) > 0.01)

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['products', 'supplier'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              view === v ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
            {v === 'products' ? 'Teórico vs Real' : 'Por proveedor'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center text-gray-500 py-12">Cargando...</div> : (
        view === 'products' ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-[10px] uppercase text-gray-500 mb-2">Total productos activos</p>
                <p className="text-3xl font-black">{products.length}</p>
              </div>
              <div className="bg-orange-950/30 border border-orange-900 rounded-2xl p-5">
                <p className="text-[10px] uppercase text-gray-500 mb-2">Con diferencia</p>
                <p className="text-3xl font-black text-orange-400">{withDiff.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-[10px] uppercase text-gray-500 mb-2">Último conteo registrado</p>
                <p className="text-sm font-medium mt-2 text-gray-300">
                  {products.find(p => p.last_count_date)?.last_count_date
                    ? new Date(products.find(p => p.last_count_date).last_count_date).toLocaleDateString('es-CL')
                    : 'Sin conteos aún'}
                </p>
              </div>
            </div>

            <Section title="Inventario teórico vs stock actual">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5">Producto</th>
                    <th className="py-2.5 text-right">Teórico*</th>
                    <th className="py-2.5 text-right">Actual</th>
                    <th className="py-2.5 text-right text-emerald-500">Entradas</th>
                    <th className="py-2.5 text-right text-orange-400">Salidas</th>
                    <th className="py-2.5 text-right">Diferencia</th>
                    <th className="py-2.5 text-right">Último conteo</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const diff = Number(p.diff)
                    const dec = p.requires_weight ? 2 : 0
                    return (
                      <tr key={p.id} className={clsx('border-b border-gray-800/40 hover:bg-gray-900/40',
                        Math.abs(diff) > 0.01 && 'bg-orange-950/10')}>
                        <td className="py-2.5 font-mono text-xs text-gray-400">{p.sku}</td>
                        <td className="py-2.5 font-medium">{p.name}</td>
                        <td className="py-2.5 text-right text-gray-400">{fmtN(p.theoretical_stock, dec)}</td>
                        <td className="py-2.5 text-right font-medium">{fmtN(p.current_stock, dec)}</td>
                        <td className="py-2.5 text-right text-emerald-400 font-medium">
                          {p.total_entradas > 0 ? `+${fmtN(p.total_entradas, dec)}` : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="py-2.5 text-right text-orange-400 font-medium">
                          {p.total_salidas > 0 ? fmtN(p.total_salidas, dec) : <span className="text-gray-600">—</span>}
                        </td>
                        <td className={clsx('py-2.5 text-right font-bold',
                          Math.abs(diff) < 0.01 ? 'text-green-400' : diff > 0 ? 'text-blue-400' : 'text-red-400')}>
                          {Math.abs(diff) < 0.01 ? '✓' : `${diff > 0 ? '+' : ''}${fmtN(diff, dec)}`}
                        </td>
                        <td className="py-2.5 text-right text-xs text-gray-500">
                          {p.last_count_date
                            ? `${fmtN(p.last_counted, dec)} · ${new Date(p.last_count_date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}`
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-600 mt-3">* Teórico = suma acumulada de todos los movimientos registrados en el sistema</p>
            </Section>
          </>
        ) : (
          <Section title="Stock por proveedor (facturas ingresadas)">
            {bySupplier.length === 0 ? <EmptyState msg="Sin facturas ingresadas" /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                    <th className="py-2.5">Proveedor</th>
                    <th className="py-2.5 text-right">Facturas</th>
                    <th className="py-2.5 text-right">Productos</th>
                    <th className="py-2.5 text-right">Qty total</th>
                    <th className="py-2.5 text-right">Costo total</th>
                  </tr>
                </thead>
                <tbody>
                  {bySupplier.map((s: any) => (
                    <tr key={s.supplier_name} className="border-b border-gray-800/40 hover:bg-gray-900/40">
                      <td className="py-3 font-medium">{s.supplier_name}</td>
                      <td className="py-3 text-right text-gray-400">{s.invoice_count}</td>
                      <td className="py-3 text-right text-gray-400">{s.product_count}</td>
                      <td className="py-3 text-right">{fmtN(s.total_qty, 1)}</td>
                      <td className="py-3 text-right font-bold">{fmt(s.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        )
      )}
    </div>
  )
}
