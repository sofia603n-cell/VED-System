interface StockSummaryProps {
  totalStock: number
  healthyStock: number
  criticalStock: number
}

export function StockSummary({ totalStock, healthyStock, criticalStock }: StockSummaryProps) {
  return (
    <div className="stock-summary-grid">
      <div className="stock-summary-card primary">
        <div className="summary-label">Total en Bodega</div>
        <div className="summary-value">{totalStock}</div>
        <div className="summary-foot">Unidades físicas listas</div>
      </div>
      <div className="stock-summary-card success">
        <div className="summary-label">Stock Saludable</div>
        <div className="summary-value">{healthyStock}</div>
        <div className="summary-foot">Por encima del mínimo</div>
      </div>
      <div className="stock-summary-card warning">
        <div className="summary-label">Por Reponer</div>
        <div className="summary-value">{criticalStock}</div>
        <div className="summary-foot">Requieren orden de fabricación</div>
      </div>
    </div>
  )
}
