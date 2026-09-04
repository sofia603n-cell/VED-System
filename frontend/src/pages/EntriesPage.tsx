import { useEffect, useMemo, useState } from 'react'
import { createInventoryMovement, fetchInventoryMovements, fetchProducts } from '../api/mockApi'
import { useToast } from '../context/ToastContext'
import type { InventoryMovement, InventoryMovementForm, MovementType, Product } from '../types'

type ViewFilter = 'todos' | MovementType

const reasons: Record<MovementType, Array<InventoryMovementForm['reason']>> = {
  entrada: ['Producción', 'Reembolso'],
  salida: ['Daño', 'Defecto'],
}
const formatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export function EntriesPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<ViewFilter>('todos')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { success, error, info } = useToast()
  const [form, setForm] = useState<InventoryMovementForm>({ productId: 0, quantity: 1, reason: 'Producción' })

  const load = async () => {
    const [history, catalog] = await Promise.all([fetchInventoryMovements(), fetchProducts()])
    setMovements(history)
    setProducts(catalog)
    setForm((value) => value.productId || !catalog.length ? value : { ...value, productId: catalog[0].id })
  }
  useEffect(() => { void load() }, [])

  const visible = useMemo(() => filter === 'todos' ? movements : movements.filter((m) => m.type === filter), [filter, movements])
  const units = (type: MovementType) => movements.filter((m) => m.type === type).reduce((sum, m) => sum + m.items.reduce((subtotal, item) => subtotal + item.quantity, 0), 0)
  const typeForForm: MovementType = reasons.entrada.includes(form.reason) ? 'entrada' : 'salida'

  const startMovement = (type: MovementType) => {
    setForm({ productId: products[0]?.id ?? 0, quantity: 1, reason: reasons[type][0] })
    setOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.productId || form.quantity <= 0) {
      error('Selecciona un producto e ingresa una cantidad mayor a cero.', 'Datos incompletos')
      return
    }
    const product = products.find((item) => item.id === form.productId)
    if (typeForForm === 'salida' && product && form.quantity > product.stock) {
      error(`No puedes retirar más de las ${product.stock} unidades disponibles.`, 'Stock insuficiente')
      return
    }
    setSaving(true)
    try {
      const movement = await createInventoryMovement(form)
      setMovements((current) => [movement, ...current.filter((item) => item.id !== movement.id)])
      success(`${movement.type === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente.`, 'Movimiento confirmado')
      setOpen(false)
      void load()
    } catch (caught) {
      error(caught instanceof Error ? caught.message : 'No fue posible registrar el movimiento.', 'Error de inventario')
    } finally { setSaving(false) }
  }

  const exportHistory = () => {
    const rows = [['Fecha', 'Tipo', 'Motivo', 'Producto', 'Cantidad', 'Responsable'], ...visible.flatMap((m) => m.items.map((item) => [m.date, m.type, m.reason, item.productName, String(item.quantity), m.user]))]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
    link.download = `historial_movimientos_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    info('Historial exportado a CSV.', 'Descarga completa')
  }

  return <>
    <div className="section-header">
      <div><h2 className="section-title">Entradas, Salidas e Historial</h2><span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Trazabilidad de cada movimiento de inventario registrado</span></div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" className="btn-outline" onClick={exportHistory}><i className="ti ti-download" /> Exportar CSV</button>
        <button type="button" className="btn-secondary" onClick={() => startMovement('salida')}><i className="ti ti-arrow-bar-to-up" /> Registrar salida</button>
        <button type="button" className="btn-primary" onClick={() => startMovement('entrada')}><i className="ti ti-arrow-bar-to-down" /> Registrar entrada</button>
      </div>
    </div>
    <div className="stock-summary-grid">
      <div className="stock-summary-card primary"><div className="summary-label">Movimientos registrados</div><div className="summary-value">{movements.length}</div><div className="summary-foot">Historial completo</div></div>
      <div className="stock-summary-card success"><div className="summary-label">Unidades de entrada</div><div className="summary-value">+{units('entrada')}</div><div className="summary-foot">Producción y reembolsos</div></div>
      <div className="stock-summary-card warning"><div className="summary-label">Unidades de salida</div><div className="summary-value">-{units('salida')}</div><div className="summary-foot">Daños y defectos</div></div>
    </div>
    <div className="filters-row"><div className="period-pills" style={{ display: 'inline-flex' }}>
      {([['todos', 'Todos'], ['entrada', 'Entradas'], ['salida', 'Salidas']] as const).map(([value, label]) => <button key={value} type="button" className={`pill ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>{label}</button>)}
    </div></div>
    <div className="table-card"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Tipo</th><th>Motivo</th><th>Responsable</th></tr></thead><tbody>
      {visible.length ? visible.flatMap((movement) => movement.items.map((item) => <tr key={`${movement.id}-${item.productId}`}>
        <td><span style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>{formatter.format(new Date(movement.date))}</span></td>
        <td><div className="product-cell"><div className="product-thumb">📦</div><div className="product-name">{item.productName}</div></div></td>
        <td><strong style={{ color: movement.type === 'entrada' ? 'var(--success)' : 'var(--danger)' }}>{movement.type === 'entrada' ? '+' : '-'}{item.quantity}</strong> unid.</td>
        <td><span className={`badge ${movement.type === 'entrada' ? 'badge-success' : 'badge-danger'}`}>{movement.type}</span></td><td>{movement.reason}</td><td>{movement.user}</td>
      </tr>)) : <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No hay movimientos para este filtro.</td></tr>}
    </tbody></table></div>
    {open && <div className="modal-backdrop" onClick={() => !saving && setOpen(false)}><div className="modal-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '520px' }}>
      <div className="modal-header"><h3 className="modal-title">Registrar {typeForForm} de inventario</h3><button type="button" className="modal-close" disabled={saving} onClick={() => setOpen(false)}><i className="ti ti-x" /></button></div>
      <form onSubmit={submit}><div className="modal-body">
        <div className="form-group"><label className="form-label">Producto *</label><select className="form-input" value={form.productId} onChange={(event) => setForm({ ...form, productId: Number(event.target.value) })} required disabled={!products.length}>{products.length ? products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku}) — Stock: {product.stock}</option>) : <option value={0}>No hay productos disponibles</option>}</select></div>
        <div className="form-grid-2"><div className="form-group"><label className="form-label">Tipo *</label><select className="form-input" value={typeForForm} onChange={(event) => setForm({ ...form, reason: reasons[event.target.value as MovementType][0] })}><option value="entrada">Entrada</option><option value="salida">Salida</option></select></div>
        <div className="form-group"><label className="form-label">Motivo *</label><select className="form-input" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value as InventoryMovementForm['reason'] })}>{reasons[typeForForm].map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></div></div>
        <div className="form-group"><label className="form-label">Cantidad *</label><input type="number" min="1" max={typeForForm === 'salida' ? products.find((item) => item.id === form.productId)?.stock : undefined} step="1" className="form-input" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} required /></div>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>El movimiento se guarda en este navegador y actualiza el stock de inmediato.</div>
      </div><div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}><button type="button" className="btn-secondary" disabled={saving} onClick={() => setOpen(false)}>Cancelar</button><button type="submit" className="btn-primary" disabled={saving || !products.length}>{saving ? 'Guardando...' : 'Confirmar movimiento'}</button></div></form>
    </div></div>}
  </>
}
