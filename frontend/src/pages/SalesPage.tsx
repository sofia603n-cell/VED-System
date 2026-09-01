import { useEffect, useMemo, useState } from 'react'
import { fetchSales } from '../api/mockApi'
import type { Sale } from '../types'
import { formatCurrency } from '../utils/formatters'

interface SaleForm {
  customer: string
  product: string
  total: number
  status: string
  date: string
}

function emptySaleForm(): SaleForm {
  return {
    customer: '',
    product: '',
    total: 0,
    status: 'Completada',
    date: new Date().toISOString().slice(0, 10),
  }
}

function getSaleBadgeClass(status: string) {
  if (status === 'Pendiente') return 'badge-warning'
  if (status === 'Cancelada') return 'badge-danger'
  return 'badge-success'
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<SaleForm>(emptySaleForm())

  useEffect(() => {
    fetchSales().then(setSales)
  }, [])

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, item) => sum + item.total, 0)
    const completed = sales.filter((item) => item.status === 'Completada').length
    const pending = sales.filter((item) => item.status === 'Pendiente').length
    return { revenue, completed, pending }
  }, [sales])

  const openCreate = () => {
    setForm(emptySaleForm())
    setModalOpen(true)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.customer.trim() || !form.product.trim() || Number(form.total) <= 0) {
      return
    }

    const nextId = sales.length ? Math.max(...sales.map((sale) => sale.id)) + 1 : 1
    const newSale: Sale = {
      id: nextId,
      customer: form.customer.trim(),
      product: form.product.trim(),
      total: Number(form.total),
      status: form.status,
      date: form.date || new Date().toISOString().slice(0, 10),
    }

    setSales((current) => [newSale, ...current])
    setModalOpen(false)
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Registro de ventas</div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <i className="ti ti-plus" /> Nueva venta
        </button>
      </div>

      <div className="sales-summary-grid">
        <div className="sales-summary-card primary">
          <span><i className="ti ti-cash" /> Ingresos</span>
          <strong>{formatCurrency(totals.revenue)}</strong>
          <small>Ventas registradas</small>
        </div>
        <div className="sales-summary-card success">
          <span><i className="ti ti-check" /> Completadas</span>
          <strong>{totals.completed}</strong>
          <small>Pedidos cerrados</small>
        </div>
        <div className="sales-summary-card warning">
          <span><i className="ti ti-clock-hour-4" /> Pendientes</span>
          <strong>{totals.pending}</strong>
          <small>En revisión</small>
        </div>
      </div>

      <div className="sales-layout">
        <div className="table-card sales-table-card">
          <div className="card-header compact">
            <div>
              <div className="card-title">Historial de ventas</div>
              <div className="card-sub">Últimos movimientos por cliente</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <div className="customer-pill">
                      <span className="avatar-mini">{sale.customer.slice(0, 2).toUpperCase()}</span>
                      {sale.customer}
                    </div>
                  </td>
                  <td>{sale.product}</td>
                  <td><strong>{formatCurrency(sale.total)}</strong></td>
                  <td><span className={`badge ${getSaleBadgeClass(sale.status)}`}>{sale.status}</span></td>
                  <td>{sale.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sales-side-panel">
          <div className="mini-panel accent">
            <div className="mini-panel-header">
              <span>Resumen semanal</span>
              <i className="ti ti-trending-up" />
            </div>
            <div className="mini-panel-value">+18.4%</div>
            <small>Respecto a la semana anterior</small>
          </div>

          <div className="mini-panel">
            <div className="mini-panel-header">
              <span>Producto top</span>
              <i className="ti ti-crown" />
            </div>
            <div className="mini-panel-product">Vela Árabe</div>
            <small>Ventas más altas del período</small>
          </div>

          <div className="mini-panel neutral">
            <div className="mini-panel-header">
              <span>Canal</span>
              <i className="ti ti-store" />
            </div>
            <div className="mini-panel-value">Online</div>
            <small>Mayor volumen: 62%</small>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">Registrar nueva venta</div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <input
                    className="form-input"
                    value={form.customer}
                    onChange={(event) => setForm({ ...form, customer: event.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Producto *</label>
                  <input
                    className="form-input"
                    value={form.product}
                    onChange={(event) => setForm({ ...form, product: event.target.value })}
                    placeholder="Nombre del producto"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={form.total}
                    onChange={(event) => setForm({ ...form, total: Number(event.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    <option value="Completada">Completada</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar venta
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
