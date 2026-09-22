import { Link, useNavigate } from 'react-router-dom'

interface DashboardHeaderProps {
  lowStockCount: number
}

export function DashboardHeader({ lowStockCount }: DashboardHeaderProps) {
  const navigate = useNavigate()

  return (
    <>
      {lowStockCount > 0 && (
        <div className="alert-bar" style={{ cursor: 'pointer' }} onClick={() => navigate('/stock')}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '1.2rem' }} />
          <span style={{ flex: 1 }}>
            <strong>Aviso de Inventario:</strong> {lowStockCount} producto(s) tienen stock por debajo del mínimo establecido.
          </span>
          <span className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'transparent' }}>
            Revisar Stock <i className="ti ti-arrow-right" />
          </span>
        </div>
      )}

      <div className="section-header" style={{ marginTop: '-8px' }}>
        <div>
          <h2 className="section-title">Resumen Ejecutivo</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Monitoreo en tiempo real del taller y puntos de distribución
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-primary" onClick={() => navigate('/ventas')}>
            <i className="ti ti-shopping-cart-plus" /> Registrar Venta
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/productos')}>
            <i className="ti ti-candle" /> Nuevo Producto
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/entradas')}>
            <i className="ti ti-arrow-bar-to-down" /> Entrada Stock
          </button>
        </div>
      </div>
    </>
  )
}

interface DashboardTopProductsProps {
  items: Array<{ name: string; sku: string; category: string; units: number; revenue: number; trend: string; trendType: 'badge-success' | 'badge-warning' }>
}

export function DashboardTopProducts({ items }: DashboardTopProductsProps) {
  return (
    <>
      <div className="section-header">
        <div>
          <h3 className="section-title">Productos Estrella</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Referencias con mayor demanda y facturación
          </span>
        </div>
        <Link className="btn-outline" to="/productos">
          <i className="ti ti-arrow-right" /> Ver catálogo completo
        </Link>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto & Referencia</th>
              <th>Línea</th>
              <th>Unidades Despachadas</th>
              <th>Total Facturado</th>
              <th>Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.name}>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">🕯️</div>
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-sku">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-neutral">{product.category}</span>
                </td>
                <td>
                  <strong>{product.units}</strong> unid.
                </td>
                <td>
                  <strong style={{ color: 'var(--gold)' }}>{product.revenue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</strong>
                </td>
                <td>
                  <span className={`badge ${product.trendType}`}>
                    <i className="ti ti-trending-up" /> {product.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
