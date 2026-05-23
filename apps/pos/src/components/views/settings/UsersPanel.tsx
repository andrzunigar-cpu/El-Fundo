import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, Check, X, RefreshCw, Shield, User } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const api = () => (window as any).posAPI

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin:  { label: 'Administrador', color: 'bg-red-900/40 text-red-400 border-red-700/50' },
  cajero: { label: 'Cajero',        color: 'bg-blue-900/40 text-blue-400 border-blue-700/50' },
}

const EMPTY_FORM = { username: '', display_name: '', password: '', role: 'cajero' }

export function UsersPanel() {
  const [users, setUsers]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [editing, setEditing]   = useState<any | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api().users.getAll()
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowNew(true)
  }

  const openEdit = (u: any) => {
    setShowNew(false)
    setEditing(u)
    setForm({ username: u.username, display_name: u.display_name, password: '', role: u.role })
  }

  const cancel = () => { setShowNew(false); setEditing(null) }

  const save = async () => {
    if (!form.username.trim())     return toast.error('Usuario requerido')
    if (!form.display_name.trim()) return toast.error('Nombre requerido')
    if (!editing && !form.password.trim()) return toast.error('Contraseña requerida para usuario nuevo')
    setSaving(true)
    try {
      if (editing) {
        await api().users.update(editing.id, {
          username:     form.username,
          display_name: form.display_name,
          password:     form.password || undefined,
          role:         form.role,
          is_active:    editing.is_active,
        })
        toast.success('Usuario actualizado')
      } else {
        await api().users.create(form)
        toast.success('Usuario creado')
      }
      cancel()
      load()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: any) => {
    try {
      await api().users.update(u.id, { ...u, is_active: u.is_active ? 0 : 1, password: undefined })
      load()
    } catch (e: any) {
      toast.error(e.message ?? 'Error')
    }
  }

  const del = async (u: any) => {
    if (!confirm(`¿Eliminar usuario "${u.display_name}"?`)) return
    setDeleting(u.id)
    try {
      await api().users.delete(u.id)
      toast.success('Usuario eliminado')
      load()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Usuarios</h2>
          <p className="text-xs text-gray-500 mt-0.5">Gestiona quién puede acceder a la configuración.</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-all">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {/* Formulario nuevo / editar */}
      {(showNew || editing) && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre para mostrar">
              <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="Ej: María González"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
            <Field label="Usuario (login)">
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Ej: maria"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
            <Field label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={editing ? '••••••••' : 'Contraseña'}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </Field>
            <Field label="Rol">
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                <option value="cajero">Cajero</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            <button onClick={cancel}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const meta = ROLE_META[u.role] ?? ROLE_META.cajero
            const isEditing = editing?.id === u.id
            return (
              <div key={u.id}
                className={clsx('bg-gray-900 border rounded-xl px-5 py-4 flex items-center gap-4',
                  isEditing ? 'border-red-600' : 'border-gray-800',
                  !u.is_active && 'opacity-50')}>
                {/* Avatar */}
                <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  u.role === 'admin' ? 'bg-red-900/50' : 'bg-gray-800')}>
                  {u.role === 'admin'
                    ? <Shield className="w-5 h-5 text-red-400" />
                    : <User className="w-5 h-5 text-gray-400" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{u.display_name}</span>
                    <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', meta.color)}>
                      {meta.label}
                    </span>
                    {!u.is_active && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">@{u.username}</p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(u)} title="Editar"
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleActive(u)} title={u.is_active ? 'Desactivar' : 'Activar'}
                    className={clsx('p-2 rounded-lg transition-colors text-xs font-semibold px-2.5',
                      u.is_active
                        ? 'text-gray-500 hover:text-orange-400 hover:bg-orange-900/20'
                        : 'text-gray-500 hover:text-green-400 hover:bg-green-900/20')}>
                    {u.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => del(u)} disabled={deleting === u.id} title="Eliminar"
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
                    {deleting === u.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
