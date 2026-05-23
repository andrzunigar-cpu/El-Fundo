import React, { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Check, X, Lock, ToggleLeft, ToggleRight } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

// ── Paleta de colores disponibles ──────────────────────────
const COLORS = [
  { id: 'red',    label: 'Rojo',    dot: 'bg-red-500',    ring: 'ring-red-500'    },
  { id: 'orange', label: 'Naranja', dot: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'amber',  label: 'Ámbar',   dot: 'bg-amber-500',  ring: 'ring-amber-500'  },
  { id: 'yellow', label: 'Amarillo',dot: 'bg-yellow-400', ring: 'ring-yellow-400' },
  { id: 'lime',   label: 'Lima',    dot: 'bg-lime-500',   ring: 'ring-lime-500'   },
  { id: 'green',  label: 'Verde',   dot: 'bg-green-500',  ring: 'ring-green-500'  },
  { id: 'teal',   label: 'Teal',    dot: 'bg-teal-500',   ring: 'ring-teal-500'   },
  { id: 'cyan',   label: 'Cyan',    dot: 'bg-cyan-500',   ring: 'ring-cyan-500'   },
  { id: 'sky',    label: 'Celeste', dot: 'bg-sky-500',    ring: 'ring-sky-500'    },
  { id: 'blue',   label: 'Azul',    dot: 'bg-blue-500',   ring: 'ring-blue-500'   },
  { id: 'violet', label: 'Violeta', dot: 'bg-violet-500', ring: 'ring-violet-500' },
  { id: 'pink',   label: 'Rosa',    dot: 'bg-pink-500',   ring: 'ring-pink-500'   },
  { id: 'rose',   label: 'Fresa',   dot: 'bg-rose-500',   ring: 'ring-rose-500'   },
  { id: 'slate',  label: 'Gris',    dot: 'bg-slate-400',  ring: 'ring-slate-400'  },
  { id: 'gray',   label: 'Neutro',  dot: 'bg-gray-500',   ring: 'ring-gray-500'   },
]

const dotClass = (color: string) =>
  COLORS.find(c => c.id === color)?.dot ?? 'bg-gray-500'

const CORE = ['cat-vacuno', 'cat-cerdo', 'cat-cordero', 'cat-pollo', 'cat-embutidos']

