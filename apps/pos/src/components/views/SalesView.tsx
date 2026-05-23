import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { ShoppingCart, Tag, ClipboardList } from 'lucide-react'
import { clsx } from 'clsx'
import { ProductGrid } from '../products/ProductGrid'
import { CartPanel } from '../pos/CartPanel'
import { QuantityPanel } from '../pos/QuantityPanel'
import { PromotionsPanel } from './sales/PromotionsPanel'
import { OrdersPanel } from './sales/OrdersPanel'
import { usePOSStore } from '../../stores/posStore'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

type SalesTab = 'caja' | 'promociones' | 'ordenes'

export function SalesView() {
  const [salesTab, setSalesTab] = useState<SalesTab>('caja')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [step, setStep] = useState<'cart' | 'payment'>('cart')
  const { addToCart, cart, cartTotal, discountAmount, checkoutVuelto, checkoutTotalPaid } = usePOSStore()

  const handleAddToCart = useCallback((product: any, quantity: number, weightKg?: number) => {
    addToCart(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        basePrice: product.base_price,
        requiresWeight: !!product.requires_weight,
        formatLabel: product.format_label ?? null,
        priceUnit: product.price_unit ?? (product.requires_weight ? 'kg' : 'unidad'),
      },
      quantity,
      weightKg
    )
    toast.success(`${product.name} agregado`, { duration: 1000, position: 'bottom-center' })
    // Mantener el mismo producto seleccionado para ingresos rápidos múltiples
    // setSelectedProduct(null)  ← descomenta si prefieres limpiar tras agregar
  }, [addToCart])

  const TABS = [
    { id: 'caja' as SalesTab,       label: 'Caja',        icon: ShoppingCart },
    { id: 'promociones' as SalesTab, label: 'Promociones', icon: Tag },
    { id: 'ordenes' as SalesTab,    label: 'Órdenes',     icon: ClipboardList },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar — solo visible cuando no está en modo pago */}
      {step === 'cart' && (
        <div className="flex items-center gap-1 px-4 pt-2 pb-0 border-b border-gray-800 flex-shrink-0 bg-gray-950">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setSalesTab(t.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all',
                salesTab === t.id
                  ? 'border-red-500 text-white bg-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'
              )}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      )}
    <div className="flex flex-1 overflow-hidden">
      {step === 'cart' && salesTab === 'promociones' && <PromotionsPanel />}
      {step === 'cart' && salesTab === 'ordenes'     && <OrdersPanel />}
      {step === 'cart' && salesTab === 'caja' ? (
        <>
          {/* Grilla de productos */}
          <div className="flex-1 overflow-y-auto p-4 min-w-0">
            <ProductGrid
              onSelect={setSelectedProduct}
              selectedId={selectedProduct?.id ?? null}
            />
          </div>

          {/* Panel de cantidad/peso */}
          <QuantityPanel
            product={selectedProduct}
            onAdd={handleAddToCart}
            onCancel={() => setSelectedProduct(null)}
          />

          {/* Carrito — solo items, sin pago */}
          <aside className="w-[400px] flex-shrink-0 border-l border-gray-800">
            <CartPanel
              mode="items"
              onGoToPayment={() => { setSelectedProduct(null); setStep('payment') }}
            />
          </aside>
        </>
      ) : step === 'payment' ? (
        /* Paso 2: Cobro — split layout */
        <>
          {/* LEFT: pantalla de cliente con el total */}
          <div className="flex-1 flex flex-col justify-center items-center bg-gray-950 border-r border-gray-800 gap-8 p-10 overflow-y-auto">
            {/* Lista de ítems */}
            {cart.length > 0 && (
              <div className="w-full max-w-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Detalle de venta</p>
                <div className="space-y-2">
                  {cart.map((item: any) => (
                    <div key={item.product.id} className="flex justify-between text-sm text-gray-300">
                      <span>
                        {item.product.requiresWeight
                          ? `${(item.weightKg ?? 0).toFixed(3)} kg`
                          : `${item.quantity}×`}{' '}
                        {item.product.name}
                      </span>
                      <span className="font-mono text-gray-200">{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-800 pt-2 flex justify-between text-xs text-gray-500">
                    <span>{cart.length} producto{cart.length !== 1 ? 's' : ''}</span>
                    <span className="font-mono">{fmt(Math.max(0, cartTotal() - discountAmount))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Banner dinámico: COBRAR / EXACTO / VUELTO */}
            {(() => {
              const finalTotal = Math.max(0, cartTotal() - discountAmount)
              const isVuelto  = checkoutVuelto > 0
              const isExact   = checkoutTotalPaid > 0 && checkoutTotalPaid === finalTotal

              if (isVuelto) {
                // Verde — hay vuelto
                return (
                  <div className="w-full max-w-lg rounded-2xl px-8 py-7 flex items-center justify-between gap-6"
                    style={{ border: '2px solid rgba(57,255,20,0.55)', background: 'rgba(57,255,20,0.06)',
                             boxShadow: '0 0 48px rgba(57,255,20,0.22), inset 0 0 24px rgba(57,255,20,0.04)' }}>
                    <span className="text-3xl font-black uppercase tracking-wide leading-tight"
                      style={{ color: '#39ff14', textShadow: '0 0 18px #39ff14, 0 0 36px #39ff1480' }}>
                      VUELTO<br />AL CLIENTE
                    </span>
                    <span className="text-5xl font-black font-mono"
                      style={{ color: '#39ff14', textShadow: '0 0 18px #39ff14, 0 0 36px #39ff14' }}>
                      {fmt(checkoutVuelto)}
                    </span>
                  </div>
                )
              }

              if (isExact) {
                // Azul — monto exacto
                return (
                  <div className="w-full max-w-lg rounded-2xl px-8 py-7 flex items-center justify-between gap-6"
                    style={{ border: '2px solid rgba(59,130,246,0.55)', background: 'rgba(59,130,246,0.06)',
                             boxShadow: '0 0 48px rgba(59,130,246,0.22), inset 0 0 24px rgba(59,130,246,0.04)' }}>
                    <span className="text-3xl font-black uppercase tracking-wide leading-tight"
                      style={{ color: '#3b82f6', textShadow: '0 0 18px #3b82f6, 0 0 36px #3b82f680' }}>
                      MONTO<br />EXACTO ✓
                    </span>
                    <span className="text-5xl font-black font-mono"
                      style={{ color: '#3b82f6', textShadow: '0 0 18px #3b82f6, 0 0 36px #3b82f6' }}>
                      {fmt(finalTotal)}
                    </span>
                  </div>
                )
              }

              // Rojo — cobrar (muestra saldo restante si ya hay algo ingresado)
              const remaining = finalTotal - checkoutTotalPaid
              return (
                <div className="w-full max-w-lg rounded-2xl px-8 py-7 flex items-center justify-between gap-6"
                  style={{ border: '2px solid rgba(255,7,58,0.55)', background: 'rgba(255,7,58,0.06)',
                           boxShadow: '0 0 48px rgba(255,7,58,0.22), inset 0 0 24px rgba(255,7,58,0.04)' }}>
                  <span className="text-3xl font-black uppercase tracking-wide leading-tight"
                    style={{ color: '#ff073a', textShadow: '0 0 18px #ff073a, 0 0 36px #ff073a80' }}>
                    {checkoutTotalPaid > 0 ? <>FALTA<br />COBRAR</> : <>COBRAR<br />A CLIENTE</>}
                  </span>
                  <span className="text-5xl font-black font-mono"
                    style={{ color: '#ff073a', textShadow: '0 0 18px #ff073a, 0 0 36px #ff073a' }}>
                    {fmt(remaining)}
                  </span>
                </div>
              )
            })()}
          </div>

          {/* RIGHT: panel de pago */}
          <div className="w-[380px] flex-shrink-0 border-l border-gray-800">
            <CartPanel
              mode="payment"
              onBack={() => setStep('cart')}
              onCheckoutComplete={() => setStep('cart')}
            />
          </div>
        </>
      ) : null}
    </div>
    </div>
  )
}
