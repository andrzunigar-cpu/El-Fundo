'use client'

import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import {
  Mail, Plus, Trash2, RefreshCw, CheckCircle2,
  Clock, AlertCircle, Copy, ExternalLink, X,
  User, Briefcase, ShoppingBag, Settings, Info,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type AccountStatus = 'pendiente' | 'activo' | 'inactivo'
type AccountRole   = 'general' | 'ventas' | 'pedidos' | 'admin' | 'otro'

interface EmailAccount {
  id:          string
  name:        string
  email:       string
  role:        AccountRole
  description: string
  status:      AccountStatus
  created_at:  string
}

// ── Constantes ────────────────────────────────────────────────────────────────

const ROLES: Record<AccountRole, { label: string; icon: React.ElementType; color: string }> = {
  general:  { label: 'General',   icon: User,       color: 'bg-gray-100 text-gray-700' },
  ventas:   { label: 'Ventas',    icon: Briefcase,  color: 'bg-blue-100 text-blue-700' },
  pedidos:  { label: 'Pedidos',   icon: ShoppingBag,color: 'bg-purple-100 text-purple-700' },
  admin:    { label: 'Admin',     icon: Settings,   color: 'bg-red-100 text-red-700' },
  otro:     { label: 'Otro',      icon: Mail,       color: 'bg-yellow-100 text-yellow-700' },
}

const STATUS_CONFIG: Record<AccountStatus, { label: string; icon: React.ElementType; color: string }> = {
  pendiente: { label: 'Pendiente',  icon: Clock,         color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  activo:    { label: 'Activo',     icon: CheckCircle2,  color: 'bg-green-100 text-green-700 border-green-200' },
  inactivo:  { label: 'Inactivo',   icon: AlertCircle,   color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const SUGERIDOS = [
  { prefix: 'contacto',   name: 'Contacto General',  role: 'general' as AccountRole },
  { prefix: 'ventas',     name: 'Equipo Ventas',      role: 'ventas'  as AccountRole },
  { prefix: 'pedidos',    name: 'Gestión Pedidos',    role: 'pedidos' as AccountRole },
  { prefix: 'admin',      name: 'Administración',     role: 'admin'   as AccountRole },
  { prefix: 'info',       name: 'Información',        role: 'general' as AccountRole },
]

const DOMAIN = 'carniceriaelfundo.cl'

// ── Componente principal ──────────────────────────────────────────────────────

export default function CorreosPage() {
  const [accounts, setAccounts]       = useState<EmailAccount[]>([])
  const [loading, setLoading]         = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [showGuide, setShowGuide]     = useState(false)
  const [deleting, setDeleting]       = useState<string | null>(null)

  // Formulario
  const [fPrefix, setFPrefix]   = useState('')
  const [fName, setFName]       = useState('')
  const [fRole, setFRole]       = useState<AccountRole>('general')
  const [fDesc, setFDesc]       = useState('')
  const [saving, setSaving]     = useState(false)

  // ── Cargar cuentas ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/correos')
      const d = await r.json()
      setAccounts(d.accounts ?? [])
      setTableExists(d.tableExists !== false)
    } catch {
      toast.error('Error cargando correos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Crear cuenta ───────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fPrefix.trim() || !fName.trim()) return
    setSaving(true)
    try {
      const email = `${fPrefix.toLowerCase().trim()}@${DOMAIN}`
      const r = await fetch('/api/admin/correos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fName, email, role: fRole, description: fDesc }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error ?? 'Error al crear'); return }
      toast.success(`${email} creado`)
      setShowForm(false)
      setFPrefix(''); setFName(''); setFRole('general'); setFDesc('')
      load()
    } finally {
      setSaving(false)
    }
  }

  // ── Cambiar estado ─────────────────────────────────────────────────────────
  const handleStatus = async (id: string, status: AccountStatus) => {
    const r = await fetch('/api/admin/correos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (r.ok) { setAccounts(a => a.map(x => x.id === id ? { ...x, status } : x)) }
    else toast.error('Error al actualizar')
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar ${email} del registro?\n\nRecuerda también eliminarlo en Zoho/Google si está activo.`)) return
    setDeleting(id)
    const r = await fetch(`/api/admin/correos?id=${id}`, { method: 'DELETE' })
    if (r.ok) { setAccounts(a => a.filter(x => x.id !== id)); toast.success('Eliminado') }
    else toast.error('Error al eliminar')
    setDeleting(null)
  }

  // ── Copiar email ───────────────────────────────────────────────────────────
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado'))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Correos @{DOMAIN}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona las cuentas de correo del negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Info className="w-4 h-4" />
            Cómo configurar
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Nueva cuenta
          </button>
        </div>
      </div>

      {/* Guía de configuración */}
      {showGuide && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 relative">
          <button onClick={() => setShowGuide(false)}
            className="absolute top-3 right-3 text-blue-400 hover:text-blue-700">
            <X className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Cómo crear correos @{DOMAIN} — Zoho Mail (gratis)
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2"><span className="font-bold shrink-0">1.</span>
              Ve a <a href="https://www.zoho.com/mail/" target="_blank" rel="noopener"
                className="underline font-semibold hover:text-blue-900 inline-flex items-center gap-0.5">
                zoho.com/mail <ExternalLink className="w-3 h-3" />
              </a> y crea una cuenta gratis (hasta 5 usuarios).
            </li>
            <li className="flex gap-2"><span className="font-bold shrink-0">2.</span>
              Al registrarte, elige <strong>"Uso con mi propio dominio"</strong> e ingresa <code className="bg-blue-100 px-1 rounded">carniceriaelfundo.cl</code>.
            </li>
            <li className="flex gap-2"><span className="font-bold shrink-0">3.</span>
              Zoho te pedirá agregar registros MX y TXT en el DNS de tu dominio. Ve a <strong>nic.cl</strong> → panel de administración → DNS de carniceriaelfundo.cl.
            </li>
            <li className="flex gap-2"><span className="font-bold shrink-0">4.</span>
              Agrega los registros MX que Zoho indica. Ejemplo:<br />
              <code className="bg-blue-100 px-2 py-0.5 rounded block mt-1">MX mx.zoho.com priority 10</code>
              <code className="bg-blue-100 px-2 py-0.5 rounded block mt-1">MX mx2.zoho.com priority 20</code>
            </li>
            <li className="flex gap-2"><span className="font-bold shrink-0">5.</span>
              Una vez verificado, crea las cuentas en el panel de Zoho y regístralas aquí para tener el control centralizado.
            </li>
          </ol>
          <p className="text-xs text-blue-600 mt-3">
            Alternativa premium: Google Workspace ($6 USD/usuario/mes) — <strong>mismos pasos, mayor funcionalidad</strong>.
          </p>
        </div>
      )}

      {/* Alerta si tabla no existe */}
      {!tableExists && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Tabla no creada en Supabase</p>
            <p className="text-xs text-yellow-700 mt-1">
              Ejecuta este SQL en el Editor SQL de Supabase:
            </p>
            <pre className="text-xs bg-yellow-100 rounded p-2 mt-2 overflow-x-auto">{`CREATE TABLE IF NOT EXISTS email_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pendiente',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON email_accounts USING (true) WITH CHECK (true);`}
            </pre>
            <button onClick={load}
              className="mt-2 text-xs text-yellow-800 underline hover:no-underline">
              Recargar después de ejecutar el SQL
            </button>
          </div>
        </div>
      )}

      {/* Sugerencias rápidas */}
      {accounts.length === 0 && !loading && tableExists && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Cuentas sugeridas para tu negocio</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUGERIDOS.map(s => {
              const email = `${s.prefix}@${DOMAIN}`
              return (
                <button key={s.prefix}
                  onClick={() => { setFPrefix(s.prefix); setFName(s.name); setFRole(s.role); setShowForm(true) }}
                  className="text-left p-3 border border-dashed border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors group">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-red-700">{email}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.name}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal crear cuenta */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowForm(false)}>
          <form onSubmit={handleCreate}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Nueva cuenta de correo</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección de correo</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-red-400">
                  <input
                    autoFocus
                    value={fPrefix}
                    onChange={e => setFPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="ventas"
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-200 shrink-0">
                    @{DOMAIN}
                  </span>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del responsable</label>
                <input
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                  placeholder="Ej: Equipo Ventas"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                  required
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Área</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(ROLES) as [AccountRole, typeof ROLES[AccountRole]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button key={key} type="button"
                        onClick={() => setFRole(key)}
                        className={clsx(
                          'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors',
                          fRole === key ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}>
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
                <input
                  value={fDesc}
                  onChange={e => setFDesc(e.target.value)}
                  placeholder="Para qué se usa esta cuenta"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving || !fPrefix || !fName}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Registrar cuenta
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Esto registra la cuenta en el sistema. Luego debes crearla también en Zoho Mail o Google Workspace.
            </p>
          </form>
        </div>
      )}

      {/* Tabla de cuentas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">
            Cuentas registradas
            {accounts.length > 0 && <span className="ml-2 text-gray-400 font-normal">({accounts.length})</span>}
          </h2>
          <button onClick={load} className="text-gray-400 hover:text-gray-700 transition-colors">
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 text-gray-300 animate-spin mx-auto" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center">
            <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Sin cuentas registradas aún</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-red-600 hover:underline font-medium">
              + Agregar primera cuenta
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {accounts.map(acc => {
              const roleCfg   = ROLES[acc.role] ?? ROLES.general
              const statusCfg = STATUS_CONFIG[acc.status] ?? STATUS_CONFIG.pendiente
              const RoleIcon   = roleCfg.icon
              const StatusIcon = statusCfg.icon

              return (
                <div key={acc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  {/* Icono rol */}
                  <div className={clsx('p-2 rounded-lg shrink-0', roleCfg.color)}>
                    <RoleIcon className="w-4 h-4" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{acc.email}</p>
                      <button onClick={() => copy(acc.email)}
                        className="text-gray-300 hover:text-gray-600 transition-colors shrink-0">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{acc.name}{acc.description ? ` — ${acc.description}` : ''}</p>
                  </div>

                  {/* Área */}
                  <span className={clsx('hidden sm:block px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0', roleCfg.color)}>
                    {roleCfg.label}
                  </span>

                  {/* Estado — selector */}
                  <div className="shrink-0">
                    <select
                      value={acc.status}
                      onChange={e => handleStatus(acc.id, e.target.value as AccountStatus)}
                      className={clsx(
                        'text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-none',
                        statusCfg.color
                      )}>
                      <option value="pendiente">Pendiente</option>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(acc.id, acc.email)}
                    disabled={deleting === acc.id}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-40">
                    {deleting === acc.id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-3 text-xs text-gray-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Este módulo registra y organiza las cuentas de correo de tu negocio.
          La creación real de los buzones debes hacerla en <strong>Zoho Mail</strong> (gratis) o <strong>Google Workspace</strong>.
          El estado <em>Pendiente</em> indica que aún no se ha creado el buzón en el proveedor.
        </span>
      </div>
    </div>
  )
}