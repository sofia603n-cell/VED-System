import { useEffect, useMemo, useState } from 'react'
import { fetchStock } from '../api/mockApi'
import type { StockItem } from '../types'
import { getProductState, stateClass } from '../utils/formatters'

export function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [reference, setReference] = useState('')
  const [alertFilter, setAlertFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchStock().then(setItems)
  }, [])

  const categories = useMemo(() => [...new Set(items.map((item) => item.category))], [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const state = getProductState(item)
      const matchesCategory = !reference || item.category === reference
      const matchesAlert = !alertFilter || (alertFilter === 'bajo' ? item.stock <= item.minStock : item.stock > item.minStock)
      const matchesStock = !stockFilter ||
        (stockFilter === 'alto' ? item.stock >= item.minStock * 2 : stockFilter === 'medio' ? item.stock > item.minStock && item.stock < item.minStock * 2 : item.stock <= item.minStock)
      const matchesStatus = !statusFilter || state === statusFilter

      return matchesCategory && matchesAlert && matchesStock && matchesStatus
    })
  }, [items, reference, alertFilter, stockFilter, statusFilter])

  const alertCount = items.filter((item) => item.stock <= item.minStock).length
  const totalStock = items.reduce((sum, item) => sum + item.stock, 0)
  const healthyStock = items.filter((item) => item.stock > item.minStock).length
  const criticalStock = items.filter((item) => item.stock <= item.minStock).length

  const getStockBarPercent = (item: StockItem) => {
    if (item.stock <= 0) return 0
    const reference = Math.max(item.minStock * 2, 12)
    return Math.min(100, Math.max(8, (item.stock / reference) * 100))
  }

  return (
    <>
      <div className="stock-summary-grid">
        <div className="stock-summary-card primary">
          <div className="summary-label">Stock total</div>
          <div className="summary-value">{totalStock}</div>
          <div className="summary-foot">Unidades disponibles</div>
        </div>
        <div className="stock-summary-card success">
          <div className="summary-label">En rango</div>
          <div className="summary-value">{healthyStock}</div>
          <div className="summary-foot">Productos estables</div>
        </div>
        <div className="stock-summary-card warning">
          <div className="summary-label">Por revisar</div>
          <div className="summary-value">{criticalStock}</div>
          <div className="summary-foot">Bajo mínimo</div>
        </div>
      </div>

      <div className="alert-bar">
        <i className="ti ti-alert-triangle" /> Hay {alertCount} productos por debajo del stock mínimo.
      </div>

      <div className="filters-row users-filter-row">
        <select className="form-input small" value={reference} onChange={(event) => setReference(event.target.value)}>
          <option value="">Todas las referencias</option>
          {categories.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>

        <select className="form-input small" value={alertFilter} onChange={(event) => setAlertFilter(event.target.value)}>
          <option value="">Todas las alertas</option>
          <option value="bajo">Bajo mínimo</option>
          <option value="ok">Sin alerta</option>
        </select>

        <select className="form-input small" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
          <option value="">Todo el stock</option>
          <option value="bajo">Bajo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
        </select>

        <select className="form-input small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Todos los estados</option>
          <option value="success">En stock</option>
          <option value="warning">Stock bajo</option>
          <option value="danger">Sin stock</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Referencia</th>
              <th>Presentación</th>
              <th>Color</th>
              <th>Precio</th>
              <th>Stock actual</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const state = getProductState(item)
              const stockPercent = getStockBarPercent(item)

              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.presentation || 'unidad'}</td>
                  <td>{item.color || 'Sin color'}</td>
                  <td>{typeof item.price === 'number' ? item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '—'}</td>
                  <td>
                    <div className="stock-meter-wrap">
                      <div className="stock-meter-label">
                        <span>{item.stock}</span>
                        <small>{item.minStock} mín.</small>
                      </div>
                      <div className="stock-meter">
                        <span className={`stock-fill ${state}`} style={{ width: `${stockPercent}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>{item.minStock}</td>
                  <td>
                    <span className={`badge ${stateClass(state)}`}>
                      {item.stock <= item.minStock ? 'Revisar' : 'OK'}
                    </span>
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
