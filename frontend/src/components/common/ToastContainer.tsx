import React from 'react'
import { useToast } from '../../context/ToastContext'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'ti-circle-check'
      case 'error':
        return 'ti-alert-triangle'
      case 'warning':
        return 'ti-alert-circle'
      default:
        return 'ti-info-circle'
    }
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
          <div className="toast-icon">
            <i className={`ti ${getIcon(toast.type)}`} />
          </div>
          <div className="toast-body">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-msg">{toast.message}</div>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Cerrar notificación"
          >
            <i className="ti ti-x" />
          </button>
        </div>
      ))}
    </div>
  )
}

