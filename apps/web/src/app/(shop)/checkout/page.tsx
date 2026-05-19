'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Truck, Store, CreditCard, Banknote, ShoppingBag } from 'lucide-react'
import { clsx } from 'clsx'
import { useCartStore } from '../../../stores/cart-store'
import { apiClient } from '../../../lib/api-client'

// ─── Métodos de pago organizados ───────────────────────────

const ONLINE_METHODS = [
  {
    id: 'webpay',
    label: 'Webpay Plus',
    desc: 'Débito, crédito y prepago',
    logo: '🏦',
    badge: 'Transbank',
  },
  {
    id: 'amipass',
    label: 'Amipass',
    desc: 'Voucher de alimentación Sodexo',
    logo: '🎫',
    badge: 'Sodexo',
  },
  {
    id: 'edenred',
    label: 'Edenred',
    desc: 'Ticket Restaurant',
    logo: '🎟️',
    badge: 'Edenred',
  },
  {
    id: 'pluxee',
    label: 'Pluxee',
    desc: 'Beneficios y voucher alimentación',
    logo: '💳',
    badge: 'Pluxee',
  },
]

const DELIVERY_METHODS = [
  {
    id: 'cash',
    label: 'Efectivo',
    desc: 'Paga en efectivo al recibir',
    icon: Banknote,
  },
  {
    id: 'debit_card',
    label: 'Débito',
    desc: 'Terminal POS al recibir',
    icon: CreditCard,
  },
  {
    id: 'credit_card',
    label: 'Crédito',
    desc: 'Terminal POS al recibir',
    icon: CreditCard,
  },
]

// ─── Schema de validación ──────────────────────────────────

