import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase  = getSupabase()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    let query = supabase
      .from('products')
      .select('*')
      .order('category_id')
      .order('name')

    if (categoryId) query = query.eq('category_id', categoryId)

    const isPromo = searchParams.get('is_promo')
    if (isPromo === 'true') query = query.not('promotional_price', 'is', null)

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/products]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[GET /api/products] catch:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Insert robusto — quita columnas inexistentes y reintenta
async function tryInsert(payload: Record<string, unknown>, attempts = 0): Promise<{ data: unknown; error: { message: string } | null }> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
    .single()

  if (!error) return { data, error: null }

  const match = error.message.match(/['"]([a-z_]+)['"]/i)
  const missingCol = match?.[1]

  if (missingCol && missingCol in payload && attempts < 10) {
    const cleanPayload = { ...payload }
    delete cleanPayload[missingCol]
    return tryInsert(cleanPayload, attempts + 1)
  }

  return { data: null, error }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await tryInsert(body)

    if (result.error) {
      console.error('[POST /api/products]', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
