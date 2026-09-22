import { useEffect, useMemo, useState } from 'react'
import { fetchReports } from '../api/mockApi'
import { LoadingState } from '../components/common/LoadingState'
import { ReportsCharts, ReportsHeader, ReportsInsights, ReportsMetrics, ReportsOperationChart, ReportsTable } from '../components/reports/ReportsBlocks'
import { useToast } from '../context/ToastContext'
import type { ReportData } from '../types'

export function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [range, setRange] = useState<'6M' | '12M'>('6M')
  const [activePeriod, setActivePeriod] = useState<string | null>(null)
  const { info } = useToast()

  useEffect(() => {
    fetchReports().then((data) => {
      setReport(data)
      setActivePeriod(data.table[data.table.length - 1]?.period ?? null)
    })
  }, [])

  const visibleRows = useMemo(() => {
    if (!report) return []
    return range === '6M' ? report.table.slice(-6) : report.table
  }, [range, report])

  const summary = useMemo(() => {
    if (!visibleRows.length) {
      return { income: 0, profit: 0, margin: 0, orders: 0, averageInvoice: 0 }
    }

    const income = visibleRows.reduce((sum, row) => sum + row.income, 0)
    const profit = visibleRows.reduce((sum, row) => sum + row.profit, 0)
    const orders = visibleRows.reduce((sum, row) => sum + (row.salesCount ?? 0), 0)
    const margin = Math.round((profit / Math.max(1, income)) * 100)

    return { income, profit, margin, orders, averageInvoice: income / Math.max(1, orders) }
  }, [visibleRows])

  const selectedRow = useMemo(() => {
    if (!visibleRows.length) return null
    return visibleRows.find((row) => row.period === activePeriod) ?? visibleRows[visibleRows.length - 1]
  }, [activePeriod, visibleRows])

  const bestPeriod = useMemo(() => visibleRows.reduce<typeof visibleRows[number] | undefined>((best, row) => !best || row.income > best.income ? row : best, undefined), [visibleRows])
  const monthlyVariation = useMemo(() => {
    const current = visibleRows[visibleRows.length - 1]
    const previous = visibleRows[visibleRows.length - 2]
    return previous?.income ? ((current?.income ?? 0) - previous.income) / previous.income * 100 : 0
  }, [visibleRows])

  if (!report) return <LoadingState />

  const handleExportCSV = () => {
    const rows = [
      ['Período', 'Ingresos (COP)', 'Ganancia Neta (COP)', 'Margen (%)', 'Ventas Realizadas', 'Factura Promedio (COP)'],
      ...visibleRows.map((r) => [
        r.period,
        String(r.income),
        String(r.profit),
        `${Math.round((r.profit / Math.max(1, r.income)) * 100)}%`,
        String(r.salesCount ?? 0),
        String(Math.round(r.income / Math.max(1, r.salesCount ?? 0))),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_financiero_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    info('Reporte financiero exportado a CSV', 'Descarga Completa')
  }

  return <>
    <ReportsHeader onExport={handleExportCSV} />
    <ReportsMetrics cards={report.cards} />
    <ReportsInsights income={summary.income} averageInvoice={summary.averageInvoice} variation={monthlyVariation} bestPeriod={bestPeriod?.period} />
    <ReportsCharts rows={visibleRows} selectedRow={selectedRow} range={range} onRange={setRange} onSelect={setActivePeriod} />
    <ReportsOperationChart rows={visibleRows} />
    <ReportsTable rows={visibleRows} />
  </>
}
