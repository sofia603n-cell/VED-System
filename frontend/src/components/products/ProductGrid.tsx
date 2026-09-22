import type { Product } from '../../types'
import { formatCurrency, getProductState, stateClass } from '../../utils/formatters'

function getStockBarPercent(product: Pick<Product, 'stock' | 'minStock'>) {
  if (product.stock <= 0) return 0
  const reference = Math.max(product.minStock * 2, 12)
  return Math.min(100, Math.max(10, (product.stock / reference) * 100))
}

interface ProductGridProps {
  items: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductGrid({ items, onEdit, onDelete }: ProductGridProps) {
  return (
    <div className="product-grid">
      {items.map((product) => {
        const state = getProductState(product)
        const stockPct = getStockBarPercent(product)

        return (
          <div key={product.id} className="product-card">
            <div>
              <div className="product-card-head">
                <div className="product-card-thumb">🕯️</div>
                <span className={`badge ${stateClass(state)}`}>
                  {state === 'success' ? 'En stock' : state === 'warning' ? 'Stock bajo' : 'Agotado'}
                </span>
              </div>

              <h3 className="product-card-title">{product.name}</h3>
              <div className="product-card-desc">{product.description || 'Vela artesanal de alta calidad.'}</div>

              <div className="product-card-meta">
                <span className="badge badge-neutral">
                  <i className="ti ti-tag" /> {product.category}
                </span>
                {product.colors && (
                  <span className="badge badge-neutral">
                    <i className="ti ti-color-swatch" /> {product.colors}
                  </span>
                )}
                <span className="product-sku">{product.sku}</span>
              </div>

              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>Existencias: <strong>{product.stock}</strong> unid.</span>
                  <span>Mínimo: {product.minStock}</span>
                </div>
                <div className="stock-bar-wrap">
                  <div
                    className={`stock-bar-fill ${state === 'success' ? 'healthy' : state === 'warning' ? 'warning' : 'critical'}`}
                    style={{ width: `${stockPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="product-card-foot">
              <div className="product-price">{formatCurrency(product.price)}</div>
              <div className="product-actions-btn">
                <button type="button" className="icon-action-btn" onClick={() => onEdit(product)} title="Editar producto">
                  <i className="ti ti-edit" />
                </button>
                <button type="button" className="icon-action-btn delete" onClick={() => onDelete(product)} title="Eliminar producto">
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
