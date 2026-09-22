import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createProduct, deleteProduct, fetchColors, fetchProducts, fetchReferences, updateProduct } from '../api/mockApi'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { ProductFilters } from '../components/products/ProductFilters'
import { ProductFormModal } from '../components/products/ProductFormModal'
import { ProductGrid } from '../components/products/ProductGrid'
import { ProductHeader } from '../components/products/ProductHeader'
import { ProductReferences } from '../components/products/ProductReferences'
import { ProductTable } from '../components/products/ProductTable'
import { useToast } from '../context/ToastContext'
import type { CatalogOption, Product, ProductForm } from '../types'
import { getProductState } from '../utils/formatters'

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
  const location = useLocation()
  const navigate = useNavigate()
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
  const [colors, setColors] = useState<CatalogOption[]>([])
  const [references, setReferences] = useState<CatalogOption[]>([])
  const [saving, setSaving] = useState(false)
  const [pageTab, setPageTab] = useState<'catalogo' | 'referencias'>('catalogo')

  const { success, warning, info } = useToast()

  useEffect(() => {
    const editProductId = (location.state as { editProductId?: unknown } | null)?.editProductId
    if (!Number.isInteger(editProductId)) return

    const product = items.find((item) => item.id === editProductId)
    if (!product) return

    openEdit(product)
    navigate(location.pathname, { replace: true, state: null })
  }, [items, location.pathname, location.state, navigate])

  useEffect(() => {
    void Promise.all([fetchProducts(), fetchColors(), fetchReferences()]).then(([products, availableColors, availableReferences]) => {
      setItems(products)
      setColors(availableColors)
      setReferences(availableReferences)
    })
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
    setForm({ ...emptyProductForm(), sku: nextSku, colorId: colors[0]?.id, colors: colors[0]?.name || '', referenceId: references[0]?.id, category: references[0]?.name || '' })
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
      colorId: product.colorId,
      referenceId: product.referenceId,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.colorId || !form.referenceId || form.price < 0 || form.stock < 0 || form.minStock < 0) {
      warning('Completa los campos obligatorios y selecciona valores válidos.', 'Revisa el formulario')
      return
    }

    setSaving(true)
    try {
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
    } catch (caught) {
      warning(caught instanceof Error ? caught.message : 'No fue posible guardar el producto.', 'Error al guardar')
    } finally {
      setSaving(false)
    }
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
      <ProductHeader
        pageTab={pageTab}
        viewMode={viewMode}
        productCount={filteredItems.length}
        totalProducts={items.length}
        referenceCount={references.length}
        onTabChange={setPageTab}
        onViewChange={setViewMode}
        onExport={handleExport}
        onCreate={openCreate}
      />

      {pageTab === 'referencias' ? (
        <ProductReferences references={references} products={items} />
      ) : (
        <>
          <ProductFilters
            query={query}
            category={category}
            stateFilter={stateFilter}
            sort={sort}
            categories={categories}
            onQueryChange={setQuery}
            onCategoryChange={setCategory}
            onStateChange={setStateFilter}
            onSortChange={setSort}
          />

          {viewMode === 'grid' ? (
            <ProductGrid items={filteredItems} onEdit={openEdit} onDelete={setProductToDelete} />
          ) : (
            <ProductTable items={filteredItems} onEdit={openEdit} onDelete={setProductToDelete} />
          )}
        </>
      )}

      <ProductFormModal open={isModalOpen} editing={editingId !== null} saving={saving} form={form} colors={colors} references={references} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} onChange={setForm} />

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
