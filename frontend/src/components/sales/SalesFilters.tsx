interface SalesFiltersProps {
  search: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function SalesFilters({ search, statusFilter, onSearchChange, onStatusChange }: SalesFiltersProps) {
  return <div className="filters-row"><input type="text" className="form-input" style={{ maxWidth: '300px' }} placeholder="Buscar por cliente, pedido o vela..." value={search} onChange={(e) => onSearchChange(e.target.value)} /><div className="period-pills">{(['Todas', 'Completada', 'Pendiente', 'Cancelada'] as const).map((status) => <button key={status} type="button" className={`pill ${statusFilter === status ? 'active' : ''}`} onClick={() => onStatusChange(status)}>{status}</button>)}</div></div>
}
