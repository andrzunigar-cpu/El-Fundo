import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Check, X, Banknote, CreditCard, Globe, Bike, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

type Method = {
  method: string
  label: string
  commission_pct: number
  is_active: number
  category: string
  channel: string | null
  sort_order: number
  show_online: number
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; border: string; bg: string }> = {
  offline:         { label: 'Pago presencial',   icon: Banknote, color: 'text-green-400',  border: 'border-green-900/50',  bg: 'bg-green-950/10' },
  online_web:      { label: 'Online web',         icon: Globe,    color: 'text-blue-400',   border: 'border-blue-900/50',   bg: 'bg-blue-950/10'  },
  online_delivery: { label: 'Delivery (apps)',    icon: Bike,     color: 'text-orange-400', border: 'border-orange-900/50', bg: 'bg-orange-950/10'},
}

const CHANNEL_OPTS = [
  { value: null,      label: 'Sin canal' },
  { value: 'reparto', label: 'Reparto'   },
  { value: 'local',   label: 'Local'     },
]

function EditRow({ m, onSave, onCancel }: { m: Method; onSave: (d: Method) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Method>({ ...m })
  return (
    <tr className="bg-gray-900/60">
      <td className="py-2 px-3">
        <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500" />
      </td>
      <td className="py-2 px-2">
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, channel: null }))}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-red-500 w-full">
          <option value="offline">Presencial</option>
          <option value="online_web">Online web</option>
          <option value="online_delivery">Delivery</option>
        </select>
      </td>
      <td className="py-2 px-2">
        {form.category === 'online_delivery' ? (
          <select value={form.channel ?? ''} onChange={e => setForm(f => ({ ...f, channel: e.target.value || null }))}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-red-500 w-full">
            {CHANNEL_OPTS.map(o => <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>)}
          </select>
        ) : <span className="text-xs text-gray-600">—</span>}
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center gap-1">
          <input type="number" step="0.1" min="0" max="100"
            value={form.commission_pct}
            onChange={e => setForm(f => ({ ...f, commission_pct: parseFloat(e.target.value) || 0 }))}
            className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-red-500" />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </td>
      <td className="py-2 px-2">
        {form.category === 'offline' && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={form.show_online === 1}
              onChange={e => setForm(f => ({ ...f, show_online: e.target.checked ? 1 : 0 }))}
              className="rounded" />
            <span className="text-[10px] text-gray-400">tb. online</span>
          </label>
        )}
      </td>
      <td className="py-2 px-2 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => onSave(form)} className="p-1.5 hover:bg-green-900 rounded">
            <Check className="w-3.5 h-3.5 text-green-400" />
          </button>
          <button onClick={onCancel} className="p-1.5 hover:bg-red-900/50 rounded">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    method: '', label: '', commission_pct: 0,
    category: 'offline', channel: null as string | null,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.label.trim()) { toast.error('Nombre obligatorio'); return }
    if (!form.method.trim()) { toast.error('Clave (method) obligatoria'); return }
    setSaving(true)
    try {
      const res = await (window as any).posAPI.paymentSettings.create(form)
      if (!res.success) { toast.error(res.message ?? 'Error'); setSaving(false); return }
      toast.success('Medio de pago creado')
      onSaved(); onClose()
    } catch { toast.error('Error al guardar'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">Nuevo medio de pago</h3>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Nombre visible *</label>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ej: Mercado Pago"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Clave interna * <span className="text-gray-600">(sin espacios)</span></label>
          <input value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value.replace(/\s+/g, '_').toLowerCase() }))}
            placeholder="mercado_pago"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, channel: null }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              <option value="offline">Presencial</option>
              <option value="online_web">Online web</option>
              <option value="online_delivery">Delivery</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Comisión %</label>
            <input type="number" step="0.1" min="0" max="100" value={form.commission_pct}
              onChange={e => setForm(f => ({ ...f, commission_pct: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
        </div>

        {form.category === 'online_delivery' && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Canal</label>
            <select value={form.channel ?? ''} onChange={e => setForm(f => ({ ...f, channel: e.target.value || null }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              {CHANNEL_OPTS.map(o => <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm font-medium hover:bg-gray-700">Cancelar</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MethodGroup({ category, methods, editing, onEdit, onSave, onCancel, onToggle, onDelete }: any) {
  const meta = CATEGORY_META[category]
  if (!meta || methods.length === 0) return null
  const Icon = meta.icon
  const channelLabel = (ch: string | null) =>
    ch === 'reparto' ? '🛵 Reparto' : ch === 'local' ? '🏪 Local' : null

  return (
    <div className={clsx('rounded-2xl border p-4', meta.bg, meta.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={clsx('w-4 h-4', meta.color)} />
        <h3 className={clsx('font-bold text-sm', meta.color)}>{meta.label}</h3>
        <span className="text-xs text-gray-500 ml-auto">{methods.length} métodos</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-700/50">
            <th className="pb-2 pl-1">Nombre</th>
            {category === 'online_delivery' && <th className="pb-2">Canal</th>}
            <th className="pb-2 text-right">Comisión</th>
            {category === 'offline' && <th className="pb-2 text-center text-[10px]">+Online</th>}
            <th className="pb-2 text-right pr-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {methods.map((m: Method) =>
            editing === m.method ? (
              <EditRow key={m.method} m={m} onSave={onSave} onCancel={onCancel} />
            ) : (
              <tr key={m.method} className={clsx('border-b border-gray-700/20 last:border-0',
                !m.is_active && 'opacity-40')}>
                <td className="py-2.5 pl-1">
                  <p className="font-medium">{m.label}</p>
                  <p className="text-[10px] font-mono text-gray-600">{m.method}</p>
                </td>
                {category === 'online_delivery' && (
                  <td className="py-2.5">
                    {m.channel ? (
                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{channelLabel(m.channel)}</span>
                    ) : <span className="text-xs text-gray-600">—</span>}
                  </td>
                )}
                <td className="py-2.5 text-right">
                  <span className={clsx('text-sm font-bold', m.commission_pct > 0 ? 'text-red-400' : 'text-green-400')}>
                    {m.commission_pct > 0 ? `${m.commission_pct}%` : 'Gratis'}
                  </span>
                </td>
                {category === 'offline' && (
                  <td className="py-2.5 text-center">
                    {m.show_online === 1
                      ? <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded-full">Sí</span>
                      : <span className="text-[10px] text-gray-700">—</span>}
                  </td>
                )}
                <td className="py-2.5 pr-1">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onToggle(m.method)} title={m.is_active ? 'Desactivar' : 'Activar'}
                      className="p-1 hover:bg-gray-700 rounded">
                      {m.is_active
                        ? <ToggleRight className="w-4 h-4 text-green-400" />
                        : <ToggleLeft className="w-4 h-4 text-gray-600" />}
                    </button>
                    <button onClick={() => onEdit(m.method)} className="p-1 hover:bg-gray-700 rounded">
                      <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                    </button>
                    <button onClick={() => onDelete(m.method)} className="p-1 hover:bg-red-900/50 rounded">
                      <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PaymentMethodsPanel() {
  const [methods, setMethods] = useState<Method[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await (window as any).posAPI.paymentSettings.getAll()
    setMethods(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (m: Method) => {
    await (window as any).posAPI.paymentSettings.updateFull(m)
    toast.success('Actualizado')
    setEditing(null)
    load()
  }

  const handleToggle = async (method: string) => {
    await (window as any).posAPI.paymentSettings.toggleActive(method)
    load()
  }

  const handleDelete = async (method: string) => {
    const res = await (window as any).posAPI.paymentSettings.delete(method)
    if (!res.success) { toast.error(res.message ?? 'No se puede eliminar'); return }
    toast.success('Eliminado')
    load()
  }

  const grouped = {
    offline:         methods.filter(m => m.category === 'offline'),
    online_web:      methods.filter(m => m.category === 'online_web'),
    online_delivery: methods.filter(m => m.category === 'online_delivery'),
  }

  if (loading) return <div className="text-center text-gray-500 py-8">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Activa/desactiva métodos, edita la comisión que cobra cada uno y ve el neto en reportes.
        </p>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
          <Plus className="w-4 h-4" /> Nuevo método
        </button>
      </div>

      {(['offline', 'online_web', 'online_delivery'] as const).map(cat => (
        <MethodGroup
          key={cat}
          category={cat}
          methods={grouped[cat]}
          editing={editing}
          onEdit={setEditing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  )
}
