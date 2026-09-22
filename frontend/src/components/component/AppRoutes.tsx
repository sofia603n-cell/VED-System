import { lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { User } from '../../types'
import { ProtectedLayout } from './ProtectedLayout'

const AuditPage = lazy(() => import('../../pages/AuditPage').then((module) => ({ default: module.AuditPage })))
const CustomerAuditPage = lazy(() => import('../../pages/CustomerAuditPage').then((module) => ({ default: module.CustomerAuditPage })))
const DashboardPage = lazy(() => import('../../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const EntriesPage = lazy(() => import('../../pages/EntriesPage').then((module) => ({ default: module.EntriesPage })))
const LoginPage = lazy(() => import('../../pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const ProductsPage = lazy(() => import('../../pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const ReportsPage = lazy(() => import('../../pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const SalesPage = lazy(() => import('../../pages/SalesPage').then((module) => ({ default: module.SalesPage })))
const StockPage = lazy(() => import('../../pages/StockPage').then((module) => ({ default: module.StockPage })))
const UsersPage = lazy(() => import('../../pages/UsersPage').then((module) => ({ default: module.UsersPage })))

export function AppRoutes() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('velas_user')
    return stored ? JSON.parse(stored) : null
  })
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    const storedTheme = localStorage.getItem('velas_theme')
    return storedTheme === 'light'
  })

  useEffect(() => {
    document.body.dataset.theme = isLightMode ? 'light' : 'dark'
    localStorage.setItem('velas_theme', isLightMode ? 'light' : 'dark')
  }, [isLightMode])

  useEffect(() => {
    const handleExpiredSession = () => setUser(null)
    window.addEventListener('auth:expired', handleExpiredSession)
    return () => window.removeEventListener('auth:expired', handleExpiredSession)
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />
      <Route element={<ProtectedLayout user={user} setUser={setUser} isLightMode={isLightMode} setIsLightMode={setIsLightMode} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/entradas" element={<EntriesPage />} />
        <Route path="/ventas" element={<SalesPage />} />
        <Route path="/reportes" element={<ReportsPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/auditoria" element={<AuditPage />} />
        <Route path="/auditoria-clientes" element={<CustomerAuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
