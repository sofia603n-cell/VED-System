import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from '../layout/Sidebar'
import { CommandPalette } from '../common/CommandPalette'
import { useToast } from '../../context/ToastContext'
import type { User } from '../../types'
import { NotificationPanel } from './NotificationPanel'
import { SettingsPanel } from './SettingsPanel'
import { TopBar } from './TopBar'

type ProtectedLayoutProps = {
  user: User | null
  setUser: (user: User | null) => void
  isLightMode: boolean
  setIsLightMode: (value: boolean) => void
}

export function ProtectedLayout({
  user,
  setUser,
  isLightMode,
  setIsLightMode,
}: ProtectedLayoutProps) {
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
  const { title, sub } = titleFromPath(location.pathname)

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
        <TopBar
          title={title}
          subtitle={sub}
          isLightMode={isLightMode}
          notificationsMuted={notificationsMuted}
          unreadCount={unreadCount}
          isNotificationsOpen={isNotificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          isSettingsOpen={isSettingsOpen}
          setSettingsOpen={setSettingsOpen}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          onOpenCommandPalette={() => setCommandOpen(true)}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          notificationPanel={
            <NotificationPanel
              isOpen={isNotificationsOpen}
              notifications={notifications}
              unreadCount={unreadCount}
              onClose={() => setNotificationsOpen(false)}
              onMarkAllAsRead={markAllAsRead}
              onNotificationClick={handleNotificationClick}
              muted={notificationsMuted}
            />
          }
          settingsPanel={
            <SettingsPanel
              isOpen={isSettingsOpen}
              notificationsMuted={notificationsMuted}
              onToggleNotificationsMuted={toggleNotificationsMuted}
              onNavigateUsers={() => navigate('/usuarios')}
              onNavigateAudit={() => navigate('/auditoria')}
              onClose={() => setSettingsOpen(false)}
            />
          }
        />

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
