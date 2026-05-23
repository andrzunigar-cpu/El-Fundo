import React, { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { DateRangeBar, Section, EmptyState, fmt, fmtN, today, daysAgo } from './shared'

export function InvoicesTab() {
  const [from, setFrom] = useState(today())
  const [to,   setTo]   = useState(today())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<'invoices' | 'supplier'>('invoices')

  const load = useCallback(async () => {
    setLoading(true)
    const r = await (window as any).posAPI.reports.invoicesReport(from, to)
    setData(r)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const invoices: any[] = data?.invoices ?? []
  const bySupplier: any[] = data?.bySupplier ?? []
  const totalCost = invoices.reduce((s: number, r: any) => s + (r.total_cost ?? 0), 0)
  const totalQty  = invoices.reduce((s: number, r: any) => s + (r.total_qty ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DateRangeBar from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
        <div className="flex gap-2">
          {(['invoices', 'supplier'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold',
                view === v ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
              {v === 'invoices' ? 'Por documento' : 'Por proveedor'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center text-gray-500 py-12">Cargando...</div> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Documentos ingresados</p>
              <p className="text-3xl font-black">{invoices.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Total compras</p>
              <p className="text-3xl font-black text-blue-400">{fmt(totalCost)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Cantidad total ingresada</p>
              <p className="text-3xl font-black">{fmtN(totalQty, 1)}</p>
              <p className="text-xs text-gray-500 mt-1">unidades / kg</p>
            </div>
          </div>

          {view === 'invoices' ? (
            <Section title="Guías y facturas">
              {invoices.length === 0 ? <EmptyState msg="Sin documentos en el período" /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                      <th className="py-2.5">Fecha</th>
                      <th className="py-2.5">Proveedor</th>
                      <th className="py-2.5">N° documento</th>
                      <th className="py-2.5 text-right">Productos</th>
                      <th className="py-2.5 text-right">Cantidad</th>
                      <th className="py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => {
                      const isExp = expanded === String(inv.id)
                      return (
                        <React.Fragment key={inv.id}>
                          <tr
                            className="border-b border-gray-800/40 hover:bg-gray-900/40 cursor-pointer"
                            onClick={() => setExpanded(isExp ? null : String(inv.id))}>
                            <td className="py-3">
                              {new Date(inv.invoice_date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="py-3 font-medium">{inv.supplier_name || '—'}</td>
                            <td className="py-3 text-gray-400 font-mono text-xs">{inv.invoice_number || '—'}</td>
                            <td className="py-3 text-right text-gray-400">{inv.product_count}</td>
                            <td className="py-3 text-right">{fmtN(inv.total_qty, 1)}</td>
                            <td className="py-3 text-right font-bold text-blue-400">{fmt(inv.total_cost)}</td>
                          </tr>
                          {isExp && inv.items && (
                            <tr className="border-b border-gray-800/40 bg-gray-900/30">
                              <td colSpan={6} className="px-4 py-3">
                                <p className="text-xs text-gray-400 uppercase mb-2 font-semibold">Detalle de productos</p>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-500 border-b border-gray-700">
                                      <th className="pb-1 text-left">SKU</th>
                                      <th className="pb-1 text-left">Producto</th>
                                      <th className="pb-1 text-right">Cantidad</th>
                                      <th className="pb-1 text-right">Costo unit.</th>
                                      <th className="pb-1 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(inv.items as any[]).map((item: any, i: number) => (
                                      <tr key={i} className="border-b border-gray-700/30">
                                        <td className="py-1.5 font-mono text-gray-500">{item.sku}</td>
                                        <td className="py-1.5">{item.product_name}</td>
                                        <td className="py-1.5 text-right">
                                          {fmtN(item.quantity, item.requires_weight ? 2 : 0)}
                                          <span className="text-gray-500 ml-1">{item.requires_weight ? 'kg' : 'un'}</span>
                                        </td>
                                        <td className="py-1.5 text-right text-gray-400">{item.cost_per_unit ? fmt(item.cost_per_unit) : '—'}</td>
                                        <td className="py-1.5 text-right font-medium">{item.cost_per_unit ? fmt(item.quantity * item.cost_per_unit) : '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Section>
          ) : (
            <Section title="Resumen por proveedor">
              {bySupplier.length === 0 ? <EmptyState msg="Sin datos de proveedores" /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                      <th className="py-2.5">Proveedor</th>
                      <th className="py-2.5 text-right">Facturas</th>
                      <th className="py-2.5 text-right">Productos distintos</th>
                      <th className="py-2.5 text-right">Qty total</th>
                      <th className="py-2.5 text-right">Costo total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bySupplier.map((s: any) => (
                      <tr key={s.supplier_name} className="border-b border-gray-800/40 hover:bg-gray-900/40">
                        <td className="py-3 font-medium">{s.supplier_name || 'Sin proveedor'}</td>
                        <td className="py-3 text-right text-gray-400">{s.invoice_count}</td>
                        <td className="py-3 text-right text-gray-400">{s.product_count}</td>
                        <td className="py-3 text-right">{fmtN(s.total_qty, 1)}</td>
                        <td className="py-3 text-right font-bold text-blue-400">{fmt(s.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  )
}
