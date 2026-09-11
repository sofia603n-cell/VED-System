import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { ThemeToggle } from './components/layout/ThemeToggle'
import { ToastContainer } from './components/common/ToastContainer'
import { CommandPalette } from './components/common/CommandPalette'
import { ToastProvider, useToast } from './context/ToastContext'
import type { User } from './types'

const AuditPage = lazy(() => import('./pages/AuditPage').then((module) => ({ default: module.AuditPage })))
const CustomerAuditPage = lazy(() => import('./pages/CustomerAuditPage').then((module) => ({ default: module.CustomerAuditPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const EntriesPage = lazy(() => import('./pages/EntriesPage').then((module) => ({ default: module.EntriesPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const SalesPage = lazy(() => import('./pages/SalesPage').then((module) => ({ default: module.SalesPage })))
const StockPage = lazy(() => import('./pages/StockPage').then((module) => ({ default: module.StockPage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then((module) => ({ default: module.UsersPage })))

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="route-loading" role="status">Cargando...</div>}>
          <AppRoutes />
        </Suspense>
        <ToastContainer />
      </BrowserRouter>
    </ToastProvider>
  )
}

function AppRoutes() {
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

function ProtectedLayout({
  user,
  setUser,
  isLightMode,
  setIsLightMode,
}: {
  user: User | null
  setUser: (user: User | null) => void
  isLightMode: boolean
  setIsLightMode: (value: boolean) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { info } = useToast()
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCommandOpen, setCommandOpen] = useState(false)
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [notificationsMuted, setNotificationsMuted] = useState(false)

  const [notifications, setNotifications] = useState<Array<{
    id: number
    title: string
    message: string
    time: string
    link: string
    read: boolean
  }>>([])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleLogout = () => {
    sessionStorage.removeItem('velas_user')
    sessionStorage.removeItem('velas_token')
    setUser(null)
    info('Sesión finalizada correctamente')
    navigate('/login', { replace: true })
  }

  const handleNotificationClick = (id: number, link: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setNotificationsOpen(false)
    navigate(link)
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const toggleNotificationsMuted = () => {
    setNotificationsMuted((value) => !value)
    setSettingsOpen(false)
    info(notificationsMuted ? 'Notificaciones activadas' : 'Notificaciones silenciadas')
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <i className="ti ti-menu-2" />
            </button>
            <div className="topbar-heading">
              <h1 className="topbar-title">{titleFromPath(location.pathname).title}</h1>
              <span className="topbar-subtitle">{titleFromPath(location.pathname).sub}</span>
            </div>
          </div>

          <div className="topbar-center">
            <button
              type="button"
              className="search-bar-btn"
              onClick={() => setCommandOpen(true)}
              title="Buscar o navegar (Ctrl+K)"
            >
              <i className="ti ti-search search-icon" />
              <span className="search-placeholder">Buscar productos, ventas, pantallas...</span>
              <span className="search-shortcut">
                <kbd>Ctrl</kbd> <kbd>K</kbd>
              </span>
            </button>
          </div>

          <div className="topbar-actions">
            {/* Notifications */}
            <div className="notification-wrap">
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  if (!notificationsMuted) {
                    setNotificationsOpen((value) => !value)
                  }
                }}
                title={notificationsMuted ? 'Notificaciones silenciadas' : 'Notificaciones'}
              >
                <i className={notificationsMuted ? 'ti ti-bell-off' : 'ti ti-bell'} />
                {!notificationsMuted && unreadCount > 0 && <span className="notif-dot" />}
              </button>

              {isNotificationsOpen && !notificationsMuted ? (
                <div className="notification-panel">
                  <div className="notification-header">
                    <div className="notif-title-group">
                      <span>Notificaciones</span>
                      {unreadCount > 0 && <span className="notif-count-badge">{unreadCount} nuevas</span>}
                    </div>
                    <div className="notif-actions-header">
                      {unreadCount > 0 && (
                        <button type="button" className="notif-mark-all" onClick={markAllAsRead}>
                          Marcar leídas
                        </button>
                      )}
                      <button type="button" className="notification-close" onClick={() => setNotificationsOpen(false)}>
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  </div>

                  <div className="notification-body">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`notification-item ${!item.read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(item.id, item.link)}
                      >
                        <div className={`notification-bullet ${!item.read ? 'active' : ''}`} />
                        <div className="notification-copy">
                          <strong>{item.title}</strong>
                          <span>{item.message}</span>
                          <small>{item.time}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle isLightMode={isLightMode} onToggle={() => setIsLightMode(!isLightMode)} />

            {/* Settings Wrap */}
            <div className="settings-wrap">
              <button
                type="button"
                className="icon-btn"
                title="Configuración y Sistema"
                onClick={() => setSettingsOpen((value) => !value)}
              >
                <i className="ti ti-settings" />
              </button>

              {isSettingsOpen ? (
                <div className="settings-panel">
                  <div className="settings-header">
                    <span>Preferencias Rápidas</span>
                  </div>
                  <button type="button" className="setting-item" onClick={toggleNotificationsMuted}>
                    <div>
                      <strong>{notificationsMuted ? 'Activar notificaciones' : 'Silenciar notificaciones'}</strong>
                      <small>{notificationsMuted ? 'Se mostrarán avisos nuevamente' : 'Oculta alertas del panel'}</small>
                    </div>
                    <span className={`toggle ${notificationsMuted ? 'on' : ''}`}>
                      <span className="toggle-knob" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="setting-item"
                    onClick={() => {
                      navigate('/usuarios')
                      setSettingsOpen(false)
                    }}
                  >
                    <div>
                      <strong>Administración de Usuarios</strong>
                      <small>Permisos y cuentas del sistema</small>
                    </div>
                    <i className="ti ti-arrow-up-right" />
                  </button>
                  <button
                    type="button"
                    className="setting-item"
                    onClick={() => {
                      navigate('/auditoria')
                      setSettingsOpen(false)
                    }}
                  >
                    <div>
                      <strong>Registro de Auditoría</strong>
                      <small>Historial de cambios y accesos</small>
                    </div>
                    <i className="ti ti-arrow-up-right" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  )
}

function titleFromPath(pathname: string): { title: string; sub: string } {
  const map: Record<string, { title: string; sub: string }> = {
    '/dashboard': { title: 'Panel de Control', sub: 'Métricas generales y rendimiento de fábrica' },
    '/productos': { title: 'Catálogo de Velas', sub: 'Administración de productos, colores y presentaciones' },
    '/stock': { title: 'Control de Stock', sub: 'Supervisión de existencias y alertas de reposición' },
    '/entradas': { title: 'Movimientos de Inventario', sub: 'Entradas, salidas e historial de existencias' },
    '/ventas': { title: 'Embudo y Pedidos', sub: 'Canales, avance por cliente y facturación' },
    '/reportes': { title: 'Reportes y Analítica', sub: 'Rendimiento comercial y rentabilidad' },
    '/usuarios': { title: 'Gestión de Usuarios', sub: 'Control de accesos y roles del personal' },
    '/auditoria': { title: 'Auditoría del Sistema', sub: 'Historial detallado de operaciones y trazabilidad' },
    '/auditoria-clientes': { title: 'Auditoría de Clientes', sub: 'Registro, estado y actividad comercial de clientes' },
  }

  return map[pathname] ?? { title: 'Panel', sub: 'Sistema Velas Estrella de David' }
}

export default App
