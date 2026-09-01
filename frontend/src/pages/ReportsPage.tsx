import { useEffect, useMemo, useState } from 'react'
import { fetchReports } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
import { LoadingState } from '../components/common/LoadingState'
import type { ReportData } from '../types'
import { formatCurrency } from '../utils/formatters'

export function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [range, setRange] = useState<'6M' | '12M'>('6M')
  const [activePeriod, setActivePeriod] = useState<string | null>(null)

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

  return (
    <>
      <div className="metrics-grid">
        {report.cards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="charts-row reports-grid">
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Rendimiento financiero</div>
              <div className="card-sub">Ingresos y ganancias por periodo</div>
            </div>
            <div className="period-pills" aria-label="Filtro de reportes por periodo">
              <button type="button" className={`pill ${range === '6M' ? 'active' : ''}`} onClick={() => setRange('6M')}>
                <i className="ti ti-chart-line" /> 6M
              </button>
              <button type="button" className={`pill ${range === '12M' ? 'active' : ''}`} onClick={() => setRange('12M')}>
                <i className="ti ti-calendar-event" /> 12M
              </button>
            </div>
          </div>

          <div className="report-bar-chart">
            {visibleRows.map((row) => {
              const isActive = row.period === selectedRow?.period
              return (
                <div
                  key={row.period}
                  className={`report-bar-group ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setActivePeriod(row.period)}
                  onMouseLeave={() => setActivePeriod((current) => current ?? row.period)}
                >
                  <div className="report-bar-values">
                    <div
                      className="report-bar income"
                      style={{ height: `${Math.max(12, (row.income / maxIncome) * 100)}%` }}
                      title={`${row.period}: ${formatCurrency(row.income)}`}
                    />
                    <div
                      className="report-bar profit"
                      style={{ height: `${Math.max(10, (row.profit / maxIncome) * 100)}%` }}
                      title={`${row.period}: ${formatCurrency(row.profit)}`}
                    />
                  </div>
                  <span>{row.period}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="chart-card report-summary-card">
          <div className="card-header compact">
            <div>
              <div className="card-title">Resumen</div>
              <div className="card-sub">{selectedRow ? `Detalle de ${selectedRow.period}` : 'Comparativo del rango'}</div>
            </div>
          </div>
          <div className="report-summary-numbers">
            <div>
              <span>Ingresos</span>
              <strong>{selectedRow ? formatCurrency(selectedRow.income) : formatCurrency(summary.income)}</strong>
            </div>
            <div>
              <span>Ganancia</span>
              <strong>{selectedRow ? formatCurrency(selectedRow.profit) : formatCurrency(summary.profit)}</strong>
            </div>
            <div>
              <span>Margen</span>
              <strong>{selectedRow ? `${selectedRow.margin}%` : `${summary.margin}%`}</strong>
            </div>
          </div>
          <div className="insight-box">
            <i className="ti ti-trend-up" />
            {selectedRow
              ? `Durante ${selectedRow.period} se registraron ingresos de ${formatCurrency(selectedRow.income)} con un margen de ${selectedRow.margin}%.`
              : 'El rendimiento del período se mantiene estable y por encima del objetivo mínimo del negocio.'}
          </div>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Ingresos</th>
              <th>Ganancia</th>
              <th>Margen</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.period} className={row.period === selectedRow?.period ? 'row-highlight' : ''}>
                <td>{row.period}</td>
                <td>{formatCurrency(row.income)}</td>
                <td>{formatCurrency(row.profit)}</td>
                <td>{row.margin}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
