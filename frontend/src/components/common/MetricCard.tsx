import type { DashboardData } from '../../types'

export function MetricCard({ metric }: { metric: DashboardData['metrics'][number] }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{metric.label}</div>
      <div className="metric-value">{metric.value}</div>
      <div className="metric-sub">
        <i className={`ti ${metric.icon}`} />
        <span className={metric.trendType}>{metric.subtext}</span>
      </div>
    </div>
  )
}
