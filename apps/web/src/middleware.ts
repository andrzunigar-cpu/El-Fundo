import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'

const BYPASS = [
  '/mantencion',
  '/gestion-elfundo',
  '/api',
  '/_next',
  '/favicon',
  '/logo',
  '/robots',
  '/sitemap',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Bloqueo ruta /admin directa ──
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Protección del dashboard admin (HMAC-SHA256) ──
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get('admin_auth')?.value ?? ''
    if (!(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL('/gestion-elfundo', request.url))
    }
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
