import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchDashboard } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
import { LoadingState } from '../components/common/LoadingState'
import type { DashboardData } from '../types'
import { formatCurrency } from '../utils/formatters'

const fallbackDashboardData: DashboardData = {
  metrics: [
    { label: 'Pedidos Realizados', value: '18', subtext: '+12% este mes', trendType: 'delta-up', icon: 'ti-shopping-cart' },
    { label: 'Ventas Totales', value: formatCurrency(2480000), subtext: '+18% vs mes anterior', trendType: 'delta-up', icon: 'ti-cash' },
    { label: 'Stock en Alerta', value: '3', subtext: 'Requieren reposición', trendType: 'delta-down', icon: 'ti-package' },
    { label: 'Usuarios Activos', value: '3', subtext: 'Personal autorizado', trendType: 'delta-up', icon: 'ti-users' },
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
      { label: 'Velas Clásicas', percent: 42, color: '#d4af37' },
      { label: 'Aromáticas', percent: 30, color: '#7c4dff' },
      { label: 'Navideñas & Festivas', percent: 28, color: '#3a86ff' },
    ],
  },
  bestSellers: [
    { name: 'Vela Árabe Dorada', sku: 'VEL-1', category: 'Velas Clásicas', units: 34, revenue: 1428000, trend: '+8%', trendType: 'badge-success' },
    { name: 'Vela Floral Aromaterapia', sku: 'VEL-2', category: 'Aromáticas', units: 21, revenue: 756000, trend: '+12%', trendType: 'badge-warning' },
    { name: 'Vela Navideña Estrella', sku: 'VEL-3', category: 'Navideñas', units: 14, revenue: 672000, trend: '+10%', trendType: 'badge-success' },
  ],
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [range, setRange] = useState<'6M' | '1A'>('6M')
  const [hoveredBar, setHoveredBar] = useState<{ month: string; value: number } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
      .then((res) => {
        setData(res || fallbackDashboardData)
      })
      .catch(() => setData(fallbackDashboardData))
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
      {/* Banner de Stock en Alerta */}
      <div className="alert-bar" style={{ cursor: 'pointer' }} onClick={() => navigate('/stock')}>
        <i className="ti ti-alert-triangle" style={{ fontSize: '1.2rem' }} />
        <span style={{ flex: 1 }}>
          <strong>Aviso de Inventario:</strong> Existen productos con stock crítico por debajo del mínimo establecido.
        </span>
        <span className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'transparent' }}>
          Revisar Stock <i className="ti ti-arrow-right" />
        </span>
      </div>

      {/* Acciones Rápidas */}
      <div className="section-header" style={{ marginTop: '-8px' }}>
        <div>
          <h2 className="section-title">Resumen Ejecutivo</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Monitoreo en tiempo real del taller y puntos de distribución
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-primary" onClick={() => navigate('/ventas')}>
            <i className="ti ti-shopping-cart-plus" /> Registrar Venta
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/productos')}>
            <i className="ti ti-candle" /> Nuevo Producto
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/entradas')}>
            <i className="ti ti-arrow-bar-to-down" /> Entrada Stock
          </button>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="metrics-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Gráficos de Ventas y Categorías */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Ventas & Producción</div>
              <div className="card-sub">
                {hoveredBar
                  ? `Mes ${hoveredBar.month}: Índice de actividad ${hoveredBar.value} pts`
                  : 'Evolución de pedidos y volumen de ventas'}
              </div>
            </div>
            <div className="period-pills" aria-label="Filtros de rango de ventas">
              <button
                className={`pill ${range === '6M' ? 'active' : ''}`}
                type="button"
                onClick={() => setRange('6M')}
              >
                <i className="ti ti-calendar-stats" /> 6 Meses
              </button>
              <button
                className={`pill ${range === '1A' ? 'active' : ''}`}
                type="button"
                onClick={() => setRange('1A')}
              >
                <i className="ti ti-chart-area-line" /> 1 Año
              </button>
            </div>
          </div>

          <div className="chart-bars">
            {chartSeries.map((bar) => (
              <div
                key={bar.month}
                className="bar-group"
                onMouseEnter={() => setHoveredBar(bar)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div
                  className="bar"
                  style={{ height: `${Math.max(16, (bar.value / maxBarValue) * 100)}%` }}
                  title={`${bar.month}: ${bar.value}% del volumen`}
                />
                <span>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

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
                <span style={{ fontSize: '1.4rem' }}>{data.categoryShare.total}%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>Total</span>
              </div>
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

      {/* Productos más vendidos */}
      <div className="section-header">
        <div>
          <h3 className="section-title">Productos Estrella</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Referencias con mayor demanda y facturación
          </span>
        </div>
        <Link className="btn-outline" to="/productos">
          <i className="ti ti-arrow-right" /> Ver catálogo completo
        </Link>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto & Referencia</th>
              <th>Línea</th>
              <th>Unidades Despachadas</th>
              <th>Total Facturado</th>
              <th>Rendimiento</th>
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
                <td>
                  <span className="badge badge-neutral">{product.category}</span>
                </td>
                <td>
                  <strong>{product.units}</strong> unid.
                </td>
                <td>
                  <strong style={{ color: 'var(--gold)' }}>{formatCurrency(product.revenue)}</strong>
                </td>
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