// ── Subcomponente: modal para crear ────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [sort, setSort] = useState('99')
  const [color, setColor] = useState('gray')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 30) }, [])

  const save = async () => {
    if (!name.trim()) { toast.error('Ingresa un nombre'); return }
    setSaving(true)
    try {
      const api = (window as any).posAPI
      await api.categories.create({ name: name.trim(), sort_order: parseInt(sort) || 99, color })
      toast.success(`Categoría "${name.trim()}" creada`)
      onCreated()
      onClose()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-base mb-4">Nueva categoría</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nombre</label>
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose() }}
              placeholder="Ej: Aves, Mariscos…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Orden (menor = primero)</label>
            <input
              type="number"
              value={sort}
              onChange={e => setSort(e.target.value)}
              min={1}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={clsx(
                    'w-6 h-6 rounded-full transition-all',
                    c.dot,
                    color === c.id ? `ring-2 ring-offset-2 ring-offset-gray-900 ${c.ring} scale-125` : 'opacity-70 hover:opacity-100 hover:scale-110'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando…' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Fila editable ───────────────────────────────────────────
function CategoryRow({ cat, onRefresh }: { cat: any; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)
  const [sort, setSort] = useState(String(cat.sort_order ?? 99))
  const [color, setColor] = useState(cat.color ?? 'gray')
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isCore = CORE.includes(cat.id)
  const isActive = cat.status === 'active'

  useEffect(() => {
    if (editing) setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 30)
  }, [editing])

  const saveEdit = async () => {
    if (!name.trim()) { toast.error('El nombre no puede estar vacío'); return }
    setSaving(true)
    try {
      const api = (window as any).posAPI
      await api.categories.update(cat.id, { name: name.trim(), sort_order: parseInt(sort) || 99, color })
      toast.success('Categoría actualizada')
      setEditing(false)
      onRefresh()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    }
    setSaving(false)
  }

  const cancelEdit = () => {
    setName(cat.name)
    setSort(String(cat.sort_order ?? 99))
    setColor(cat.color ?? 'gray')
    setEditing(false)
  }

  const toggle = async () => {
    try {
      const api = (window as any).posAPI
      await api.categories.toggleStatus(cat.id)
      onRefresh()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    }
  }

  const deleteCat = async () => {
    try {
      const api = (window as any).posAPI
      const r = await api.categories.delete(cat.id)
      if (!r.success) { toast.error(r.message ?? 'No se pudo eliminar'); return }
      toast.success(`"${cat.name}" eliminada`)
      onRefresh()
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
    }
  }

  return (
    <div className={clsx(
      'rounded-xl border transition-all',
      isActive
        ? 'bg-gray-800 border-gray-700'
        : 'bg-gray-900 border-gray-800 opacity-60',
    )}>
      {editing ? (
        /* ── Modo edición ── */
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className={clsx('w-3 h-3 rounded-full flex-shrink-0', dotClass(color))} />
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
            />
            <input
              type="number"
              value={sort}
              onChange={e => setSort(e.target.value)}
              min={1}
              title="Orden"
              className="w-16 bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Selector de color */}
          <div className="flex flex-wrap gap-1.5 pl-5">
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                title={c.label}
                className={clsx(
                  'w-5 h-5 rounded-full transition-all',
                  c.dot,
                  color === c.id
                    ? `ring-2 ring-offset-1 ring-offset-gray-800 ${c.ring} scale-125`
                    : 'opacity-60 hover:opacity-100 hover:scale-110'
                )}
              />
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={cancelEdit}
              className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-600 flex items-center gap-1">
              <X className="w-3 h-3" /> Cancelar
            </button>
            <button onClick={saveEdit} disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50">
              <Check className="w-3 h-3" /> Guardar
            </button>
          </div>
        </div>
      ) : (
        /* ── Modo vista ── */
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Color dot */}
          <div className={clsx('w-3 h-3 rounded-full flex-shrink-0', dotClass(color))} />

          {/* Nombre + badge */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-white">{cat.name}</span>
            {isCore && (
              <span className="ml-2 text-[10px] text-gray-500 font-mono bg-gray-700 px-1.5 py-0.5 rounded">
                base
              </span>
            )}
          </div>

          {/* Orden */}
          <span className="text-[11px] text-gray-600 font-mono w-6 text-center">{cat.sort_order}</span>

          {/* Toggle encender/apagar */}
          <button
            onClick={toggle}
            title={isActive ? 'Apagar categoría' : 'Encender categoría'}
            className={clsx(
              'flex-shrink-0 transition-colors',
              isActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-600 hover:text-gray-400'
            )}>
            {isActive
              ? <ToggleRight className="w-5 h-5" />
              : <ToggleLeft className="w-5 h-5" />}
          </button>

          {/* Editar */}
          <button
            onClick={() => setEditing(true)}
            className="flex-shrink-0 text-gray-500 hover:text-blue-400 transition-colors p-1">
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Eliminar */}
          {isCore ? (
            <div className="flex-shrink-0 text-gray-700 p-1" title="Categoría base, no eliminable">
              <Lock className="w-3.5 h-3.5" />
            </div>
          ) : confirmDel ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-red-400">¿Borrar?</span>
              <button onClick={deleteCat}
                className="text-red-400 hover:text-red-300 p-0.5">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDel(false)}
                className="text-gray-500 hover:text-gray-300 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="flex-shrink-0 text-gray-500 hover:text-red-400 transition-colors p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ────────────────────────────────────
export function CategoriesPanel() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    try {
      const api = (window as any).posAPI
      const data = await api.categories.getAll()
      setCategories(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const active   = categories.filter(c => c.status === 'active')
  const inactive = categories.filter(c => c.status !== 'active')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Categorías</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {active.length} activas · {inactive.length} inactivas
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-10 rounded-xl bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Activas */}
          {active.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold px-1">Activas</p>
              {active.map(cat => (
                <CategoryRow key={cat.id} cat={cat} onRefresh={load} />
              ))}
            </div>
          )}

          {/* Inactivas */}
          {inactive.length > 0 && (
            <div className="space-y-1.5 mt-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold px-1">Inactivas</p>
              {inactive.map(cat => (
                <CategoryRow key={cat.id} cat={cat} onRefresh={load} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal crear */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
