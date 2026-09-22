interface ProductFiltersProps {
  query: string
  category: string
  stateFilter: string
  sort: string
  categories: string[]
  onQueryChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStateChange: (value: string) => void
  onSortChange: (value: string) => void
}

export function ProductFilters({
  query,
  category,
  stateFilter,
  sort,
  categories,
  onQueryChange,
  onCategoryChange,
  onStateChange,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <div className="filters-row">
      <div style={{ flex: '1 1 240px', position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nombre, SKU o color..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <select className="form-input small" style={{ width: 'auto' }} value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        {categories.map((c) => (
          <option key={c} value={c === 'Todas' ? '' : c}>
            {c}
          </option>
        ))}
      </select>

      <select className="form-input small" style={{ width: 'auto' }} value={stateFilter} onChange={(e) => onStateChange(e.target.value)}>
        <option value="">Todos los estados</option>
        <option value="success">En stock óptimo</option>
        <option value="warning">Stock bajo</option>
        <option value="danger">Agotado</option>
      </select>

      <select className="form-input small" style={{ width: 'auto' }} value={sort} onChange={(e) => onSortChange(e.target.value)}>
        <option value="name">Ordenar: Nombre</option>
        <option value="ref">Ordenar: Referencia</option>
        <option value="price">Ordenar: Mayor precio</option>
        <option value="stock">Ordenar: Mayor stock</option>
      </select>
    </div>
  )
}
