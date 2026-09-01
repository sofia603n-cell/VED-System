import { Link, useLocation } from 'react-router-dom'
import type { User } from '../../types'
import { BrandLogo } from './BrandLogo'

export function Sidebar({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <aside className="sidebar">
      <BrandLogo />

      <div className="sidebar-user">
        <div className="user-avatar">{user.initials || 'AS'}</div>
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-role">{user.email}</div>
        </div>
        <span className="role-badge">{user.role === 'supremo' ? 'Supremo' : 'Normal'}</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">General</div>
        <NavLink to="/dashboard" label="Dashboard" icon="ti-layout-dashboard" />

        <div className="nav-section-label">Inventario</div>
        <NavLink to="/productos" label="Productos" icon="ti-candle" />
        <NavLink to="/stock" label="Stock" icon="ti-package" badge="3" />
        <NavLink to="/entradas" label="Entradas" icon="ti-arrow-bar-to-down" />

        <div className="nav-section-label">Ventas</div>
        <NavLink to="/ventas" label="Ventas" icon="ti-shopping-bag" />
        <NavLink to="/reportes" label="Reportes" icon="ti-chart-bar" />

        <div className="nav-section-label">Sistema</div>
        <NavLink to="/usuarios" label="Usuarios" icon="ti-users" />
        <NavLink to="/auditoria" label="Auditoría" icon="ti-clipboard-list" />
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" type="button" onClick={onLogout}>
          <i className="ti ti-logout" /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function NavLink({ to, label, icon, badge }: { to: string; label: string; icon: string; badge?: string }) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link className={`nav-item ${active ? 'active' : ''}`} to={to}>
      <i className={`ti ${icon}`} />
      <span>{label}</span>
      {badge ? <span className="nav-badge">{badge}</span> : null}
    </Link>
  )
}
