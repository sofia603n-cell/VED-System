import { useEffect, useMemo, useState } from 'react'
import { createSale, fetchProducts, fetchSales } from '../api/mockApi'
import { useToast } from '../context/ToastContext'
import type { Product, Sale } from '../types'
import { formatCurrency } from '../utils/formatters'

interface SaleRecord extends Sale {
  paymentMethod?: string
  quantity?: number
  unitPrice?: number
}

export function SalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todas')
  const { success, info, error } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    customer: '',
    productId: 0,
    productName: '',
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'Transferencia Nequi / Daviplata',
    status: 'Completada',
    date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    Promise.all([fetchSales(), fetchProducts()]).then(([salesData, productsData]) => {
      setSales(salesData)
      setProducts(productsData)
      if (productsData.length > 0) {
        setForm((prev) => ({
          ...prev,
          productId: productsData[0].id,
          productName: productsData[0].name,
          unitPrice: productsData[0].price,
        }))
      }
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

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, item) => sum + item.total, 0)
    const completed = sales.filter((item) => item.status === 'Completada').length
    const pending = sales.filter((item) => item.status === 'Pendiente').length
    return { revenue, completed, pending }
  }, [sales])

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
    if (!form.customer.trim() || !selectedProduct || form.quantity <= 0 || form.unitPrice < 0) {
      error('Selecciona cliente y producto, e ingresa valores válidos.', 'Revisa el formulario')
      return
    }
    if (form.quantity > selectedProduct.stock) { error('La cantidad supera el stock disponible.', 'Stock insuficiente'); return }
    setSaving(true)
    void createSale(form).then((created) => {
      setSales((current) => [{ ...created, quantity: form.quantity, unitPrice: form.unitPrice, paymentMethod: form.paymentMethod }, ...current])
      success(`Venta #${created.id} por ${formatCurrency(created.total)} registrada`, 'Venta Exitosa')
      setModalOpen(false)
    }).catch((caught) => error(caught instanceof Error ? caught.message : 'No fue posible registrar la venta.', 'Error de venta')).finally(() => setSaving(false))
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
          <h2 className="section-title">Registro & Facturación de Ventas</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Gestión comercial, despachos a clientes y comprobantes de pago
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-outline" onClick={handleExportCSV}>
            <i className="ti ti-download" /> Exportar CSV
          </button>
          <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
            <i className="ti ti-plus" /> Nueva Venta
          </button>
        </div>
      </div>

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
                <div className="form-group">
                  <label className="form-label">Nombre del Cliente *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. Distribuidora Santa Fe o María Gómez"
                    value={form.customer}
                    onChange={(e) => setForm({ ...form, customer: e.target.value })}
                    required
                  />
                </div>

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
                    <label className="form-label">Método de Pago</label>
                    <select
                      className="form-input"
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                      <option value="Transferencia Nequi / Daviplata">Nequi / Daviplata</option>
                      <option value="Efectivo en Tienda">Efectivo</option>
                      <option value="Tarjeta Débito / Crédito">Tarjeta</option>
                      <option value="Bancolombia Transferencia">Bancolombia</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado de Entrega</label>
                    <select
                      className="form-input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Completada">Completada (Entregado)</option>
                      <option value="Pendiente">Pendiente (Por entregar)</option>
                    </select>
                  </div>
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
  )
}
