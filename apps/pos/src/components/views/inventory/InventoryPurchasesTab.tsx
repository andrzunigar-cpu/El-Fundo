import React, { useEffect, useState, useCallback } from 'react'
import { Plus, FileText, X, Trash2, UserPlus, Check, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { DateRangeFilter, formatCLP, formatDateShort, todayISO, daysAgoISO } from './shared'
import { NewProductModal } from '../ProductsView'

const DOC_TYPES = [
  { value: 'factura',      label: 'Factura',              preIva: true,  color: 'bg-blue-900/40 text-blue-400'    },
  { value: 'guia_despacho', label: 'Guía de despacho',    preIva: false, color: 'bg-purple-900/40 text-purple-400' },
  { value: 'boleta',       label: 'Boleta',               preIva: false, color: 'bg-yellow-900/40 text-yellow-400' },
  { value: 'sin_respaldo', label: 'Compra sin respaldo',  preIva: false, color: 'bg-gray-800 text-gray-400'       },
]
const docLabel = (v: string) => DOC_TYPES.find(d => d.value === v) ?? DOC_TYPES[0]

export function InventoryPurchasesTab({ autoOpenNew = false }: { autoOpenNew?: boolean }) {
  const [purchases, setPurchases] = useState<any[]>([])
  const [from, setFrom] = useState(todayISO())
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

  // Abrir modal automáticamente si viene del acceso directo
  useEffect(() => { if (autoOpenNew) setShowNew(true) }, [])

  const total = purchases.reduce((s, p) => s + Number(p.total), 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Ingresar documento
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
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">N° documento</th>
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
                  <td className="py-3 px-3">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', docLabel(p.document_type).color)}>
                      {docLabel(p.document_type).label}
                    </span>
                  </td>
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
  const [documentType, setDocumentType] = useState('factura')
  const [supplier, setSupplier] = useState('')
  const [supplierRut, setSupplierRut] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [formats, setFormats]     = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  // Quick-add supplier
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [qaName, setQaName] = useState('')
  const [qaRut, setQaRut] = useState('')
  const [qaPhone, setQaPhone] = useState('')
  const [qaSaving, setQaSaving] = useState(false)
  // Crear producto (popup completo)
  const [showNewProduct, setShowNewProduct] = useState(false)
  // Impuesto adicional editable
  const [additionalTaxPct, setAdditionalTaxPct] = useState<string>('0')

  useEffect(() => {
    const api = (window as any).posAPI
    api.products.getAll().then(setProducts)
    api.suppliers.getAll().then((s: any[]) => setSuppliers(s.filter(x => x.status === 'active')))
    api.formats.getAll().then(setFormats)
  }, [])

  const handleSupplierSelect = (id: string) => {
    setSupplierId(id)
    if (!id) { setSupplier(''); setSupplierRut(''); return }
    const s = suppliers.find(x => x.id === id)
    if (s) { setSupplier(s.name); setSupplierRut(s.rut || '') }
  }

  const saveQuickSupplier = async () => {
    if (!qaName.trim()) { toast.error('Ingresa el nombre del proveedor'); return }
    setQaSaving(true)
    const api = (window as any).posAPI
    try {
      const res = await api.suppliers.create({ name: qaName.trim(), rut: qaRut.trim(), phone: qaPhone.trim() })
      const fresh = await api.suppliers.getAll()
      const active = fresh.filter((x: any) => x.status === 'active')
      setSuppliers(active)
      handleSupplierSelect(res.id)
      setShowQuickAdd(false)
      setQaName(''); setQaRut(''); setQaPhone('')
      toast.success(`Proveedor "${qaName}" creado`)
    } catch (err: any) {
      toast.error(err.message || 'Error al crear proveedor')
    } finally { setQaSaving(false) }
  }

  const addItem = () => setItems([...items, { productId: '', productName: '', quantity: '', unitCost: '', subtotal: 0, expiryDate: '' }])
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

  const subtotal      = items.reduce((s, i) => s + (i.subtotal || 0), 0)
  const tax           = Math.round(subtotal * 0.19)
  const additionalTax = Math.round(subtotal * (parseFloat(additionalTaxPct) || 0) / 100)
  const total         = subtotal + tax + additionalTax

  const submit = async () => {
    if (!supplier || !invoiceNumber || items.length === 0) {
      toast.error('Completa proveedor, N° documento y al menos un ítem')
      return
    }
    const validItems = items.filter(i => i.productId && i.quantity)
    if (validItems.length === 0) { toast.error('Agrega productos con cantidad'); return }
    const missingExpiry = validItems.filter(i => !i.expiryDate)
    if (missingExpiry.length > 0) {
      toast.error(`Falta fecha de vencimiento en ${missingExpiry.length === 1 ? '1 producto' : `${missingExpiry.length} productos`}`)
      return
    }

    setSaving(true)
    const api = (window as any).posAPI
    try {
      await api.inventory.registerPurchase({
        documentType,
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
          expiryDate: i.expiryDate,
        })),
        tax,
        additionalTax,
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
          <h2 className="text-xl font-bold">Ingresar documento de compra</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tipo de documento */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Tipo de documento</label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map(d => (
                <button key={d.value} type="button" onClick={() => setDocumentType(d.value)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    documentType === d.value
                      ? clsx(d.color, 'border-current')
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                  )}>
                  {d.label}
                  {d.preIva && <span className="ml-1 opacity-60 text-[10px]">· IVA crédito</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              {/* Label con botón crear proveedor */}
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-400">Proveedor</label>
                <button
                  type="button"
                  onClick={() => { setShowQuickAdd(v => !v); setQaName(''); setQaRut(''); setQaPhone('') }}
                  className={clsx(
                    'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors',
                    showQuickAdd
                      ? 'bg-green-900/40 text-green-400'
                      : 'text-gray-500 hover:text-green-400 hover:bg-green-900/20'
                  )}
                >
                  <UserPlus className="w-3 h-3" />
                  Crear proveedor
                </button>
              </div>

              {/* Mini-formulario crear proveedor */}
              {showQuickAdd && (
                <div className="mb-2 p-3 bg-green-950/30 border border-green-800/40 rounded-lg space-y-2">
                  <input
                    value={qaName} onChange={e => setQaName(e.target.value)} autoFocus
                    placeholder="Nombre *"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={qaRut} onChange={e => setQaRut(e.target.value)}
                      placeholder="RUT (opcional)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                    />
                    <input
                      value={qaPhone} onChange={e => setQaPhone(e.target.value)}
                      placeholder="Teléfono (opcional)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveQuickSupplier} disabled={qaSaving || !qaName.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm font-medium"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {qaSaving ? 'Guardando...' : 'Guardar y seleccionar'}
                    </button>
                    <button onClick={() => setShowQuickAdd(false)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <select value={supplierId} onChange={e => handleSupplierSelect(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                <option value="">— Sin proveedor —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}{s.rut ? ` (${s.rut})` : ''}</option>)}
              </select>
              {!supplierId && (
                <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="O ingresa manualmente..."
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
              )}
            </div>
            <Field label="RUT proveedor">
              <input value={supplierRut} onChange={e => setSupplierRut(e.target.value)} placeholder="76.123.456-7"
                readOnly={!!supplierId}
                className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 ${supplierId ? 'text-gray-500 cursor-not-allowed' : ''}`} />
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewProduct(true)}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded
                             text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                >
                  <Package className="w-3 h-3" />
                  Crear producto
                </button>
                <button onClick={addItem} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                  <Plus className="w-3 h-3" /> Agregar fila
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <button
                onClick={addItem}
                className="w-full py-8 border border-dashed border-gray-700 rounded-lg
                           flex flex-col items-center gap-2 text-gray-500
                           hover:border-red-500/50 hover:bg-red-950/10 hover:text-red-400
                           transition-all cursor-pointer group"
              >
                <Plus className="w-8 h-8 opacity-40 group-hover:opacity-80 transition-opacity" />
                <span className="text-sm">Agregar primer producto</span>
              </button>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                    <th className="py-2">Producto</th>
                    <th className="py-2 w-24 text-right">Cantidad</th>
                    <th className="py-2 w-28 text-right">Costo unit.</th>
                    <th className="py-2 w-36">
                      <span className="text-orange-400">Vto.</span>
                      <span className="text-red-500 ml-0.5">*</span>
                    </th>
                    <th className="py-2 w-28 text-right">Subtotal</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const prod = products.find(p => p.id === it.productId)
                    const unit = prod?.requires_weight ? 'kg' : prod ? 'un' : ''
                    return (
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
                        <div className="flex items-center gap-1">
                          <input type="number" step="0.01" value={it.quantity} onChange={e => updateItem(idx, { quantity: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-red-500" />
                          {unit && <span className="text-xs text-gray-500 whitespace-nowrap">{unit}</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={it.unitCost} onChange={e => updateItem(idx, { unitCost: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-red-500" />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="date"
                          value={it.expiryDate}
                          onChange={e => updateItem(idx, { expiryDate: e.target.value })}
                          className={clsx(
                            'w-full bg-gray-800 border rounded px-2 py-1 text-sm focus:outline-none transition-colors',
                            it.expiryDate
                              ? 'border-gray-600 text-white focus:border-orange-400'
                              : 'border-red-700/60 text-gray-500 focus:border-red-500'
                          )}
                        />
                      </td>
                      <td className="py-2 pr-2 text-right text-sm font-medium">{formatCLP(it.subtotal)}</td>
                      <td className="text-center">
                        <button onClick={() => removeItem(idx)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>

          <Field label="Notas (opcional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none" />
          </Field>

          {/* ── Estado de Resultado ── */}
          <div className="rounded-xl border border-gray-700 overflow-hidden text-sm">
            <div className="bg-gray-800 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estado de Resultado</span>
            </div>
            <div className="bg-gray-900/60 px-4 py-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Base imponible (Neto)</span>
                <span className="font-mono">{formatCLP(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">IVA (19%)</span>
                <span className="font-mono text-yellow-300">{formatCLP(tax)}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <span>Imp. adicional</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0" max="100" step="0.5"
                      value={additionalTaxPct}
                      onChange={e => setAdditionalTaxPct(e.target.value)}
                      className="w-16 bg-gray-800 border border-amber-700/60 rounded px-2 py-0.5 text-right text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
                <span className={clsx('font-mono', additionalTax > 0 ? 'text-orange-300' : 'text-gray-600')}>
                  {formatCLP(additionalTax)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-700/60">
                <span className="font-bold text-base">Total a pagar</span>
                <span className="font-bold text-lg text-white font-mono">{formatCLP(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Confirmar documento y actualizar stock'}
          </button>
        </div>
      </div>

      {/* Popup crear producto — se abre sobre este modal */}
      {showNewProduct && (
        <NewProductModal
          formats={formats}
          onClose={() => setShowNewProduct(false)}
          onSaved={async () => {
            const api = (window as any).posAPI
            const fresh = await api.products.getAll()
            setProducts(fresh)
            setShowNewProduct(false)
            toast.success('Producto creado — ya disponible en el listado')
          }}
        />
      )}
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
            <div className="flex items-center gap-2 mb-0.5">
              {data && <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', docLabel(data.document_type).color)}>
                {docLabel(data.document_type).label}
              </span>}
            </div>
            <h2 className="text-xl font-bold">{data?.invoice_number}</h2>
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
