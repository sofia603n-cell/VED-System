import type { Product } from '../types'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function getProductState(product: Pick<Product, 'stock' | 'minStock'>) {
  if (product.stock <= 0) return 'danger'
  if (product.stock <= product.minStock) return 'warning'
  return 'success'
}

export function stateClass(state: 'success' | 'warning' | 'danger') {
  return {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
  }[state]
}

export function coveragePercent(ordered: number, available: number) {
  if (ordered <= 0) return 0
  return Math.round(Math.min(100, (Math.max(0, available) / ordered) * 100))
}

export function coverageState(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 80) return 'success'
  if (percent >= 40) return 'warning'
  return 'danger'
}

export function orderProcessPercent(
  status: string,
  lines: Array<{ ordered: number; stock: number; prepared?: number }>,
) {
  const normalized = status.toLowerCase()
  if (normalized === 'entregado' || normalized === 'completada') return 100
  if (normalized === 'cancelada' || normalized === 'cancelado') return 0

  const ordered = lines.reduce((sum, line) => sum + line.ordered, 0)
  if (ordered <= 0) return 0

  const covered = lines.reduce((sum, line) => {
    const available = Math.max(line.prepared ?? 0, Math.min(line.stock, line.ordered))
    return sum + Math.min(available, line.ordered)
  }, 0)

  const coverage = Math.round((covered / ordered) * 100)
  return coverage
}
