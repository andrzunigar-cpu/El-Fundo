'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Package, Tag, LogOut, ChevronRight, ShoppingBag, Percent, Settings } from 'lucide-react'
import NewOrderNotifier from '@/components/NewOrderNotifier'

const NAV = [
  { href: '/admin/dashboard',               label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { href: '/admin/dashboard/pedidos',       label: 'Pedidos',        icon: ShoppingBag },
  { href: '/admin/dashboard/productos',     label: 'Productos',      icon: Package },
  { href: '/admin/dashboard/promociones',   label: 'Promociones',    icon: Percent },
  { href: '/admin/dashboard/categorias',    label: 'Categorías',     icon: Tag },
  { href: '/admin/dashboard/configuracion', label: 'Configuración',  icon: Settings },
]

function isAuthed() {
  // Revisar cookie
  if (typeof document !== 'undefined') {
    if (document.cookie.includes('admin_auth=true')) return true
  }
  // Revisar localStorage como fallback
  try {
    if (localStorage.getItem('admin_auth') === 'true') return true
  } catch {}
  return false
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/admin')
    } else {
      setReady(true)
    }
  }, [router])

  const handleLogout = () => {
    try { localStorage.removeItem('admin_auth') } catch {}
    document.cookie = 'admin_auth=; path=/; max-age=0'
    router.replace('/admin')
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando acceso...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-100 bg-gray-950">
          <Image
            src="/logo.png"
            alt="Carnicería El Fundo"
            width={160}
            height={54}
            className="h-10 w-auto object-contain"
            priority
          />
          <p className="text-xs text-gray-400 mt-1 pl-0.5">Panel Administrador</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon
            // Exact match para Dashboard, startsWith para el resto
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Notificador de pedidos nuevos */}
      <NewOrderNotifier />
    </div>
  )
}
