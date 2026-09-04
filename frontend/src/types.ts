export type UserRole = 'normal' | 'supremo'
export type UserStatus = 'activo' | 'inactivo'
export type ProductStatus = 'active' | 'inactive'

export interface User {
  id: number
  dni?: string
  name: string
  initials?: string
  email: string
  password?: string
  role: UserRole
  estado: UserStatus
  username?: string
  phone?: string
  address?: string
  cityId?: number
  backendRole?: string
}

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  price: number
  stock: number
  minStock: number
  measures: string
  presentation: string
  colors: string
  description: string
  status: ProductStatus
  colorId?: number
  referenceId?: number
}

export interface ProductForm {
  name: string
  sku: string
  category: string
  price: number
  stock: number
  minStock: number
  measures: string
  presentation: string
  colors: string
  description: string
  status: ProductStatus
  colorId?: number
  referenceId?: number
}

export interface UserForm {
  dni: string
  name: string
  initials: string
  email: string
  password?: string
  role: UserRole
  estado: UserStatus
  username?: string
  phone?: string
  address?: string
  cityId?: number
}

export interface CatalogOption {
  id: number
  name: string
}

export interface DashboardMetric {
  label: string
  value: string
  subtext: string
  trendType: 'delta-up' | 'delta-down'
  icon: string
}

export interface SalesSeriesEntry {
  month: string
  value: number
}

export interface CategoryShareItem {
  label: string
  percent: number
  color: string
}

export interface BestSeller {
  name: string
  sku: string
  category: string
  units: number
  revenue: number
  trend: string
  trendType: 'badge-success' | 'badge-warning'
}

export interface DashboardData {
  metrics: DashboardMetric[]
  salesSeries: SalesSeriesEntry[]
  categoryShare: {
    total: number
    items: CategoryShareItem[]
  }
  bestSellers: BestSeller[]
}

export interface Sale {
  id: number
  customer: string
  product: string
  total: number
  status: string
  date: string
}

export interface StockItem {
  id: number
  name: string
  category: string
  stock: number
  minStock: number
  sku?: string
}

export interface ReportRow {
  period: string
  income: number
  profit: number
  margin: number
  salesCount?: number
}

export interface ReportData {
  cards: DashboardMetric[]
  table: ReportRow[]
}

export interface AuditEntry {
  id: number
  user: string
  action: string
  module: string
  date: string
}

export type MovementType = 'entrada' | 'salida'
export type MovementReason = 'Producción' | 'Reembolso' | 'Venta' | 'Daño' | 'Defecto'

export interface InventoryMovementItem {
  productId: number
  productName: string
  quantity: number
}

export interface InventoryMovement {
  id: number
  type: MovementType
  reason: MovementReason
  date: string
  user: string
  items: InventoryMovementItem[]
}

export interface InventoryMovementForm {
  productId: number
  quantity: number
  reason: Exclude<MovementReason, 'Venta'>
}
