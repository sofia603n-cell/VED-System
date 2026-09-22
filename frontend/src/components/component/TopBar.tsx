import type { ReactNode } from 'react'

type TopBarProps = {
  title: string
  subtitle: string
  isLightMode: boolean
  notificationsMuted: boolean
  unreadCount: number
  isNotificationsOpen: boolean
  setNotificationsOpen: (value: boolean) => void
  isSettingsOpen: boolean
  setSettingsOpen: (value: boolean) => void
  onToggleTheme: () => void
  onOpenCommandPalette: () => void
  onMobileMenuOpen: () => void
  notificationPanel: ReactNode
  settingsPanel: ReactNode
}

export function TopBar({
  title,
  subtitle,
  isLightMode,
  notificationsMuted,
  unreadCount,
  isNotificationsOpen,
  setNotificationsOpen,
  isSettingsOpen,
  setSettingsOpen,
  onToggleTheme,
  onOpenCommandPalette,
  onMobileMenuOpen,
  notificationPanel,
  settingsPanel,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={onMobileMenuOpen}
          aria-label="Abrir menú"
        >
          <i className="ti ti-menu-2" />
        </button>
        <div className="topbar-heading">
          <h1 className="topbar-title">{title}</h1>
          <span className="topbar-subtitle">{subtitle}</span>
        </div>
      </div>

      <div className="topbar-center">
        <button
          type="button"
          className="search-bar-btn"
          onClick={onOpenCommandPalette}
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
        <div className="notification-wrap">
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              if (!notificationsMuted) {
                setNotificationsOpen(!isNotificationsOpen)
              }
            }}
            title={notificationsMuted ? 'Notificaciones silenciadas' : 'Notificaciones'}
          >
            <i className={notificationsMuted ? 'ti ti-bell-off' : 'ti ti-bell'} />
            {!notificationsMuted && unreadCount > 0 && <span className="notif-dot" />}
          </button>
          {notificationPanel}
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={isLightMode ? 'Modo oscuro' : 'Modo claro'}
        >
          <i className={isLightMode ? 'ti ti-moon' : 'ti ti-sun'} />
        </button>

        <div className="settings-wrap">
          <button
            type="button"
            className="icon-btn"
            title="Configuración y Sistema"
            onClick={() => setSettingsOpen(!isSettingsOpen)}
          >
            <i className="ti ti-settings" />
          </button>
          {settingsPanel}
        </div>
      </div>
    </header>
  )
}
