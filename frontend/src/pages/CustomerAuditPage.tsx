import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCustomerAudit } from '../api/mockApi'
import { CustomerAuditFilters, CustomerAuditHeader, CustomerAuditMetrics, CustomerAuditTable } from '../components/customerAudit/CustomerAuditBlocks'
import { useToast } from '../context/ToastContext'
import type { CustomerAuditEntry } from '../types'

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

  return <>
    <CustomerAuditHeader loading={loading} canExport={Boolean(filteredCustomers.length)} onExport={exportCsv} />
    <CustomerAuditMetrics registered={registered} active={active} orders={totalOrders} />
    <CustomerAuditFilters query={query} status={status} loading={loading} onQuery={setQuery} onStatus={setStatus} onReload={() => void loadCustomers()} />
    <CustomerAuditTable customers={filteredCustomers} loading={loading} />
  </>
}
