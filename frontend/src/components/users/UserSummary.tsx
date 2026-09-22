interface UserSummaryProps {
  active: number
  superAdmins: number
  admins: number
}

export function UserSummary({ active, superAdmins, admins }: UserSummaryProps) {
  return (
    <div className="stock-summary-grid">
      <div className="stock-summary-card primary"><div className="summary-label">Usuarios Activos</div><div className="summary-value">{active}</div><div className="summary-foot">Con acceso habilitado</div></div>
      <div className="stock-summary-card success"><div className="summary-label">Super Administradores</div><div className="summary-value">{superAdmins}</div><div className="summary-foot">Control total del sistema</div></div>
      <div className="stock-summary-card warning"><div className="summary-label">Administradores Regulares</div><div className="summary-value">{admins}</div><div className="summary-foot">Operación diaria y ventas</div></div>
    </div>
  )
}
