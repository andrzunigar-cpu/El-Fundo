import { type NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }
    // Validación básica de formato email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // discount_pct fijo en servidor — no aceptado del cliente (previene manipulación)
    const { data, error } = await getSupabase()
      .from('subscribers')
      .upsert({ name: name ? String(name).slice(0, 100) : '', email: email.toLowerCase(), discount_pct: 10 }, { onConflict: 'email' })
      .select()
      .single()

    if (error) {
      // Si la tabla no existe aún, igual devolvemos success para no romper el flujo
      console.error('Subscribers error:', error.message)
      return NextResponse.json({ ok: true, fallback: true })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err) {
    console.error('Subscribers exception:', err)
    return NextResponse.json({ ok: true, fallback: true })
  }
}

export async function GET(request: NextRequest) {
  // Solo admin puede ver la lista de suscriptores
  const { verifyAdminToken } = await import('@/lib/admin-auth')
  const token = request.cookies.get('admin_auth')?.value ?? ''
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data, error } = await getSupabase()
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
