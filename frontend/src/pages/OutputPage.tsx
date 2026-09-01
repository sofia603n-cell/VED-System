import { useMemo, useState } from 'react'

type OutputType = 'Venta' | 'Ajuste' | 'Daño' | 'Devolución'

interface OutputEntry {
  id: number
  product: string
  quantity: number
  type: OutputType
  date: string
  note: string
}

const initialOutputs: OutputEntry[] = [
  { id: 1, product: 'Vela Lavanda & Vainilla', quantity: 12, type: 'Venta', date: '2026-08-28', note: 'Pedido por WhatsApp' },
  { id: 2, product: 'Vela Coco & Sándalo', quantity: 5, type: 'Ajuste', date: '2026-08-26', note: 'Corrección de inventario' },
  { id: 3, product: 'Vela Eucalipto Natural', quantity: 3, type: 'Daño', date: '2026-08-25', note: 'Producto con defecto' },
]

function emptyOutputForm() {
  return {
    product: '',
    quantity: 1,
    type: 'Venta' as OutputType,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  }
}

export function OutputPage() {
  const [outputs, setOutputs] = useState<OutputEntry[]>(initialOutputs)
  const [filter, setFilter] = useState<'Todas' | OutputType>('Todas')
  const [form, setForm] = useState(emptyOutputForm())

  const filteredOutputs = useMemo(() => {
    if (filter === 'Todas') return outputs
    return outputs.filter((entry) => entry.type === filter)
  }, [outputs, filter])

  const totalUnits = outputs.reduce((sum, entry) => sum + entry.quantity, 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.product.trim() || Number(form.quantity) <= 0) return

    const nextEntry: OutputEntry = {
      id: Date.now(),
      product: form.product.trim(),
      quantity: Number(form.quantity),
      type: form.type,
      date: form.date,
      note: form.note.trim() || 'Salida registrada',
    }

    setOutputs((current) => [nextEntry, ...current])
    setForm(emptyOutputForm())
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Salidas de inventario</div>
      </div>

      <div className="entry-summary-grid">
        <div className="entry-summary-card primary">
          <span><i className="ti ti-package-export" /> Unidades salidas</span>
          <strong>{totalUnits}</strong>
          <small>Movimientos registrados</small>
        </div>
        <div className="entry-summary-card success">
          <span><i className="ti ti-shopping-bag" /> Ventas</span>
          <strong>{outputs.filter((entry) => entry.type === 'Venta').length}</strong>
          <small>Salidas por ventas</small>
        </div>
        <div className="entry-summary-card warning">
          <span><i className="ti ti-alert-triangle" /> Ajustes</span>
          <strong>{outputs.filter((entry) => entry.type === 'Ajuste' || entry.type === 'Daño').length}</strong>
          <small>Revisión de stock</small>
        </div>
      </div>

      <div className="entries-layout">
        <div className="table-card entry-table-card">
          <div className="card-header compact">
            <div>
              <div className="card-title">Historial</div>
              <div className="card-sub">Últimas salidas registradas</div>
            </div>
            <div className="period-pills small">
              {(['Todas', 'Venta', 'Ajuste', 'Daño', 'Devolución'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`pill ${filter === type ? 'active' : ''}`}
                  onClick={() => setFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutputs.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.product}</td>
                  <td><strong>{entry.quantity}</strong></td>
                  <td><span className={`badge ${entry.type === 'Venta' ? 'badge-success' : entry.type === 'Ajuste' ? 'badge-warning' : entry.type === 'Daño' ? 'badge-danger' : 'badge-neutral'}`}>{entry.type}</span></td>
                  <td>{entry.date}</td>
                  <td>{entry.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="entry-form-card">
          <div className="card-title">Registrar salida</div>
          <form onSubmit={handleSubmit} className="entry-form">
            <div className="form-group">
              <label className="form-label">Producto</label>
              <input className="form-input" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} placeholder="Nombre del producto" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <input type="number" min="1" className="form-input" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) || 1 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as OutputType })}>
                  <option value="Venta">Venta</option>
                  <option value="Ajuste">Ajuste</option>
                  <option value="Daño">Daño</option>
                  <option value="Devolución">Devolución</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" className="form-input" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Nota</label>
                <input className="form-input" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Motivo / pedido" />
              </div>
            </div>
            <button type="submit" className="btn-primary full-width">
              <i className="ti ti-arrow-bar-to-up" /> Guardar salida
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
