import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../../utils/formatters'

export type AnalyticsPoint = { label: string; value: number; secondary?: number; secondaryLabel?: string; detail?: string }

export function AnalyticsChart({ points, valueLabel, onSelect, valueFormat = 'currency' }: { points: AnalyticsPoint[]; valueLabel: string; onSelect?: (point: AnalyticsPoint) => void; valueFormat?: 'currency' | 'number' }) {
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, points.length - 1))
  useEffect(() => setSelectedIndex(Math.max(0, points.length - 1)), [points.length])
  const chart = useMemo(() => {
    const width = 680, height = 250, left = 54, right = 24, top = 22, bottom = 42
    const max = Math.max(...points.map((point) => point.value), 1)
    const x = (index: number) => points.length === 1 ? width / 2 : left + index * (width - left - right) / (points.length - 1)
    const y = (value: number) => top + (1 - value / max) * (height - top - bottom)
    return { width, height, left, right, bottom, max, x, y, path: points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.value)}`).join(' ') }
  }, [points])
  if (!points.length) return <div className="analytics-empty">Aún no hay datos suficientes para esta gráfica.</div>
  const selected = points[selectedIndex] ?? points[points.length - 1]
  const select = (index: number) => { setSelectedIndex(index); onSelect?.(points[index]) }
  const formatValue = (value: number) => valueFormat === 'currency' ? formatCurrency(value) : new Intl.NumberFormat('es-CO').format(Math.round(value))
  return <div className="analytics-chart">
    <div className="analytics-tooltip"><strong>{selected.label}</strong><span>{valueLabel}: {formatValue(selected.value)}</span>{selected.secondary !== undefined ? <span>{selected.secondaryLabel ?? 'Pedidos'}: {selected.secondary}</span> : null}{selected.detail ? <small>{selected.detail}</small> : null}</div>
    <svg viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="none">
      {[0, .25, .5, .75, 1].map((fraction) => <g key={fraction}><line x1={chart.left} x2={chart.width - chart.right} y1={chart.y(chart.max * fraction)} y2={chart.y(chart.max * fraction)} className="analytics-grid-line" /><text x={chart.left - 8} y={chart.y(chart.max * fraction) + 4} className="analytics-axis-label" textAnchor="end">{formatValue(chart.max * fraction)}</text></g>)}
      <path d={`${chart.path} L ${chart.x(points.length - 1)} ${chart.height - chart.bottom} L ${chart.x(0)} ${chart.height - chart.bottom} Z`} className="analytics-area" /><path d={chart.path} className="analytics-line" />
      {points.map((point, index) => <g key={point.label} className="analytics-point" onClick={() => select(index)}><circle cx={chart.x(index)} cy={chart.y(point.value)} r={index === selectedIndex ? 6 : 4} /><text x={chart.x(index)} y={chart.height - 13} textAnchor="middle" className="analytics-x-label">{point.label}</text></g>)}
    </svg>
    <div className="analytics-periods">{points.map((point, index) => <button key={point.label} type="button" className={index === selectedIndex ? 'active' : ''} onClick={() => select(index)}>{point.label}</button>)}</div>
  </div>
}
