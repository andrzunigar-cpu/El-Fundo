'use client'

import { useEffect, useState } from 'react'
import { Save, Loader, Store, Truck, Clock, Phone, MapPin, MessageCircle, CreditCard, ToggleLeft, ToggleRight, AlertCircle, CheckCircle, WrenchIcon } from 'lucide-react'

interface Settings {
  store_name:        string
  store_phone:       string
  store_address:     string
  store_hours:       string
  whatsapp:          string
  delivery_price:    number
  min_order:         number
  delivery_active:   boolean
  store_open:        boolean
  webpay_active:     boolean
  maintenance_mode:  boolean
}

const DEFAULTS: Settings = {
  store_name:        'Carnicería El Fundo',
  store_phone:     '+56 9 XXXX XXXX',
  store_address:   'Santiago, Chile',
  store_hours:     'Lun–Sáb 8:00–20:00, Dom 9:00–14:00',
  whatsapp:        '',
  delivery_price:  2990,
  min_order:       5000,
  delivery_active:   true,
  store_open:        true,
  webpay_active:     true,
  maintenance_mode:  false,
}

export default function ConfiguracionAdmin() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => { setSettings({ ...DEFAULTS, ...data }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  // Aplica/quita la cookie de mantención inmediatamente al toggle
  const toggleMaintenance = (val: boolean) => {
    set('maintenance_mode', val)
    if (val) {
      document.cookie = 'maintenance_mode=true; path=/; max-age=86400; SameSite=Lax'
    } else {
      document.cookie = 'maintenance_mode=; path=/; max-age=0; SameSite=Lax'
    }
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    // Sincronizar cookie con el estado guardado
    if (settings.maintenance_mode) {
      document.cookie = 'maintenance_mode=true; path=/; max-age=86400; SameSite=Lax'
    } else {
      document.cookie = 'maintenance_mode=; path=/; max-age=0; SameSite=Lax'
    }
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      localStorage.setItem('store_settings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      localStorage.setItem('store_settings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Cargando configuración...</div>

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 text-sm mt-1">Ajusta la información y comportamiento de tu tienda</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 ${
            saved ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {saving ? <><Loader className="w-4 h-4 animate-spin" /> Guardando...</> :
           saved  ? <><CheckCircle className="w-4 h-4" /> Guardado</> :
           <><Save className="w-4 h-4" /> Guardar cambios</>}
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-6">

        {/* ── MODO MANTENCIÓN (tarjeta destacada) ── */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          settings.maintenance_mode
            ? 'bg-orange-50 border-orange-400'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${settings.maintenance_mode ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <WrenchIcon className={`w-5 h-5 ${settings.maintenance_mode ? 'text-orange-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Modo Mantención</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {settings.maintenance_mode
                    ? '⚠️ El sitio está en mantención — los clientes ven la página de mantención'
                    : 'El sitio está visible para todos los clientes'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleMaintenance(!settings.maintenance_mode)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${
                settings.maintenance_mode ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                settings.maintenance_mode ? 'translate-x-9' : 'translate-x-1'
              }`} />
            </button>
          </div>
          {settings.maintenance_mode && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-sm font-medium">
                🔒 Los clientes ven la pantalla de mantención. Tú (admin) sigues teniendo acceso normal.
              </span>
              <a
                href="/mantencion"
                target="_blank"
                className="ml-auto text-xs font-semibold text-orange-700 underline whitespace-nowrap"
              >
                Ver página →
              </a>
            </div>
          )}
        </div>

        {/* ── Estado de la tienda ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-red-600" /> Estado de la tienda
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-800 text-sm">Tienda abierta</p>
                <p className="text-xs text-gray-500 mt-0.5">Los clientes pueden hacer pedidos online</p>
              </div>
              <button
                onClick={() => set('store_open', !settings.store_open)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  settings.store_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {settings.store_open
                  ? <><ToggleRight className="w-5 h-5" /> Abierta</>
                  : <><ToggleLeft className="w-5 h-5" /> Cerrada</>}
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-800 text-sm">Pago con WebPay</p>
                <p className="text-xs text-gray-500 mt-0.5">Habilitar pago online con tarjeta</p>
              </div>
              <button
                onClick={() => set('webpay_active', !settings.webpay_active)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  settings.webpay_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {settings.webpay_active
                  ? <><CreditCard className="w-4 h-4" /> Activo</>
                  : <><CreditCard className="w-4 h-4" /> Inactivo</>}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-800 text-sm">Servicio de delivery</p>
                <p className="text-xs text-gray-500 mt-0.5">Ofrecer despacho a domicilio</p>
              </div>
              <button
                onClick={() => set('delivery_active', !settings.delivery_active)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  settings.delivery_active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {settings.delivery_active
                  ? <><Truck className="w-4 h-4" /> Activo</>
                  : <><Truck className="w-4 h-4" /> Inactivo</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Información de la tienda ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-600" /> Información de contacto
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tienda</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={e => set('store_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Teléfono
                </label>
                <input
                  type="tel"
                  value={settings.store_phone}
                  onChange={e => set('store_phone', e.target.value)}
                  placeholder="+56 9 XXXX XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-green-600" /> WhatsApp
                </label>
                <input
                  type="tel"
                  value={settings.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder="+56 9 XXXX XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Dirección
              </label>
              <input
                type="text"
                value={settings.store_address}
                onChange={e => set('store_address', e.target.value)}
                placeholder="Calle, número, comuna, Santiago"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Horario de atención
              </label>
              <input
                type="text"
                value={settings.store_hours}
                onChange={e => set('store_hours', e.target.value)}
                placeholder="Lun–Sáb 8:00–20:00, Dom 9:00–14:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* ── Delivery ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-red-600" /> Configuración de delivery
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo de despacho</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={settings.delivery_price}
                  onChange={e => set('delivery_price', Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">0 = despacho gratis</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={settings.min_order}
                  onChange={e => set('min_order', Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">0 = sin mínimo</p>
            </div>
          </div>
        </div>

        {/* Guardar abajo */}
        <div className="flex justify-end pb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition disabled:opacity-50 ${
              saved ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {saving ? <><Loader className="w-4 h-4 animate-spin" /> Guardando...</> :
             saved  ? <><CheckCircle className="w-4 h-4" /> Guardado exitosamente</> :
             <><Save className="w-4 h-4" /> Guardar configuración</>}
          </button>
        </div>
      </div>
    </div>
  )
}
