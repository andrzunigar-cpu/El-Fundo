import React, { useEffect, useState, useCallback } from 'react'
import { Plus, FileText, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { DateRangeFilter, formatCLP, formatDateShort, todayISO, daysAgoISO } from './shared'

export function InventoryPurchasesTab() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [from, setFrom] = useState(daysAgoISO(30))
  const [to, setTo] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [viewing, setViewing] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const api = (window as any).posAPI
    const data = await api.inventory.listPurchases({ from, to })
    setPurchases(data)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const total = purchases.reduce((s, p) => s + Number(p.total), 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Ingresar factura
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-800">
        <Stat label="Facturas del período" value={purchases.length} />
        <Stat label="Total comprado" value={formatCLP(total)} highlight />
        <Stat label="Promedio por factura" value={purchases.length ? formatCLP(total / purchases.length) : '$0'} />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : purchases.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin facturas en el período</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-3 px-3">N° factura</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Proveedor</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">IVA</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-900">
                  <td className="py-3 px-3 font-mono text-xs">{p.invoice_number}</td>
                  <td className="py-3 px-3 text-gray-400">{formatDateShort(p.invoice_date)}</td>
                  <td className="py-3 px-3 font-medium">{p.supplier_name}</td>
                  <td className="py-3 px-3 text-center text-gray-400">{p.item_count}</td>
                  <td className="py-3 px-3 text-right text-gray-400">{formatCLP(p.subtotal)}</td>
                  <td className="py-3 px-3 text-right text-gray-400">{formatCLP(p.tax)}</td>
                  <td className="py-3 px-3 text-right font-bold">{formatCLP(p.total)}</td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => setViewing(p)} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && <NewPurchaseModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load() }} />}
      {viewing && <PurchaseDetailModal id={viewing.id} onClose={() => setViewing(null)} />}
    </div>
  )
}

function NewPurchaseModal({ onClose, onSaved }: any) {
  const [supplier, setSupplier] = useState('')
  const [supplierRut, setSupplierRut] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const api = (window as any).posAPI
    api.products.getAll().then(setProducts)
  }, [])

  const addItem = () => setItems([...items, { productId: '', productName: '', quantity: '', unitCost: '', subtotal: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, patch: any) => {
    setItems(items.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, ...patch }
      const q = parseFloat(updated.quantity) || 0
      const c = parseFloat(updated.unitCost) || 0
      updated.subtotal = Math.round(q * c)
      return updated
    }))
  }

  const subtotal = items.reduce((s, i) => s + (i.subtotal || 0), 0)
  const tax = Math.round(subtotal * 0.19)
  const total = subtotal + tax

  const submit = async () => {
    if (!supplier || !invoiceNumber || items.length === 0) {
      toast.error('Completa proveedor, N° factura y al menos un ítem')
      return
    }
    const validItems = items.filter(i => i.productId && i.quantity)
    if (validItems.length === 0) { toast.error('Agrega productos con cantidad'); return }

    setSaving(true)
    const api = (window as any).posAPI
    try {
      await api.inventory.registerPurchase({
        supplierName: supplier,
        supplierRut,
        invoiceNumber,
        invoiceDate,
        notes,
        items: validItems.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: parseFloat(i.quantity),
          unitCost: parseInt(i.unitCost, 10) || 0,
          subtotal: i.subtotal,
        })),
        tax,
        total,
      })
      toast.success('Factura ingresada y stock actualizado')
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 rounded-xl w-[900px] max-h-[90vh] border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold">Ingresar factura de compra</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proveedor">
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Carnes del Sur SpA"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
            <Field label="RUT proveedor">
              <input value={supplierRut} onChange={e => setSupplierRut(e.target.value)} placeholder="76.123.456-7"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
            <Field label="N° factura">
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="F-12345"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
            <Field label="Fecha factura">
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">Productos comprados</h3>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                <Plus className="w-3 h-3" /> Agregar producto
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-6 text-sm border border-dashed border-gray-800 rounded-lg">
                Click en "Agregar producto" para comenzar
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                    <th className="py-2">Producto</th>
                    <th className="py-2 w-24 text-right">Cantidad</th>
                    <th className="py-2 w-28 text-right">Costo unit.</th>
                    <th className="py-2 w-28 text-right">Subtotal</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-b border-gray-800/40">
                      <td className="py-2 pr-2">
                        <select
                          value={it.productId}
                          onChange={e => {
                            const p = products.find(p => p.id === e.target.value)
                            updateItem(idx, { productId: e.target.value, productName: p?.name || '' })
                          }}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
                        >
                          <option value="">Selecciona...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" step="0.01" value={it.quantity} onChange={e => updateItem(idx, { quantity: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-red-500" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={it.unitCost} onChange={e => updateItem(idx, { unitCost: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-red-500" />
                      </td>
                      <td className="py-2 pr-2 text-right text-sm font-medium">{formatCLP(it.subtotal)}</td>
                      <td className="text-center">
                        <button onClick={() => removeItem(idx)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Field label="Notas (opcional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none" />
          </Field>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>{formatCLP(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">IVA (19%)</span><span>{formatCLP(tax)}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-700"><span>Total</span><span>{formatCLP(total)}</span></div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Confirmar factura y actualizar stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PurchaseDetailModal({ id, onClose }: any) {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    const api = (window as any).posAPI
    api.inventory.getPurchase(id).then(setData)
  }, [id])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 rounded-xl w-[700px] max-h-[85vh] border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold">Factura {data?.invoice_number}</h2>
            <p className="text-sm text-gray-400">{data?.supplier_name}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        {data && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div><span className="text-gray-500">Fecha:</span> {formatDateShort(data.invoice_date)}</div>
              <div><span className="text-gray-500">RUT:</span> {data.supplier_rut || '—'}</div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-800">
                  <th className="py-2">Producto</th>
                  <th className="py-2 text-right">Cant.</th>
                  <th className="py-2 text-right">Costo</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((it: any) => (
                  <tr key={it.id} className="border-b border-gray-800/40">
                    <td className="py-2">{it.product_name}</td>
                    <td className="py-2 text-right">{Number(it.quantity).toFixed(2)}</td>
                    <td className="py-2 text-right">{formatCLP(it.unit_cost)}</td>
                    <td className="py-2 text-right font-medium">{formatCLP(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>{formatCLP(data.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">IVA</span><span>{formatCLP(data.tax)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-700"><span>Total</span><span>{formatCLP(data.total)}</span></div>
            </div>

            {data.notes && <div className="mt-3 text-sm text-gray-400 italic">"{data.notes}"</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function Stat({ label, value, highlight }: any) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-green-950/30 border-green-900' : 'bg-gray-900 border-gray-800'}`}>
      <div className="text-[10px] uppercase text-gray-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
