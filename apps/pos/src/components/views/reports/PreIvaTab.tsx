import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Receipt, FileText, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { DateRangeBar, fmt, monthStart, today, Section, EmptyState } from './shared'

const IVA_PCT = 19

// Fila de tabla con neto / IVA calculados
function TaxRow({ label, sub, bruto, neto, iva, className }: {
  label: string; sub?: string; bruto: number; neto: number; iva: number; className?: string
}) {
  return (
    <div className={clsx('grid grid-cols-4 gap-2 py-2 px-3 rounded-lg text-sm', className)}>
      <div className="col-span-1">
        <p className="font-medium text-white text-xs">{label}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <p className="text-right text-gray-300 text-xs font-mono">{fmt(bruto)}</p>
      <p className="text-right text-gray-400 text-xs font-mono">{fmt(neto)}</p>
      <p className="text-right text-xs font-mono font-semibold text-amber-400">{fmt(iva)}</p>
    </div>
  )
}

function TableHeader() {
  return (
    <div className="grid grid-cols-4 gap-2 py-1.5 px-3 border-b border-gray-700 mb-1">
      <p className="text-[10px] uppercase text-gray-500 tracking-wider col-span-1">Concepto</p>
      <p className="text-[10px] uppercase text-gray-500 tracking-wider text-right">Total bruto</p>
      <p className="text-[10px] uppercase text-gray-500 tracking-wider text-right">Neto</p>
      <p className="text-[10px] uppercase text-gray-500 tracking-wider text-right">IVA 19%</p>
    </div>
  )
}

