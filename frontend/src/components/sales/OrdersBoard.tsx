import { useEffect, useMemo, useState } from 'react'
import type { CustomerOrder } from '../../types'
import { coveragePercent, coverageState, formatCurrency, orderProcessPercent, stateClass } from '../../utils/formatters'

function statusBadge(status: string) {
  if (status === 'Entregado' || status === 'Completada') return 'badge-success'
  if (status === 'Alistamiento' || status === 'Pendiente') return 'badge-warning'
  return 'badge-danger'
}

export function OrdersBoard({ orders, onComplete, onEdit, onCancel }: { orders: CustomerOrder[]; onComplete: (order: CustomerOrder) => Promise<void>; onEdit: (order: CustomerOrder) => void; onCancel: (order: CustomerOrder) => Promise<void> }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [openId, setOpenId] = useState<number | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  useEffect(() => {
    const multi = orders.find((order) => order.items.length > 1)
    setOpenId((current) => current ?? multi?.id ?? orders[0]?.id ?? null)
  }, [orders])

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        order.customer.toLowerCase().includes(q) ||
        String(order.id).includes(q) ||
        order.items.some((item) => item.productName.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const handleComplete = async (order: CustomerOrder) => {
    setCompletingId(order.id)
    try {
      await onComplete(order)
    } finally {
      setCompletingId(null)
    }
  }

  const handleCancel = async (order: CustomerOrder) => {
    if (!window.confirm(`¿Cancelar el pedido #${order.id}?`)) return
    setCancelingId(order.id)
    try {
      await onCancel(order)
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <>
      <div className="filters-row">
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '320px' }}
          placeholder="Buscar cliente, vela o n° de pedido..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="period-pills">
          {['Todos', 'Pendiente', 'Alistamiento', 'Entregado', 'Cancelado'].map((status) => (
            <button
              key={status}
              type="button"
              className={`pill ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-list">
        {filtered.map((order) => {
          const process = orderProcessPercent(order.status, order.items)
          const processState = coverageState(process)
          const isOpen = openId === order.id

          return (
            <article key={order.id} className={`table-card order-card ${isOpen ? 'open' : ''}`}>
              <button type="button" className="order-card-toggle" onClick={() => setOpenId(isOpen ? null : order.id)}>
                <div className="order-card-main">
                  <span className="order-id">#{order.id}</span>
                  <div>
                    <strong>{order.customer}</strong>
                    <div className="order-meta">
                      {order.items.length} velas · {order.canal} · {order.date}
                    </div>
                  </div>
                </div>
                <div className="order-card-progress">
                  <div className="order-progress-label">
                    <span>Avance del pedido</span>
                    <strong>{process}%</strong>
                  </div>
                  <div className="stock-bar-wrap">
                    <div
                      className={`stock-bar-fill ${processState === 'success' ? 'healthy' : processState === 'warning' ? 'warning' : 'critical'}`}
                      style={{ width: `${Math.max(process, 4)}%` }}
                    />
                  </div>
                </div>
                <span className={`badge ${statusBadge(order.status)}`}>{order.status}</span>
                <strong className="order-total">{formatCurrency(order.total)}</strong>
                <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} />
              </button>

              {isOpen ? (
                <div className="order-lines">
                  <table>
                    <thead>
                      <tr>
                        <th>Vela</th>
                        <th>Pedidas</th>
                        <th>En stock</th>
                        <th>Cobertura</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => {
                        const percent = coveragePercent(item.ordered, item.stock)
                        const state = coverageState(percent)
                        return (
                          <tr key={`${order.id}-${item.productId}`}>
                            <td>
                              <div className="product-cell">
                                <div className="product-thumb">🕯️</div>
                                <div>
                                  <div className="product-name">{item.productName}</div>
                                  <div className="product-sku">Alistadas: {item.prepared}</div>
                                </div>
                              </div>
                            </td>
                            <td>{item.ordered}</td>
                            <td>{item.stock}</td>
                            <td style={{ minWidth: '180px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span className={`badge ${stateClass(state)}`}>{percent}%</span>
                                <span style={{ color: 'var(--text-dim)' }}>
                                  {Math.min(item.stock, item.ordered)} de {item.ordered}
                                </span>
                              </div>
                              <div className="stock-bar-wrap">
                                <div
                                  className={`stock-bar-fill ${state === 'success' ? 'healthy' : state === 'warning' ? 'warning' : 'critical'}`}
                                  style={{ width: `${Math.max(percent, 4)}%` }}
                                />
                              </div>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--gold)' }}>{formatCurrency(item.subtotal)}</strong>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {order.status !== 'Entregado' && order.status !== 'Cancelado' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px' }}>
                    {order.status === 'Pendiente' ? <button type="button" className="btn-secondary" onClick={() => onEdit(order)}>
                      <i className="ti ti-edit" /> Editar pedido
                    </button> : null}
                    <button type="button" className="btn-secondary" onClick={() => void handleCancel(order)} disabled={cancelingId === order.id} style={{ marginLeft: '8px' }}>
                      <i className="ti ti-x" /> {cancelingId === order.id ? 'Cancelando...' : 'Cancelar pedido'}
                    </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => void handleComplete(order)}
                        disabled={completingId === order.id}
                      >
                        <i className="ti ti-check" />
                        {completingId === order.id ? 'Actualizando...' : order.status === 'Pendiente' ? 'Enviar a alistamiento' : 'Completar pedido'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </>
  )
}