const checkoutSchema = z.object({
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName:  z.string().min(2, 'Apellido requerido'),
  email:     z.string().email('Email inválido'),
  phone:     z.string().regex(/^(\+56)?9\d{8}$/, 'Ej: +56912345678'),
  deliveryType: z.enum(['pickup', 'delivery']),
  street:    z.string().optional(),
  number:    z.string().optional(),
  commune:   z.string().optional(),
  notes:     z.string().optional(),
  paymentMethod: z.string().min(1, 'Selecciona un método de pago'),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

// ─── Componente ────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const items    = useCartStore(s => s.items)
  const total    = useCartStore(s => s.total)
  const clearCart = useCartStore(s => s.clearCart)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryType: 'delivery', paymentMethod: '' },
  })

  const deliveryType    = watch('deliveryType')
  const paymentMethod   = watch('paymentMethod')
  const isOnlinePayment = ONLINE_METHODS.some(m => m.id === paymentMethod)
  const deliveryFee     = deliveryType === 'delivery' ? 2990 : 0
  const orderTotal      = total() + deliveryFee

  const onSubmit = async (data: CheckoutForm) => {
    if (!items.length) { toast.error('Tu carrito está vacío'); return }

    setIsSubmitting(true)
    try {
      const orderPayload = {
        source: 'web',
        customerName:  `${data.firstName} ${data.lastName}`,
        customerEmail: data.email,
        customerPhone: data.phone,
        items: items.map(i => ({
          productId:   i.product.id,
          productName: i.product.name,
          productSku:  i.product.sku,
          quantity:    i.quantity,
          weightKg:    i.weightKg,
          unitPrice:   i.product.onlinePrice ?? i.product.basePrice,
          subtotal:    i.subtotal,
          discount:    0,
        })),
        deliveryType:    data.deliveryType,
        deliveryAddress: data.deliveryType === 'delivery' ? {
          street:  data.street!,
          number:  data.number!,
          commune: data.commune!,
          city:    'Santiago',
          region:  'Metropolitana',
        } : undefined,
        notes:         data.notes,
        paymentMethod: data.paymentMethod,
        // Pago online: pending hasta confirmar; contra entrega: pending hasta recibir
        paymentStatus:  isOnlinePayment ? 'pending' : 'pending',
        subtotal:       total(),
        discountTotal:  0,
        taxTotal:       0,
        deliveryFee,
        total:          orderTotal,
      }

      const order = await apiClient.post('/orders', orderPayload)
      const orderId = order.data.id

      // Redirigir según método de pago
      if (data.paymentMethod === 'webpay') {
        const pay = await apiClient.post('/payments/transbank/init', { orderId })
        clearCart()
        window.location.href = pay.data.redirectUrl
        return
      }

      if (data.paymentMethod === 'amipass') {
        const pay = await apiClient.post('/payments/amipass/init', { orderId })
        clearCart()
        window.location.href = pay.data.redirectUrl
        return
      }

      if (data.paymentMethod === 'edenred') {
        const pay = await apiClient.post('/payments/edenred/init', { orderId })
        clearCart()
        window.location.href = pay.data.redirectUrl
        return
      }

      if (data.paymentMethod === 'pluxee') {
        const pay = await apiClient.post('/payments/pluxee/init', { orderId })
        clearCart()
        window.location.href = pay.data.redirectUrl
        return
      }

      // Contra entrega: ir a confirmación directamente
      clearCart()
      router.push(`/orders/${orderId}/confirmation`)

    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al procesar el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!items.length) {
    router.replace('/products')
    return null
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Finalizar compra</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Columna izquierda ── */}
        <div className="space-y-5">

          {/* Datos de contacto */}
          <section className="card">
            <h2 className="text-lg font-semibold mb-4">Datos de contacto</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre</label>
                <input {...register('firstName')} className="input-field" placeholder="Juan" />
                {errors.firstName && <p className="error-text">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Apellido</label>
                <input {...register('lastName')} className="input-field" placeholder="González" />
                {errors.lastName && <p className="error-text">{errors.lastName.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input {...register('email')} type="email" className="input-field" placeholder="juan@gmail.com" />
                {errors.email && <p className="error-text">{errors.email.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="label">Teléfono</label>
                <input {...register('phone')} className="input-field" placeholder="+56912345678" />
                {errors.phone && <p className="error-text">{errors.phone.message}</p>}
              </div>
            </div>
          </section>

          {/* Tipo de entrega */}
          <section className="card">
            <h2 className="text-lg font-semibold mb-4">Entrega</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { value: 'delivery', label: 'Despacho a domicilio', icon: Truck,  desc: '$2.990' },
                { value: 'pickup',   label: 'Retiro en tienda',     icon: Store,  desc: 'Gratis' },
              ].map(opt => (
                <label key={opt.value}
                  className={clsx(
                    'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                    deliveryType === opt.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  )}>
                  <input type="radio" value={opt.value} {...register('deliveryType')} className="hidden" />
                  <opt.icon className={clsx('w-5 h-5', deliveryType === opt.value ? 'text-red-600' : 'text-gray-400')} />
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {deliveryType === 'delivery' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="label">Calle</label>
                    <input {...register('street')} className="input-field" placeholder="Av. Principal" />
                  </div>
                  <div>
                    <label className="label">Número</label>
                    <input {...register('number')} className="input-field" placeholder="123" />
                  </div>
                </div>
                <div>
                  <label className="label">Comuna</label>
                  <input {...register('commune')} className="input-field" placeholder="Las Condes" />
                </div>
                <div>
                  <label className="label">Instrucciones (opcional)</label>
                  <input {...register('notes')} className="input-field" placeholder="Dpto 4B, tocar timbre..." />
                </div>
              </div>
            )}
          </section>

          {/* Método de pago */}
          <section className="card">
            <h2 className="text-lg font-semibold mb-1">Método de pago</h2>
            {errors.paymentMethod && <p className="error-text mb-3">{errors.paymentMethod.message}</p>}

            {/* Pago online */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Pago online
              </p>
              <div className="space-y-2">
                {ONLINE_METHODS.map(m => (
                  <label key={m.id}
                    className={clsx(
                      'flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all',
                      paymentMethod === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    )}>
                    <input type="radio" value={m.id}
                      {...register('paymentMethod')}
                      onChange={() => setValue('paymentMethod', m.id)}
                      className="hidden" />
                    <span className="text-2xl w-8 text-center">{m.logo}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{m.label}</p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.badge}</span>
                      </div>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                    {paymentMethod === m.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Contra entrega (solo si es delivery) */}
            {deliveryType === 'delivery' && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Pago contra entrega
                </p>
                <div className="space-y-2">
                  {DELIVERY_METHODS.map(m => (
                    <label key={m.id}
                      className={clsx(
                        'flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all',
                        paymentMethod === m.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      )}>
                      <input type="radio" value={m.id}
                        {...register('paymentMethod')}
                        onChange={() => setValue('paymentMethod', m.id)}
                        className="hidden" />
                      <m.icon className={clsx('w-5 h-5', paymentMethod === m.id ? 'text-green-600' : 'text-gray-400')} />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{m.label}</p>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                      {paymentMethod === m.id && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Resumen pedido ── */}
        <div>
          <div className="card sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Tu pedido</h2>

            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate mr-2">
                    {item.product.name}
                    {item.weightKg ? ` · ${item.weightKg}kg` : ` · ×${item.quantity}`}
                  </span>
                  <span className="font-medium whitespace-nowrap">${item.subtotal.toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total().toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Despacho</span>
                <span>{deliveryFee === 0 ? 'Gratis' : `$${deliveryFee.toLocaleString('es-CL')}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-red-600">${orderTotal.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Aviso según método seleccionado */}
            {paymentMethod && !isOnlinePayment && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                <p className="font-semibold mb-0.5">Pago contra entrega</p>
                <p>El repartidor llevará terminal POS. Pagas al recibir tu pedido.</p>
              </div>
            )}
            {paymentMethod === 'webpay' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                <p className="font-semibold mb-0.5">Pago seguro Transbank</p>
                <p>Serás redirigido a Webpay Plus para completar el pago.</p>
              </div>
            )}
            {['amipass','edenred','pluxee'].includes(paymentMethod) && (
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
                <p className="font-semibold mb-0.5">Voucher de alimentación</p>
                <p>Serás redirigido al portal de pago de tu beneficio.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !paymentMethod}
              className={clsx(
                'w-full mt-5 font-bold py-4 rounded-xl transition-all text-white',
                !paymentMethod
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isOnlinePayment
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-green-600 hover:bg-green-500'
              )}
            >
              {isSubmitting
                ? 'Procesando...'
                : isOnlinePayment
                  ? `Pagar $${orderTotal.toLocaleString('es-CL')}`
                  : `Confirmar pedido · $${orderTotal.toLocaleString('es-CL')}`}
            </button>

            <p className="text-xs text-center text-gray-400 mt-3">
              {isOnlinePayment ? '🔒 Pago 100% seguro y encriptado' : '🚚 El repartidor va con terminal POS'}
            </p>
          </div>
        </div>

      </form>
    </main>
  )
}
