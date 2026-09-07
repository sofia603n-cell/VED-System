import { useEffect, useMemo, useState } from 'react'
import { createPedido, fetchProducts, fetchSales, fetchUsers, updatePedidoStatus } from '../api/mockApi'
import type { Product, Sale, User } from '../types'
import { formatCurrency } from '../utils/formatters'

interface SaleForm {
  customerId: string
  paymentMethod: string
  paymentStatus: string
  channel: string
  date: string
}

interface SaleLine {
  productId: string
  quantity: number
}

function emptySaleLine(): SaleLine {
  return { productId: '', quantity: 1 }
}

function emptySaleForm(): SaleForm {
  return {
    customerId: '',
    paymentMethod: 'Efectivo',
    paymentStatus: 'Pendiente',
    channel: 'whatsapp',
    date: new Date().toISOString().slice(0, 10),
  }
}

function getLinePercentage(product: Product | undefined, quantity: number): number {
  if (!product || quantity <= 0) return 0
  if (product.stock <= 0) return 0
  return Math.min(100, Math.round((product.stock / quantity) * 100))
}

function getAvailabilityWidth(percentage: number): number {
  if (!Number.isFinite(percentage) || percentage <= 0) return 0
  return Math.min(100, percentage)
}

function getSaleBadgeClass(status: string) {
  if (status === 'Pendiente') return 'badge-warning'
  if (status === 'Cancelada') return 'badge-danger'
  return 'badge-success'
}

