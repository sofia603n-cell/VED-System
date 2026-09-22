import { useEffect, useState } from 'react'
import { fetchDashboard } from '../api/mockApi'
import { LoadingState } from '../components/common/LoadingState'
import {
  DashboardHeader,
  DashboardTopProducts,
} from '../components/dashboard/DashboardHeader'
import {
  DashboardMetricsGrid,
  DashboardPerformance,
  DashboardStats,
} from '../components/dashboard/DashboardModules'
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
  const [selectedPeriod, setSelectedPeriod] = useState<{ month: string; value: number; orders: number; units: number; damaged?: number } | null>(null)

  useEffect(() => {
    fetchDashboard()
      .then((res) => {
        setData(res)
      })
      .catch(() => setData(emptyDashboardData))
  }, [])

  if (!data) return <LoadingState />

  const chartSeries = range === '6M' ? data.salesSeries.slice(-6) : data.salesSeries
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
  return (
    <>
      <DashboardHeader lowStockCount={lowStockCount} />

      <DashboardMetricsGrid metrics={data.metrics} />

      <DashboardPerformance
        chartSeries={chartSeries}
        categoryShare={data.categoryShare}
        range={range}
        selectedPeriod={selectedPeriod}
        onRangeChange={setRange}
        onSelectPeriod={(month) => {
          const bar = chartSeries.find((item) => item.month === month)
          if (bar) setSelectedPeriod(bar)
        }}
      />

      <div className="business-insights" aria-label="Indicadores comerciales del período">
        <div className="business-insight"><i className="ti ti-receipt-2" /><span>Factura promedio</span><strong>{formatCurrency(businessInsights.totalValue / Math.max(1, businessInsights.totalOrders))}</strong></div>
        <div className="business-insight"><i className="ti ti-packages" /><span>Unidades por pedido</span><strong>{(businessInsights.totalUnits / Math.max(1, businessInsights.totalOrders)).toFixed(1)}</strong></div>
        <div className="business-insight"><i className="ti ti-chart-line" /><span>Variación mensual</span><strong className={businessInsights.variation >= 0 ? 'positive' : 'negative'}>{businessInsights.variation >= 0 ? '+' : ''}{businessInsights.variation.toFixed(1)}%</strong></div>
        <div className="business-insight"><i className="ti ti-trophy" /><span>Mejor mes</span><strong>{businessInsights.best?.month ?? 'Sin datos'}</strong></div>
      </div>

      {/* Gráfico de Barras: Comparativa de Dañadas, Vendidas y Pedidos */}
      <DashboardStats chartSeries={chartSeries} />

      <DashboardTopProducts items={data.bestSellers} />
    </>
  )
}
