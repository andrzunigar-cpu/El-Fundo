import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Truck, Phone, Mail, MapPin, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

interface Supplier {
  id: string
  name: string
  rut?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  status: string
}

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [editing, setEditing]     = useState<Supplier | null>(null)
  const [search, setSearch]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await (window as any).posAPI.suppliers.getAll()
    setSuppliers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`¿Eliminar proveedor "${s.name}"?`)) return
    await (window as any).posAPI.suppliers.delete(s.id)
    toast.success('Proveedor eliminado')
    load()
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.rut ?? '').includes(search)
  )

  return (
    <div className="h-full flex flex-col">
      {/* toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="flex-1 max-w-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
        />
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo proveedor
        </button>
      </div>

      {/* stats */}
      <div className="px-4 py-3 border-b border-gray-800 text-sm text-gray-400">
        {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}
      </div>

      {/* tabla */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
            <Truck className="w-12 h-12 opacity-30" />
            <p className="text-sm">
              {search ? 'Sin resultados' : 'Aún no hay proveedores. Crea el primero.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
              <tr>
                <th className="py-3 px-3">Nombre</th>
                <th className="py-3 px-3">RUT</th>
                <th className="py-3 px-3">Teléfono</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Dirección</th>
                <th className="py-3 px-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-800/40 hover:bg-gray-900 group">
                  <td className="py-3 px-3 font-medium">{s.name}</td>
                  <td className="py-3 px-3 text-gray-400 font-mono text-xs">{s.rut || '—'}</td>
                  <td className="py-3 px-3 text-gray-400">{s.phone || '—'}</td>
                  <td className="py-3 px-3 text-gray-400">{s.email || '—'}</td>
                  <td className="py-3 px-3 text-gray-400 truncate max-w-[180px]">{s.address || '—'}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing(s)}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 hover:bg-red-900/40 rounded text-gray-400 hover:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <SupplierModal
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load() }}
        />
      )}
      {editing && (
        <SupplierModal
          supplier={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

// ── Modal crear / editar ──────────────────────────────────
function SupplierModal({ supplier, onClose, onSaved }: {
  supplier?: Supplier
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!supplier
  const [form, setForm] = useState({
    name:    supplier?.name    ?? '',
    rut:     supplier?.rut     ?? '',
    phone:   supplier?.phone   ?? '',
    email:   supplier?.email   ?? '',
    address: supplier?.address ?? '',
    notes:   supplier?.notes   ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return }
    setSaving(true)
    const api = (window as any).posAPI
    try {
      if (isEdit) {
        await api.suppliers.update(supplier!.id, form)
        toast.success('Proveedor actualizado')
      } else {
        await api.suppliers.create(form)
        toast.success('Proveedor creado')
      }
      onSaved()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 rounded-xl w-[520px] border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <Field label="Nombre *" icon={Truck}>
            <input autoFocus value={form.name} onChange={set('name')} placeholder="Carnes del Sur SpA"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </Field>

          <Field label="RUT" icon={Hash}>
            <input value={form.rut} onChange={set('rut')} placeholder="76.123.456-7"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" icon={Phone}>
              <input value={form.phone} onChange={set('phone')} placeholder="+56 9 1234 5678"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
            <Field label="Email" icon={Mail}>
              <input value={form.email} onChange={set('email')} placeholder="contacto@proveedor.cl"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
          </div>

          <Field label="Dirección" icon={MapPin}>
            <input value={form.address} onChange={set('address')} placeholder="Av. Industrial 1234, Santiago"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </Field>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notas</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Observaciones opcionales..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none" />
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }: any) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      {children}
    </div>
  )
}
