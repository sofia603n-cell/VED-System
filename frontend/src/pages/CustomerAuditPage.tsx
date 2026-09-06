import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCustomerAudit } from '../api/mockApi'
import { MetricCard } from '../components/common/MetricCard'
import { useToast } from '../context/ToastContext'
import type { CustomerAuditEntry } from '../types'
import { formatCurrency } from '../utils/formatters'

function formatDate(value?: string) {
  if (!value) return 'Sin pedidos'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(date)
}

export function CustomerAuditPage() {
  const [customers, setCustomers] = useState<CustomerAuditEntry[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [loading, setLoading] = useState(true)
  const { info, warning } = useToast()

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      setCustomers(await fetchCustomerAudit())
    } catch {
      setCustomers([])
      warning('No se pudo consultar la auditoría de clientes. Puedes intentarlo de nuevo.', 'Consulta no disponible')
    } finally {
      setLoading(false)
    }
  }, [warning])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return customers.filter((customer) => {
      const matchesStatus = status === 'todos' || customer.status === status
      const matchesSearch = !search || [
        customer.name,
        customer.document,
        customer.email,
        customer.phone,
      ].join(' ').toLocaleLowerCase().includes(search)
      return matchesStatus && matchesSearch
    })
  }, [customers, query, status])

  const registered = customers.filter((customer) => customer.registered).length
  const active = customers.filter((customer) => customer.status === 'activo').length
  const totalOrders = customers.reduce((total, customer) => total + customer.orders, 0)

  const exportCsv = () => {
    const rows = [
      ['ID', 'Cliente', 'Documento', 'Correo', 'Teléfono', 'Estado', 'Registrado', 'Pedidos', 'Total comprado', 'Último pedido'],
      ...filteredCustomers.map((customer) => [
        String(customer.id), customer.name, customer.document, customer.email, customer.phone,
        customer.status, customer.registered ? 'Sí' : 'Derivado de pedidos', String(customer.orders),
        String(customer.totalSpent), customer.lastOrderDate || '',
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `auditoria_clientes_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    info('Auditoría de clientes exportada a CSV', 'Descarga completa')
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Auditoría de Clientes</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Clientes registrados, su estado y trazabilidad comercial. Esta vista es solo de consulta.
          </span>
        </div>
        <button type="button" className="btn-outline" onClick={exportCsv} disabled={loading || !filteredCustomers.length}>
          <i className="ti ti-download" /> Exportar CSV
        </button>
      </div>

      <div className="metrics-grid">
        <MetricCard metric={{ label: 'Clientes registrados', value: String(registered), subtext: 'Cuentas con rol cliente', trendType: 'delta-up', icon: 'ti-user-check' }} />
        <MetricCard metric={{ label: 'Clientes activos', value: String(active), subtext: 'Disponibles para pedidos', trendType: 'delta-up', icon: 'ti-users' }} />
        <MetricCard metric={{ label: 'Pedidos asociados', value: String(totalOrders), subtext: 'Trazabilidad comercial', trendType: 'delta-up', icon: 'ti-shopping-bag' }} />
      </div>

      <div className="filters-row">
        <input type="search" className="form-input" style={{ maxWidth: '360px' }} placeholder="Buscar por nombre, documento, correo o teléfono..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="form-input small" style={{ width: 'auto' }} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <button type="button" className="btn-outline" onClick={() => void loadCustomers()} disabled={loading}>
          <i className={`ti ${loading ? 'ti-loader-2' : 'ti-refresh'}`} /> {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead><tr><th>Cliente</th><th>Contacto</th><th>Registro</th><th>Estado</th><th>Pedidos</th><th>Total comprado</th><th>Último pedido</th></tr></thead>
          <tbody>
            {!loading && filteredCustomers.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px' }}>No hay clientes que coincidan con los filtros actuales.</td></tr>
            ) : filteredCustomers.map((customer) => (
              <tr key={`${customer.id}-${customer.name}`}>
                <td><strong>{customer.name}</strong><br /><span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{customer.document}</span></td>
                <td><span>{customer.email}</span><br /><span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{customer.phone}</span></td>
                <td><span className={`badge ${customer.registered ? 'badge-success' : 'badge-neutral'}`}>{customer.registered ? 'Registrado' : 'En pedidos'}</span></td>
                <td><span className={`badge ${customer.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>{customer.status}</span></td>
                <td>{customer.orders}</td>
                <td><strong>{formatCurrency(customer.totalSpent)}</strong></td>
                <td>{formatDate(customer.lastOrderDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
