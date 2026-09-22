import type { Sale } from '../../types'
import { formatCurrency } from '../../utils/formatters'

interface SalesTableProps {
  sales: Sale[]
  onReceipt: (sale: Sale) => void
}

export function SalesTable({ sales, onReceipt }: SalesTableProps) {
  return (
    <div className="table-card">
      <table><thead><tr><th>N° Venta</th><th>Cliente / Comprador</th><th>Vela Adquirida</th><th>Total (COP)</th><th>Estado</th><th>Fecha</th><th style={{ textAlign: 'center' }}>Comprobante</th></tr></thead>
        <tbody>{sales.map((sale) => <tr key={sale.id}><td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-dim)' }}>#{sale.id}</span></td><td><strong>{sale.customer}</strong></td><td><div className="product-cell"><div className="product-thumb">🕯️</div><div>{sale.product}</div></div></td><td><strong style={{ color: 'var(--gold)' }}>{formatCurrency(sale.total)}</strong></td><td><span className={`badge ${sale.status === 'Completada' ? 'badge-success' : sale.status === 'Pendiente' ? 'badge-warning' : 'badge-danger'}`}>{sale.status}</span></td><td><span style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: '0.8rem' }}>{sale.date}</span></td><td style={{ textAlign: 'center' }}><button type="button" className="icon-action-btn" onClick={() => onReceipt(sale)} title="Ver e imprimir recibo"><i className="ti ti-receipt" /></button></td></tr>)}</tbody>
      </table>
    </div>
  )
}
