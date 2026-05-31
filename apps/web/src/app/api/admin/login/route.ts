import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// ── In-memory rate limiting (per IP, per server instance) ─────────────────
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000   // 15 min

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
    username = body.username ?? ''
    password = body.password ?? ''
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const expectedUser = process.env.ADMIN_USERNAME ?? ''
  const expectedPass = process.env.ADMIN_PASSWORD ?? ''

  if (!expectedUser || !expectedPass) {
    console.error('[admin/login] ADMIN_USERNAME or ADMIN_PASSWORD env vars not set')
    return NextResponse.json({ error: 'Servidor no configurado' }, { status: 503 })
  }

  // Constant-time comparison to avoid timing attacks
  const userMatch = username.length === expectedUser.length &&
    username.split('').every((c, i) => c === expectedUser[i])
  const passMatch = password.length === expectedPass.length &&
    password.split('').every((c, i) => c === expectedPass[i])

  if (!userMatch || !passMatch) {
    // Generic message — don't reveal which field is wrong
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const token = await getAdminToken()
  if (!token) {
    return NextResponse.json({ error: 'ADMIN_SESSION_SECRET no configurado' }, { status: 503 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_auth', token, {
    httpOnly: true,                                     // JS cannot read this cookie
    secure:   process.env.NODE_ENV === 'production',   // HTTPS only in prod
    sameSite: 'strict',
    maxAge:   60 * 60 * 8,                             // 8 hours
    path:     '/',
  })
  return res
}
