import { useState } from 'react'

export interface StatsBarPoint {
  label: string
  damaged: number // cuántas se dañaron
  sold: number    // cuántas se vendieron
  orders: number  // cuántos pedidos se hicieron
}

interface StatsBarChartProps {
  data: StatsBarPoint[]
  title?: string
  subtitle?: string
}

export function StatsBarChart({
  data,
  title = 'Estadísticas de Operación y Ventas',
  subtitle = 'Comparativa de unidades dañadas, unidades vendidas y pedidos realizados',
}: StatsBarChartProps) {
  const [activeLabel, setActiveLabel] = useState<string | null>(data[data.length - 1]?.label ?? null)

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.damaged, d.sold, d.orders]),
    5
  )

  const totals = data.reduce(
    (acc, d) => ({
      damaged: acc.damaged + d.damaged,
      sold: acc.sold + d.sold,
      orders: acc.orders + d.orders,
    }),
    { damaged: 0, sold: 0, orders: 0 }
  )

  const activePoint = data.find((d) => d.label === activeLabel) ?? data[data.length - 1]

  return (
    <div className="chart-card stats-bar-card">
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti ti-chart-bar" style={{ color: 'var(--gold)' }} />
            {title}
          </div>
          <div className="card-sub">{subtitle}</div>
        </div>

        {/* Resumen Total Rápido */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
            Dañadas: <strong style={{ color: '#ef4444' }}>{totals.damaged}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#d4af37' }} />
            Vendidas: <strong style={{ color: 'var(--gold)' }}>{totals.sold}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
            Pedidos: <strong style={{ color: '#10b981' }}>{totals.orders}</strong>
          </span>
        </div>
      </div>

      {/* Tooltip o Resumen del Período Seleccionado */}
      {activePoint && (
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            marginBottom: '16px',
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            <i className="ti ti-calendar" style={{ marginRight: '6px', color: 'var(--primary-light)' }} />
            {activePoint.label}
          </span>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>
            <i className="ti ti-alert-triangle" style={{ marginRight: '4px' }} />
            {activePoint.damaged} unidades dañadas
          </span>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
            <i className="ti ti-flame" style={{ marginRight: '4px' }} />
            {activePoint.sold} unidades vendidas
          </span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>
            <i className="ti ti-shopping-cart" style={{ marginRight: '4px' }} />
            {activePoint.orders} pedidos realizados
          </span>
        </div>
      )}

      {/* Gráfico de Barras Agrupadas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          height: '240px',
          padding: '10px 0 30px 0',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          gap: '12px',
        }}
      >
        {/* Líneas Guía de Fondo */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '30px',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            opacity: 0.15,
          }}
        >
          <div style={{ borderTop: '1px dashed var(--text-dim)', width: '100%' }} />
          <div style={{ borderTop: '1px dashed var(--text-dim)', width: '100%' }} />
          <div style={{ borderTop: '1px dashed var(--text-dim)', width: '100%' }} />
        </div>

        {data.map((point) => {
          const isSelected = point.label === activePoint?.label
          const hDamaged = Math.max(point.damaged > 0 ? 6 : 0, (point.damaged / maxVal) * 190)
          const hSold = Math.max(point.sold > 0 ? 6 : 0, (point.sold / maxVal) * 190)
          const hOrders = Math.max(point.orders > 0 ? 6 : 0, (point.orders / maxVal) * 190)

          return (
            <div
              key={point.label}
              onClick={() => setActiveLabel(point.label)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                opacity: isSelected ? 1 : 0.75,
                transition: 'all 0.2s ease',
              }}
              title={`${point.label}: ${point.damaged} dañadas, ${point.sold} vendidas, ${point.orders} pedidos`}
            >
              {/* Grupo de 3 barras */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '4px',
                  width: '100%',
                  maxWidth: '72px',
                  height: '190px',
                  justifyContent: 'center',
                }}
              >
                {/* Barra Dañadas */}
                <div
                  style={{
                    flex: 1,
                    maxWidth: '20px',
                    height: `${hDamaged}px`,
                    background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    boxShadow: isSelected ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none',
                    position: 'relative',
                  }}
                >
                  {point.damaged > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#ef4444',
                      }}
                    >
                      {point.damaged}
                    </span>
                  )}
                </div>

                {/* Barra Vendidas */}
                <div
                  style={{
                    flex: 1,
                    maxWidth: '20px',
                    height: `${hSold}px`,
                    background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    boxShadow: isSelected ? '0 0 8px rgba(212, 175, 55, 0.5)' : 'none',
                    position: 'relative',
                  }}
                >
                  {point.sold > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--gold)',
                      }}
                    >
                      {point.sold}
                    </span>
                  )}
                </div>

                {/* Barra Pedidos */}
                <div
                  style={{
                    flex: 1,
                    maxWidth: '20px',
                    height: `${hOrders}px`,
                    background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    boxShadow: isSelected ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                    position: 'relative',
                  }}
                >
                  {point.orders > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#10b981',
                      }}
                    >
                      {point.orders}
                    </span>
                  )}
                </div>
              </div>

              {/* Etiqueta del período */}
              <span
                style={{
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--gold)' : 'var(--text-dim)',
                  textAlign: 'center',
                }}
              >
                {point.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Leyenda interactiva */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '14px',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #ef4444, #b91c1c)' }} />
          Unidades Dañadas / Defectuosas
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #f59e0b, #b45309)' }} />
          Unidades Vendidas
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #10b981, #047857)' }} />
          Pedidos Realizados
        </span>
      </div>
    </div>
  )
}