function getOrderProgress(status: string): number {
  if (status === 'Entregado') return 100
  if (status === 'Alistamiento') return 66
  return 33
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [saleLines, setSaleLines] = useState<SaleLine[]>([emptySaleLine()])
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [form, setForm] = useState<SaleForm>(emptySaleForm())

  useEffect(() => {
    fetchSales().then(setSales)
    fetchProducts().then(setProducts)
    fetchUsers().then(setUsers)
  }, [])

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, item) => sum + item.total, 0)
    const completed = sales.filter((item) => item.status === 'Completada').length
    const pending = sales.filter((item) => item.status === 'Pendiente').length
    return { revenue, completed, pending }
  }, [sales])

  const openCreate = () => {
    setForm(emptySaleForm())
    setSaleLines([emptySaleLine()])
    setModalOpen(true)
  }

  const updateSaleLine = (index: number, values: Partial<SaleLine>) => {
    setSaleLines((current) => current.map((line, currentIndex) => (currentIndex === index ? { ...line, ...values } : line)))
  }

  const addSaleLine = () => {
    setSaleLines((current) => [...current, emptySaleLine()])
  }

  const removeSaleLine = (index: number) => {
    setSaleLines((current) => current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : [emptySaleLine()])
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedSale) return

    try {
      const updated = await updatePedidoStatus(selectedSale.id, status)
      setSelectedSale(updated)
      setSales((current) => current.map((sale) => sale.id === updated.id ? updated : sale))
      if (status === 'Alistamiento') {
        setProducts(await fetchProducts())
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      window.alert(`No se pudo actualizar el estado del pedido: ${message}`)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validLines = saleLines.filter((line) => line.productId && Number(line.quantity) > 0)
    if (!form.customerId || validLines.length === 0) {
      return
    }

    const customer = users.find((user) => user.id === Number(form.customerId))
    const payload = {
      id_cliente: Number(form.customerId),
      id_vendedor: users.find((user) => user.role === 'supremo')?.id ?? 1,
      porcentaje: 0,
      fecha_entrega: form.date,
      tipo_pago: form.paymentMethod,
      estado_pago: form.paymentStatus,
      canal: form.channel,
      items: validLines.map((line) => {
        const product = products.find((item) => item.id === Number(line.productId))
        return {
          id_producto: Number(line.productId),
          cantidad: Number(line.quantity),
          precio_acordado: product ? product.price : 0,
          alistamiento: 0,
        }
      }),
    }

    try {
      const created = await createPedido(payload)
      setSales((current) => [created, ...current])
      setModalOpen(false)
      setForm(emptySaleForm())
      setSaleLines([emptySaleLine()])
    } catch (error) {
      const productName = validLines.length > 0 ? products.find((product) => product.id === Number(validLines[0].productId))?.name ?? 'producto' : 'producto'
      const customerName = customer?.name ?? 'cliente'
      window.alert(`No se pudo crear el pedido para ${customerName} con ${productName}. Revisa que exista el cliente y el vendedor correctos en la base de datos y que PostgreSQL esté activo.`)
    }
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Pedidos</div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <i className="ti ti-plus" /> Nuevo pedido
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
                  <td>
                    <div className="action-buttons">
                      <span>{sale.date}</span>
                      <button type="button" className="icon-btn ghost" onClick={() => setSelectedSale(sale)}>
                        <i className="ti ti-eye" />
                      </button>
                    </div>
                  </td>
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

      {selectedSale ? (
        <div className="modal-overlay open" onClick={() => setSelectedSale(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">Detalle del pedido</div>
            <div className="order-progress">
              <div className="stock-meter-label">
                <span>Estado del pedido</span>
                <small>{selectedSale.status} · {getOrderProgress(selectedSale.status)}%</small>
              </div>
              <div className="stock-meter">
                <span className="stock-fill success" style={{ width: `${getOrderProgress(selectedSale.status)}%` }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="order-status">Cambiar estado</label>
              <select
                id="order-status"
                className="form-input"
                value={selectedSale.status}
                onChange={(event) => handleStatusChange(event.target.value)}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Alistamiento">Alistamiento</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
            <div className="table-card compact-table">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Stock disponible</th>
                    <th>% disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSale.details && selectedSale.details.length ? selectedSale.details : [{ name: selectedSale.product, quantity: 1, percentage: 100, availableStock: 1 }]).map((detail, index) => {
                    const productMatch = products.find((product) => product.name.toLowerCase() === detail.name.toLowerCase())
                    const availableStock = typeof detail.availableStock === 'number' ? detail.availableStock : (productMatch?.stock ?? 0)
                    const requestedQty = Number(detail.quantity ?? 0)
                    const percentage = requestedQty > 0 ? Math.min(100, Math.round((availableStock / requestedQty) * 100)) : 0
                    const width = getAvailabilityWidth(percentage)

                    return (
                      <tr key={`${selectedSale.id}-${detail.name}-${index}`}>
                        <td>{detail.name}</td>
                        <td>{detail.quantity}</td>
                        <td>{availableStock}</td>
                        <td>
                          <div className="stock-meter-wrap">
                            <div className="stock-meter-label">
                              <span>{percentage}%</span>
                              <small>{availableStock} / {requestedQty}</small>
                            </div>
                            <div className="stock-meter">
                              <span className="stock-fill success" style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => setSelectedSale(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">Registrar nuevo pedido</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <select
                  className="form-input"
                  value={form.customerId}
                  onChange={(event) => setForm({ ...form, customerId: event.target.value })}
                >
                  <option value="">Selecciona un cliente</option>
                  {users.filter((user) => user.role === 'normal').map((user) => (
                    <option key={user.id} value={String(user.id)}>{user.name}</option>
                  ))}
                </select>
              </div>

              {saleLines.map((line, index) => {
                const selectedProduct = products.find((product) => product.id === Number(line.productId))
                const percentage = getLinePercentage(selectedProduct, Number(line.quantity) || 1)

                return (
                  <div key={`line-${index}`} className="form-row" style={{ alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label className="form-label">Producto {index + 1} *</label>
                      <select
                        className="form-input"
                        value={line.productId}
                        onChange={(event) => updateSaleLine(index, { productId: event.target.value })}
                      >
                        <option value="">Selecciona un producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={String(product.id)}>{product.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Cantidad *</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={line.quantity}
                        onChange={(event) => updateSaleLine(index, { quantity: Number(event.target.value) || 1 })}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1.2 }}>
                      <label className="form-label">% stock</label>
                      <div className="stock-meter-wrap" style={{ marginTop: '4px' }}>
                        <div className="stock-meter-label">
                          <span>{percentage}%</span>
                          <small>{selectedProduct?.stock ?? 0} / {Number(line.quantity) || 1}</small>
                        </div>
                        <div className="stock-meter">
                          <span className="stock-fill success" style={{ width: `${getAvailabilityWidth(percentage)}%` }} />
                        </div>
                      </div>
                    </div>

                    {saleLines.length > 1 ? (
                      <button type="button" className="btn-outline" onClick={() => removeSaleLine(index)} style={{ marginBottom: '7px' }}>
                        Quitar
                      </button>
                    ) : null}
                  </div>
                )
              })}

              <button type="button" className="btn-outline" onClick={addSaleLine} style={{ marginBottom: '14px' }}>
                <i className="ti ti-plus" /> Agregar producto
              </button>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pago</label>
                  <select
                    className="form-input"
                    value={form.paymentMethod}
                    onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado pago</label>
                  <select
                    className="form-input"
                    value={form.paymentStatus}
                    onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Parcial">Parcial</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Canal</label>
                  <select
                    className="form-input"
                    value={form.channel}
                    onChange={(event) => setForm({ ...form, channel: event.target.value })}
                  >
                    <option value="persona">Persona</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha entrega</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
