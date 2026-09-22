import { useEffect, useMemo, useState } from 'react'
import { createInventoryMovement, fetchInventoryMovements, fetchProducts } from '../api/mockApi'
import { EntriesFilters, EntriesHeader, EntriesSummary, EntriesTable, MovementModal } from '../components/entries/EntriesBlocks'
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
    <EntriesHeader onExport={exportHistory} onEntry={() => startMovement('entrada')} onExit={() => startMovement('salida')} />
    <EntriesSummary movementCount={movements.length} incoming={units('entrada')} outgoing={units('salida')} />
    <EntriesFilters filter={filter} onChange={setFilter} />
    <EntriesTable visible={visible} formatter={formatter} />
    <MovementModal open={open} saving={saving} type={typeForForm} form={form} products={products} reasons={reasons} onClose={() => setOpen(false)} onSubmit={submit} onChange={setForm} />
  </>
}
