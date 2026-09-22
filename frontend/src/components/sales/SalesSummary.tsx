import { formatCurrency } from '../../utils/formatters'

interface SalesSummaryProps {
  revenue: number
  completed: number
  pending: number
}

export function SalesSummary({ revenue, completed, pending }: SalesSummaryProps) {
  return (
    <div className="stock-summary-grid">
      <div className="stock-summary-card primary"><div className="summary-label">Facturación Acumulada</div><div className="summary-value" style={{ color: 'var(--gold)' }}>{formatCurrency(revenue)}</div><div className="summary-foot">Total facturado en el sistema</div></div>
      <div className="stock-summary-card success"><div className="summary-label">Ventas Entregadas</div><div className="summary-value">{completed}</div><div className="summary-foot">Pedidos completados con éxito</div></div>
      <div className="stock-summary-card warning"><div className="summary-label">Por Despachar</div><div className="summary-value">{pending}</div><div className="summary-foot">Pendientes de confirmación o entrega</div></div>
    </div>
  )
}
