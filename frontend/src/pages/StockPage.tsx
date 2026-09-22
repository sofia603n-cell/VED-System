import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStock } from '../api/mockApi'
import { StockFilters } from '../components/stock/StockFilters'
import { StockSummary } from '../components/stock/StockSummary'
import { StockTable } from '../components/stock/StockTable'
import { useToast } from '../context/ToastContext'
import type { StockItem } from '../types'

export function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [alertFilter, setAlertFilter] = useState('')
  const { info } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchStock().then(setItems)
  }, [])

  const categories = useMemo(() => ['Todas', ...new Set(items.map((item) => item.category))], [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase().trim()
      const itemSku = item.sku || `VEL-${item.id}`
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || itemSku.toLowerCase().includes(q)
      const matchesCategory = !category || category === 'Todas' || item.category === category
      const matchesAlert = !alertFilter || (alertFilter === 'bajo' ? item.stock <= item.minStock : item.stock > item.minStock)

      return matchesSearch && matchesCategory && matchesAlert
    })
  }, [items, search, category, alertFilter])

  const alertCount = items.filter((item) => item.stock <= item.minStock).length
  const totalStock = items.reduce((sum, item) => sum + item.stock, 0)
  const healthyStock = items.filter((item) => item.stock > item.minStock).length
  const criticalStock = items.filter((item) => item.stock <= item.minStock).length

  const handleExportStock = () => {
    const rows = [
      ['Referencia', 'Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Diferencial', 'Estado'],
      ...filteredItems.map((item) => [
        item.sku || `VEL-${item.id}`,
        item.name,
        item.category,
        String(item.stock),
        String(item.minStock),
        String(item.stock - item.minStock),
        item.stock <= item.minStock ? 'CRÍTICO / REVISAR' : 'ÓPTIMO',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `control_stock_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    info('Reporte de existencias descargado en CSV', 'Descarga Completa')
  }

  return (
    <>
      <StockSummary totalStock={totalStock} healthyStock={healthyStock} criticalStock={criticalStock} />

      {alertCount > 0 && (
        <div className="alert-bar">
          <i className="ti ti-alert-triangle" style={{ fontSize: '1.25rem' }} />
          <span>
            Atención: Hay <strong>{alertCount}</strong> productos en o por debajo del stock de seguridad.
          </span>
        </div>
      )}

      <StockFilters
        search={search}
        category={category}
        alertFilter={alertFilter}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onAlertFilterChange={setAlertFilter}
        onExport={handleExportStock}
      />

      <StockTable
        items={filteredItems}
        onEdit={(item) => navigate('/productos', { state: { editProductId: item.id } })}
      />
    </>
  )
}
