import React, { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Minus, X, Sparkles, History, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { MovementBadge, formatDate } from './shared'

const CATS = [
  { id: '',                label: 'Todos',      color: 'gray'   },
  { id: 'cat-vacuno',      label: 'Vacuno',     color: 'red'    },
  { id: 'cat-cerdo',       label: 'Cerdo',      color: 'orange' },
  { id: 'cat-cordero',     label: 'Cordero',    color: 'amber'  },
  { id: 'cat-pollo',       label: 'Pollo',      color: 'yellow' },
  { id: 'cat-embutidos',   label: 'Embutidos',  color: 'pink'   },
  { id: 'cat-parrilla',    label: 'Parrilla',   color: 'rose'   },
  { id: 'cat-congelados',  label: 'Congelados', color: 'cyan'   },
  { id: 'cat-bebidas',     label: 'Bebidas',    color: 'sky'    },
  { id: 'cat-otros',       label: 'Otros',      color: 'slate'  },
]

const CAT_ACTIVE: Record<string, string> = {
  gray:   'bg-gray-600 text-white',
  red:    'bg-red-600 text-white',
  orange: 'bg-orange-600 text-white',
  amber:  'bg-amber-500 text-white',
  yellow: 'bg-yellow-500 text-black',
  pink:   'bg-pink-600 text-white',
  rose:   'bg-rose-600 text-white',
  cyan:   'bg-cyan-600 text-white',
  sky:    'bg-sky-500 text-white',
  blue:   'bg-blue-600 text-white',
  slate:  'bg-slate-600 text-white',
}
const CAT_INACTIVE = 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'

export function InventoryStockTab() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState<any>(null)
  const [showInitial, setShowInitial] = useState(false)
  const [movementsProduct, setMovementsProduct] = useState<any>(null)

  const load = useCallback(async () => {
    const api = (window as any).posAPI
    const data = await api.inventory.getAllStock()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const api = (window as any).posAPI
    api.on('stock-updated', load)
    return () => api.off('stock-updated', load)
  }, [load])

  const filtered = items.filter(i =>
    (!activeCat || i.category_id === activeCat) &&
    (!search.trim() ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const outCount = items.filter(i => Number(i.quantity) <= 0).length
  const lowCount = items.filter(i => Number(i.quantity) > 0 && Number(i.quantity) < Number(i.min_stock)).length

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Alertas rápidas */}
        {(outCount > 0 || lowCount > 0) && (
          <div className="flex gap-2">
            {outCount > 0 && (
              <span className="text-xs bg-red-900/40 text-red-400 px-2.5 py-1 rounded-full font-medium">
                {outCount} agotado{outCount > 1 ? 's' : ''}
              </span>
            )}
            {lowCount > 0 && (
              <span className="text-xs bg-orange-900/40 text-orange-400 px-2.5 py-1 rounded-full font-medium">
                {lowCount} stock bajo
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => setShowInitial(true)}
          className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium text-sm"
        >
          <Sparkles className="w-4 h-4" /> Inventario inicial
        </button>
      </div>

      {/* Filtros categoría */}
      <div className="flex gap-2 px-4 py-2.5 border-b border-gray-800 flex-wrap">
        {CATS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-semibold transition-all',
              activeCat === cat.id ? CAT_ACTIVE[cat.color] : CAT_INACTIVE
            )}
          >
            {cat.label}
            {cat.id && (
              <span className="ml-1 opacity-60">
                ({items.filter(i => i.category_id === cat.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-16">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-950 z-10">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-right">Teórico</th>
                <th className="py-3 px-4 text-right text-green-500">Mov +</th>
                <th className="py-3 px-4 text-right text-red-500">Mov −</th>
                <th className="py-3 px-4 text-right">Diferencia</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Historial</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-600 py-16 text-sm">
                    Sin productos{activeCat ? ' en esta categoría' : ''}
                  </td>
                </tr>
              )}
              {filtered.map(item => {
                const qty      = Number(item.quantity)
                const movIn    = Number(item.mov_in  || 0)
                const movOut   = Number(item.mov_out || 0)
                const diff     = movIn - movOut          // neto movimientos
                const min      = Number(item.min_stock || 0)
                const status   = qty <= 0 ? 'out' : (min > 0 && qty < min) ? 'low' : 'ok'
                const movCount = Number(item.movement_count || 0)
                const dec      = item.requires_weight ? 2 : 0
                const unit     = item.requires_weight ? 'kg' : 'un'
                return (
                  <tr key={item.id} className="border-b border-gray-800/40 hover:bg-gray-900">
                    <td className="py-3 px-4 font-mono text-xs text-gray-400">{item.sku}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{item.name}</p>
                      {item.format_label && (
                        <p className="text-[10px] text-gray-500">{item.format_label}</p>
                      )}
                    </td>
                    {/* Teórico */}
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={clsx(
                        status === 'out' ? 'text-red-400' :
                        status === 'low' ? 'text-orange-400' : 'text-white'
                      )}>
                        {qty.toFixed(dec)}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">{unit}</span>
                    </td>
                    {/* Mov + */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-green-400">
                      {movIn > 0 ? `+${movIn.toFixed(dec)}` : <span className="text-gray-700">—</span>}
                    </td>
                    {/* Mov − */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-red-400">
                      {movOut > 0 ? `-${movOut.toFixed(dec)}` : <span className="text-gray-700">—</span>}
                    </td>
                    {/* Diferencia */}
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      <span className={clsx(
                        diff > 0 ? 'text-sky-300' :
                        diff < 0 ? 'text-red-400' : 'text-gray-600'
                      )}>
                        {movCount > 0 ? diff.toFixed(dec) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        status === 'out' ? 'bg-red-900/40 text-red-400' :
                        status === 'low' ? 'bg-orange-900/40 text-orange-400' :
                        'bg-green-900/40 text-green-400'
                      )}>
                        {status === 'out' ? 'Agotado' : status === 'low' ? 'Bajo' : 'OK'}
                      </span>
                    </td>

                    {/* ── Columna Movimientos ── */}
                    <td className="py-3 px-4 text-center">
                      {movCount > 0 ? (
                        <button
                          onClick={() => setMovementsProduct(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                                     bg-gray-800 hover:bg-indigo-900/60 hover:text-indigo-300
                                     text-gray-400 text-xs font-medium transition-colors group"
                          title={`Ver ${movCount} movimientos`}
                        >
                          <History className="w-3 h-3" />
                          {movCount}
                          <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setAdjusting(item)}
                        className="px-3 py-1 bg-gray-800 hover:bg-red-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        Ajustar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {adjusting && (
        <AdjustModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => { setAdjusting(null); load() }}
        />
      )}
      {showInitial && (
        <InitialInventoryModal
          items={items}
          onClose={() => setShowInitial(false)}
          onSaved={() => { setShowInitial(false); load() }}
        />
      )}
      {movementsProduct && (
        <ProductMovementsModal
          product={movementsProduct}
          onClose={() => setMovementsProduct(null)}
        />
      )}
    </div>
  )
}

// ── Modal movimientos por producto ──────────────────────────────────────────
const TYPE_FILTERS = [
  { id: '',                 label: 'Todos' },
  { id: 'sale',             label: 'Ventas' },
  { id: 'purchase',         label: 'Compras' },
  { id: 'consumption',      label: 'Merma' },
  { id: 'adjustment',       label: 'Ajustes' },
  { id: 'count_adjustment', label: 'Toma inventario' },
  { id: 'initial',          label: 'Inicial' },
]

function ProductMovementsModal({ product, onClose }: { product: any; onClose: () => void }) {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const api = (window as any).posAPI
    api.inventory.getMovements({ productId: product.id, limit: 500 }).then((data: any[]) => {
      setMovements(data)
      setLoading(false)
    })
  }, [product.id])

  const filtered = typeFilter ? movements.filter(m => m.type === typeFilter) : movements

  // Resumen por tipo
  const summary = movements.reduce((acc: Record<string, { count: number; qty: number }>, m) => {
    if (!acc[m.type]) acc[m.type] = { count: 0, qty: 0 }
    acc[m.type].count++
    acc[m.type].qty += Number(m.quantity)
    return acc
  }, {})

  const unit = product.requires_weight ? 'kg' : 'un'
  const fmtQty = (q: number) => (q >= 0 ? '+' : '') + q.toFixed(product.requires_weight ? 2 : 0)

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-3xl max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold">Movimientos de stock</h2>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{product.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Stock actual: <span className="font-bold text-white">
                {Number(product.quantity).toFixed(product.requires_weight ? 2 : 0)} {unit}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen por tipo */}
        {!loading && movements.length > 0 && (
          <div className="flex gap-2 px-5 py-3 border-b border-gray-800 flex-wrap">
            {Object.entries(summary).map(([type, s]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(prev => prev === type ? '' : type)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                  typeFilter === type
                    ? 'border-indigo-500 bg-indigo-900/40 text-indigo-300'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                )}
              >
                <MovementBadge type={type} />
                <span className="text-gray-300">{s.count}</span>
                <span className={s.qty >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {fmtQty(s.qty)} {unit}
                </span>
              </button>
            ))}
            {typeFilter && (
              <button
                onClick={() => setTypeFilter('')}
                className="px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:text-white bg-gray-800 border border-gray-700"
              >
                <X className="w-3 h-3 inline mr-1" />Quitar filtro
              </button>
            )}
          </div>
        )}

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-500 py-16">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-600 py-16">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin movimientos{typeFilter ? ' de este tipo' : ''}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-950 z-10">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4 text-right">Cantidad</th>
                  <th className="py-2.5 px-4 text-right">Antes</th>
                  <th className="py-2.5 px-4 text-center">→</th>
                  <th className="py-2.5 px-4 text-right">Después</th>
                  <th className="py-2.5 px-4">Referencia / Nota</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const qty = Number(m.quantity)
                  return (
                    <tr key={m.id} className="border-b border-gray-800/40 hover:bg-gray-900/60">
                      <td className="py-2.5 px-4 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="py-2.5 px-4">
                        <MovementBadge type={m.type} />
                      </td>
                      <td className={clsx(
                        'py-2.5 px-4 text-right font-bold font-mono',
                        qty >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {fmtQty(qty)} {unit}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-500 font-mono text-xs">
                        {Number(m.quantity_before).toFixed(product.requires_weight ? 2 : 0)}
                      </td>
                      <td className="py-2.5 px-4 text-center text-gray-700 text-xs">→</td>
                      <td className="py-2.5 px-4 text-right text-gray-300 font-mono font-medium text-xs">
                        {Number(m.quantity_after).toFixed(product.requires_weight ? 2 : 0)}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-400 max-w-[200px] truncate" title={m.notes || ''}>
                        {m.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-500">{filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal ajuste ────────────────────────────────────────────────────────────
function AdjustModal({ product, onClose, onSaved }: any) {
  const [mode, setMode] = useState<'add' | 'subtract' | 'set'>('add')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const q = parseFloat(quantity)
    if (isNaN(q) || q <= 0) { toast.error('Cantidad inválida'); return }
    setSaving(true)
    const api = (window as any).posAPI
    const delta = mode === 'add' ? q : mode === 'subtract' ? -q : (q - Number(product.quantity))
    try {
      await api.inventory.adjust(product.id, delta, notes || `Ajuste manual (${mode})`)
      toast.success('Stock actualizado')
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-[480px] border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Ajustar stock</h2>
            <p className="text-sm text-gray-400 mt-0.5">{product.name}</p>
            <p className="text-xs text-gray-500">
              Actual: {Number(product.quantity).toFixed(product.requires_weight ? 2 : 0)}
              {product.requires_weight ? ' kg' : ' un'}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['add', 'subtract', 'set'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                'py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
                mode === m
                  ? m === 'add' ? 'bg-green-600 text-white'
                    : m === 'subtract' ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {m === 'add' ? <><Plus className="w-4 h-4" /> Agregar</>
               : m === 'subtract' ? <><Minus className="w-4 h-4" /> Restar</>
               : 'Fijar en'}
            </button>
          ))}
        </div>

        <label className="text-xs text-gray-400 mb-1 block">
          {mode === 'set' ? 'Cantidad final' : 'Cantidad a ' + (mode === 'add' ? 'agregar' : 'restar')}
        </label>
        <input
          type="number"
          step={product.requires_weight ? '0.01' : '1'}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-3xl font-black mb-3 focus:outline-none focus:border-red-500 text-center"
        />

        <label className="text-xs text-gray-400 mb-1 block">Motivo (opcional)</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Recepción, merma, conteo..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm mb-5 focus:outline-none focus:border-red-500"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal inventario inicial ────────────────────────────────────────────────
function InitialInventoryModal({ items, onClose, onSaved }: any) {
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    items.forEach((i: any) => { init[i.id] = String(i.quantity || 0) })
    return init
  })
  const [activeCat, setActiveCat] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredItems = items.filter((i: any) => !activeCat || i.category_id === activeCat)

  const submit = async () => {
    setSaving(true)
    const api = (window as any).posAPI
    const updates = Object.entries(quantities)
      .map(([productId, q]) => ({ productId, quantity: parseFloat(q) || 0 }))
      .filter(u => u.quantity > 0)

    if (updates.length === 0) {
      toast.error('Ingresa al menos una cantidad')
      setSaving(false)
      return
    }
    try {
      const result = await api.inventory.setInitial(updates)
      toast.success(`Inventario cargado: ${result.productsUpdated} productos`)
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-[740px] max-h-[88vh] border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold">Cargar inventario inicial</h2>
            <p className="text-sm text-gray-400">Ingresa las cantidades de partida para cada producto</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        {/* Filtros categoría */}
        <div className="flex gap-2 px-5 py-2.5 border-b border-gray-800 flex-wrap">
          {CATS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
                activeCat === cat.id ? CAT_ACTIVE[cat.color] : CAT_INACTIVE
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Producto</th>
                <th className="py-2.5 px-4 text-right w-40">Cantidad inicial</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-900/50">
                  <td className="py-2 px-4 font-mono text-xs text-gray-400">{p.sku}</td>
                  <td className="py-2 px-4 font-medium">{p.name}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        step={p.requires_weight ? '0.001' : '1'}
                        min={0}
                        value={quantities[p.id] ?? '0'}
                        onChange={e => setQuantities({ ...quantities, [p.id]: e.target.value })}
                        className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-right text-sm focus:outline-none focus:border-red-500"
                      />
                      <span className="text-xs text-gray-500 w-5">{p.requires_weight ? 'kg' : 'un'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Cargar inventario'}
          </button>
        </div>
      </div>
    </div>
  )
}
