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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body     = await request.json()

    // Quitar campos que pueden no existir en el schema
    const safe = { ...body }
    if (!safe.unit) delete safe.unit

    const { data, error } = await supabase
      .from('products')
      .insert(safe)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/products]', error)
      // Si el error es por columna faltante, reintentar sin esa columna
      if (error.message?.includes('column') && error.message?.includes('unit')) {
        const { unit: _unit, ...withoutUnit } = safe
        const { data: d2, error: e2 } = await supabase
          .from('products').insert(withoutUnit).select().single()
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
        return NextResponse.json(d2, { status: 201 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
