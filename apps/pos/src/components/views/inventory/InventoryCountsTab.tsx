import React, { useEffect, useState, useCallback } from 'react'
import { Plus, ClipboardCheck, X, AlertCircle, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { DateRangeFilter, formatDate, todayISO, daysAgoISO } from './shared'

const CAT_LABELS: Record<string, string> = {
  'cat-vacuno':     'Vacuno',
  'cat-cerdo':      'Cerdo',
  'cat-pollo':      'Pollo',
  'cat-embutidos':  'Embutidos',
  'cat-parrilla':   'Parrilla',
  'cat-congelados': 'Congelados',
  'cat-bebidas':    'Bebidas',
  'cat-otros':      'Otros',
}

const CAT_ORDER = [
  'cat-vacuno','cat-cerdo','cat-pollo',
  'cat-embutidos','cat-parrilla','cat-congelados',
  'cat-bebidas','cat-otros',
]

export function InventoryCountsTab() {
  const [counts, setCounts] = useState<any[]>([])
  const [from, setFrom] = useState(todayISO())
  const [to, setTo] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [activeCountId, setActiveCountId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const api = (window as any).posAPI
    setLoading(true)
    const data = await api.inventory.listCounts({ from, to })
    setCounts(data)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const startNew = async () => {
    const api = (window as any).posAPI
    const result = await api.inventory.countStart()
    toast.success(`Toma ${result.reference} creada — ${result.productsCount} productos`)
    setActiveCountId(result.id)
  }

  if (activeCountId) {
    return <CountEditor countId={activeCountId} onClose={() => { setActiveCountId(null); load() }} />
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
        <button onClick={startNew} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nueva toma
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : counts.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin tomas de inventario en el período</p>
            <button onClick={startNew} className="mt-4 text-red-400 hover:text-red-300 text-sm">+ Crear primera toma</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-3 px-3">Referencia</th>
                <th className="py-3 px-3">Fecha creación</th>
                <th className="py-3 px-3">Fecha cierre</th>
                <th className="py-3 px-3 text-center">Productos</th>
                <th className="py-3 px-3 text-center">Diferencias</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {counts.map(c => (
                <tr key={c.id} className="border-b border-gray-800/40 hover:bg-gray-900">
                  <td className="py-3 px-3 font-mono text-xs">{c.reference}</td>
                  <td className="py-3 px-3 text-gray-400">{formatDate(c.created_at)}</td>
                  <td className="py-3 px-3 text-gray-400">{formatDate(c.completed_at)}</td>
                  <td className="py-3 px-3 text-center">{c.total_products || '—'}</td>
                  <td className="py-3 px-3 text-center">
                    {c.total_differences > 0 ? (
                      <span className="text-orange-400 font-medium">{c.total_differences}</span>
                    ) : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium',
                      c.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                      c.status === 'cancelled' ? 'bg-gray-800 text-gray-500' :
                      'bg-yellow-900/40 text-yellow-400'
                    )}>
                      {c.status === 'completed' ? 'Cerrada' : c.status === 'cancelled' ? 'Cancelada' : 'Borrador'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {c.status === 'draft' && (
                      <button onClick={() => setActiveCountId(c.id)} className="px-3 py-1 bg-gray-800 hover:bg-red-600 rounded text-xs font-medium">
                        Continuar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CountEditor({ countId, onClose }: { countId: string; onClose: () => void }) {
  const [count, setCount] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(async () => {
    const api = (window as any).posAPI
    const data = await api.inventory.countGetItems(countId)
    setCount(data)
    setItems(data.items || [])
    setLoading(false)
  }, [countId])

  useEffect(() => { load() }, [load])

  const updateQty = async (productId: string, value: string) => {
    const qty = parseFloat(value)
    if (isNaN(qty)) return
    const api = (window as any).posAPI
    await api.inventory.countUpdateItem(countId, productId, qty)
    setItems(items.map(i => i.product_id === productId
      ? { ...i, counted_quantity: qty, difference: qty - Number(i.system_quantity) }
      : i))
  }

  const cancel = async () => {
    if (!confirm('¿Cancelar esta toma sin aplicar cambios?')) return
    const api = (window as any).posAPI
    await api.inventory.countCancel(countId)
    toast('Toma cancelada')
    onClose()
  }

  const complete = async () => {
    setConfirming(true)
    const api = (window as any).posAPI
    try {
      const result = await api.inventory.countComplete(countId)
      toast.success(`Toma aplicada: ${result.productsAdjusted} productos ajustados`)
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setConfirming(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>

  const filtered = items.filter(i =>
    !search.trim() ||
    i.product_name.toLowerCase().includes(search.toLowerCase()) ||
    i.product_sku.toLowerCase().includes(search.toLowerCase())
  )
  const itemsWithDiff = items.filter(i => Number(i.difference) !== 0)
  const totalAdded = itemsWithDiff.filter(i => i.difference > 0).reduce((s, i) => s + Number(i.difference), 0)
  const totalRemoved = Math.abs(itemsWithDiff.filter(i => i.difference < 0).reduce((s, i) => s + Number(i.difference), 0))

  // Agrupar por categoría
  const grouped = (() => {
    const groups: { catId: string; label: string; items: any[] }[] = []
    const seen = new Set<string>()
    // Primero en el orden definido
    for (const catId of CAT_ORDER) {
      const catItems = filtered.filter(i => i.category_id === catId)
      if (catItems.length > 0) { groups.push({ catId, label: CAT_LABELS[catId] ?? catId, items: catItems }); seen.add(catId) }
    }
    // Luego cualquier categoría no contemplada
    const rest = filtered.filter(i => !seen.has(i.category_id ?? ''))
    if (rest.length > 0) groups.push({ catId: 'otros', label: 'Sin categoría', items: rest })
    return groups
  })()

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold">Toma {count.reference}</h2>
            <p className="text-xs text-gray-500">Creada {formatDate(count.created_at)}</p>
          </div>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:border-red-500"
        />
      </div>

      <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-800">
        <SmallStat label="Productos a contar" value={items.length} />
        <SmallStat label="Con diferencias" value={itemsWithDiff.length} color="orange" />
        <SmallStat label="Sobrantes" value={`+${totalAdded.toFixed(2)}`} color="green" />
        <SmallStat label="Faltantes" value={`-${totalRemoved.toFixed(2)}`} color="red" />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-950 z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <th className="py-2 px-2">SKU</th>
              <th className="py-2 px-2">Producto</th>
              <th className="py-2 px-2 text-right">Sistema</th>
              <th className="py-2 px-2 text-right">Contado</th>
              <th className="py-2 px-2 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(group => (
              <React.Fragment key={group.catId}>
                {/* Cabecera de categoría */}
                <tr>
                  <td colSpan={5} className="pt-4 pb-1 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{group.label}</span>
                      <span className="text-xs text-gray-600">({group.items.length} productos)</span>
                      <div className="flex-1 border-t border-gray-800" />
                    </div>
                  </td>
                </tr>
                {group.items.map(item => {
                  const diff = Number(item.difference)
                  return (
                    <tr key={item.id} className={clsx('border-b border-gray-800/30', diff !== 0 && 'bg-orange-950/10')}>
                      <td className="py-2 px-2 font-mono text-xs text-gray-400">{item.product_sku}</td>
                      <td className="py-2 px-2">{item.product_name}</td>
                      <td className="py-2 px-2 text-right text-gray-400">
                        {Number(item.system_quantity).toFixed(item.requires_weight ? 2 : 0)}
                        <span className="text-gray-600 text-xs ml-1">{item.requires_weight ? 'kg' : 'un'}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step={item.requires_weight ? '0.01' : '1'}
                            defaultValue={item.counted_quantity}
                            onBlur={e => updateQty(item.product_id, e.target.value)}
                            className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right text-sm focus:outline-none focus:border-red-500"
                          />
                          <span className="text-gray-600 text-xs w-5 text-left">{item.requires_weight ? 'kg' : 'un'}</span>
                        </div>
                      </td>
                      <td className={clsx('py-2 px-2 text-right font-medium', diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-500')}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(item.requires_weight ? 2 : 0)}
                        <span className="text-xs opacity-50 ml-1">{item.requires_weight ? 'kg' : 'un'}</span>
                      </td>
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-800 flex gap-3">
        <button onClick={cancel} className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-red-700 text-sm font-medium">
          Cancelar toma
        </button>
        <div className="flex-1" />
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium">
          Guardar borrador
        </button>
        <button onClick={complete} disabled={confirming}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-bold disabled:opacity-50">
          <Check className="w-4 h-4" />
          {confirming ? 'Aplicando...' : `Cerrar y aplicar (${itemsWithDiff.length} ajustes)`}
        </button>
      </div>
    </div>
  )
}

function SmallStat({ label, value, color }: any) {
  const colors: any = {
    orange: 'text-orange-400',
    green:  'text-green-400',
    red:    'text-red-400',
  }
  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className={clsx('text-xl font-bold mt-1', colors[color] || 'text-white')}>{value}</div>
    </div>
  )
}
