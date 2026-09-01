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
}

export interface UserForm {
  dni: string
  name: string
  initials: string
  email: string
  password: string
  role: UserRole
  estado: UserStatus
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
}

export interface ReportRow {
  period: string
  income: number
  profit: number
  margin: number
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
