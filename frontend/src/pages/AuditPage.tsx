import { useEffect, useMemo, useState } from 'react'
import { fetchAudit } from '../api/mockApi'
import { AuditFilters, AuditHeader, AuditMetrics, AuditTable } from '../components/audit/AuditBlocks'
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

  return <>
    <AuditHeader onExport={handleExportCSV} />
    <AuditMetrics total={totalActions} inventory={inventoryChanges} sales={salesChanges} />
    <AuditFilters query={query} moduleFilter={moduleFilter} modules={modules} onQuery={setQuery} onModule={setModuleFilter} />
    <AuditTable entries={filteredEntries} getBadge={getActionBadge} />
  </>
}
