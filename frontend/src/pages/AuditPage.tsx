import { useEffect, useMemo, useState } from 'react'
import { fetchAudit } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
import { useToast } from '../context/ToastContext'
import type { AuditEntry } from '../types'

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('Todos')
  const { info } = useToast()

  useEffect(() => {
    fetchAudit().then(setEntries)
  }, [])

  const modules = useMemo(() => ['Todos', ...new Set(entries.map((entry) => entry.module))], [entries])

  const filteredEntries = useMemo(() => {
    const search = query.trim().toLowerCase()
    return entries.filter((entry) => {
      const inModule = moduleFilter === 'Todos' || entry.module === moduleFilter
      const inSearch =
        !search || [entry.user, entry.action, entry.module, entry.date].join(' ').toLowerCase().includes(search)
      return inModule && inSearch
    })
  }, [entries, moduleFilter, query])

  const totalActions = entries.length
  const inventoryChanges = entries.filter((entry) => entry.module === 'Inventario').length
  const salesChanges = entries.filter((entry) => entry.module === 'Ventas').length

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Fecha y Hora', 'Usuario Responsable', 'Módulo', 'Acción Realizada'],
      ...filteredEntries.map((e) => [
        `#${e.id}`,
        e.date,
        e.user,
        e.module,
        e.action,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `auditoria_sistema_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    info('Bitácora de auditoría exportada a CSV', 'Descarga Completa')
  }

  const getActionBadge = (action: string) => {
    const lower = action.toLowerCase()
    if (lower.includes('elimin') || lower.includes('borr') || lower.includes('cancel')) {
      return { class: 'badge-danger', icon: 'ti-trash' }
    }
    if (lower.includes('cre') || lower.includes('registr') || lower.includes('nuev') || lower.includes('agreg')) {
      return { class: 'badge-success', icon: 'ti-plus' }
    }
    if (lower.includes('actualiz') || lower.includes('modific') || lower.includes('edit')) {
      return { class: 'badge-warning', icon: 'ti-edit' }
    }
    return { class: 'badge-neutral', icon: 'ti-activity' }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Auditoría & Trazabilidad</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Registro inmutable de todas las operaciones realizadas en la plataforma
          </span>
        </div>
        <button type="button" className="btn-outline" onClick={handleExportCSV}>
          <i className="ti ti-download" /> Exportar Auditoría (CSV)
        </button>
      </div>

      {/* Métricas de Auditoría */}
      <div className="metrics-grid">
        <MetricCard
          metric={{
            label: 'Eventos Registrados',
            value: String(totalActions),
            subtext: 'Trazabilidad completa',
            trendType: 'delta-up',
            icon: 'ti-activity',
          }}
        />
        <MetricCard
          metric={{
            label: 'Movimientos de Stock',
            value: String(inventoryChanges),
            subtext: 'En inventario y almacén',
            trendType: 'delta-up',
            icon: 'ti-package',
          }}
        />
        <MetricCard
          metric={{
            label: 'Transacciones Comerciales',
            value: String(salesChanges),
            subtext: 'En módulo de ventas',
            trendType: 'delta-up',
            icon: 'ti-receipt',
          }}
        />
      </div>

      {/* Filtros */}
      <div className="filters-row">
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '340px' }}
          placeholder="Buscar por usuario, acción, fecha..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="form-input small"
          style={{ width: 'auto' }}
          value={moduleFilter}
          onChange={(event) => setModuleFilter(event.target.value)}
        >
          {modules.map((module) => (
            <option key={module} value={module}>
              Módulo: {module}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Registros */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Módulo</th>
              <th>Acción Realizada</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
              const badge = getActionBadge(entry.action)
              return (
                <tr key={entry.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                      #{entry.id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {entry.date}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        className="user-avatar"
                        style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}
                      >
                        {entry.user.slice(0, 2).toUpperCase()}
                      </div>
                      <strong>{entry.user}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{entry.module}</span>
                  </td>
                  <td>
                    <span className={`badge ${badge.class}`} style={{ display: 'inline-flex', gap: '6px' }}>
                      <i className={`ti ${badge.icon}`} /> {entry.action}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
