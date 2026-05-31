'use client'

import { useEffect, useState } from 'react'
import { Mail, Download, Trash2, Tag } from 'lucide-react'

interface Subscriber {
  id: string
  name: string
  email: string
  discount_pct: number
  created_at: string
}

export default function SuscriptoresPage() {
  const [subs, setSubs]       = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/subscribers')
      .then(r => r.json())
      .then(data => { setSubs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const exportCSV = () => {
    const header = 'Nombre,Email,Descuento,Código,Fecha'
    const rows = subs.map(s =>
      `"${s.name || ''}","${s.email}","${s.discount_pct}%","BIENVENIDO${s.discount_pct}","${new Date(s.created_at).toLocaleDateString('es-CL')}"`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'suscriptores.csv'; a.click()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Suscriptores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Emails registrados desde el popup de bienvenida</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={subs.length === 0}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Total suscriptores</p>
          <p className="text-3xl font-black text-gray-900">{subs.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Esta semana</p>
          <p className="text-3xl font-black text-gray-900">
            {subs.filter(s => {
              const d = new Date(s.created_at)
              const now = new Date()
              return (now.getTime() - d.getTime()) < 7 * 24 * 3600 * 1000
            }).length}
          </p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-100">
          <p className="text-xs text-red-400 mb-1">Descuento activo</p>
          <p className="text-3xl font-black text-red-600">10%</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Cargando...</div>
        ) : subs.length === 0 ? (
          <div className="py-16 text-center">
            <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aún no hay suscriptores</p>
            <p className="text-gray-300 text-xs mt-1">Los emails aparecerán aquí cuando alguien registre su correo en el popup</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subs.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{s.name || <span className="text-gray-300 italic">—</span>}</td>
                  <td className="px-5 py-3.5 text-gray-600">{s.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1 rounded-lg">
                      <Tag className="w-3 h-3" /> BIENVENIDO{s.discount_pct}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
