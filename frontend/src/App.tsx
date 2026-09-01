import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { ThemeToggle } from './components/layout/ThemeToggle'
import { AuditPage } from './pages/AuditPage'
import { DashboardPage } from './pages/DashboardPage'
import { EntriesPage } from './pages/EntriesPage'
import { LoginPage } from './pages/LoginPage'
import { ProductsPage } from './pages/ProductsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SalesPage } from './pages/SalesPage'
import { StockPage } from './pages/StockPage'
import { UsersPage } from './pages/UsersPage'
import type { User } from './types'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
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
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [notificationsMuted, setNotificationsMuted] = useState(false)

  const notifications = [
    {
      id: 1,
      title: 'Pedido urgente',
      message: 'Se registró un pedido de 12 velas aromáticas.',
      time: 'Hace 12 min',
      link: '/ventas',
    },
    {
      id: 2,
      title: 'Stock mínimo',
      message: 'Hay 3 productos por debajo del stock ideal.',
      time: 'Hace 38 min',
      link: '/stock',
    },
    {
      id: 3,
      title: 'Auditoría nueva',
      message: 'Se realizó un cambio en inventario y usuarios.',
      time: 'Hace 1 hora',
      link: '/auditoria',
    },
  ]

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const handleLogout = () => {
    sessionStorage.removeItem('velas_user')
    sessionStorage.removeItem('velas_token')
    setUser(null)
    navigate('/login', { replace: true })
  }

  const handleNotificationClick = (link: string) => {
    setNotificationsOpen(false)
    navigate(link)
  }

  const toggleNotificationsMuted = () => {
    setNotificationsMuted((value) => !value)
    setSettingsOpen(false)
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">{titleFromPath(location.pathname)}</div>
          <div className="search-bar">
            <i className="ti ti-search" />
            <input type="text" placeholder="Buscar…" />
          </div>
          <div className="topbar-actions">
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
                {!notificationsMuted ? <span className="notif-dot" /> : null}
              </button>
              {isNotificationsOpen && !notificationsMuted ? (
                <div className="notification-panel">
                  <div className="notification-header">
                    <span>Notificaciones</span>
                    <button type="button" className="notification-close" onClick={() => setNotificationsOpen(false)}>
                      <i className="ti ti-x" />
                    </button>
                  </div>
                  {notifications.map((item) => (
                    <button key={item.id} type="button" className="notification-item" onClick={() => handleNotificationClick(item.link)}>
                      <div className="notification-bullet" />
                      <div className="notification-copy">
                        <strong>{item.title}</strong>
                        <span>{item.message}</span>
                        <small>{item.time}</small>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <ThemeToggle isLightMode={isLightMode} onToggle={() => setIsLightMode(!isLightMode)} />
            <div className="settings-wrap">
              <button type="button" className="icon-btn" title="Configuración" onClick={() => setSettingsOpen((value) => !value)}>
                <i className="ti ti-settings" />
              </button>
              {isSettingsOpen ? (
                <div className="settings-panel">
                  <div className="settings-header">
                    <span>Configuración</span>
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
                  <button type="button" className="setting-item" onClick={() => { navigate('/usuarios'); setSettingsOpen(false) }}>
                    <div>
                      <strong>Administración</strong>
                      <small>Ir a usuarios y permisos</small>
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
    </div>
  )
}

function titleFromPath(pathname: string) {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/productos': 'Catálogo de productos',
    '/stock': 'Control de stock',
    '/entradas': 'Entradas de inventario',
    '/ventas': 'Ventas',
    '/reportes': 'Reportes',
    '/usuarios': 'Gestión de usuarios',
    '/auditoria': 'Auditoría del sistema',
  }

  return map[pathname] ?? 'Panel'
}

export default App
