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
