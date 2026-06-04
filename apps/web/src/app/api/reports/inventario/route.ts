import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_auth')?.value ?? ''
  if (!(await verifyAdminToken(token)))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sb = getSupabase()

  // ── Stock actual de todos los productos ──────────────────────────────────
  const { data: stockRaw, error: stockErr } = await sb
    .from('products')
    .select(`
      id, name, sku, price_unit,
      base_price, cost_price,
      stock_levels (quantity, reserved_quantity, min_stock, updated_at)
    `)
    .eq('status', 'active')
    .order('name')

  if (stockErr) return NextResponse.json({ error: stockErr.message }, { status: 500 })

  const stock = (stockRaw ?? []).map((p: any) => {
    const sl = Array.isArray(p.stock_levels) ? p.stock_levels[0] : p.stock_levels
    const qty      = sl?.quantity ?? 0
    const reserved = sl?.reserved_quantity ?? 0
    const min      = sl?.min_stock ?? 0
    const available = Math.max(0, qty - reserved)
    const costPrice = p.cost_price ?? 0
    const stockValue = Math.round(qty * costPrice)

    return {
      id:          p.id,
      name:        p.name,
      sku:         p.sku,
      unit:        p.price_unit ?? 'kg',
      qty,
      reserved,
      available,
      minStock:    min,
      costPrice,
      basePrice:   p.base_price ?? 0,
      stockValue,
      updatedAt:   sl?.updated_at ?? null,
      status:      qty === 0 ? 'sin_stock' : qty <= min ? 'bajo' : 'ok',
    }
  })

  // ── Resumen ───────────────────────────────────────────────────────────────
  const sinStock     = stock.filter(s => s.status === 'sin_stock').length
  const stockBajo    = stock.filter(s => s.status === 'bajo').length
  const totalProductos = stock.length
  const valorTotal   = stock.reduce((sum, s) => sum + s.stockValue, 0)

  // ── Última sincronización ─────────────────────────────────────────────────
  const { data: lastSync } = await sb
    .from('stock_levels')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    summary: { totalProductos, sinStock, stockBajo, valorTotal },
    stock,
    lastSyncAt: lastSync?.updated_at ?? null,
  })
}