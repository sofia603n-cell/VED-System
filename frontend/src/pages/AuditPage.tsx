import { useEffect, useMemo, useState } from 'react'
import { fetchAudit } from '../api/mockApi'
import type { AuditEntry } from '../types'

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('Todos')

  useEffect(() => {
    fetchAudit().then(setEntries)
  }, [])

  const modules = useMemo(() => ['Todos', ...new Set(entries.map((entry) => entry.module))], [entries])

  const filteredEntries = useMemo(() => {
    const search = query.trim().toLowerCase()
    return entries.filter((entry) => {
      const inModule = moduleFilter === 'Todos' || entry.module === moduleFilter
      const inSearch = !search || [entry.user, entry.action, entry.module, entry.date].join(' ').toLowerCase().includes(search)
      return inModule && inSearch
    })
  }, [entries, moduleFilter, query])

  const totalActions = entries.length
  const todayChanges = entries.filter((entry) => entry.date.includes('2026-08')).length
  const inventoryChanges = entries.filter((entry) => entry.module === 'Inventario').length
  const moduleStats = useMemo(
    () =>
      Array.from(
        entries.reduce((acc, entry) => {
          acc.set(entry.module, (acc.get(entry.module) ?? 0) + 1)
          return acc
        }, new Map<string, number>())
      ).sort((a, b) => b[1] - a[1]),
    [entries]
  )

  return (
    <>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Movimientos</div>
          <div className="metric-value">{totalActions}</div>
          <div className="metric-sub"><span className="delta-up"><i className="ti ti-activity" /></span> Registros activos</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Hoy</div>
          <div className="metric-value">{todayChanges}</div>
          <div className="metric-sub"><span className="delta-up"><i className="ti ti-calendar-time" /></span> Cambios del día</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Inventario</div>
          <div className="metric-value">{inventoryChanges}</div>
          <div className="metric-sub"><span className="delta-down"><i className="ti ti-box" /></span> Ajustes de stock</div>
        </div>
      </div>

      <div className="audit-summary-grid">
        <div className="audit-summary-card">
          <div className="audit-summary-card__head">
            <span>Actividad</span>
            <i className="ti ti-wave-sine" />
          </div>
          <strong>{totalActions}</strong>
          <small>Movimientos registrados</small>
        </div>
        <div className="audit-summary-card success">
          <div className="audit-summary-card__head">
            <span>Máximo</span>
            <i className="ti ti-check" />
          </div>
          <strong>{moduleStats[0]?.[1] ?? 0}</strong>
          <small>Por módulo</small>
        </div>
        <div className="audit-summary-card warning compact-card">
          <div className="audit-summary-card__head">
            <span>Estado</span>
            <i className="ti ti-shield-check" />
          </div>
          <strong>Estable</strong>
          <small>Sin alertas críticas</small>
        </div>
      </div>

      <div className="filters-row users-filter-row audit-filters">
        <input
          type="text"
          className="form-input small"
          placeholder="Buscar usuario, acción o fecha…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="form-input small" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
          {modules.map((module) => (
            <option key={module} value={module}>{module}</option>
          ))}
        </select>
      </div>

      <div className="audit-layout">
        <div className="table-card">
          <div className="card-header compact">
            <div>
              <div className="card-title">Historial de auditoría</div>
              <div className="card-sub">Seguimiento de acciones del sistema</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Módulo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div className="audit-user-cell">
                      <span className="audit-avatar">{entry.user.slice(0, 2).toUpperCase()}</span>
                      {entry.user}
                    </div>
                  </td>
                  <td><span className="audit-pill">{entry.action}</span></td>
                  <td><span className="audit-module">{entry.module}</span></td>
                  <td>{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="audit-side-panel">
          <div className="mini-panel accent">
            <div className="mini-panel-header">
              <span>Top módulos</span>
              <i className="ti ti-layout-grid" />
            </div>
            <div className="audit-module-list">
              {moduleStats.slice(0, 3).map(([module, count]) => (
                <div key={module} className="audit-module-row">
                  <span>{module}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mini-panel neutral">
            <div className="mini-panel-header">
              <span>Última revisión</span>
              <i className="ti ti-clock" />
            </div>
            <div className="mini-panel-value">03:20 PM</div>
            <small>Sin incidentes críticos detectados</small>
          </div>
        </div>
      </div>
    </>
  )
}
