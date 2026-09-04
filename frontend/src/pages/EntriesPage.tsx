import { useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '../api/mockApi'
import { useToast } from '../context/ToastContext'
import type { Product } from '../types'

type EntryType = 'Compra' | 'Producción' | 'Ajuste' | 'Devolución'

interface InventoryEntry {
  id: number
  product: string
  sku?: string
  quantity: number
  type: EntryType
  date: string
  note: string
  supplier?: string
}

const initialEntries: InventoryEntry[] = [
  { id: 1, product: 'Vela Árabe Dorada', sku: 'VEL-1', quantity: 40, type: 'Producción', date: '2026-09-02', note: 'Lote artesanal acabado oro', supplier: 'Taller Central' },
  { id: 2, product: 'Vela Floral Aromaterapia', sku: 'VEL-2', quantity: 25, type: 'Compra', date: '2026-09-01', note: 'Materias primas y ceras', supplier: 'Insumos Parafinas S.A.S.' },
  { id: 3, product: 'Vela Navideña Estrella', sku: 'VEL-3', quantity: 18, type: 'Producción', date: '2026-08-30', note: 'Lote de temporada navideña', supplier: 'Taller Central' },
  { id: 4, product: 'Vela Relajante Brisa', sku: 'VEL-4', quantity: 8, type: 'Ajuste', date: '2026-08-28', note: 'Ajuste de conteo físico', supplier: 'Auditoría interna' },
]

export function EntriesPage() {
  const [entries, setEntries] = useState<InventoryEntry[]>(initialEntries)
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<'Todas' | EntryType>('Todas')
  const [isModalOpen, setModalOpen] = useState(false)
  const { success, info } = useToast()

  const [form, setForm] = useState({
    product: '',
    quantity: 10,
    type: 'Producción' as EntryType,
    date: new Date().toISOString().slice(0, 10),
    note: '',
    supplier: '',
  })

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data)
      if (data.length > 0) {
        setForm((prev) => ({ ...prev, product: data[0].name }))
      }
    })
  }, [])

  const filteredEntries = useMemo(() => {
    if (filter === 'Todas') return entries
    return entries.filter((entry) => entry.type === filter)
  }, [entries, filter])

  const totalUnits = entries.reduce((sum, entry) => sum + entry.quantity, 0)
  const productionCount = entries.filter((e) => e.type === 'Producción').reduce((sum, e) => sum + e.quantity, 0)
  const purchaseCount = entries.filter((e) => e.type === 'Compra').reduce((sum, e) => sum + e.quantity, 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.product.trim() || Number(form.quantity) <= 0) return

    const matchedProduct = products.find((p) => p.name === form.product)

    const nextEntry: InventoryEntry = {
      id: Date.now(),
      product: form.product.trim(),
      sku: matchedProduct?.sku || 'VEL-IN',
      quantity: Number(form.quantity),
      type: form.type,
      date: form.date,
      note: form.note.trim() || 'Ingreso registrado en taller',
      supplier: form.supplier.trim() || (form.type === 'Producción' ? 'Taller Central' : 'Proveedor'),
    }

    setEntries((current) => [nextEntry, ...current])
    success(`Ingreso de ${form.quantity} unidades de "${form.product}" registrado`, 'Entrada Confirmada')
    setModalOpen(false)
    setForm({
      product: products[0]?.name || '',
      quantity: 10,
      type: 'Producción',
      date: new Date().toISOString().slice(0, 10),
      note: '',
      supplier: '',
    })
  }

  const handleExport = () => {
    const rows = [
      ['Fecha', 'Producto / Referencia', 'Cantidad', 'Tipo de Entrada', 'Origen / Proveedor', 'Notas'],
      ...filteredEntries.map((e) => [
        e.date,
        `${e.product} (${e.sku || 'N/A'})`,
        String(e.quantity),
        e.type,
        e.supplier || '',
        e.note,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `entradas_stock_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    info('Historial de entradas exportado a CSV', 'Descarga Completa')
  }

  const getBadgeClass = (type: EntryType) => {
    switch (type) {
      case 'Producción':
        return 'badge-warning'
      case 'Compra':
        return 'badge-success'
      case 'Ajuste':
        return 'badge-neutral'
      default:
        return 'badge-danger'
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Entradas de Mercancía & Producción</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Registro de lotes elaborados en taller e insumos adquiridos
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-outline" onClick={handleExport}>
            <i className="ti ti-download" /> Exportar CSV
          </button>
          <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
            <i className="ti ti-plus" /> Registrar Entrada
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="stock-summary-grid">
        <div className="stock-summary-card primary">
          <div className="summary-label">Total Ingresado</div>
          <div className="summary-value">{totalUnits}</div>
          <div className="summary-foot">Unidades en el historial</div>
        </div>
        <div className="stock-summary-card success">
          <div className="summary-label">Producción de Taller</div>
          <div className="summary-value">{productionCount}</div>
          <div className="summary-foot">Velas terminadas</div>
        </div>
        <div className="stock-summary-card warning">
          <div className="summary-label">Compras a Proveedor</div>
          <div className="summary-value">{purchaseCount}</div>
          <div className="summary-foot">Insumos y lotes externos</div>
        </div>
      </div>

      {/* Filtro por tipo de entrada */}
      <div className="filters-row">
        <div className="period-pills" style={{ display: 'inline-flex' }}>
          {(['Todas', 'Producción', 'Compra', 'Ajuste', 'Devolución'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`pill ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Entradas */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vela Ingresada</th>
              <th>Cantidad</th>
              <th>Tipo</th>
              <th>Origen / Proveedor</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((item) => (
              <tr key={item.id}>
                <td>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>{item.date}</span>
                </td>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">📦</div>
                    <div>
                      <div className="product-name">{item.product}</div>
                      {item.sku && <div className="product-sku">{item.sku}</div>}
                    </div>
                  </div>
                </td>
                <td>
                  <strong style={{ color: 'var(--success)' }}>+{item.quantity}</strong> unid.
                </td>
                <td>
                  <span className={`badge ${getBadgeClass(item.type)}`}>{item.type}</span>
                </td>
                <td>{item.supplier}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Entrada */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Entrada de Stock</h3>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Seleccionar Vela / Producto *</label>
                  <select
                    className="form-input"
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.sku}) - Stock actual: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Cantidad a ingresar *</label>
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
                    <label className="form-label">Tipo de movimiento *</label>
                    <select
                      className="form-input"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as EntryType })}
                    >
                      <option value="Producción">Producción (Taller)</option>
                      <option value="Compra">Compra a Proveedor</option>
                      <option value="Ajuste">Ajuste de Conteo</option>
                      <option value="Devolución">Devolución</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Fecha de ingreso</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Origen / Proveedor</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ej. Taller Central o Proveedor"
                      value={form.supplier}
                      onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas u observaciones</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Número de lote, responsable o detalles..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <i className="ti ti-check" /> Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
