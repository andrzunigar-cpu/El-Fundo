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
  const range = searchParams.get('range') ?? '30'    // días
  const rangeN = Math.min(365, Math.max(1, Number(range)))

  const since = new Date()
  since.setDate(since.getDate() - rangeN)
  const sinceISO = since.toISOString()

  // ── Resumen global ────────────────────────────────────────────────────────
  const { data: ordersRaw, error: ordersErr } = await sb
    .from('orders')
    .select('id, total_amount, status, payment_method, created_at, channel')
    .gte('created_at', sinceISO)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 })

  const orders = ordersRaw ?? []

  // ── Totales por día ──────────────────────────────────────────────────────
  const byDay: Record<string, { date: string; total: number; count: number }> = {}
  for (const o of orders) {
    const day = o.created_at?.slice(0, 10) ?? 'unknown'
    if (!byDay[day]) byDay[day] = { date: day, total: 0, count: 0 }
    byDay[day].total += o.total_amount ?? 0
    byDay[day].count += 1
  }
  const dailySales = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))

  // ── Por medio de pago ────────────────────────────────────────────────────
  const byPayment: Record<string, { method: string; total: number; count: number }> = {}
  for (const o of orders) {
    const m = o.payment_method ?? 'otro'
    if (!byPayment[m]) byPayment[m] = { method: m, total: 0, count: 0 }
    byPayment[m].total += o.total_amount ?? 0
    byPayment[m].count += 1
  }

  // ── Top productos ────────────────────────────────────────────────────────
  const { data: itemsRaw } = await sb
    .from('order_items')
    .select('product_id, product_name, quantity, subtotal, order_id')
    .in('order_id', orders.map(o => o.id).slice(0, 1000))

  const byProduct: Record<string, { name: string; qty: number; total: number; count: number }> = {}
  for (const item of (itemsRaw ?? [])) {
    const k = item.product_id ?? item.product_name
    if (!byProduct[k]) byProduct[k] = { name: item.product_name, qty: 0, total: 0, count: 0 }
    byProduct[k].qty   += item.quantity ?? 0
    byProduct[k].total += item.subtotal ?? 0
    byProduct[k].count += 1
  }
  const topProducts = Object.values(byProduct)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // ── Última sincronización POS ────────────────────────────────────────────
  const { data: lastOrder } = await sb
    .from('orders')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    range: rangeN,
    summary: {
      totalRevenue:  orders.reduce((s, o) => s + (o.total_amount ?? 0), 0),
      totalOrders:   orders.length,
      avgTicket:     orders.length > 0
        ? Math.round(orders.reduce((s, o) => s + (o.total_amount ?? 0), 0) / orders.length)
        : 0,
    },
    dailySales,
    byPayment:   Object.values(byPayment).sort((a, b) => b.total - a.total),
    topProducts,
    lastSyncAt:  lastOrder?.updated_at ?? null,
  })
}