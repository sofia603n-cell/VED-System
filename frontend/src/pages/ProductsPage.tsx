import { useEffect, useMemo, useState } from 'react'
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../api/mockApi'
import type { Product, ProductForm } from '../types'
import { getProductState, stateClass } from '../utils/formatters'
import { formatCurrency } from '../utils/formatters'

function getStockBarPercent(product: Pick<Product, 'stock' | 'minStock'>) {
  if (product.stock <= 0) return 0
  const reference = Math.max(product.minStock * 2, 12)
  return Math.min(100, Math.max(8, (product.stock / reference) * 100))
}

function emptyProductForm(): ProductForm {
  return {
    name: '',
    sku: '',
    category: 'Veladora',
    price: 0,
    stock: 0,
    minStock: 10,
    measures: '',
    presentation: '',
    colors: '',
    description: '',
    status: 'active',
  }
}

export function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [sort, setSort] = useState('name')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyProductForm())

  useEffect(() => {
    fetchProducts().then(setItems)
  }, [])

  const filteredItems = useMemo(() => {
    const search = query.toLowerCase()
    const result = items.filter((product) => {
      const matchText = !search || [product.name, product.sku, product.category].join(' ').toLowerCase().includes(search)
      const matchCategory = !category || product.category === category
      const matchState = !stateFilter || getProductState(product) === stateFilter
      return matchText && matchCategory && matchState
    })

    result.sort((a, b) => {
      switch (sort) {
        case 'ref':
          return a.sku.localeCompare(b.sku)
        case 'price':
          return b.price - a.price
        case 'stock':
          return b.stock - a.stock
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [items, query, category, stateFilter, sort])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyProductForm())
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock,
      measures: product.measures,
      presentation: product.presentation,
      colors: product.colors,
      description: product.description,
      status: product.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.sku || !form.category || form.price <= 0 || form.stock < 0) {
      return
    }

    if (editingId !== null) {
      const updated = await updateProduct(editingId, { ...form })
      setItems((current) => current.map((item) => (item.id === editingId ? updated : item)))
    } else {
      const created = await createProduct(form)
      setItems((current) => [created, ...current])
    }
    setModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    await deleteProduct(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const handleExport = () => {
    const rows = [
      ['Producto', 'Categoría', 'Precio', 'Stock', 'Estado'],
      ...filteredItems.map((product) => [
        product.name,
        product.category,
        String(product.price),
        String(product.stock),
        getProductState(product) === 'success' ? 'En stock' : getProductState(product) === 'warning' ? 'Stock bajo' : 'Sin stock',
      ]),
    ]

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = 'productos-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Todos los productos</div>
        <div className="button-row">
          <button className="btn-outline" type="button" onClick={handleExport}>
            <i className="ti ti-download" /> Exportar
          </button>
          <button className="btn-primary" type="button" onClick={openCreate}>
            <i className="ti ti-plus" /> Nuevo producto
          </button>
        </div>
      </div>

      <div className="filters-row">
        <input
          type="text"
          className="form-input small"
          placeholder="Buscar producto…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="form-input small" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Todas las categorías</option>
          <option value="Veladora">Veladora</option>
          <option value="Veladora Especial">Veladora Especial</option>
          <option value="Pebetero">Pebetero</option>
          <option value="Vela Lisa">Vela Lisa</option>
          <option value="Vela Acanalada">Vela Acanalada</option>
          <option value="Vela Aromatizada">Vela Aromatizada</option>
          <option value="Vela Personalizada">Vela Personalizada</option>
          <option value="Parafina">Parafina</option>
        </select>
        <select className="form-input small" value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
          <option value="">Todos los estados</option>
          <option value="success">En stock</option>
          <option value="danger">Sin stock</option>
          <option value="warning">Stock bajo</option>
        </select>
        <select className="form-input small" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="name">Ordenar: nombre A-Z</option>
          <option value="ref">Ordenar: referencia</option>
          <option value="price">Ordenar: precio ↑</option>
          <option value="stock">Ordenar: stock ↓</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Disponibilidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((product) => {
              const state = getProductState(product)
              const stockPercent = getStockBarPercent(product)
              return (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb">🕯️</div>
                      <div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-sku">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{product.category}</span></td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <div className="stock-meter-wrap">
                      <div className="stock-meter-label">
                        <span>{product.stock}</span>
                        <small>{product.minStock} mín.</small>
                      </div>
                      <div className="stock-meter">
                        <span
                          className={`stock-fill ${state}`}
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>{product.stock > product.minStock ? 'Disponible' : 'Bajo mínimo'}</td>
                  <td>
                    <span className={`badge ${stateClass(state)}`}>
                      {state === 'success' ? 'En stock' : state === 'warning' ? 'Stock bajo' : 'Sin stock'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" className="icon-btn ghost" onClick={() => openEdit(product)}>
                        <i className="ti ti-edit" />
                      </button>
                      <button type="button" className="icon-btn ghost danger" onClick={() => handleDelete(product.id)}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">{editingId !== null ? 'Editar producto' : 'Nuevo producto'}</div>
            <form onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Referencia *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.sku}
                    onChange={(event) => setForm({ ...form, sku: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select className="form-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    <option value="Veladora">Veladora</option>
                    <option value="Veladora Especial">Veladora Especial</option>
                    <option value="Pebetero">Pebetero</option>
                    <option value="Vela Lisa">Vela Lisa</option>
                    <option value="Vela Acanalada">Vela Acanalada</option>
                    <option value="Vela Aromatizada">Vela Aromatizada</option>
                    <option value="Vela Personalizada">Vela Personalizada</option>
                    <option value="Parafina">Parafina</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio ($) *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock inicial *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={form.stock}
                    onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock mínimo</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={form.minStock}
                    onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Medidas</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.measures}
                    onChange={(event) => setForm({ ...form, measures: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Presentación</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.presentation}
                    onChange={(event) => setForm({ ...form, presentation: event.target.value })}
                  />
                </div>
                <div className="form-group full-span">
                  <label className="form-label">Colores</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.colors}
                    onChange={(event) => setForm({ ...form, colors: event.target.value })}
                  />
                </div>
                <div className="form-group full-span">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-input textarea"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  <i className="ti ti-check" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
