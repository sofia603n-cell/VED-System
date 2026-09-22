import type { StockItem } from '../../types'
import { getProductState, stateClass } from '../../utils/formatters'

interface StockTableProps {
  items: StockItem[]
  onEdit: (item: StockItem) => void
}

export function StockTable({ items, onEdit }: StockTableProps) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Vela & SKU</th>
            <th>Línea</th>
            <th>Nivel de Existencias</th>
            <th>Mínimo Requerido</th>
            <th>Estado</th>
            <th style={{ textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const state = getProductState(item)
            const maxRef = Math.max(item.minStock * 2, 10)
            const pct = Math.min(100, Math.max(10, (item.stock / maxRef) * 100))

            return (
              <tr key={item.id}>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">🕯️</div>
                    <div>
                      <div className="product-name">{item.name}</div>
                      <div className="product-sku">{item.sku || `VEL-${item.id}`}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-neutral">{item.category}</span>
                </td>
                <td style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <strong>{item.stock} unidades</strong>
                    <span style={{ color: 'var(--text-dim)' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="stock-bar-wrap">
                    <div
                      className={`stock-bar-fill ${state === 'success' ? 'healthy' : state === 'warning' ? 'warning' : 'critical'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
                <td>
                  <span style={{ color: 'var(--text-muted)' }}>{item.minStock} unid.</span>
                </td>
                <td>
                  <span className={`badge ${stateClass(state)}`}>
                    {item.stock <= item.minStock ? 'Bajo Mínimo' : 'Óptimo'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => onEdit(item)}
                    title={`Editar ${item.name}`}
                  >
                    <i className="ti ti-edit" /> Editar producto
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
