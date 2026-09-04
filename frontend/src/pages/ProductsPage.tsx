import { useEffect, useMemo, useState } from 'react'
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../api/mockApi'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { useToast } from '../context/ToastContext'
import type { Product, ProductForm } from '../types'
import { formatCurrency, getProductState, stateClass } from '../utils/formatters'

function getStockBarPercent(product: Pick<Product, 'stock' | 'minStock'>) {
  if (product.stock <= 0) return 0
  const reference = Math.max(product.minStock * 2, 12)
  return Math.min(100, Math.max(10, (product.stock / reference) * 100))
}

function emptyProductForm(): ProductForm {
  return {
    name: '',
    sku: '',
    category: 'Velas',
    price: 0,
    stock: 0,
    minStock: 10,
    measures: '8x15 cm',
    presentation: 'unidad',
    colors: 'Dorado',
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyProductForm())
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const { success, warning, info } = useToast()

  useEffect(() => {
    fetchProducts().then(setItems)
  }, [])

  const categories = useMemo(() => {
    const list = items.map((p) => p.category).filter(Boolean)
    return ['Todas', ...Array.from(new Set(list))]
  }, [items])

  const filteredItems = useMemo(() => {
    const search = query.toLowerCase()
    const result = items.filter((product) => {
      const matchText = !search || [product.name, product.sku, product.category, product.colors].join(' ').toLowerCase().includes(search)
      const matchCategory = !category || category === 'Todas' || product.category === category
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
    const nextSku = `VEL-${items.length + 1}`
    setForm({ ...emptyProductForm(), sku: nextSku })
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
      success(`"${form.name}" actualizado con éxito`, 'Producto Guardado')
    } else {
      const created = await createProduct(form)
      setItems((current) => [created, ...current])
      success(`"${form.name}" agregado al catálogo`, 'Nuevo Producto')
    }
    setModalOpen(false)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return
    await deleteProduct(productToDelete.id)
    setItems((current) => current.filter((item) => item.id !== productToDelete.id))
    warning(`"${productToDelete.name}" fue eliminado del catálogo`, 'Producto Eliminado')
    setProductToDelete(null)
  }

  const handleExport = () => {
    const rows = [
      ['Referencia / SKU', 'Producto', 'Categoría', 'Color', 'Precio (COP)', 'Stock Actual', 'Stock Mínimo', 'Estado'],
      ...filteredItems.map((product) => [
        product.sku,
        product.name,
        product.category,
        product.colors,
        String(product.price),
        String(product.stock),
        String(product.minStock),
        getProductState(product) === 'success' ? 'En stock' : getProductState(product) === 'warning' ? 'Stock bajo' : 'Sin stock',
      ]),
    ]

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `catalogo_velas_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    info('Catálogo exportado en formato CSV', 'Descarga Completa')
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Catálogo de Velas & Aromas</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Mostrando {filteredItems.length} de {items.length} productos registrados
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="view-switcher" aria-label="Cambiar vista">
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula de velas"
            >
              <i className="ti ti-layout-grid" />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista de tabla detallada"
            >
              <i className="ti ti-table" />
            </button>
          </div>

          <button className="btn-outline" type="button" onClick={handleExport}>
            <i className="ti ti-download" /> Exportar CSV
          </button>
          <button className="btn-primary" type="button" onClick={openCreate}>
            <i className="ti ti-plus" /> Nueva Vela
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="filters-row">
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombre, SKU o color..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          className="form-input small"
          style={{ width: 'auto' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c === 'Todas' ? '' : c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="form-input small"
          style={{ width: 'auto' }}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="success">En stock óptimo</option>
          <option value="warning">Stock bajo</option>
          <option value="danger">Agotado</option>
        </select>

        <select
          className="form-input small"
          style={{ width: 'auto' }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Ordenar: Nombre</option>
          <option value="ref">Ordenar: Referencia</option>
          <option value="price">Ordenar: Mayor precio</option>
          <option value="stock">Ordenar: Mayor stock</option>
        </select>
      </div>

      {/* Vista de Cuadrícula (Grid) */}
      {viewMode === 'grid' ? (
        <div className="product-grid">
          {filteredItems.map((product) => {
            const state = getProductState(product)
            const stockPct = getStockBarPercent(product)

            return (
              <div key={product.id} className="product-card">
                <div>
                  <div className="product-card-head">
                    <div className="product-card-thumb">🕯️</div>
                    <span className={`badge ${stateClass(state)}`}>
                      {state === 'success' ? 'En stock' : state === 'warning' ? 'Stock bajo' : 'Agotado'}
                    </span>
                  </div>

                  <h3 className="product-card-title">{product.name}</h3>
                  <div className="product-card-desc">{product.description || 'Vela artesanal de alta calidad.'}</div>

                  <div className="product-card-meta">
                    <span className="badge badge-neutral">
                      <i className="ti ti-tag" /> {product.category}
                    </span>
                    {product.colors && (
                      <span className="badge badge-neutral">
                        <i className="ti ti-color-swatch" /> {product.colors}
                      </span>
                    )}
                    <span className="product-sku">{product.sku}</span>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>Existencias: <strong>{product.stock}</strong> unid.</span>
                      <span>Mínimo: {product.minStock}</span>
                    </div>
                    <div className="stock-bar-wrap">
                      <div
                        className={`stock-bar-fill ${state === 'success' ? 'healthy' : state === 'warning' ? 'warning' : 'critical'}`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="product-card-foot">
                  <div className="product-price">{formatCurrency(product.price)}</div>
                  <div className="product-actions-btn">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => openEdit(product)}
                      title="Editar producto"
                    >
                      <i className="ti ti-edit" />
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn delete"
                      onClick={() => setProductToDelete(product)}
                      title="Eliminar producto"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Vista de Tabla (Table) */
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Vela / Referencia</th>
                <th>Línea</th>
                <th>Color</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((product) => {
                const state = getProductState(product)
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
                    <td>{product.colors || 'Natural'}</td>
                    <td><strong style={{ color: 'var(--gold)' }}>{formatCurrency(product.price)}</strong></td>
                    <td>
                      <strong>{product.stock}</strong> / <span style={{ color: 'var(--text-dim)' }}>{product.minStock}</span>
                    </td>
                    <td>
                      <span className={`badge ${stateClass(state)}`}>
                        {state === 'success' ? 'En stock' : state === 'warning' ? 'Stock bajo' : 'Agotado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => openEdit(product)}
                          title="Editar producto"
                        >
                          <i className="ti ti-edit" />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn delete"
                          onClick={() => setProductToDelete(product)}
                          title="Eliminar producto"
                        >
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
      )}

      {/* Modal de Crear / Editar Producto */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Vela' : 'Registrar Nueva Vela'}</h3>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre del producto *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ej. Vela Árabe Dorada"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Referencia / SKU *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ej. VEL-01"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select
                      className="form-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="Velas">Velas Clásicas</option>
                      <option value="Aromáticas">Aromáticas & Esencias</option>
                      <option value="Navideñas">Navideñas & Temporada</option>
                      <option value="Decorativas">Decorativas</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Color *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ej. Blanco, Dorado, Miel"
                      value={form.colors}
                      onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Precio de venta (COP) *</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      className="form-input"
                      placeholder="ej. 35000"
                      value={form.price || ''}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Presentación *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ej. Unidad, Paquete x 6"
                      value={form.presentation}
                      onChange={(e) => setForm({ ...form, presentation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Stock actual *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock mínimo (alerta) *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={form.minStock}
                      onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción o notas del producto</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Detalles sobre cera, mecha, aroma y presentación..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <i className="ti ti-device-floppy" /> {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={productToDelete !== null}
        danger
        title="¿Eliminar este producto?"
        message={`Esta acción eliminará "${productToDelete?.name}" (${productToDelete?.sku}) del catálogo. ¿Deseas continuar?`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </>
  )
}
