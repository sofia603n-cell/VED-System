type SettingsPanelProps = {
  isOpen: boolean
  notificationsMuted: boolean
  onToggleNotificationsMuted: () => void
  onNavigateUsers: () => void
  onNavigateAudit: () => void
  onClose: () => void
}

export function SettingsPanel({
  isOpen,
  notificationsMuted,
  onToggleNotificationsMuted,
  onNavigateUsers,
  onNavigateAudit,
  onClose,
}: SettingsPanelProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span>Preferencias Rápidas</span>
      </div>
      <button type="button" className="setting-item" onClick={onToggleNotificationsMuted}>
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
          onNavigateUsers()
          onClose()
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
          onNavigateAudit()
          onClose()
        }}
      >
        <div>
          <strong>Registro de Auditoría</strong>
          <small>Historial de cambios y accesos</small>
        </div>
        <i className="ti ti-arrow-up-right" />
      </button>
    </div>
  )
}
