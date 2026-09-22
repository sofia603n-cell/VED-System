import type { DashboardData, DashboardMetric } from '../../types'
import { AnalyticsChart } from '../common/AnalyticsChart'
import { MetricCard } from '../common/MetricCard'
import { StatsBarChart } from '../common/StatsBarChart'
import { formatCurrency } from '../../utils/formatters'

interface DashboardMetricsGridProps {
  metrics: DashboardMetric[]
}

export function DashboardMetricsGrid({ metrics }: DashboardMetricsGridProps) {
  return (
    <div className="metrics-grid">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  )
}

interface DashboardPerformanceProps {
  chartSeries: DashboardData['salesSeries']
  categoryShare: DashboardData['categoryShare']
  range: '6M' | '1A'
  selectedPeriod: { month: string; value: number; orders: number; units: number; damaged?: number } | null
  onRangeChange: (next: '6M' | '1A') => void
  onSelectPeriod: (month: string) => void
}

export function DashboardPerformance({
  chartSeries,
  categoryShare,
  range,
  selectedPeriod,
  onRangeChange,
  onSelectPeriod,
}: DashboardPerformanceProps) {
  const insightPeriod = selectedPeriod ?? chartSeries[chartSeries.length - 1]

  return (
    <div className="charts-row">
      <div className="chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">Ventas & Producción</div>
            <div className="card-sub">
              {insightPeriod
                ? `${insightPeriod.month}: ${insightPeriod.orders} pedidos · ${insightPeriod.units} unidades · Factura ${formatCurrency(insightPeriod.value / Math.max(1, insightPeriod.orders))}`
                : 'Selecciona un período para analizar pedidos y volumen'}
            </div>
          </div>
          <div className="period-pills" aria-label="Filtros de rango de ventas">
            <button
              className={`pill ${range === '6M' ? 'active' : ''}`}
              type="button"
              onClick={() => onRangeChange('6M')}
            >
              <i className="ti ti-calendar-stats" /> 6 Meses
            </button>
            <button
              className={`pill ${range === '1A' ? 'active' : ''}`}
              type="button"
              onClick={() => onRangeChange('1A')}
            >
              <i className="ti ti-chart-area-line" /> 1 Año
            </button>
          </div>
        </div>

        <AnalyticsChart
          valueLabel="Valor de pedidos"
          points={chartSeries.map((bar) => ({
            label: bar.month,
            value: bar.value,
            secondary: bar.orders,
            secondaryLabel: 'Pedidos',
            detail: `${bar.units} unidades · Factura ${formatCurrency(bar.value / Math.max(1, bar.orders))}`,
          }))}
          onSelect={(point) => onSelectPeriod(point.label)}
        />
      </div>

      <DashboardDistribution categoryShare={categoryShare} />
    </div>
  )
}

interface DashboardDistributionProps {
  categoryShare: { total: number; items: Array<{ label: string; percent: number; color: string; units: number }> }
}

export function DashboardDistribution({ categoryShare }: DashboardDistributionProps) {
  const share = categoryShare

  const donutGradient = share.items.length
    ? `conic-gradient(${share.items
        .map((item, index, items) => {
          const start = items.slice(0, index).reduce((sum, part) => sum + part.percent, 0)
          return `${item.color} ${start}% ${start + item.percent}%`
        })
        .join(', ')})`
    : 'conic-gradient(#d4af37 0 100%)'

  return (
    <div className="chart-card">
      <div className="card-header">
        <div>
          <div className="card-title">Distribución</div>
          <div className="card-sub">Ventas por tipo de vela</div>
        </div>
      </div>
      <div className="donut-wrap">
        <div className="donut-chart" style={{ background: donutGradient }}>
          <div className="donut-inner">
            <span style={{ fontSize: '1.4rem' }}>{share.total}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>Total</span>
          </div>
        </div>
      </div>
      <div className="legend-list">
        {share.items.map((item) => (
          <div key={item.label} className="legend-item">
            <span className="legend-dot">
              <span className="dot" style={{ background: item.color }} />
              {item.label}
            </span>
            <span className="legend-pct">{item.percent}% · {item.units} und.</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DashboardStatsProps {
  chartSeries: DashboardData['salesSeries']
}

export function DashboardStats({ chartSeries }: DashboardStatsProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <StatsBarChart
        data={chartSeries.map((item) => ({
          label: item.month,
          damaged: item.damaged ?? 0,
          sold: item.units,
          orders: item.orders,
        }))}
        title="Estadísticas de Operación: Dañadas, Vendidas y Pedidos"
        subtitle="Gráfico de barras comparativo: cuántas se dañaron, cuántas se vendieron y cuántos pedidos se hicieron"
      />
    </div>
  )
}
