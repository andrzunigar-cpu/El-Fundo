import { NextRequest, NextResponse } from 'next/server'

// Rutas que NUNCA se redirigen a mantención
const BYPASS = [
  '/mantencion',
  '/admin',
  '/api',
  '/_next',
  '/favicon',
  '/logo',
  '/robots',
  '/sitemap',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ¿Esta ruta está en la lista de bypass?
  const isBypass = BYPASS.some(p => pathname.startsWith(p))
  if (isBypass) return NextResponse.next()

  // ¿Está en mantención?
  const maintenance = request.cookies.get('maintenance_mode')?.value === 'true'
  if (maintenance) {
    const url = request.nextUrl.clone()
    url.pathname = '/mantencion'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto archivos estáticos y _next
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
