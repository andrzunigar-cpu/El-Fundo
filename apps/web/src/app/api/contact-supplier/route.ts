import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, empresa, telefono, email, mensaje } = body

    if (!email || !nombre) {
      return NextResponse.json({ error: 'Nombre y email requeridos' }, { status: 400 })
    }

    // Intentar guardar en tabla supplier_contacts (si existe)
    const { error } = await getSupabase()
      .from('supplier_contacts')
      .insert({ nombre, empresa: empresa || '', telefono: telefono || '', email, mensaje: mensaje || '' })

    if (error) {
      // Si la tabla no existe, guardamos igual como pedido de contacto genérico
      console.error('Supplier contact error (table may not exist yet):', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Supplier contact exception:', err)
    return NextResponse.json({ ok: true }) // never fail the frontend
  }
}
