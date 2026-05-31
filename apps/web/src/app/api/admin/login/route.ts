import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// ── In-memory rate limiting (per IP, resets cada 15 min) ──────────────────
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000

// Comparación en tiempo constante para evitar timing attacks
function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

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

  // Soporta hasta 3 pares de credenciales admin via env:
  //   ADMIN_USERNAME / ADMIN_PASSWORD            (principal)
  //   ADMIN_USERNAME_2 / ADMIN_PASSWORD_2        (secundario, opcional)
  //   ADMIN_USERNAME_3 / ADMIN_PASSWORD_3        (terciario,  opcional)
  // Si alguno de los pares secundarios no está definido, simplemente se ignora.
  const pairs: Array<[string, string]> = [
    [String(process.env.ADMIN_USERNAME   ?? '').trim(), String(process.env.ADMIN_PASSWORD   ?? '').trim()],
    [String(process.env.ADMIN_USERNAME_2 ?? '').trim(), String(process.env.ADMIN_PASSWORD_2 ?? '').trim()],
    [String(process.env.ADMIN_USERNAME_3 ?? '').trim(), String(process.env.ADMIN_PASSWORD_3 ?? '').trim()],
  ].filter(([u, p]) => u && p) as Array<[string, string]>

  if (pairs.length === 0) {
    return NextResponse.json({ error: 'Servidor no configurado' }, { status: 503 })
  }

  // Comparación en tiempo constante por cada par para evitar timing attacks
  const ok = pairs.some(([u, p]) => safeEq(username, u) && safeEq(password, p))

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
