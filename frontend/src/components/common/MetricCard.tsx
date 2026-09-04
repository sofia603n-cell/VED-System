import type { DashboardData } from '../../types'

export function MetricCard({ metric }: { metric: DashboardData['metrics'][number] }) {
  const isUp = metric.trendType === 'delta-up'

  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span className="metric-label">{metric.label}</span>
        <div className="metric-icon-wrap">
          <i className={`ti ${metric.icon}`} />
        </div>
      </div>
      <div className="metric-value">{metric.value}</div>
      <div className="metric-sub">
        <span className={isUp ? 'delta-up' : 'delta-down'}>
          <i className={`ti ${isUp ? 'ti-trending-up' : 'ti-alert-circle'}`} />
          {metric.subtext}
        </span>
      </div>
    </div>
  )
}
