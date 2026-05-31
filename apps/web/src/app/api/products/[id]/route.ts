import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabase()
  const { id }   = await params
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// Intentar update y, si falla por columna inexistente, sacar esa columna y reintentar
async function tryUpdate(id: string, payload: Record<string, unknown>, attempts = 0): Promise<{ data: unknown; error: { message: string } | null }> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (!error) return { data, error: null }

  // Extraer nombre de columna del mensaje de error de Postgres
  // Ejemplos: "Could not find the 'unit' column", "column \"foo\" of relation \"products\" does not exist"
  const match = error.message.match(/['"]([a-z_]+)['"]/i)
  const missingCol = match?.[1]

  if (missingCol && missingCol in payload && attempts < 10) {
    const cleanPayload = { ...payload }
    delete cleanPayload[missingCol]
    return tryUpdate(id, cleanPayload, attempts + 1)
  }

  return { data: null, error }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(request)
  if (deny) return deny

  const { id }   = await params
  const body     = await request.json()

  const payload = { ...body, updated_at: new Date().toISOString() }
  const result = await tryUpdate(id, payload)

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
