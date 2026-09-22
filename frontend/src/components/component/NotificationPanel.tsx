type NotificationItem = {
  id: number
  title: string
  message: string
  time: string
  link: string
  read: boolean
}

type NotificationPanelProps = {
  isOpen: boolean
  notifications: NotificationItem[]
  unreadCount: number
  onClose: () => void
  onMarkAllAsRead: () => void
  onNotificationClick: (id: number, link: string) => void
  muted: boolean
}

export function NotificationPanel({
  isOpen,
  notifications,
  unreadCount,
  onClose,
  onMarkAllAsRead,
  onNotificationClick,
  muted,
}: NotificationPanelProps) {
  if (!isOpen || muted) {
    return null
  }

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <div className="notif-title-group">
          <span>Notificaciones</span>
          {unreadCount > 0 && <span className="notif-count-badge">{unreadCount} nuevas</span>}
        </div>
        <div className="notif-actions-header">
          {unreadCount > 0 && (
            <button type="button" className="notif-mark-all" onClick={onMarkAllAsRead}>
              Marcar leídas
            </button>
          )}
          <button type="button" className="notification-close" onClick={onClose}>
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
            onClick={() => onNotificationClick(item.id, item.link)}
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
  )
}
