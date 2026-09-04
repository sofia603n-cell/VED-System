import { useEffect, useMemo, useState } from 'react'
import { fetchStock } from '../api/mockApi'
import { useToast } from '../context/ToastContext'
import type { StockItem } from '../types'
import { getProductState, stateClass } from '../utils/formatters'

export function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [alertFilter, setAlertFilter] = useState('')
  const { success, warning, info } = useToast()

  useEffect(() => {
    fetchStock().then(setItems)
  }, [])

  const categories = useMemo(() => ['Todas', ...new Set(items.map((item) => item.category))], [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase().trim()
      const itemSku = item.sku || `VEL-${item.id}`
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || itemSku.toLowerCase().includes(q)
      const matchesCategory = !category || category === 'Todas' || item.category === category
      const matchesAlert = !alertFilter || (alertFilter === 'bajo' ? item.stock <= item.minStock : item.stock > item.minStock)

      return matchesSearch && matchesCategory && matchesAlert
    })
  }, [items, search, category, alertFilter])

  const alertCount = items.filter((item) => item.stock <= item.minStock).length
  const totalStock = items.reduce((sum, item) => sum + item.stock, 0)
  const healthyStock = items.filter((item) => item.stock > item.minStock).length
  const criticalStock = items.filter((item) => item.stock <= item.minStock).length

  const handleQuickAdjust = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.stock + delta)
          if (newStock <= item.minStock) {
            warning(`Stock bajo para ${item.name} (${newStock} unid.)`, 'Alerta de Inventario')
          } else {
            success(`Stock de ${item.name}: ${newStock} unid.`, 'Existencias actualizadas')
          }
          return { ...item, stock: newStock }
        }
        return item
      })
    )
  }

  const handleExportStock = () => {
    const rows = [
      ['Referencia', 'Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Diferencial', 'Estado'],
      ...filteredItems.map((item) => [
        item.sku || `VEL-${item.id}`,
        item.name,
        item.category,
        String(item.stock),
        String(item.minStock),
        String(item.stock - item.minStock),
        item.stock <= item.minStock ? 'CRÍTICO / REVISAR' : 'ÓPTIMO',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `control_stock_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    info('Reporte de existencias descargado en CSV', 'Descarga Completa')
  }

  return (
    <>
      {/* Tarjetas de Resumen */}
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

      {alertCount > 0 && (
        <div className="alert-bar">
          <i className="ti ti-alert-triangle" style={{ fontSize: '1.25rem' }} />
          <span>
            Atención: Hay <strong>{alertCount}</strong> productos en o por debajo del stock de seguridad.
          </span>
        </div>
      )}

      {/* Filtros y Acciones */}
      <div className="section-header">
        <div className="filters-row" style={{ flex: 1 }}>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: '280px' }}
            placeholder="Buscar referencia o vela..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-input small"
            style={{ width: 'auto' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c === 'Todas' ? '' : c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="form-input small"
            style={{ width: 'auto' }}
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
          >
            <option value="">Todas las alertas</option>
            <option value="bajo">Solo bajo mínimo</option>
            <option value="ok">Solo estables</option>
          </select>
        </div>

        <button type="button" className="btn-outline" onClick={handleExportStock}>
          <i className="ti ti-download" /> Exportar Inventario
        </button>
      </div>

      {/* Tabla de Stock con Ajuste Rápido */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Vela & SKU</th>
              <th>Línea</th>
              <th>Nivel de Existencias</th>
              <th>Mínimo Requerido</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Ajuste Rápido</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
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
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => handleQuickAdjust(item.id, -1)}
                        title="Restar 1 unidad"
                        disabled={item.stock <= 0}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => handleQuickAdjust(item.id, 1)}
                        title="Sumar 1 unidad"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn"
                        style={{ color: 'var(--gold)', fontWeight: 'bold' }}
                        onClick={() => handleQuickAdjust(item.id, 5)}
                        title="Sumar 5 unidades"
                      >
                        +5
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
