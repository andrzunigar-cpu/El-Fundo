import React, { useEffect, useState, useCallback } from 'react'
import { Tag, RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight, Percent, Gift, X, Check } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const api = () => (window as any).posAPI
const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n ?? 0)

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  pct:          { label: 'Descuento %',    color: 'bg-orange-900/40 text-orange-400 border-orange-700' },
  free_order:   { label: 'Orden gratis',   color: 'bg-emerald-900/40 text-emerald-400 border-emerald-700' },
  free_product: { label: 'Producto gratis', color: 'bg-blue-900/40 text-blue-400 border-blue-700' },
}

export function PromotionsPanel() {
  const [promos, setPromos]   = useState<any[]>([])
  const [codes,  setCodes]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'promos' | 'codes'>('promos')
  const [showNewCode, setShowNewCode] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])

  const [newCode, setNewCode] = useState({
    code: '', name: '', type: 'pct', value: '', maxUses: '', expiresAt: '',
    freeProductId: '', freeProductName: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [p, c, prods] = await Promise.all([
      api().products.getPromotions(),
      api().discountCodes.getAll(),
      api().products.getAll(),
    ])
    setPromos(p)
    setCodes(c)
    setAllProducts(prods)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createCode = async () => {
    if (!newCode.code.trim() || !newCode.type) return
    if (newCode.type === 'pct' && (!newCode.value || parseFloat(newCode.value) <= 0)) {
      toast.error('Ingresa el % de descuento'); return
    }
    try {
      await api().discountCodes.create({
        code: newCode.code.trim().toUpperCase(),
        name: newCode.name,
        type: newCode.type,
        value: parseFloat(newCode.value) || 0,
        maxUses: parseInt(newCode.maxUses) || 0,
        expiresAt: newCode.expiresAt || null,
        freeProductId: newCode.type === 'free_product' ? newCode.freeProductId : null,
        freeProductName: newCode.type === 'free_product' ? newCode.freeProductName : null,
      })
      toast.success('Código creado')
      setNewCode({ code: '', name: '', type: 'pct', value: '', maxUses: '', expiresAt: '', freeProductId: '', freeProductName: '' })
      setShowNewCode(false)
      load()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al crear código')
    }
  }

  const deleteCode = async (id: string) => {
    await api().discountCodes.delete(id)
    toast.success('Código eliminado')
    load()
  }

  const toggleCode = async (id: string) => {
    await api().discountCodes.toggleActive(id)
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <RefreshCw className="w-5 h-5 animate-spin" />
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header tabs */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex gap-1">
          {(['promos', 'codes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                tab === t ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
              {t === 'promos' ? '🏷️ Promociones activas' : '🎟️ Códigos de descuento'}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {/* ── PROMOCIONES ACTIVAS ── */}
        {tab === 'promos' && (
          <>
            {promos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-3">
                <Tag className="w-10 h-10 opacity-30" />
                <p className="text-sm">No hay promociones activas</p>
                <p className="text-xs text-gray-700">Ve a Productos → editar → sección Promoción para activarlas</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {promos.map(p => {
                  const promoPrice = Math.round(p.base_price * (1 - p.promotion_pct / 100))
                  return (
                    <div key={p.id} className="bg-gray-900 border border-red-500/30 rounded-2xl p-4
                                               shadow-lg shadow-red-900/10 relative overflow-hidden">
                      {/* Badge descuento */}
                      <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black
                                      px-2 py-0.5 rounded-full">
                        −{p.promotion_pct}%
                      </div>
                      {p.promotion_name && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">
                          {p.promotion_name}
                        </p>
                      )}
                      <p className="font-bold text-white text-sm leading-tight pr-12">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.sku}</p>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-xl font-black text-red-400 font-mono">{fmt(promoPrice)}</span>
                        <span className="text-xs text-gray-600 line-through font-mono mb-0.5">{fmt(p.base_price)}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1">
                        Stock: {Number(p.quantity ?? 0).toFixed(1)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── CÓDIGOS DE DESCUENTO ── */}
        {tab === 'codes' && (
          <div className="space-y-4 max-w-2xl">
            {/* Botón nuevo código */}
            <button onClick={() => setShowNewCode(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Nuevo código
            </button>

            {/* Formulario nuevo código */}
            {showNewCode && (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-bold text-white mb-2">Crear código de descuento</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Código *</label>
                    <input value={newCode.code} onChange={e => setNewCode(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                      placeholder="DESCUENTO10" maxLength={20}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono
                                 focus:outline-none focus:border-red-500 uppercase" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Nombre (opcional)</label>
                    <input value={newCode.name} onChange={e => setNewCode(v => ({ ...v, name: e.target.value }))}
                      placeholder="Descuento mayo"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Tipo de descuento *</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'pct', label: '% Descuento', icon: Percent },
                      { id: 'free_order', label: 'Orden gratis', icon: Gift },
                      { id: 'free_product', label: 'Producto gratis', icon: Tag },
                    ].map(t => (
                      <button key={t.id} onClick={() => setNewCode(v => ({ ...v, type: t.id }))}
                        className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                          newCode.type === t.id
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white')}>
                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {newCode.type === 'pct' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Porcentaje de descuento *</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={newCode.value} onChange={e => setNewCode(v => ({ ...v, value: e.target.value }))}
                        min="1" max="100" placeholder="10"
                        className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center font-mono focus:outline-none focus:border-red-500" />
                      <span className="text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                )}

                {newCode.type === 'free_product' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Producto gratis *</label>
                    <select value={newCode.freeProductId}
                      onChange={e => {
                        const prod = allProducts.find((p: any) => p.id === e.target.value)
                        setNewCode(v => ({ ...v, freeProductId: e.target.value, freeProductName: prod?.name ?? '' }))
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
                      <option value="">Seleccionar producto…</option>
                      {allProducts.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Usos máximos (0 = ilimitado)</label>
                    <input type="number" value={newCode.maxUses} onChange={e => setNewCode(v => ({ ...v, maxUses: e.target.value }))}
                      min="0" placeholder="0"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Expira (opcional)</label>
                    <input type="date" value={newCode.expiresAt} onChange={e => setNewCode(v => ({ ...v, expiresAt: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={createCode}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all">
                    <Check className="w-4 h-4" /> Crear código
                  </button>
                  <button onClick={() => setShowNewCode(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-all">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de códigos */}
            {codes.length === 0 ? (
              <div className="text-center text-gray-600 py-12 text-sm">Sin códigos creados aún</div>
            ) : (
              <div className="space-y-2">
                {codes.map((c: any) => {
                  const meta = TYPE_LABELS[c.type] ?? TYPE_LABELS.pct
                  return (
                    <div key={c.id} className={clsx(
                      'flex items-center gap-3 bg-gray-900 border rounded-xl px-4 py-3 transition-opacity',
                      c.active ? 'border-gray-700' : 'border-gray-800 opacity-50'
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-bold text-white text-sm">{c.code}</span>
                          <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded border', meta.color)}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {c.name && <span className="mr-2">{c.name}</span>}
                          {c.type === 'pct' && <span className="text-orange-400 font-mono">−{c.value}%</span>}
                          {c.type === 'free_product' && c.free_product_name && <span className="text-blue-400">{c.free_product_name}</span>}
                          {c.max_uses > 0 && <span className="ml-2 text-gray-600">{c.uses_count}/{c.max_uses} usos</span>}
                          {c.max_uses === 0 && <span className="ml-2 text-gray-600">{c.uses_count} usos</span>}
                          {c.expires_at && <span className="ml-2 text-gray-600">Expira: {c.expires_at}</span>}
                        </p>
                      </div>
                      <button onClick={() => toggleCode(c.id)} title={c.active ? 'Desactivar' : 'Activar'}
                        className="text-gray-500 hover:text-white transition-colors">
                        {c.active
                          ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                          : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => deleteCode(c.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
