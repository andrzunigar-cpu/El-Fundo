import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Trash2, CreditCard, Banknote, User, Printer, RefreshCw,
  Minus, Plus, X, Wifi, WifiOff, Check, ChevronDown,
  ArrowLeft, ArrowRight, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePOSStore } from '../../stores/posStore'
import { clsx } from 'clsx'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const GROUP_META: Record<string, { label: string; icon: any; color: string; source: string }> = {
  offline:  { label: 'Presencial', icon: WifiOff, color: 'text-gray-300', source: 'pos'    },
  online:   { label: 'Online',     icon: Wifi,    color: 'text-blue-400', source: 'online' },
}

interface CartPanelProps {
  mode?: 'items' | 'payment'
  onGoToPayment?: () => void
  onBack?: () => void
  onCheckoutComplete?: () => void
}

export function CartPanel({
  mode = 'items',
  onGoToPayment,
  onBack,
  onCheckoutComplete,
}: CartPanelProps) {
  const {
    cart, selectedCustomer, notes,
    removeFromCart, updateCartItem, clearCart,
    cartTotal, cartItemCount,
    appliedDiscount, discountAmount, setAppliedDiscount,
    setCheckoutState,
  } = usePOSStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState<string>('')
  // amounts: { [methodKey]: string }
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  // Código de descuento (UI state only — persisted in store)
  const [discountInput, setDiscountInput] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [groups, setGroups] = useState<{ id: string; label: string; icon: any; color: string; source: string; methods: any[] }[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ online: true })
  const [focusedMethod, setFocusedMethod] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const rawTotal = cartTotal()
  const total = Math.max(0, rawTotal - discountAmount)

  // ── Cargar métodos de pago ──────────────────────────────────
  useEffect(() => {
    const api = (window as any).posAPI
    api.paymentSettings.getForPos().then((r: any) => {
      // Unir online_web + online_delivery en un solo grupo "Online" ordenado por sort_order
      const onlineMethods = [
        ...(r.online_web ?? []),
        ...(r.online_delivery ?? []),
      ].sort((a: any, b: any) => (a.sort_order ?? 99) - (b.sort_order ?? 99))

      const g = [
        { ...GROUP_META.offline, id: 'offline', methods: r.offline ?? [] },
        { ...GROUP_META.online,  id: 'online',  methods: onlineMethods },
      ].filter(g => g.methods.length > 0)
      setGroups(g)
    })
  }, [])

  const setAmount = (method: string, val: string) =>
    setAmounts(prev => ({ ...prev, [method]: val.replace(/[^0-9]/g, '') }))

  const clearAmount = (method: string) =>
    setAmounts(prev => ({ ...prev, [method]: '' }))

  // Confirmar monto: blur + mover foco al siguiente método vacío
  const confirmAmount = (method: string) => {
    inputRefs.current[method]?.blur()
    setFocusedMethod(null)
    const allMethods = groups.flatMap(g => g.methods).map(m => m.method)
    const idx = allMethods.indexOf(method)
    for (let i = idx + 1; i < allMethods.length; i++) {
      const next = allMethods[i]
      if (!parseInt(amounts[next] || '0')) {
        inputRefs.current[next]?.focus()
        break
      }
    }
  }

  // ── Totales ─────────────────────────────────────────────────
  const groupTotal = (methods: any[]) =>
    methods.reduce((s, m) => s + (parseInt(amounts[m.method] || '0') || 0), 0)

  const totalPaid        = groups.reduce((s, g) => s + groupTotal(g.methods), 0)
  const remaining        = Math.max(0, total - totalPaid)
  const vuelto           = Math.max(0, totalPaid - total)
  const canCharge        = cart.length > 0 && totalPaid >= total && totalPaid > 0
  const hasOnlinePayment = groups
    .filter(g => g.source === 'online')
    .some(g => groupTotal(g.methods) > 0)

  // ── Calculadora de vuelto (solo pago en efectivo) ────────────
  const cashAmount   = parseInt(amounts['cash'] || '0') || 0
  const nonCashTotal = groups
    .flatMap(g => g.methods)
    .filter((m: any) => m.method !== 'cash')
    .reduce((s: number, m: any) => s + (parseInt(amounts[m.method] || '0') || 0), 0)
  const isOnlyCash = cashAmount > 0 && nonCashTotal === 0
  const vueltoEfectivo = isOnlyCash ? Math.max(0, cashAmount - total) : 0
  const faltaEfectivo  = isOnlyCash && cashAmount < total ? total - cashAmount : 0

  // Publicar estado de cobro al store (para panel cliente izquierdo)
  useEffect(() => {
    if (mode !== 'payment') return
    setCheckoutState(vueltoEfectivo, totalPaid)
  }, [vueltoEfectivo, totalPaid, mode])

  // Limpiar al salir del modo pago
  useEffect(() => {
    if (mode !== 'payment') setCheckoutState(0, 0)
  }, [mode])

  // ── Editar ítem del carrito ─────────────────────────────────
  const startEdit = useCallback((item: any) => {
    setEditingId(item.product.id)
    setEditVal(item.product.requiresWeight
      ? String((item.weightKg ?? 1).toFixed(3))
      : String(item.quantity))
  }, [])

  const confirmEdit = useCallback((item: any) => {
    const n = parseFloat(editVal)
    if (isNaN(n) || n <= 0) { removeFromCart(item.product.id); setEditingId(null); return }
    updateCartItem(
      item.product.id,
      item.product.requiresWeight ? 1 : Math.round(n),
      item.product.requiresWeight ? n : undefined,
    )
    setEditingId(null)
  }, [editVal, updateCartItem, removeFromCart])

  // ── Código de descuento ─────────────────────────────────────
  const applyDiscount = async () => {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountLoading(true)
    const api = (window as any).posAPI
    try {
      const result = await api.discountCodes.validate(code)
      if (!result || !result.valid) { toast.error(result?.reason ?? 'Código inválido o expirado'); return }
      setAppliedDiscount(result, rawTotal)
      setDiscountInput('')
      const msg = result.type === 'pct'
        ? `Descuento ${result.value}% aplicado`
        : result.type === 'free_order'
        ? 'Orden gratis aplicada 🎉'
        : `Producto gratis: ${result.free_product_name}`
      toast.success(msg)
    } catch (e: any) {
      toast.error(e.message ?? 'Código inválido')
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = () => {
    setAppliedDiscount(null, 0)
    setDiscountInput('')
  }

  // ── Cobrar ──────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Agrega productos al carrito'); return }
    if (!canCharge) {
      toast.error(remaining > 0 ? `Falta ${fmt(remaining)} por cubrir` : 'Indica el monto de pago')
      return
    }
    setIsProcessing(true)
    const api = (window as any).posAPI
    try {
      const validPayments = groups.flatMap(g => g.methods)
        .map(m => ({ method: m.method, amount: parseInt(amounts[m.method] || '0') || 0 }))
        .filter(p => p.amount > 0)

      // source = online si hay al menos un método no-presencial con monto
      const hasOnline = groups
        .filter(g => g.source === 'online')
        .some(g => groupTotal(g.methods) > 0)

      const orderData = {
        source: hasOnline ? 'online' : 'pos',
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          quantity: item.quantity,
          weightKg: item.weightKg,
          unitPrice: item.product.basePrice,
          subtotal: item.subtotal,
          discount: 0,
        })),
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer
          ? `${(selectedCustomer as any).firstName} ${(selectedCustomer as any).lastName}`
          : undefined,
        payments: validPayments,
        paymentMethod: validPayments[0]?.method ?? 'cash',
        paymentStatus: 'paid',
        deliveryType: validPayments[0]?.method?.includes('reparto') ? 'delivery' : 'pickup',
        subtotal: rawTotal,
        discountTotal: discountAmount,
        discountCode: appliedDiscount?.code ?? null,
        taxTotal: 0,
        total,
        deliveryFee: 0,
        notes: appliedDiscount?.type === 'free_product'
          ? `${notes ? notes + ' | ' : ''}Producto gratis: ${appliedDiscount.free_product_name}`
          : notes,
      }

      const order = await api.orders.create(orderData)

      // Marcar código de descuento como usado
      if (appliedDiscount?.id) {
        await api.discountCodes.use(appliedDiscount.id)
      }

      await api.printer.printTicket(order)

      if (order.changeGiven > 0) {
        toast.success(`Venta ingresada al sistema ✓  ·  Vuelto: ${fmt(order.changeGiven)}`, { duration: 5000, position: 'top-right' })
      } else {
        toast.success(`Venta ingresada al sistema ✓`, { duration: 3000, position: 'top-right' })
      }

      clearCart()   // also resets appliedDiscount via store
      setAmounts({})
      onCheckoutComplete?.()
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-900">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        {mode === 'payment' && (
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-1 -ml-1 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h2 className="font-bold text-base flex-1">
          {mode === 'payment' ? 'Cobro' : `Venta (${cartItemCount()})`}
        </h2>
        {mode === 'items' && cart.length > 0 && (
          <button onClick={clearCart} className="text-gray-600 hover:text-red-400 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {cart.length === 0 ? (
          <div className="text-center text-gray-700 mt-10">
            <CartIcon />
            <p className="mt-2 text-sm">Selecciona productos</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id}
              className={clsx(
                'rounded-xl p-3 transition-all',
                editingId === item.product.id
                  ? 'bg-gray-700 ring-1 ring-red-500'
                  : 'bg-gray-800 hover:bg-gray-750',
              )}>
              {editingId === item.product.id ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.product.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {item.product.requiresWeight ? 'kg' : 'unidades'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const v = parseFloat(editVal)
                      const nv = item.product.requiresWeight
                        ? Math.max(0.001, v - 0.1)
                        : Math.max(1, Math.round(v) - 1)
                      updateCartItem(item.product.id, item.product.requiresWeight ? 1 : nv, item.product.requiresWeight ? nv : undefined)
                      setEditVal(item.product.requiresWeight ? nv.toFixed(3) : String(nv))
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-600 hover:bg-gray-500 flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number" value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmEdit(item)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    step={item.product.requiresWeight ? '0.001' : '1'}
                    min={item.product.requiresWeight ? '0.001' : '1'}
                    className="w-20 text-center bg-gray-900 border border-red-500 rounded-lg py-1 text-sm font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const v = parseFloat(editVal)
                      const nv = item.product.requiresWeight ? v + 0.1 : Math.round(v) + 1
                      updateCartItem(item.product.id, item.product.requiresWeight ? 1 : nv, item.product.requiresWeight ? nv : undefined)
                      setEditVal(item.product.requiresWeight ? nv.toFixed(3) : String(nv))
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-600 hover:bg-gray-500 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => confirmEdit(item)}
                    className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center">
                    <Printer className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="w-7 h-7 rounded-lg bg-gray-600 hover:bg-gray-500 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => startEdit(item)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.product.requiresWeight
                        ? `${(item.weightKg ?? 0).toFixed(3)} kg × ${fmt(item.product.basePrice)}/kg`
                        : `${item.quantity} × ${fmt(item.product.basePrice)}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm">{fmt(item.subtotal)}</p>
                    <button
                      onClick={e => { e.stopPropagation(); removeFromCart(item.product.id) }}
                      className="text-gray-600 hover:text-red-400 transition-colors mt-0.5">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cliente */}
      <div className="px-4 py-2 border-t border-gray-800">
        <button className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <User className="w-3.5 h-3.5" />
          {selectedCustomer
            ? `${(selectedCustomer as any).firstName} ${(selectedCustomer as any).lastName}`
            : 'Agregar cliente (opcional)'}
        </button>
      </div>

      {/* Código de descuento — solo en modo pago */}
      {mode === 'payment' && (
        <div className="px-4 py-2.5 border-t border-gray-800">
          {appliedDiscount ? (
            <div className={clsx(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-xs',
              appliedDiscount.type === 'free_order'
                ? 'bg-emerald-900/30 border border-emerald-700/50'
                : appliedDiscount.type === 'free_product'
                ? 'bg-blue-900/30 border border-blue-700/50'
                : 'bg-orange-900/30 border border-orange-700/50'
            )}>
              <Tag className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />
              <div className="flex-1 min-w-0">
                <span className="font-mono font-bold text-white">{appliedDiscount.code}</span>
                {appliedDiscount.type === 'pct' && (
                  <span className="ml-2 text-orange-400">−{appliedDiscount.value}%  ({fmt(discountAmount)})</span>
                )}
                {appliedDiscount.type === 'free_order' && (
                  <span className="ml-2 text-emerald-400">Orden gratis 🎉</span>
                )}
                {appliedDiscount.type === 'free_product' && (
                  <span className="ml-2 text-blue-400">{appliedDiscount.free_product_name}</span>
                )}
              </div>
              <button onClick={removeDiscount} className="text-gray-600 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <input
                value={discountInput}
                onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') applyDiscount() }}
                placeholder="Código de descuento"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-orange-500 placeholder-gray-600"
              />
              <button
                onClick={applyDiscount}
                disabled={!discountInput.trim() || discountLoading}
                className="px-3 py-1.5 bg-orange-700/60 hover:bg-orange-600 text-orange-300 text-xs font-semibold rounded-lg transition-all disabled:opacity-40">
                {discountLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Aplicar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Sección de pago (solo en modo cobro) ── */}
      {mode === 'payment' && <div className="border-t border-gray-800 overflow-y-auto max-h-[42vh]">
        {groups.map((group, gi) => {
          const Icon = group.icon
          const gTotal = groupTotal(group.methods)
          const isCollapsed = collapsed[group.id] ?? false
          // Auto-expandir si hay algún monto ingresado en este grupo
          const hasAnyValue = group.methods.some(m => parseInt(amounts[m.method] || '0') > 0)
          const showMethods = !isCollapsed || hasAnyValue

          return (
            <div key={group.id} className={clsx('px-3 pt-2 pb-1', gi > 0 && 'border-t border-gray-800/60')}>
              {/* Cabecera del canal — clickeable para colapsar */}
              <button
                type="button"
                onClick={() => setCollapsed(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                className="w-full flex items-center justify-between mb-1.5 group"
              >
                <div className={clsx('flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider', group.color)}>
                  <Icon className="w-3 h-3" />
                  {group.label}
                </div>
                <div className="flex items-center gap-1.5">
                  {gTotal > 0 && (
                    <span className={clsx('text-xs font-bold font-mono', group.color)}>{fmt(gTotal)}</span>
                  )}
                  <ChevronDown className={clsx(
                    'w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-all duration-200',
                    showMethods ? 'rotate-180' : 'rotate-0'
                  )} />
                </div>
              </button>

              {/* Filas por método — colapsables */}
              {showMethods && (
                <div className="space-y-1.5">
                  {group.methods.map(m => {
                    const val = amounts[m.method] ?? ''
                    const hasVal = parseInt(val) > 0
                    return (
                      <div key={m.method} className="flex items-center gap-1.5">
                        <span className={clsx(
                          'flex-1 text-xs truncate',
                          hasVal ? 'text-white font-medium' : 'text-gray-500'
                        )}>
                          {m.label}
                          {m.commission_pct > 0 && (
                            <span className="ml-1 text-[10px] text-red-500 opacity-70">−{m.commission_pct}%</span>
                          )}
                        </span>
                        <div className="relative flex-shrink-0">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">$</span>
                          <input
                            ref={el => { inputRefs.current[m.method] = el }}
                            type="text"
                            inputMode="numeric"
                            value={val}
                            onChange={e => setAmount(m.method, e.target.value)}
                            onFocus={e => { e.target.select(); setFocusedMethod(m.method) }}
                            onBlur={() => setFocusedMethod(prev => prev === m.method ? null : prev)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmAmount(m.method) }}
                            placeholder="0"
                            className={clsx(
                              'w-24 pl-5 pr-2 py-1.5 bg-gray-800 border rounded-lg text-xs text-right font-mono focus:outline-none transition-colors',
                              hasVal ? 'border-gray-500 text-white' : 'border-gray-700 text-gray-400',
                              focusedMethod === m.method ? 'border-green-500' : 'focus:border-green-500'
                            )}
                          />
                        </div>
                        {/* ✓ verde cuando está enfocado con valor | X para limpiar | espacio vacío */}
                        {focusedMethod === m.method && hasVal ? (
                          <button
                            onMouseDown={e => { e.preventDefault(); confirmAmount(m.method) }}
                            className="w-6 h-6 rounded-md flex items-center justify-center
                                       bg-green-600 hover:bg-green-500 text-white transition-colors flex-shrink-0"
                            title="Confirmar monto (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : hasVal ? (
                          <button onClick={() => clearAmount(m.method)}
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="w-5 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* (rojo eliminado — aparece en panel izquierdo) */}

        {/* Resumen global (pago mixto) */}
        {cart.length > 0 && totalPaid > 0 && !isOnlyCash && (
          <div className="mx-3 mb-2 mt-1.5 space-y-1 text-xs border-t border-gray-700 pt-2">
            <div className="flex justify-between text-gray-500">
              <span>Total pagado</span>
              <span className="font-mono font-bold text-white">{fmt(totalPaid)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-red-400 font-semibold">
                <span>Pendiente</span>
                <span className="font-mono">{fmt(remaining)}</span>
              </div>
            )}
            {vuelto > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Vuelto</span>
                <span className="font-mono">{fmt(vuelto)}</span>
              </div>
            )}
          </div>
        )}
      </div>}

      {/* Total + CTA */}
      <div className="px-4 py-4 border-t border-gray-800">
        {mode === 'payment' && discountAmount > 0 && (
          <div className="flex justify-between items-baseline mb-1 text-xs text-gray-500">
            <span>Subtotal</span>
            <span className="font-mono">{fmt(rawTotal)}</span>
          </div>
        )}
        {mode === 'payment' && discountAmount > 0 && (
          <div className="flex justify-between items-baseline mb-1 text-xs text-orange-400">
            <span>Descuento</span>
            <span className="font-mono">−{fmt(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline mb-3">
          <span className="text-gray-400 text-sm">Total</span>
          <span className="text-3xl font-black">{fmt(total)}</span>
        </div>
        {mode === 'items' ? (
          <button
            onClick={onGoToPayment}
            disabled={cart.length === 0}
            className={clsx(
              'w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
              cart.length === 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95',
            )}
          >
            Ir a cobrar <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={isProcessing || !canCharge}
            className={clsx(
              'w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
              !canCharge
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : hasOnlinePayment
                  ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                  : 'bg-red-600 hover:bg-red-500 text-white active:scale-95',
            )}
          >
            {isProcessing
              ? <RefreshCw className="w-5 h-5 animate-spin" />
              : <><Printer className="w-5 h-5" /> Cobrar {cart.length > 0 && fmt(total)}</>}
          </button>
        )}
      </div>
    </div>
  )
}

function CartIcon() {
  return (
    <svg className="w-10 h-10 mx-auto text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
