interface ProductHeaderProps {
  pageTab: 'catalogo' | 'referencias'
  viewMode: 'grid' | 'table'
  productCount: number
  totalProducts: number
  referenceCount: number
  onTabChange: (tab: 'catalogo' | 'referencias') => void
  onViewChange: (view: 'grid' | 'table') => void
  onExport: () => void
  onCreate: () => void
}

export function ProductHeader({
  pageTab,
  viewMode,
  productCount,
  totalProducts,
  referenceCount,
  onTabChange,
  onViewChange,
  onExport,
  onCreate,
}: ProductHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title">Catálogo de Velas & Aromas</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {pageTab === 'catalogo'
            ? `Mostrando ${productCount} de ${totalProducts} productos registrados`
            : `${referenceCount} referencias cargadas desde la base de datos`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="period-pills" role="tablist" aria-label="Catálogo o referencias">
          <button type="button" className={`pill ${pageTab === 'catalogo' ? 'active' : ''}`} onClick={() => onTabChange('catalogo')}>
            Catálogo
          </button>
          <button type="button" className={`pill ${pageTab === 'referencias' ? 'active' : ''}`} onClick={() => onTabChange('referencias')}>
            Referencias
          </button>
        </div>
        {pageTab === 'catalogo' && (
          <>
            <div className="view-switcher" aria-label="Cambiar vista">
              <button type="button" className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => onViewChange('grid')} title="Vista de cuadrícula de velas">
                <i className="ti ti-layout-grid" />
              </button>
              <button type="button" className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => onViewChange('table')} title="Vista de tabla detallada">
                <i className="ti ti-table" />
              </button>
            </div>
            <button className="btn-outline" type="button" onClick={onExport}>
              <i className="ti ti-download" /> Exportar CSV
            </button>
            <button className="btn-primary" type="button" onClick={onCreate}>
              <i className="ti ti-plus" /> Nueva Vela
            </button>
          </>
        )}
      </div>
    </div>
  )
}
