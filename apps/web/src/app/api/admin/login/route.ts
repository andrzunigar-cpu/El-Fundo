import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// ── In-memory rate limiting (per IP, resets cada 15 min) ──────────────────
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now   = Date.now()
  const entry = attempts.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS }
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + WINDOW_MS }
  entry.count++
  attempts.set(ip, entry)
  return entry.count > MAX_ATTEMPTS
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 15 minutos.' },
      { status: 429 }
    )
  }

  let username = '', password = ''
  try {
    const body = await req.json()
    username = String(body.username ?? '').trim()
    password = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Solicitud invalida' }, { status: 400 })
  }

  // Trim para eliminar espacios/newlines que Vercel puede agregar
  const expectedUser = String(process.env.ADMIN_USERNAME ?? '').trim()
  const expectedPass = String(process.env.ADMIN_PASSWORD ?? '').trim()

  if (!expectedUser || !expectedPass) {
    return NextResponse.json({ error: 'Servidor no configurado' }, { status: 503 })
  }

  const ok = username === expectedUser && password === expectedPass

  if (!ok) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const token = await getAdminToken()
  if (!token) {
    return NextResponse.json({ error: 'ADMIN_SESSION_SECRET no configurado' }, { status: 503 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_auth', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 8,
    path:     '/',
  })
  return res
}
