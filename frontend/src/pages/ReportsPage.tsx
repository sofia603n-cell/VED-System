import { useEffect, useMemo, useState } from 'react'
import { fetchReports } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
import { AnalyticsChart } from '../components/common/AnalyticsChart'
import { StatsBarChart } from '../components/common/StatsBarChart'
import { LoadingState } from '../components/common/LoadingState'
import { useToast } from '../context/ToastContext'
import type { ReportData } from '../types'
import { formatCurrency } from '../utils/formatters'

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

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Informes de Ventas y Desempeño</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Valor de pedidos, volumen de ventas y comportamiento mensual
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-outline" onClick={handleExportCSV}>
            <i className="ti ti-download" /> Exportar CSV
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <i className="ti ti-printer" /> Imprimir Informe
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Reporte */}
      <div className="metrics-grid">
        {report.cards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="business-insights" aria-label="Resumen comercial del rango seleccionado">
        <div className="business-insight"><i className="ti ti-cash" /><span>Facturación del rango</span><strong>{formatCurrency(summary.income)}</strong></div>
        <div className="business-insight"><i className="ti ti-receipt" /><span>Factura promedio</span><strong>{formatCurrency(summary.averageInvoice)}</strong></div>
        <div className="business-insight"><i className="ti ti-chart-line" /><span>Variación mensual</span><strong className={monthlyVariation >= 0 ? 'positive' : 'negative'}>{monthlyVariation >= 0 ? '+' : ''}{monthlyVariation.toFixed(1)}%</strong></div>
        <div className="business-insight"><i className="ti ti-award" /><span>Mejor período</span><strong>{bestPeriod?.period ?? 'Sin datos'}</strong></div>
      </div>

      {/* Gráfico y Panel de Desempeño */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Evolución mensual de pedidos</div>
              <div className="card-sub">
                {selectedRow
                  ? `${selectedRow.period}: ${formatCurrency(selectedRow.income)} · ${selectedRow.salesCount ?? 0} pedidos · Factura ${formatCurrency(selectedRow.income / Math.max(1, selectedRow.salesCount ?? 0))}`
                  : 'Comparativa mensual'}
              </div>
            </div>
            <div className="period-pills" aria-label="Filtro de periodo">
              <button
                type="button"
                className={`pill ${range === '6M' ? 'active' : ''}`}
                onClick={() => setRange('6M')}
              >
                6 Meses
              </button>
              <button
                type="button"
                className={`pill ${range === '12M' ? 'active' : ''}`}
                onClick={() => setRange('12M')}
              >
                12 Meses
              </button>
            </div>
          </div>

          <AnalyticsChart
            valueLabel="Valor de pedidos"
            points={visibleRows.map((row) => ({
              label: row.period,
              value: row.income,
              secondary: row.salesCount ?? 0,
              secondaryLabel: 'Pedidos',
              detail: `Factura promedio ${formatCurrency(row.income / Math.max(1, row.salesCount ?? 0))}`,
            }))}
            onSelect={(point) => setActivePeriod(point.label)}
          />

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '16px', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--gold)', borderRadius: '3px' }} />
              Valor de pedidos
            </span>
          </div>
        </div>

        {/* Resumen del Período Seleccionado */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <div className="card-title">Balance del Período</div>
                <div className="card-sub">{selectedRow ? `Datos de ${selectedRow.period}` : `Resumen del rango (${range})`}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Facturación Total</span>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 700, color: 'var(--gold)' }}>
                  {formatCurrency(selectedRow?.income ?? 0)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Pedidos registrados</span>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                  {selectedRow?.salesCount ?? 0}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Factura promedio</span>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {formatCurrency((selectedRow?.income ?? 0) / Math.max(1, selectedRow?.salesCount ?? 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras: Comparativa de Dañadas, Vendidas y Pedidos */}
      <div style={{ marginBottom: '24px' }}>
        <StatsBarChart
          data={visibleRows.map((row) => ({
            label: row.period,
            damaged: row.damaged ?? 0,
            sold: row.units ?? row.salesCount ?? 0,
            orders: row.salesCount ?? 0,
          }))}
          title="Estadísticas de Operación: Dañadas, Vendidas y Pedidos"
          subtitle="Gráfico de barras comparativo: cuántas se dañaron, cuántas se vendieron y cuántos pedidos se hicieron por mes"
        />
      </div>

      {/* Tabla Desglosada */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Mes / Período</th>
              <th>Pedidos Realizados</th>
              <th>Facturación Total</th>
              <th>Factura Promedio</th>
              <th>Margen (%)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const marginPct = Math.round((row.profit / Math.max(1, row.income)) * 100)
              const avgInvoice = row.income / Math.max(1, row.salesCount ?? 0)
              return (
                <tr key={row.period}>
                  <td>
                    <strong>{row.period}</strong>
                  </td>
                  <td>{row.salesCount ?? 0} órdenes</td>
                  <td>
                    <strong style={{ color: 'var(--gold)' }}>{formatCurrency(row.income)}</strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--success)' }}>{formatCurrency(avgInvoice)}</strong>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{marginPct}%</span>
                  </td>
                  <td>
                    <span className="badge badge-success">Auditado</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
