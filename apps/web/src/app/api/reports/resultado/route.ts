import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_auth')?.value ?? ''
  if (!(await verifyAdminToken(token)))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sb = getSupabase()
  const { searchParams } = new URL(req.url)

  // Parámetros: año y mes (default: mes actual)
  const now   = new Date()
  const year  = Number(searchParams.get('year')  ?? now.getFullYear())
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)

  const fromISO = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`
  const lastDay = new Date(year, month, 0).getDate()
  const toISO   = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59.999Z`

  // ── Ingresos del mes ──────────────────────────────────────────────────────
  const { data: ordersRaw } = await sb
    .from('orders')
    .select('id, total_amount, status, created_at')
    .gte('created_at', fromISO)
    .lte('created_at', toISO)
    .neq('status', 'cancelled')

  const orders = ordersRaw ?? []
  const totalIngresos = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0)

  // ── Costo de mercadería vendida (si cost_price disponible) ────────────────
  const { data: itemsRaw } = await sb
    .from('order_items')
    .select('product_id, product_name, quantity, subtotal')
    .in('order_id', orders.map(o => o.id).slice(0, 2000))

  // Precios de costo
  const { data: productsRaw } = await sb
    .from('products')
    .select('id, name, cost_price, price_unit')

  const costMap = new Map<string, number>((productsRaw ?? []).map((p: any) => [p.id, p.cost_price ?? 0]))

  let totalCosto = 0
  const byProduct: Record<string, { name: string; ingresos: number; costo: number; qty: number }> = {}

  for (const item of (itemsRaw ?? [])) {
    const costo = (costMap.get(item.product_id) ?? 0) * (item.quantity ?? 0)
    totalCosto += costo

    const k = item.product_id
    if (!byProduct[k]) byProduct[k] = { name: item.product_name, ingresos: 0, costo: 0, qty: 0 }
    byProduct[k].ingresos += item.subtotal ?? 0
    byProduct[k].costo    += costo
    byProduct[k].qty      += item.quantity ?? 0
  }

  const margenBruto      = totalIngresos - totalCosto
  const margenBrutoPct   = totalIngresos > 0 ? Math.round((margenBruto / totalIngresos) * 100) : 0
  const hasCostData      = totalCosto > 0

  // ── Por semana del mes ────────────────────────────────────────────────────
  const byWeek: Record<number, { week: number; ingresos: number; count: number }> = {}
  for (const o of orders) {
    const day  = new Date(o.created_at).getDate()
    const week = Math.ceil(day / 7)
    if (!byWeek[week]) byWeek[week] = { week, ingresos: 0, count: 0 }
    byWeek[week].ingresos += o.total_amount ?? 0
    byWeek[week].count    += 1
  }

  // ── Top productos por rentabilidad ────────────────────────────────────────
  const topRentabilidad = Object.values(byProduct)
    .map(p => ({
      ...p,
      margen:    p.ingresos - p.costo,
      margenPct: p.ingresos > 0 ? Math.round(((p.ingresos - p.costo) / p.ingresos) * 100) : 0,
    }))
    .sort((a, b) => b.margen - a.margen)
    .slice(0, 10)

  // ── Meses anteriores (últimos 6) para comparativa ─────────────────────────
  const monthlyTrend: Array<{ label: string; ingresos: number; pedidos: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const from = `${y}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`
    const last  = new Date(y, m, 0).getDate()
    const to    = `${y}-${String(m).padStart(2, '0')}-${last}T23:59:59.999Z`

    const { data } = await sb
      .from('orders')
      .select('total_amount')
      .gte('created_at', from)
      .lte('created_at', to)
      .neq('status', 'cancelled')

    const rev = (data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0)
    monthlyTrend.push({
      label:    `${String(m).padStart(2, '0')}/${y}`,
      ingresos: rev,
      pedidos:  (data ?? []).length,
    })
  }

  return NextResponse.json({
    period: { year, month },
    summary: {
      totalIngresos,
      totalCosto,
      margenBruto,
      margenBrutoPct,
      totalPedidos: orders.length,
      hasCostData,
    },
    byWeek:          Object.values(byWeek).sort((a, b) => a.week - b.week),
    topRentabilidad,
    monthlyTrend,
  })
}