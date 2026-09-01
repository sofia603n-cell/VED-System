import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboard } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
import { LoadingState } from '../components/common/LoadingState'
import type { DashboardData } from '../types'
import { formatCurrency } from '../utils/formatters'

const fallbackDashboardData: DashboardData = {
  metrics: [
    { label: 'Pedidos', value: '18', subtext: 'Total del sistema', trendType: 'delta-up', icon: 'ti-shopping-cart' },
    { label: 'Ventas', value: formatCurrency(2480000), subtext: 'Monto registrado', trendType: 'delta-up', icon: 'ti-cash' },
    { label: 'Bajo stock', value: '3', subtext: 'Productos a revisar', trendType: 'delta-down', icon: 'ti-package' },
    { label: 'Usuarios', value: '3', subtext: 'Activos en el sistema', trendType: 'delta-up', icon: 'ti-users' },
  ],
  salesSeries: [
    { month: 'Ene', value: 22 },
    { month: 'Feb', value: 35 },
    { month: 'Mar', value: 31 },
    { month: 'Abr', value: 48 },
    { month: 'May', value: 56 },
    { month: 'Jun', value: 62 },
    { month: 'Jul', value: 68 },
    { month: 'Ago', value: 74 },
    { month: 'Sep', value: 72 },
    { month: 'Oct', value: 80 },
    { month: 'Nov', value: 88 },
    { month: 'Dic', value: 96 },
  ],
  categoryShare: {
    total: 100,
    items: [
      { label: 'Velas', percent: 42, color: '#d4af37' },
      { label: 'Aromáticas', percent: 30, color: '#7c4dff' },
      { label: 'Navideñas', percent: 28, color: '#3a86ff' },
    ],
  },
  bestSellers: [
    { name: 'Vela Árabe', sku: 'VEL-1', category: 'Velas', units: 34, revenue: 1428000, trend: '+8%', trendType: 'badge-success' },
    { name: 'Vela Floral', sku: 'VEL-2', category: 'Aromáticas', units: 21, revenue: 756000, trend: '+12%', trendType: 'badge-warning' },
    { name: 'Vela Navideña', sku: 'VEL-3', category: 'Navideñas', units: 14, revenue: 672000, trend: '+10%', trendType: 'badge-success' },
  ],
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(fallbackDashboardData)
  const [range, setRange] = useState<'6M' | '1A'>('6M')

  useEffect(() => {
    fetchDashboard().then(setData).catch(() => setData(fallbackDashboardData))
  }, [])

  if (!data) return <LoadingState />

  const chartSeries = range === '6M' ? data.salesSeries.slice(-6) : data.salesSeries
  const maxBarValue = Math.max(...chartSeries.map((bar) => bar.value), 100)
  const donutGradient = data.categoryShare.items.length
    ? `conic-gradient(${data.categoryShare.items
        .map((item, index, items) => {
          const start = items.slice(0, index).reduce((sum, part) => sum + part.percent, 0)
          return `${item.color} ${start}% ${start + item.percent}%`
        })
        .join(', ')})`
    : 'conic-gradient(#d4af37 0 100%)'

  return (
    <>
      <div className="metrics-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Ventas mensuales</div>
              <div className="card-sub">Ingresos acumulados 2026</div>
            </div>
            <div className="period-pills" aria-label="Filtros de rango de ventas">
              <button className={`pill ${range === '6M' ? 'active' : ''}`} type="button" onClick={() => setRange('6M')}>
                <i className="ti ti-calendar-stats" /> 6M
              </button>
              <button className={`pill ${range === '1A' ? 'active' : ''}`} type="button" onClick={() => setRange('1A')}>
                <i className="ti ti-chart-area-line" /> 1A
              </button>
            </div>
          </div>
          <div className="chart-bars">
            {chartSeries.map((bar) => (
              <div key={bar.month} className="bar-group">
                <div className="bar" style={{ height: `${Math.max(18, (bar.value / maxBarValue) * 100)}%` }} title={`${bar.month}: ${bar.value}%`} />
                <span>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Categorías</div>
              <div className="card-sub">Distribución por tipo</div>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut-chart" style={{ background: donutGradient }}>
              <div className="donut-inner">{data.categoryShare.total}%</div>
            </div>
          </div>
          <div className="legend-list">
            {data.categoryShare.items.map((item) => (
              <div key={item.label} className="legend-item">
                <span className="legend-dot">
                  <span className="dot" style={{ background: item.color }} />
                  {item.label}
                </span>
                <span className="legend-pct">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Productos más vendidos</div>
        <Link className="btn-outline" to="/productos">
          <i className="ti ti-arrow-right" /> Ver todos
        </Link>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Unidades</th>
              <th>Ingresos</th>
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {data.bestSellers.map((product) => (
              <tr key={product.name}>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">🕯️</div>
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-sku">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{product.category}</span></td>
                <td>{product.units}</td>
                <td>{formatCurrency(product.revenue)}</td>
                <td>
                  <span className={`badge ${product.trendType}`}>
                    <i className="ti ti-trending-up" /> {product.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
