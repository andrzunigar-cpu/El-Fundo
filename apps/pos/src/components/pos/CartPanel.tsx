import React, { useState } from 'react'
import { Trash2, CreditCard, Banknote, User, Printer, ChevronRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePOSStore } from '../../stores/posStore'
import { clsx } from 'clsx'

const PAYMENT_METHODS = [
  { id: 'cash',        label: 'Efectivo',  icon: Banknote },
  { id: 'debit_card',  label: 'Débito',    icon: CreditCard },
  { id: 'credit_card', label: 'Crédito',   icon: CreditCard },
  { id: 'amipass',     label: 'Amipass',   icon: CreditCard },
  { id: 'edenred',     label: 'Edenred',   icon: CreditCard },
  { id: 'pluxee',      label: 'Pluxee',    icon: CreditCard },
]

export function CartPanel() {
  const {
    cart, selectedCustomer, paymentMethod, notes,
    removeFromCart, clearCart, setPaymentMethod, setNotes,
    cartTotal, cartItemCount,
  } = usePOSStore()

  const [isProcessing, setIsProcessing] = useState(false)

  const formatCLP = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito')
      return
    }

    setIsProcessing(true)
    const api = (window as any).posAPI

    try {
      const orderData = {
        source: 'pos',
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
        customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : undefined,
        paymentMethod,
        paymentStatus: 'paid',
        deliveryType: 'pickup',
        subtotal: cartTotal(),
        discountTotal: 0,
        taxTotal: 0,
        total: cartTotal(),
        deliveryFee: 0,
        notes,
      }

      const order = await api.orders.create(orderData)

      // Imprimir ticket automáticamente
      await api.printer.printTicket(order)

      toast.success(`Venta completada — ${order.orderNumber}`, { duration: 3000 })
      clearCart()
    } catch (err: any) {
      toast.error(`Error al procesar: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header carrito */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-bold text-lg">Carrito ({cartItemCount()})</h2>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-gray-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Ítems */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {cart.length === 0 ? (
          <div className="text-center text-gray-600 mt-8">
            <ShoppingBagIcon />
            <p className="mt-2 text-sm">Agrega productos para comenzar</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.product.name}</p>
                <p className="text-gray-400 text-xs">
                  {item.product.requiresWeight
                    ? `${item.weightKg?.toFixed(3)} kg × ${formatCLP(item.product.basePrice)}/kg`
                    : `${item.quantity} × ${formatCLP(item.product.basePrice)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{formatCLP(item.subtotal)}</p>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cliente */}
      <div className="px-4 py-2 border-t border-gray-800">
        <button className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <User className="w-4 h-4" />
          {selectedCustomer
            ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
            : 'Agregar cliente (opcional)'}
        </button>
      </div>

      {/* Método de pago */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Pago</p>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPaymentMethod(id)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                paymentMethod === id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Total y cobrar */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">Total</span>
          <span className="text-3xl font-black text-white">{formatCLP(cartTotal())}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isProcessing || cart.length === 0}
          className={clsx(
            'w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
            cart.length === 0
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
          )}
        >
          {isProcessing ? (
            <RefreshCwIcon className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Printer className="w-5 h-5" />
              Cobrar {cart.length > 0 ? formatCLP(cartTotal()) : ''}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ShoppingBagIcon() {
  return (
    <svg className="w-12 h-12 mx-auto text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}

function RefreshCwIcon({ className }: { className?: string }) {
  return <RefreshCw className={className} />
}
