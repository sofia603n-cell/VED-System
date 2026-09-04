import { useEffect, useMemo, useState } from 'react'
import { fetchReports } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
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
      return { income: 0, profit: 0, margin: 0 }
    }

    const income = visibleRows.reduce((sum, row) => sum + row.income, 0)
    const profit = visibleRows.reduce((sum, row) => sum + row.profit, 0)
    const margin = Math.round((profit / Math.max(1, income)) * 100)

    return { income, profit, margin }
  }, [visibleRows])

  const selectedRow = useMemo(() => {
    if (!visibleRows.length) return null
    return visibleRows.find((row) => row.period === activePeriod) ?? visibleRows[visibleRows.length - 1]
  }, [activePeriod, visibleRows])

  if (!report) return <LoadingState />

  const maxIncome = Math.max(...visibleRows.map((row) => row.income), 1)

  const handleExportCSV = () => {
    const rows = [
      ['Período', 'Ingresos (COP)', 'Ganancia Neta (COP)', 'Margen (%)', 'Ventas Realizadas'],
      ...visibleRows.map((r) => [
        r.period,
        String(r.income),
        String(r.profit),
        `${Math.round((r.profit / Math.max(1, r.income)) * 100)}%`,
        String(r.salesCount ?? Math.max(8, Math.round(r.income / 65000))),
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
          <h2 className="section-title">Informes Financieros & Rentabilidad</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Análisis de ingresos brutos, utilidad neta y desempeño comercial
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

      {/* Gráfico y Panel de Desempeño */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Ingresos vs Utilidad Neta</div>
              <div className="card-sub">
                {selectedRow
                  ? `${selectedRow.period}: Ingresos ${formatCurrency(selectedRow.income)} | Ganancia ${formatCurrency(selectedRow.profit)}`
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

          <div className="chart-bars" style={{ height: '220px' }}>
            {visibleRows.map((row) => {
              const isActive = row.period === selectedRow?.period
              return (
                <div
                  key={row.period}
                  className="bar-group"
                  style={{ cursor: 'pointer', opacity: isActive ? 1 : 0.8 }}
                  onMouseEnter={() => setActivePeriod(row.period)}
                >
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                    <div
                      className="bar"
                      style={{
                        height: `${Math.max(16, (row.income / maxIncome) * 100)}%`,
                        background: 'linear-gradient(180deg, var(--gold) 0%, rgba(217, 119, 6, 0.4) 100%)',
                        maxWidth: '20px',
                      }}
                      title={`Ingresos: ${formatCurrency(row.income)}`}
                    />
                    <div
                      className="bar"
                      style={{
                        height: `${Math.max(12, (row.profit / maxIncome) * 100)}%`,
                        background: 'linear-gradient(180deg, var(--success) 0%, rgba(16, 185, 129, 0.4) 100%)',
                        maxWidth: '20px',
                      }}
                      title={`Ganancia: ${formatCurrency(row.profit)}`}
                    />
                  </div>
                  <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--gold)' : 'var(--text-dim)' }}>
                    {row.period}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '16px', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--gold)', borderRadius: '3px' }} />
              Ingresos Brutos
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '3px' }} />
              Utilidad Neta
            </span>
          </div>
        </div>

        {/* Resumen del Período Seleccionado */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <div className="card-title">Balance del Período</div>
                <div className="card-sub">Totales calculados ({range})</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Facturación Total</span>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 700, color: 'var(--gold)' }}>
                  {formatCurrency(summary.income)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Ganancia Neta Acumulada</span>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                  {formatCurrency(summary.profit)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Margen Operativo Promedio</span>
                <div style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {summary.margin}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Desglosada */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Mes / Período</th>
              <th>Ventas Facturadas</th>
              <th>Ingresos Totales</th>
              <th>Utilidad Estimada</th>
              <th>Margen (%)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const marginPct = Math.round((row.profit / Math.max(1, row.income)) * 100)
              return (
                <tr key={row.period}>
                  <td>
                    <strong>{row.period}</strong>
                  </td>
                  <td>{row.salesCount ?? Math.max(8, Math.round(row.income / 65000))} órdenes</td>
                  <td>
                    <strong style={{ color: 'var(--gold)' }}>{formatCurrency(row.income)}</strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--success)' }}>{formatCurrency(row.profit)}</strong>
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
