import { useEffect, useMemo, useState } from 'react'
import { cancelOrder, completeOrder, createOrder, createSale, createUser, fetchPedidos, fetchProducts, fetchSales, fetchSalesFunnel, fetchUsers, updateOrder, type OrderItemInput } from '../api/mockApi'
import { FunnelBoard } from '../components/sales/FunnelBoard'
import { OrdersBoard } from '../components/sales/OrdersBoard'
import { useToast } from '../context/ToastContext'
import type { CustomerOrder, Product, Sale, SalesFunnelData, User } from '../types'
import { formatCurrency } from '../utils/formatters'

interface SaleRecord extends Sale {
  paymentMethod?: string
  quantity?: number
  unitPrice?: number
}

type SalesTab = 'embudo' | 'pedidos' | 'ventas'

export function SalesPage() {
  const [tab, setTab] = useState<SalesTab>('embudo')
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [funnel, setFunnel] = useState<SalesFunnelData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [isOrderModalOpen, setOrderModalOpen] = useState(false)
    const [editingOrderId, setEditingOrderId] = useState<number | null>(null)
  const [isNewCustomerOpen, setNewCustomerOpen] = useState(false)
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todas')
  const { success, info, error } = useToast()
  const [saving, setSaving] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    dni: '',
    name: '',
    initials: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    address: '',
    role: 'cliente' as const,
    estado: 'activo' as const,
  })
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([])

  const [form, setForm] = useState({
    customerId: 0,
    sellerId: 0,
    productId: 0,
    productName: '',
    quantity: 1,
    unitPrice: 0,
    status: 'Pendiente' as 'Pendiente' | 'Alistamiento' | 'Entregado',
    paymentType: 'Transferencia' as 'Efectivo' | 'Transferencia' | 'Crédito',
    paymentStatus: 'Pendiente' as 'Pendiente' | 'Pagado' | 'Parcial',
    channel: 'persona' as 'persona' | 'facebook' | 'whatsapp',
    discount: 0,
    deliveryDate: new Date().toISOString().slice(0, 10),
    alistamiento: 0,
  })

  useEffect(() => {
    void Promise.all([fetchProducts(), fetchUsers()]).then(([productsData, usersData]) => {
        setProducts(productsData)
        setUsers(usersData)
        const customer = usersData.find((user) => user.backendRole === 'cliente')
        const seller = usersData.find((user) => user.backendRole === 'admin' || user.backendRole === 'super_admin')
        setForm((prev) => ({
          ...prev,
          customerId: customer?.id ?? 0,
          sellerId: seller?.id ?? 0,
          productId: productsData[0]?.id ?? 0,
          productName: productsData[0]?.name ?? '',
          unitPrice: productsData[0]?.price ?? 0,
        }))
        setOrderItems(productsData[0] ? [{ productId: productsData[0].id, quantity: 1, unitPrice: productsData[0].price, alistamiento: 0 }] : [])
      })

    void Promise.all([fetchSales(), fetchPedidos(), fetchSalesFunnel()]).then(([salesData, ordersData, funnelData]) => {
      setSales(salesData)
      setOrders(ordersData)
      setFunnel(funnelData)
    })
  }, [])

  const handleProductChange = (productId: number) => {
    const p = products.find((prod) => prod.id === productId)
    if (p) {
      setForm((prev) => ({
        ...prev,
        productId: p.id,
        productName: p.name,
        unitPrice: p.price,
      }))
    }
  }

  const openOrderForm = () => {
    setEditingOrderId(null)
    setForm((current) => ({ ...current, status: 'Pendiente' }))
    setOrderItems(form.productId ? [{ productId: form.productId, quantity: 1, unitPrice: form.unitPrice, alistamiento: 0 }] : [])
    setOrderModalOpen(true)
  }

  const handleEditOrder = (order: CustomerOrder) => {
    setEditingOrderId(order.id)
    setForm((current) => ({
      ...current,
      customerId: order.customerId ?? current.customerId,
      sellerId: order.sellerId ?? current.sellerId,
      status: order.status === 'Completada' ? 'Entregado' : order.status as typeof current.status,
      paymentStatus: order.paymentStatus as typeof current.paymentStatus,
      paymentType: order.paymentType as typeof current.paymentType,
      channel: order.canal as typeof current.channel,
      deliveryDate: order.deliveryDate ?? current.deliveryDate,
    }))
    setOrderItems(order.items.map((item) => ({ productId: item.productId, quantity: item.ordered, unitPrice: item.unitPrice, alistamiento: item.prepared })))
    setOrderModalOpen(true)
  }

  const addOrderItem = () => {
    const product = products.find((item) => !orderItems.some((line) => line.productId === item.id)) ?? products[0]
    if (product) setOrderItems((current) => [...current, { productId: product.id, quantity: 1, unitPrice: product.price, alistamiento: 0 }])
  }

  const updateOrderItem = (index: number, changes: Partial<OrderItemInput>) => {
    setOrderItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item))
  }

  const handleOrderSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.customerId || !form.deliveryDate || !orderItems.length || orderItems.some((item) => item.quantity <= 0 || item.alistamiento < 0)) {
      error('Completa cliente, fecha y al menos un producto válido.', 'Revisa el pedido')
      return
    }
    setSaving(true)
    const orderInput = {
      customerId: form.customerId,
      sellerId: form.sellerId,
      discount: form.discount,
      status: form.status,
      deliveryDate: form.deliveryDate,
      paymentType: form.paymentType,
      paymentStatus: form.paymentStatus,
      channel: form.channel,
      items: orderItems,
    }
    const isEditing = editingOrderId !== null
    void (editingOrderId === null ? createOrder(orderInput) : updateOrder(editingOrderId, orderInput)).then((created) => {
      setOrders((current) => isEditing ? current.map((item) => item.id === created.id ? created : item) : [created, ...current])
      setOrderModalOpen(false)
      setEditingOrderId(null)
      success(`Pedido #${created.id} ${isEditing ? 'actualizado' : 'creado'} con ${created.items.length} producto(s)`, isEditing ? 'Pedido actualizado' : 'Pedido creado')
      return fetchSalesFunnel()
    }).then(setFunnel).catch((caught) => error(caught instanceof Error ? caught.message : 'No fue posible guardar el pedido.', 'Error de pedido')).finally(() => setSaving(false))
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.dni.trim() || !newCustomer.email.trim() || !newCustomer.password) {
      error('Completa nombre, documento, correo y contraseña del cliente.', 'Datos incompletos')
      return
    }

    setSaving(true)
    try {
      const created = await createUser(newCustomer)
      setUsers((current) => [created, ...current])
      setForm((current) => ({ ...current, customerId: created.id }))
      setNewCustomerOpen(false)
      setNewCustomer({ dni: '', name: '', initials: '', email: '', username: '', password: '', phone: '', address: '', role: 'cliente', estado: 'activo' })
      success(`Cliente "${created.name}" creado y seleccionado`, 'Cliente creado')
    } catch (caught) {
      error(caught instanceof Error ? caught.message : 'No fue posible crear el cliente.', 'Error al crear cliente')
    } finally {
      setSaving(false)
    }
  }

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, item) => sum + item.total, 0)
    const completed = sales.filter((item) => item.status === 'Completada').length
    const pending = sales.filter((item) => item.status === 'Pendiente').length
    return { revenue, completed, pending }
  }, [sales])

  const customers = users.filter((user) => user.backendRole === 'cliente')
  const sellers = users.filter((user) => user.backendRole === 'admin' || user.backendRole === 'super_admin')

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        sale.customer.toLowerCase().includes(q) ||
        sale.product.toLowerCase().includes(q) ||
        String(sale.id).includes(q)
      const matchesStatus = statusFilter === 'Todas' || sale.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [sales, search, statusFilter])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const selectedProduct = products.find((product) => product.id === form.productId)
    if (!form.customerId || !selectedProduct || form.quantity <= 0 || form.unitPrice < 0 || !form.deliveryDate) {
      error('Selecciona cliente y producto, e ingresa valores válidos.', 'Revisa el formulario')
      return
    }
    if (form.quantity > selectedProduct.stock) { error('La cantidad supera el stock disponible.', 'Stock insuficiente'); return }
    setSaving(true)
    void createSale(form).then((created) => {
    setSales((current) => [{ ...created, quantity: form.quantity, unitPrice: form.unitPrice }, ...current])
      success(`Venta #${created.id} por ${formatCurrency(created.total)} registrada`, 'Venta Exitosa')
      setModalOpen(false)
    }).catch((caught) => error(caught instanceof Error ? caught.message : 'No fue posible registrar la venta.', 'Error de venta')).finally(() => setSaving(false))
  }

  const handleCompleteOrder = async (order: CustomerOrder) => {
    try {
      const nextStatus = order.status === 'Pendiente' ? 'Alistamiento' : 'Entregado'
      const updated = await completeOrder(order.id, nextStatus)
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item))
      setFunnel(await fetchSalesFunnel())
      success(
        nextStatus === 'Alistamiento' ? `Pedido #${updated.id} enviado a alistamiento` : `Pedido #${updated.id} completado`,
        'Pedido actualizado',
      )
    } catch (caught) {
      error(caught instanceof Error ? caught.message : 'No fue posible completar el pedido.', 'Error de pedido')
    }
  }

  const handleCancelOrder = async (order: CustomerOrder) => {
    try {
      const updated = await cancelOrder(order.id)
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item))
      setFunnel(await fetchSalesFunnel())
      success(`Pedido #${updated.id} cancelado`, 'Pedido cancelado')
    } catch (caught) {
      error(caught instanceof Error ? caught.message : 'No fue posible cancelar el pedido.', 'Error al cancelar')
    }
  }

  const handleExportCSV = () => {
    const rows = [
      ['N° Pedido', 'Cliente', 'Producto', 'Monto Total (COP)', 'Estado', 'Fecha'],
      ...filteredSales.map((s) => [
        `#${s.id}`,
        s.customer,
        s.product,
        String(s.total),
        s.status,
        s.date,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    info('Ventas exportadas a formato CSV', 'Descarga Completa')
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Embudo, pedidos y facturación</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Visual comercial conectada a pedidos, canales y catálogo del backend
          </span>
        </div>
        <div className="period-pills" role="tablist" aria-label="Secciones de ventas">
          <button type="button" className={`pill ${tab === 'embudo' ? 'active' : ''}`} onClick={() => setTab('embudo')}>
            Embudo
          </button>
          <button type="button" className={`pill ${tab === 'pedidos' ? 'active' : ''}`} onClick={() => setTab('pedidos')}>
            Pedidos
          </button>
          <button type="button" className={`pill ${tab === 'ventas' ? 'active' : ''}`} onClick={() => setTab('ventas')}>
            Ventas
          </button>
        </div>
        {tab === 'ventas' || tab === 'pedidos' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-outline" onClick={handleExportCSV}>
              <i className="ti ti-download" /> Exportar CSV
            </button>
            <button type="button" className="btn-primary" onClick={() => (tab === 'pedidos' ? openOrderForm() : setModalOpen(true))}>
              <i className="ti ti-plus" /> {tab === 'pedidos' ? 'Nuevo Pedido' : 'Nueva Venta'}
            </button>
          </div>
        ) : null}
      </div>

      {tab === 'embudo' ? (
        funnel ? <FunnelBoard data={funnel} /> : <p style={{ color: 'var(--text-dim)' }}>Cargando embudo de ventas...</p>
      ) : null}
      {tab === 'pedidos' ? <OrdersBoard orders={orders} onComplete={handleCompleteOrder} onEdit={handleEditOrder} onCancel={handleCancelOrder} /> : null}
      {tab === 'ventas' ? (
        <>

      {/* Tarjetas de Resumen */}
      <div className="stock-summary-grid">
        <div className="stock-summary-card primary">
          <div className="summary-label">Facturación Acumulada</div>
          <div className="summary-value" style={{ color: 'var(--gold)' }}>
            {formatCurrency(totals.revenue)}
          </div>
          <div className="summary-foot">Total facturado en el sistema</div>
        </div>
        <div className="stock-summary-card success">
          <div className="summary-label">Ventas Entregadas</div>
          <div className="summary-value">{totals.completed}</div>
          <div className="summary-foot">Pedidos completados con éxito</div>
        </div>
        <div className="stock-summary-card warning">
          <div className="summary-label">Por Despachar</div>
          <div className="summary-value">{totals.pending}</div>
          <div className="summary-foot">Pendientes de confirmación o entrega</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-row">
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '300px' }}
          placeholder="Buscar por cliente, pedido o vela..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="period-pills">
          {(['Todas', 'Completada', 'Pendiente', 'Cancelada'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`pill ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>N° Venta</th>
              <th>Cliente / Comprador</th>
              <th>Vela Adquirida</th>
              <th>Total (COP)</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th style={{ textAlign: 'center' }}>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-dim)' }}>
                    #{sale.id}
                  </span>
                </td>
                <td>
                  <strong>{sale.customer}</strong>
                </td>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">🕯️</div>
                    <div>{sale.product}</div>
                  </div>
                </td>
                <td>
                  <strong style={{ color: 'var(--gold)' }}>{formatCurrency(sale.total)}</strong>
                </td>
                <td>
                  <span
                    className={`badge ${
                      sale.status === 'Completada'
                        ? 'badge-success'
                        : sale.status === 'Pendiente'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {sale.status}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {sale.date}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => setReceiptSale(sale)}
                    title="Ver e imprimir recibo"
                  >
                    <i className="ti ti-receipt" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nueva Venta (Punto de Venta) */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nueva Venta</h3>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Cliente *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="form-input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: Number(e.target.value) })} required>
                        <option value={0}>Selecciona un cliente</option>
                        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>)}
                      </select>
                      <button type="button" className="icon-btn" title="Crear nuevo cliente" onClick={() => setNewCustomerOpen((value) => !value)}>
                        <i className="ti ti-user-plus" />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vendedor</label>
                    <select className="form-input" value={form.sellerId} onChange={(e) => setForm({ ...form, sellerId: Number(e.target.value) })}>
                      <option value={0}>Asignar automáticamente</option>
                      {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
                    </select>
                  </div>
                </div>

                {isNewCustomerOpen && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong>Nuevo cliente</strong>
                      <button type="button" className="icon-btn" title="Cerrar alta de cliente" onClick={() => setNewCustomerOpen(false)}>
                        <i className="ti ti-x" />
                      </button>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Nombre completo *</label>
                        <input className="form-input" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Documento *</label>
                        <input className="form-input" value={newCustomer.dni} onChange={(e) => setNewCustomer({ ...newCustomer, dni: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Correo *</label>
                        <input type="email" className="form-input" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Usuario</label>
                        <input className="form-input" value={newCustomer.username} onChange={(e) => setNewCustomer({ ...newCustomer, username: e.target.value })} placeholder="Se genera con el correo" />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Contraseña *</label>
                        <input type="password" minLength={4} className="form-input" value={newCustomer.password} onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Teléfono</label>
                        <input className="form-input" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Dirección</label>
                      <input className="form-input" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                    </div>
                    <button type="button" className="btn-secondary full-width" onClick={() => void handleCreateCustomer()} disabled={saving}>
                      <i className="ti ti-user-plus" /> {saving ? 'Creando...' : 'Crear y seleccionar cliente'}
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Producto / Vela a vender *</label>
                  <select
                    className="form-input"
                    value={form.productId}
                    onChange={(e) => handleProductChange(Number(e.target.value))}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price)} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio Unitario (COP)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo de Pago *</label>
                    <select
                      className="form-input"
                      value={form.paymentType}
                      onChange={(e) => setForm({ ...form, paymentType: e.target.value as typeof form.paymentType })}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Crédito">Crédito</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado del Pedido *</label>
                    <select
                      className="form-input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Alistamiento">Alistamiento</option>
                      <option value="Entregado">Entregado</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Estado de Pago *</label>
                    <select className="form-input" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as typeof form.paymentStatus })}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Parcial">Parcial</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Canal *</label>
                    <select className="form-input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as typeof form.channel })}>
                      <option value="persona">Persona</option>
                      <option value="facebook">Facebook</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Fecha de Entrega *</label>
                    <input type="date" className="form-input" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descuento (%)</label>
                    <input type="number" min="0" max="100" step="0.01" className="form-input" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad alistada</label>
                  <input type="number" min="0" max={form.quantity} className="form-input" value={form.alistamiento} onChange={(e) => setForm({ ...form, alistamiento: Number(e.target.value) || 0 })} />
                </div>

                {/* Resumen Total */}
                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Total de la Venta</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {form.quantity} unid. × {formatCurrency(form.unitPrice)}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, color: 'var(--gold)' }}>
                    {formatCurrency(form.quantity * form.unitPrice)}
                  </div>
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving || !products.length}>
                  <i className="ti ti-check" /> {saving ? 'Guardando...' : 'Confirmar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Comprobante / Recibo Imprimible */}
      {receiptSale && (
        <div className="modal-backdrop" onClick={() => setReceiptSale(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Comprobante de Venta #{receiptSale.id}</h3>
              <button type="button" className="modal-close" onClick={() => setReceiptSale(null)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body" id="printable-receipt">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img src="/logo.jpeg" alt="Logo" style={{ width: '56px', height: '56px', borderRadius: '8px' }} />
                <h4 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginTop: '6px' }}>
                  Velas Estrella de David
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Fábrica de Velas & Veladoras • NIT: 900.123.456-7
                </p>
              </div>

              <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '12px 0', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Fecha:</span>
                  <strong>{receiptSale.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Cliente:</span>
                  <strong>{receiptSale.customer}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Estado:</span>
                  <span className="badge badge-success">{receiptSale.status}</span>
                </div>
              </div>

              <div style={{ padding: '16px 0', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{receiptSale.product}</span>
                  <strong>{formatCurrency(receiptSale.total)}</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Total Pagado:</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--gold)' }}>
                  {formatCurrency(receiptSale.total)}
                </strong>
              </div>
            </div>

            <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
              <button type="button" className="btn-secondary" onClick={() => setReceiptSale(null)}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.print()}
              >
                <i className="ti ti-printer" /> Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : null}

      {isOrderModalOpen && (
        <div className="modal-backdrop" onClick={() => setOrderModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '760px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingOrderId === null ? 'Registrar Nuevo Pedido' : 'Editar Pedido'}</h3>
              <button type="button" className="modal-close" onClick={() => setOrderModalOpen(false)}><i className="ti ti-x" /></button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Cliente *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="form-input" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: Number(event.target.value) })} required>
                        <option value={0}>Selecciona un cliente</option>
                        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>)}
                      </select>
                      <button type="button" className="btn-secondary" onClick={() => setNewCustomerOpen((value) => !value)}><i className="ti ti-user-plus" /> Nuevo cliente</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vendedor</label>
                    <select className="form-input" value={form.sellerId} onChange={(event) => setForm({ ...form, sellerId: Number(event.target.value) })}>
                      <option value={0}>Asignar automáticamente</option>
                      {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
                    </select>
                  </div>
                </div>

                {isNewCustomerOpen && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '12px' }}>
                    <strong>Nuevo cliente</strong>
                    <div className="form-grid-2" style={{ marginTop: '10px' }}>
                      <input className="form-input" placeholder="Nombre completo *" value={newCustomer.name} onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })} />
                      <input className="form-input" placeholder="Documento *" value={newCustomer.dni} onChange={(event) => setNewCustomer({ ...newCustomer, dni: event.target.value })} />
                      <input type="email" className="form-input" placeholder="Correo *" value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} />
                      <input type="password" className="form-input" placeholder="Contraseña *" value={newCustomer.password} onChange={(event) => setNewCustomer({ ...newCustomer, password: event.target.value })} />
                    </div>
                    <button type="button" className="btn-secondary" style={{ marginTop: '10px' }} onClick={() => void handleCreateCustomer()} disabled={saving}><i className="ti ti-user-plus" /> Crear y seleccionar cliente</button>
                  </div>
                )}

                <div className="card-header compact" style={{ padding: '0 0 10px' }}>
                  <div><div className="card-title">Productos para fabricar</div><div className="card-sub">Agrega una o varias referencias al pedido</div></div>
                  <button type="button" className="btn-secondary" onClick={addOrderItem}><i className="ti ti-plus" /> Agregar producto</button>
                </div>
                {orderItems.map((item, index) => {
                  const product = products.find((entry) => entry.id === item.productId)
                  return (
                    <div className="form-grid-2" key={`${item.productId}-${index}`} style={{ alignItems: 'end' }}>
                      <div className="form-group">
                        <label className="form-label">Producto {index + 1}</label>
                        <select className="form-input" value={item.productId} onChange={(event) => {
                          const selected = products.find((entry) => entry.id === Number(event.target.value))
                          updateOrderItem(index, { productId: Number(event.target.value), unitPrice: selected?.price ?? 0 })
                        }}>
                          {products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · Stock {entry.stock}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <label className="form-group" style={{ flex: 1 }}>
                          <span className="form-label">Cantidad</span>
                          <input type="number" min="1" className="form-input" aria-label={`Cantidad producto ${index + 1}`} value={item.quantity} onChange={(event) => updateOrderItem(index, { quantity: Number(event.target.value) || 1 })} />
                        </label>
                        <label className="form-group" style={{ flex: 1 }}>
                          <span className="form-label">Alistadas</span>
                          <input type="number" min="0" className="form-input" aria-label={`Alistadas producto ${index + 1}`} value={item.alistamiento} onChange={(event) => updateOrderItem(index, { alistamiento: Number(event.target.value) || 0 })} />
                        </label>
                        <button type="button" className="btn-secondary" disabled={orderItems.length === 1} onClick={() => setOrderItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><i className="ti ti-trash" /> Quitar producto</button>
                      </div>
                      <small style={{ color: 'var(--text-dim)' }}>{product?.name ?? 'Producto'} · {formatCurrency(item.unitPrice)} · {item.quantity} unidad(es)</small>
                    </div>
                  )
                })}

                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Tipo de pago</label><select className="form-input" value={form.paymentType} onChange={(event) => setForm({ ...form, paymentType: event.target.value as typeof form.paymentType })}><option value="Efectivo">Efectivo</option><option value="Transferencia">Transferencia</option><option value="Crédito">Crédito</option></select></div>
                  <div className="form-group"><label className="form-label">Estado de pago</label><select className="form-input" value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value as typeof form.paymentStatus })}><option value="Pendiente">Pendiente</option><option value="Pagado">Pagado</option><option value="Parcial">Parcial</option></select></div>
                  <div className="form-group"><label className="form-label">Estado del pedido</label><input className="form-input" value="Pendiente" readOnly /></div>
                  <div className="form-group"><label className="form-label">Canal</label><select className="form-input" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as typeof form.channel })}><option value="persona">Persona</option><option value="facebook">Facebook</option><option value="whatsapp">WhatsApp</option></select></div>
                  <div className="form-group"><label className="form-label">Fecha de entrega</label><input type="date" className="form-input" value={form.deliveryDate} onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Descuento (%)</label><input type="number" min="0" max="100" step="0.01" className="form-input" value={form.discount} onChange={(event) => setForm({ ...form, discount: Number(event.target.value) || 0 })} /></div>
                </div>
              </div>
              <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
                <button type="button" className="btn-secondary" onClick={() => { setOrderModalOpen(false); setEditingOrderId(null) }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving || !orderItems.length}><i className="ti ti-check" /> {saving ? 'Guardando...' : editingOrderId === null ? 'Crear Pedido' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
