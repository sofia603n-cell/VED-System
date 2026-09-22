interface StockFiltersProps {
  search: string
  category: string
  alertFilter: string
  categories: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onAlertFilterChange: (value: string) => void
  onExport: () => void
}

export function StockFilters({
  search,
  category,
  alertFilter,
  categories,
  onSearchChange,
  onCategoryChange,
  onAlertFilterChange,
  onExport,
}: StockFiltersProps) {
  return (
    <div className="section-header">
      <div className="filters-row" style={{ flex: 1 }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '280px' }}
          placeholder="Buscar referencia o vela..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <select
          className="form-input small"
          style={{ width: 'auto' }}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
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
          value={alertFilter}
          onChange={(e) => onAlertFilterChange(e.target.value)}
        >
          <option value="">Todas las alertas</option>
          <option value="bajo">Solo bajo mínimo</option>
          <option value="ok">Solo estables</option>
        </select>
      </div>

      <button type="button" className="btn-outline" onClick={onExport}>
        <i className="ti ti-download" /> Exportar Inventario
      </button>
    </div>
  )
}
