import { NextRequest, NextResponse } from 'next/server'

const BYPASS = [
  '/mantencion',
  '/gestion-elfundo', // ruta privada del admin
  '/api',
  '/_next',
  '/favicon',
  '/logo',
  '/robots',
  '/sitemap',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAdminCookie = request.cookies.get('admin_auth')?.value === 'true'

  // ── Bloqueo ruta /admin directa ──
  // /admin (login antiguo) → redirige al home
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin/dashboard/* sin cookie → redirige a login privado
  if (pathname.startsWith('/admin/dashboard') && !hasAdminCookie) {
    return NextResponse.redirect(new URL('/gestion-elfundo', request.url))
  }

  // ── Bypass mantenimiento ──
  const isBypass = BYPASS.some(p => pathname.startsWith(p))
  if (isBypass) return NextResponse.next()

  // ── Modo mantenimiento ──
  const maintenance = request.cookies.get('maintenance_mode')?.value === 'true'
  if (maintenance) {
    const url = request.nextUrl.clone()
    url.pathname = '/mantencion'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
