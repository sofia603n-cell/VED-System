import type { SalesFunnelData } from '../../types'
import { formatCurrency } from '../../utils/formatters'

const CHANNEL_LABELS: Record<string, string> = {
  persona: 'Presencial',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
}

export function FunnelBoard({ data }: { data: SalesFunnelData }) {
  const maxCount = Math.max(...data.stages.map((stage) => stage.count), 1)
  const maxChannel = Math.max(...data.channels.map((channel) => channel.orders), 1)

  return (
    <div className="funnel-layout">
      <div className="stock-summary-grid">
        <div className="stock-summary-card primary">
          <div className="summary-label">Pedidos en el embudo</div>
          <div className="summary-value">{data.totalOrders}</div>
          <div className="summary-foot">Leídos desde /pedidos y /reportes</div>
        </div>
        <div className="stock-summary-card success">
          <div className="summary-label">Monto asociado</div>
          <div className="summary-value" style={{ color: 'var(--gold)' }}>
            {formatCurrency(data.totalAmount)}
          </div>
          <div className="summary-foot">Ventas y pedidos registrados</div>
        </div>
        <div className="stock-summary-card warning">
          <div className="summary-label">Canales activos</div>
          <div className="summary-value">{data.channels.length}</div>
          <div className="summary-foot">Persona, Facebook y WhatsApp</div>
        </div>
      </div>

      <div className="funnel-grid">
        <section className="table-card funnel-card">
          <div className="funnel-card-head">
            <h3>Embudo de pedidos</h3>
            <p>Pendiente → Alistamiento → Entregado, según el estado del backend.</p>
          </div>
          <div className="funnel-stages">
            {data.stages.map((stage, index) => {
              const width = 100 - index * 16
              const fill = Math.max(12, (stage.count / maxCount) * 100)
              return (
                <div key={stage.key} className="funnel-stage" style={{ width: `${width}%` }}>
                  <div className="funnel-stage-meta">
                    <strong>{stage.label}</strong>
                    <span>
                      {stage.count} pedidos · {formatCurrency(stage.amount)}
                    </span>
                  </div>
                  <div className="stock-bar-wrap funnel-stage-bar">
                    <div className={`stock-bar-fill ${index === 2 ? 'healthy' : index === 1 ? 'warning' : 'critical'}`} style={{ width: `${fill}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="table-card funnel-card">
          <div className="funnel-card-head">
            <h3>Entrada por canal</h3>
            <p>Conectado a /reportes/ventas-por-canal cuando el API está disponible.</p>
          </div>
          <div className="funnel-channels">
            {data.channels.length === 0 ? (
              <p className="funnel-empty">Aún no hay pedidos por canal.</p>
            ) : (
              data.channels.map((channel) => {
                const pct = Math.round((channel.orders / maxChannel) * 100)
                return (
                  <div key={channel.canal} className="funnel-channel">
                    <div className="funnel-channel-row">
                      <strong>{CHANNEL_LABELS[channel.canal] || channel.canal}</strong>
                      <span>{channel.orders} pedidos · {pct}%</span>
                    </div>
                    <div className="stock-bar-wrap">
                      <div className="stock-bar-fill healthy" style={{ width: `${Math.max(8, pct)}%` }} />
                    </div>
                    <small>
                      {channel.sales} ventas · {formatCurrency(channel.amount)}
                    </small>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
