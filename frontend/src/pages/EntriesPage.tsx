import { useMemo, useState } from 'react'

type EntryType = 'Compra' | 'Ajuste' | 'Producción' | 'Devolución'

interface InventoryEntry {
  id: number
  product: string
  quantity: number
  type: EntryType
  date: string
  note: string
}

const initialEntries: InventoryEntry[] = [
  { id: 1, product: 'Vela Lavanda & Vainilla', quantity: 40, type: 'Compra', date: '2026-08-24', note: 'Pedido de proveedor' },
  { id: 2, product: 'Vela Coco & Sándalo', quantity: 25, type: 'Ajuste', date: '2026-08-22', note: 'Ajuste de inventario' },
  { id: 3, product: 'Vela Eucalipto Natural', quantity: 18, type: 'Producción', date: '2026-08-20', note: 'Lote de producción 06' },
  { id: 4, product: 'Vela Naranja & Madera', quantity: 8, type: 'Devolución', date: '2026-08-18', note: 'Devolución de cliente' },
]

function emptyEntryForm() {
  return {
    product: '',
    quantity: 1,
    type: 'Compra' as EntryType,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  }
}

export function EntriesPage() {
  const [entries, setEntries] = useState<InventoryEntry[]>(initialEntries)
  const [filter, setFilter] = useState<'Todas' | EntryType>('Todas')
  const [form, setForm] = useState(emptyEntryForm())

  const filteredEntries = useMemo(() => {
    if (filter === 'Todas') return entries
    return entries.filter((entry) => entry.type === filter)
  }, [entries, filter])

  const totalUnits = entries.reduce((sum, entry) => sum + entry.quantity, 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.product.trim() || Number(form.quantity) <= 0) return

    const nextEntry: InventoryEntry = {
      id: Date.now(),
      product: form.product.trim(),
      quantity: Number(form.quantity),
      type: form.type,
      date: form.date,
      note: form.note.trim() || 'Registro manual',
    }

    setEntries((current) => [nextEntry, ...current])
    setForm(emptyEntryForm())
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Entradas de inventario</div>
      </div>

      <div className="entry-summary-grid">
        <div className="entry-summary-card primary">
          <span><i className="ti ti-package" /> Unidades hoy</span>
          <strong>{totalUnits}</strong>
          <small>Movimientos registrados</small>
        </div>
        <div className="entry-summary-card success">
          <span><i className="ti ti-plus" /> Compras</span>
          <strong>{entries.filter((entry) => entry.type === 'Compra').length}</strong>
          <small>En este período</small>
        </div>
        <div className="entry-summary-card warning">
          <span><i className="ti ti-adjustments-alt" /> Ajustes</span>
          <strong>{entries.filter((entry) => entry.type === 'Ajuste').length}</strong>
          <small>Revisión de stock</small>
        </div>
      </div>

      <div className="entries-layout">
        <div className="table-card entry-table-card">
          <div className="card-header compact">
            <div>
              <div className="card-title">Historial</div>
              <div className="card-sub">Últimas entradas registradas</div>
            </div>
            <div className="period-pills small">
              {(['Todas', 'Compra', 'Ajuste', 'Producción', 'Devolución'] as const).map((type) => (
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
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.product}</td>
                  <td><strong>{entry.quantity}</strong></td>
                  <td><span className={`badge ${entry.type === 'Compra' ? 'badge-success' : entry.type === 'Ajuste' ? 'badge-warning' : entry.type === 'Devolución' ? 'badge-danger' : 'badge-neutral'}`}>{entry.type}</span></td>
                  <td>{entry.date}</td>
                  <td>{entry.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="entry-form-card">
          <div className="card-title">Registrar entrada</div>
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
                <select className="form-input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as EntryType })}>
                  <option value="Compra">Compra</option>
                  <option value="Ajuste">Ajuste</option>
                  <option value="Producción">Producción</option>
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
                <input className="form-input" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Referencia / lote" />
              </div>
            </div>
            <button type="submit" className="btn-primary full-width">
              <i className="ti ti-plus" /> Guardar entrada
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
