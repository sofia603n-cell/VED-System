import { Link, useLocation } from 'react-router-dom'
import type { User } from '../../types'
import { BrandLogo } from './BrandLogo'

interface SidebarProps {
  user: User
  onLogout: () => void
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ user, onLogout, isOpen, onClose }: SidebarProps) {
  const isSuper = user.role === 'supremo'

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <BrandLogo />
          {onClose && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        <div className="sidebar-user">
          <div className={`user-avatar ${isSuper ? 'avatar-super' : ''}`}>
            {user.initials || user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name" title={user.name}>{user.name}</div>
            <div className="user-role" title={user.email}>{user.email}</div>
          </div>
          <span className={`role-badge ${isSuper ? 'badge-gold' : 'badge-subtle'}`}>
            <i className={`ti ${isSuper ? 'ti-crown' : 'ti-shield-check'}`} />
            <span>{isSuper ? 'Super Admin' : 'Admin'}</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">General</div>
          <NavLink to="/dashboard" label="Dashboard" icon="ti-layout-dashboard" onClick={onClose} />

          <div className="nav-section-label">Inventario</div>
          <NavLink to="/productos" label="Productos" icon="ti-candle" onClick={onClose} />
          <NavLink to="/stock" label="Control de Stock" icon="ti-package" badge="3" badgeType="warn" onClick={onClose} />
          <NavLink to="/entradas" label="Entradas de Stock" icon="ti-arrow-bar-to-down" onClick={onClose} />

          <div className="nav-section-label">Ventas</div>
          <NavLink to="/ventas" label="Ventas" icon="ti-shopping-bag" onClick={onClose} />
          <NavLink to="/reportes" label="Reportes" icon="ti-chart-bar" onClick={onClose} />

          <div className="nav-section-label">Sistema</div>
          <NavLink to="/usuarios" label="Usuarios" icon="ti-users" onClick={onClose} />
          <NavLink to="/auditoria" label="Auditoría" icon="ti-clipboard-list" onClick={onClose} />
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" type="button" onClick={onLogout}>
            <i className="ti ti-logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function NavLink({
  to,
  label,
  icon,
  badge,
  badgeType = 'default',
  onClick,
}: {
  to: string
  label: string
  icon: string
  badge?: string
  badgeType?: 'default' | 'warn'
  onClick?: () => void
}) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link
      className={`nav-item ${active ? 'active' : ''}`}
      to={to}
      onClick={onClick}
    >
      <i className={`ti ${icon} nav-icon`} />
      <span className="nav-label">{label}</span>
      {badge ? (
        <span className={`nav-badge ${badgeType === 'warn' ? 'badge-warning-dot' : ''}`}>
          {badge}
        </span>
      ) : null}
      {active && <span className="nav-active-pill" />}
    </Link>
  )
}
