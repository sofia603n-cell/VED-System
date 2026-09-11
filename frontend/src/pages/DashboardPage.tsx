import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchDashboard } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
import { AnalyticsChart } from '../components/common/AnalyticsChart'
import { LoadingState } from '../components/common/LoadingState'
import type { DashboardData } from '../types'
import { formatCurrency } from '../utils/formatters'
const emptyDashboardData: DashboardData = {
  metrics: [],
  salesSeries: [],
  categoryShare: { total: 0, items: [] },
  bestSellers: [],
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [range, setRange] = useState<'6M' | '1A'>('6M')
  const [selectedPeriod, setSelectedPeriod] = useState<{ month: string; value: number; orders: number; units: number } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
      .then((res) => {
        setData(res)
      })
      .catch(() => setData(emptyDashboardData))
  }, [])

  if (!data) return <LoadingState />

  const chartSeries = range === '6M' ? data.salesSeries.slice(-6) : data.salesSeries
  const insightPeriod = selectedPeriod ?? chartSeries[chartSeries.length - 1]
  const lowStockCount = Number(data.metrics.find((metric) => metric.label === 'Bajo stock')?.value ?? 0)
  const businessInsights = (() => {
    const totalValue = chartSeries.reduce((sum, item) => sum + item.value, 0)
    const totalOrders = chartSeries.reduce((sum, item) => sum + item.orders, 0)
    const totalUnits = chartSeries.reduce((sum, item) => sum + item.units, 0)
    const current = chartSeries[chartSeries.length - 1]
    const previous = chartSeries[chartSeries.length - 2]
    const variation = previous?.value ? ((current?.value ?? 0) - previous.value) / previous.value * 100 : 0
    const best = chartSeries.reduce<typeof chartSeries[number] | undefined>((top, item) => !top || item.value > top.value ? item : top, undefined)
    return { totalValue, totalOrders, totalUnits, variation, best }
  })()
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
      {lowStockCount > 0 && (
        <div className="alert-bar" style={{ cursor: 'pointer' }} onClick={() => navigate('/stock')}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '1.2rem' }} />
          <span style={{ flex: 1 }}>
            <strong>Aviso de Inventario:</strong> {lowStockCount} producto(s) tienen stock por debajo del mínimo establecido.
          </span>
          <span className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'transparent' }}>
            Revisar Stock <i className="ti ti-arrow-right" />
          </span>
        </div>
      )}

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
                {insightPeriod
                  ? `${insightPeriod.month}: ${insightPeriod.orders} pedidos · ${insightPeriod.units} unidades · Ticket ${formatCurrency(insightPeriod.value / Math.max(1, insightPeriod.orders))}`
                  : 'Selecciona un período para analizar pedidos y volumen'}
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

          <AnalyticsChart
            valueLabel="Valor de pedidos"
            points={chartSeries.map((bar) => ({ label: bar.month, value: bar.value, secondary: bar.orders, secondaryLabel: 'Pedidos', detail: `${bar.units} unidades · Ticket ${formatCurrency(bar.value / Math.max(1, bar.orders))}` }))}
            onSelect={(point) => {
              const bar = chartSeries.find((item) => item.month === point.label)
              if (bar) setSelectedPeriod(bar)
            }}
          />
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
                <span className="legend-pct">{item.percent}% · {item.units} und.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="business-insights" aria-label="Indicadores comerciales del período">
        <div className="business-insight"><i className="ti ti-receipt-2" /><span>Ticket promedio</span><strong>{formatCurrency(businessInsights.totalValue / Math.max(1, businessInsights.totalOrders))}</strong></div>
        <div className="business-insight"><i className="ti ti-packages" /><span>Unidades por pedido</span><strong>{(businessInsights.totalUnits / Math.max(1, businessInsights.totalOrders)).toFixed(1)}</strong></div>
        <div className="business-insight"><i className="ti ti-chart-line" /><span>Variación mensual</span><strong className={businessInsights.variation >= 0 ? 'positive' : 'negative'}>{businessInsights.variation >= 0 ? '+' : ''}{businessInsights.variation.toFixed(1)}%</strong></div>
        <div className="business-insight"><i className="ti ti-trophy" /><span>Mejor mes</span><strong>{businessInsights.best?.month ?? 'Sin datos'}</strong></div>
      </div>

      <div className="charts-row charts-row-equal">
        <div className="chart-card">
          <div className="card-header">
            <div><div className="card-title">Pedidos por mes</div><div className="card-sub">Carga comercial y conversión de demanda</div></div>
          </div>
          <AnalyticsChart valueLabel="Pedidos" valueFormat="number" points={chartSeries.map((item) => ({ label: item.month, value: item.orders, secondary: item.units, secondaryLabel: 'Unidades', detail: `Promedio: ${(item.units / Math.max(1, item.orders)).toFixed(1)} unidades por pedido` }))} />
        </div>
        <div className="chart-card">
          <div className="card-header">
            <div><div className="card-title">Unidades vendidas</div><div className="card-sub">Volumen para planificar producción e inventario</div></div>
          </div>
          <AnalyticsChart valueLabel="Unidades" valueFormat="number" points={chartSeries.map((item) => ({ label: item.month, value: item.units, secondary: item.orders, secondaryLabel: 'Pedidos', detail: `Facturación: ${formatCurrency(item.value)}` }))} />
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
