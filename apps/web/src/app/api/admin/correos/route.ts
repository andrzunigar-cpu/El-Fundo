import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

async function auth(req: NextRequest) {
  const token = req.cookies.get('admin_auth')?.value ?? ''
  return verifyAdminToken(token)
}

// GET — listar todas
export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sb = getSupabase()
  const { data, error } = await sb
    .from('email_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    // Si la tabla no existe, retornar array vacío con flag
    if (error.code === '42P01') return NextResponse.json({ accounts: [], tableExists: false })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ accounts: data ?? [], tableExists: true })
}

// POST — crear cuenta
export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.name) {
    return NextResponse.json({ error: 'Nombre y correo son requeridos' }, { status: 400 })
  }

  const email = String(body.email).toLowerCase().trim()
  if (!email.endsWith('@carniceriaelfundo.cl')) {
    return NextResponse.json({ error: 'El correo debe ser @carniceriaelfundo.cl' }, { status: 400 })
  }

  const sb = getSupabase()
  const { data, error } = await sb
    .from('email_accounts')
    .insert({
      name:        body.name.trim(),
      email,
      role:        body.role ?? 'general',
      description: body.description ?? '',
      status:      'pendiente',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ese correo ya existe' }, { status: 409 })
    if (error.code === '42P01') return NextResponse.json({ error: 'Ejecuta las migraciones SQL primero' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// PATCH — actualizar estado o datos
export async function PATCH(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { id, ...updates } = body
  delete updates.email  // email no se puede cambiar
  delete updates.created_at

  const sb = getSupabase()
  const { data, error } = await sb
    .from('email_accounts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — eliminar cuenta
export async function DELETE(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const sb = getSupabase()
  const { error } = await sb.from('email_accounts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}