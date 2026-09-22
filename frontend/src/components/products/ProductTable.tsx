import type { Product } from '../../types'
import { formatCurrency, getProductState, stateClass } from '../../utils/formatters'

interface ProductTableProps {
  items: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductTable({ items, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Vela / Referencia</th>
            <th>Línea</th>
            <th>Color</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => {
            const state = getProductState(product)
            return (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">🕯️</div>
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-sku">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{product.category}</span></td>
                <td>{product.colors || 'Natural'}</td>
                <td><strong style={{ color: 'var(--gold)' }}>{formatCurrency(product.price)}</strong></td>
                <td>
                  <strong>{product.stock}</strong> / <span style={{ color: 'var(--text-dim)' }}>{product.minStock}</span>
                </td>
                <td>
                  <span className={`badge ${stateClass(state)}`}>
                    {state === 'success' ? 'En stock' : state === 'warning' ? 'Stock bajo' : 'Agotado'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button type="button" className="icon-action-btn" onClick={() => onEdit(product)} title="Editar producto">
                      <i className="ti ti-edit" />
                    </button>
                    <button type="button" className="icon-action-btn delete" onClick={() => onDelete(product)} title="Eliminar producto">
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