export function PreIvaTab() {
  const [from, setFrom]     = useState(today())
  const [to, setTo]         = useState(today())
  const [ppmRate, setPpmRate] = useState(1.5)
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (f = from, t = to, rate = ppmRate) => {
    setLoading(true)
    try {
      const api = (window as any).posAPI
      const res = await api.reports.preIva(f, t, rate)
      setData(res)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [from, to, ppmRate])

  useEffect(() => { load() }, [])

  const handleRange = (f: string, t: string) => {
    setFrom(f); setTo(t); load(f, t, ppmRate)
  }
  const handlePpm = (rate: number) => {
    setPpmRate(rate); load(from, to, rate)
  }

  const exportExcel = async () => {
    if (!data) return
    const { ventas: v, compras: c, resumen: r, ppm: p } = data
    const wb = XLSX.utils.book_new()

    // ── Hoja 1: Resumen ──────────────────────────────────────
    const resumenRows = [
      ['REPORTE PRE IVA', `${from} al ${to}`],
      [],
      ['VENTAS'],
      ['Concepto', 'Monto'],
      ['Total ventas bruto (con IVA)', v.totalBruto],
      ['Neto ventas (sin IVA)', v.netoVentas],
      ['IVA Débito (19%)', v.ivaDebito],
      [],
      ['COMPRAS CON FACTURA'],
      ['Concepto', 'Monto'],
      ['Total facturas bruto (con IVA)', c.totalFacturas],
      ['Neto compras (sin IVA)', c.netoCompras],
      ['IVA Crédito (19%)', c.ivaCredito],
      [],
      ['RESULTADO FISCAL'],
      ['Concepto', 'Monto'],
      ['IVA Débito', r.ivaDebito],
      ['(-) IVA Crédito', r.ivaCredito],
      [r.ivaFavor > 0 ? 'IVA remanente a favor' : 'IVA neto a pagar SII', r.ivaFavor > 0 ? r.ivaFavor : r.ivaPagar],
      [],
      ['PPM'],
      ['Concepto', 'Monto'],
      [`PPM ${p.rate}% sobre neto ventas`, p.amount],
      ['Base imponible PPM', p.netoBase],
      [],
      ['TOTAL OBLIGACIONES TRIBUTARIAS', r.totalObligaciones],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(resumenRows)
    ws1['!cols'] = [{ wch: 40 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen')

    // ── Hoja 2: Ventas por día ───────────────────────────────
    const ventasHeader = [['Fecha', 'N° Ventas', 'Total Bruto', 'Neto', 'IVA Débito']]
    const ventasRows = v.byDay.map((d: any) => [d.day, d.orders, d.bruto, d.neto, d.iva])
    const ventasTotales = [['TOTAL', v.orderCount, v.totalBruto, v.netoVentas, v.ivaDebito]]
    const ws2 = XLSX.utils.aoa_to_sheet([...ventasHeader, ...ventasRows, [], ...ventasTotales])
    ws2['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Ventas por día')

    // ── Hoja 3: Facturas de compra ───────────────────────────
    const facturasHeader = [['N° Factura', 'Proveedor', 'Fecha', 'Total Bruto', 'Neto', 'IVA Crédito']]
    const facturasRows = c.facturas.map((f: any) => [
      f.invoice_number ?? '', f.supplier_name, f.invoice_date,
      f.total_factura, f.neto, f.iva,
    ])
    const facturasTotales = [['TOTAL', '', '', c.totalFacturas, c.netoCompras, c.ivaCredito]]
    const ws3 = XLSX.utils.aoa_to_sheet([...facturasHeader, ...facturasRows, [], ...facturasTotales])
    ws3['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Facturas de compra')

    // Generar buffer y guardar
    const wbout: number[] = Array.from(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array)
    const filename = `PreIVA_${from}_${to}.xlsx`
    try {
      const api = (window as any).posAPI
      const result = await api.export.saveExcel(wbout, filename)
      if (result.success) {
        toast.success(`✓ Guardado: ${filename}`)
      }
    } catch (e: any) {
      toast.error(`Error al exportar: ${e.message}`)
    }
  }

  const r = data?.resumen
  const v = data?.ventas
  const c = data?.compras
  const p = data?.ppm

  return (
    <div className="space-y-5">

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeBar from={from} to={to} onChange={handleRange} />

        {/* Tasa PPM */}
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
          <span className="text-xs text-gray-400">PPM</span>
          <input
            type="number"
            value={ppmRate}
            onChange={e => handlePpm(parseFloat(e.target.value) || 0)}
            step={0.1}
            min={0}
            max={10}
            className="w-14 bg-transparent text-xs text-white text-center font-mono focus:outline-none"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>

        <button onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-all disabled:opacity-50">
          <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualizar
        </button>

        {data && (
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs text-white font-semibold transition-all active:scale-95 ml-auto">
            <Download className="w-3.5 h-3.5" />
            Exportar Excel
          </button>
        )}
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-800 animate-pulse" />)}
        </div>
      ) : !data ? (
        <EmptyState msg="Sin datos en el período" />
      ) : (
        <>
          {/* ── KPIs superiores ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            {/* IVA Débito */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <p className="text-[10px] uppercase tracking-wider text-gray-500">IVA Débito</p>
              </div>
              <p className="text-2xl font-black text-red-400">{fmt(r.ivaDebito)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {IVA_PCT}% sobre neto ventas {fmt(v.netoVentas)}
              </p>
            </div>

            {/* IVA Crédito */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <p className="text-[10px] uppercase tracking-wider text-gray-500">IVA Crédito</p>
              </div>
              <p className="text-2xl font-black text-emerald-400">{fmt(r.ivaCredito)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {IVA_PCT}% sobre neto compras {fmt(c.netoCompras)}
              </p>
            </div>

            {/* IVA a pagar / favor */}
            <div className={clsx(
              'rounded-2xl p-4 border',
              r.ivaFavor > 0
                ? 'bg-emerald-950/20 border-emerald-900/50'
                : 'bg-amber-950/20 border-amber-900/50',
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Minus className={clsx('w-4 h-4', r.ivaFavor > 0 ? 'text-emerald-400' : 'text-amber-400')} />
                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  {r.ivaFavor > 0 ? 'IVA a favor' : 'IVA a pagar SII'}
                </p>
              </div>
              <p className={clsx('text-2xl font-black', r.ivaFavor > 0 ? 'text-emerald-400' : 'text-amber-400')}>
                {fmt(r.ivaFavor > 0 ? r.ivaFavor : r.ivaPagar)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Débito − Crédito</p>
            </div>

            {/* PPM */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <p className="text-[10px] uppercase tracking-wider text-gray-500">PPM ({p.rate}%)</p>
              </div>
              <p className="text-2xl font-black text-blue-400">{fmt(r.ppm)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {p.rate}% sobre neto {fmt(p.netoBase)}
              </p>
            </div>
          </div>

          {/* ── Resumen fiscal ──────────────────────────────── */}
          <Section title="Resumen fiscal del período">
            <div className="space-y-2">
              {/* IVA Débito */}
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <div>
                  <p className="text-sm text-white">IVA Débito (ventas)</p>
                  <p className="text-xs text-gray-500">{v.orderCount} ventas · bruto {fmt(v.totalBruto)} · neto {fmt(v.netoVentas)}</p>
                </div>
                <p className="text-red-400 font-bold font-mono">{fmt(r.ivaDebito)}</p>
              </div>

              {/* IVA Crédito */}
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <div>
                  <p className="text-sm text-white">IVA Crédito (compras)</p>
                  <p className="text-xs text-gray-500">{c.invoiceCount} facturas · bruto {fmt(c.totalFacturas)} · neto {fmt(c.netoCompras)}</p>
                </div>
                <p className="text-emerald-400 font-bold font-mono">− {fmt(r.ivaCredito)}</p>
              </div>

              {/* Resultado IVA */}
              <div className={clsx(
                'flex justify-between items-center py-2.5 px-3 rounded-xl border',
                r.ivaFavor > 0
                  ? 'bg-emerald-950/30 border-emerald-800'
                  : 'bg-amber-950/30 border-amber-800',
              )}>
                <p className="text-sm font-bold text-white">
                  {r.ivaFavor > 0 ? 'IVA remanente a favor' : 'IVA neto a pagar SII'}
                </p>
                <p className={clsx('font-black font-mono text-lg', r.ivaFavor > 0 ? 'text-emerald-400' : 'text-amber-400')}>
                  {fmt(r.ivaFavor > 0 ? r.ivaFavor : r.ivaPagar)}
                </p>
              </div>

              {/* PPM */}
              <div className="flex justify-between items-center py-2 mt-1">
                <div>
                  <p className="text-sm text-white">PPM ({p.rate}% sobre neto ventas)</p>
                  <p className="text-xs text-gray-500">Base imponible: {fmt(p.netoBase)}</p>
                </div>
                <p className="text-blue-400 font-bold font-mono">{fmt(r.ppm)}</p>
              </div>

              {/* Total obligaciones */}
              <div className="flex justify-between items-center py-2.5 px-3 rounded-xl bg-gray-800 border border-gray-700 mt-2">
                <p className="text-sm font-bold text-white">Total obligaciones tributarias</p>
                <p className="font-black font-mono text-xl text-white">{fmt(r.totalObligaciones)}</p>
              </div>
            </div>
          </Section>

          {/* ── Detalle ventas por día ───────────────────────── */}
          {v.byDay.length > 0 && (
            <Section title="Ventas por día">
              <div className="space-y-0.5">
                <TableHeader />
                {v.byDay.map((d: any) => (
                  <TaxRow
                    key={d.day}
                    label={new Date(d.day + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    sub={`${d.orders} venta${d.orders !== 1 ? 's' : ''}`}
                    bruto={d.bruto}
                    neto={d.neto}
                    iva={d.iva}
                    className="hover:bg-gray-800/50 transition-colors"
                  />
                ))}
                {/* Totales */}
                <TaxRow
                  label="TOTAL VENTAS"
                  sub={`${v.orderCount} ventas`}
                  bruto={v.totalBruto}
                  neto={v.netoVentas}
                  iva={v.ivaDebito}
                  className="bg-gray-800 font-bold mt-1"
                />
              </div>
            </Section>
          )}

          {/* ── Detalle facturas de compra ───────────────────── */}
          {c.facturas.length > 0 ? (
            <Section title="Facturas de compra (IVA Crédito)">
              <div className="space-y-0.5">
                <TableHeader />
                {c.facturas.map((f: any, i: number) => (
                  <TaxRow
                    key={i}
                    label={f.invoice_number ?? `Factura #${i + 1}`}
                    sub={`${f.supplier_name} · ${f.invoice_date}`}
                    bruto={f.total_factura}
                    neto={f.neto}
                    iva={f.iva}
                    className="hover:bg-gray-800/50 transition-colors"
                  />
                ))}
                {/* Totales */}
                <TaxRow
                  label="TOTAL COMPRAS"
                  sub={`${c.invoiceCount} factura${c.invoiceCount !== 1 ? 's' : ''}`}
                  bruto={c.totalFacturas}
                  neto={c.netoCompras}
                  iva={c.ivaCredito}
                  className="bg-gray-800 font-bold mt-1"
                />
              </div>
            </Section>
          ) : (
            <Section title="Facturas de compra (IVA Crédito)">
              <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                <FileText className="w-4 h-4" />
                Sin facturas de compra en el período
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
