import { useEffect, useMemo, useState } from 'react'
import { cancelOrder, completeOrder, createOrder, createSale, createUser, fetchPedidos, fetchProducts, fetchSales, fetchSalesFunnel, fetchUsers, updateOrder, type OrderItemInput } from '../api/mockApi'
import { FunnelBoard } from '../components/sales/FunnelBoard'
import { OrdersBoard } from '../components/sales/OrdersBoard'
import { SalesFilters } from '../components/sales/SalesFilters'
import { SalesHeader } from '../components/sales/SalesHeader'
import { SalesSummary } from '../components/sales/SalesSummary'
import { SalesTable } from '../components/sales/SalesTable'
import { OrderFormModal, ReceiptModal, SaleFormModal, type NewCustomerState, type SalesFormState } from '../components/sales/SalesDialogs'
import type { CustomerOrder, Product, Sale, SalesFunnelData, User } from '../types'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../utils/formatters'
import type { SalesTab } from '../components/sales/salesTypes'

interface SaleRecord extends Sale { paymentMethod?: string; quantity?: number; unitPrice?: number }
const emptyCustomer: NewCustomerState = { dni: '', name: '', initials: '', email: '', username: '', password: '', phone: '', address: '', role: 'cliente', estado: 'activo' }

export function SalesPage() {
  const [tab, setTab] = useState<SalesTab>('embudo')
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [funnel, setFunnel] = useState<SalesFunnelData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [isOrderModalOpen, setOrderModalOpen] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null)
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [saving, setSaving] = useState(false)
  const [newCustomer, setNewCustomer] = useState<NewCustomerState>(emptyCustomer)
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([])
  const [form, setForm] = useState<SalesFormState>({ customerId: 0, sellerId: 0, productId: 0, productName: '', quantity: 1, unitPrice: 0, status: 'Pendiente', paymentType: 'Transferencia', paymentStatus: 'Pendiente', channel: 'persona', discount: 0, deliveryDate: new Date().toISOString().slice(0, 10), alistamiento: 0 })
  const { success, info, error } = useToast()

  useEffect(() => {
    void Promise.all([fetchProducts(), fetchUsers()]).then(([productData, userData]) => { setProducts(productData); setUsers(userData); const customer = userData.find((user) => user.backendRole === 'cliente'); const seller = userData.find((user) => user.backendRole === 'admin' || user.backendRole === 'super_admin'); setForm((current) => ({ ...current, customerId: customer?.id ?? 0, sellerId: seller?.id ?? 0, productId: productData[0]?.id ?? 0, productName: productData[0]?.name ?? '', unitPrice: productData[0]?.price ?? 0 })); setOrderItems(productData[0] ? [{ productId: productData[0].id, quantity: 1, unitPrice: productData[0].price, alistamiento: 0 }] : []) })
    void Promise.all([fetchSales(), fetchPedidos(), fetchSalesFunnel()]).then(([salesData, ordersData, funnelData]) => { setSales(salesData); setOrders(ordersData); setFunnel(funnelData) })
  }, [])

  const customers = users.filter((user) => user.backendRole === 'cliente')
  const sellers = users.filter((user) => user.backendRole === 'admin' || user.backendRole === 'super_admin')
  const totals = useMemo(() => ({ revenue: sales.reduce((sum, item) => sum + item.total, 0), completed: sales.filter((item) => item.status === 'Completada').length, pending: sales.filter((item) => item.status === 'Pendiente').length }), [sales])
  const filteredSales = useMemo(() => sales.filter((sale) => { const query = search.toLowerCase().trim(); return (!query || sale.customer.toLowerCase().includes(query) || sale.product.toLowerCase().includes(query) || String(sale.id).includes(query)) && (statusFilter === 'Todas' || sale.status === statusFilter) }), [sales, search, statusFilter])
  const handleProduct = (productId: number) => { const product = products.find((item) => item.id === productId); if (product) setForm((current) => ({ ...current, productId: product.id, productName: product.name, unitPrice: product.price })) }
  const openOrder = () => { setEditingOrderId(null); setOrderItems(form.productId ? [{ productId: form.productId, quantity: 1, unitPrice: form.unitPrice, alistamiento: 0 }] : []); setOrderModalOpen(true) }
  const editOrder = (order: CustomerOrder) => { setEditingOrderId(order.id); setForm((current) => ({ ...current, customerId: order.customerId ?? current.customerId, sellerId: order.sellerId ?? current.sellerId, paymentStatus: order.paymentStatus as SalesFormState['paymentStatus'], paymentType: order.paymentType as SalesFormState['paymentType'], channel: order.canal as SalesFormState['channel'], deliveryDate: order.deliveryDate ?? current.deliveryDate })); setOrderItems(order.items.map((item) => ({ productId: item.productId, quantity: item.ordered, unitPrice: item.unitPrice, alistamiento: item.prepared }))); setOrderModalOpen(true) }
  const createCustomer = async () => { if (!newCustomer.name.trim() || !newCustomer.dni.trim() || !newCustomer.email.trim() || !newCustomer.password) { error('Completa nombre, documento, correo y contraseña del cliente.', 'Datos incompletos'); return }; setSaving(true); try { const created = await createUser(newCustomer); setUsers((current) => [created, ...current]); setForm((current) => ({ ...current, customerId: created.id })); setNewCustomer(emptyCustomer); success(`Cliente "${created.name}" creado y seleccionado`, 'Cliente creado') } catch (caught) { error(caught instanceof Error ? caught.message : 'No fue posible crear el cliente.', 'Error al crear cliente') } finally { setSaving(false) } }
  const submitSale = (event: React.FormEvent) => { event.preventDefault(); const product = products.find((item) => item.id === form.productId); if (!form.customerId || !product || form.quantity <= 0 || form.unitPrice < 0) { error('Selecciona cliente y producto, e ingresa valores válidos.', 'Revisa el formulario'); return }; if (form.quantity > product.stock) { error('La cantidad supera el stock disponible.', 'Stock insuficiente'); return }; setSaving(true); void createSale(form).then((created) => { setSales((current) => [{ ...created, quantity: form.quantity, unitPrice: form.unitPrice }, ...current]); setModalOpen(false); success(`Venta #${created.id} por ${formatCurrency(created.total)} registrada`, 'Venta Exitosa') }).catch((caught) => error(caught instanceof Error ? caught.message : 'No fue posible registrar la venta.', 'Error de venta')).finally(() => setSaving(false)) }
  const submitOrder = (event: React.FormEvent) => { event.preventDefault(); if (!form.customerId || !form.deliveryDate || !orderItems.length) { error('Completa cliente, fecha y al menos un producto válido.', 'Revisa el pedido'); return }; setSaving(true); const input = { customerId: form.customerId, sellerId: form.sellerId, discount: form.discount, status: form.status, deliveryDate: form.deliveryDate, paymentType: form.paymentType, paymentStatus: form.paymentStatus, channel: form.channel, items: orderItems }; const request = editingOrderId === null ? createOrder(input) : updateOrder(editingOrderId, input); void request.then((order) => { setOrders((current) => editingOrderId === null ? [order, ...current] : current.map((item) => item.id === order.id ? order : item)); setOrderModalOpen(false); setEditingOrderId(null); return fetchSalesFunnel() }).then(setFunnel).catch((caught) => error(caught instanceof Error ? caught.message : 'No fue posible guardar el pedido.', 'Error de pedido')).finally(() => setSaving(false)) }
  const complete = async (order: CustomerOrder) => { try { const nextStatus = order.status === 'Pendiente' ? 'Alistamiento' : 'Entregado'; const updated = await completeOrder(order.id, nextStatus); setOrders((current) => current.map((item) => item.id === updated.id ? updated : item)); setFunnel(await fetchSalesFunnel()) } catch (caught) { error(caught instanceof Error ? caught.message : 'No fue posible completar el pedido.', 'Error de pedido') } }
  const cancel = async (order: CustomerOrder) => { try { const updated = await cancelOrder(order.id); setOrders((current) => current.map((item) => item.id === updated.id ? updated : item)); setFunnel(await fetchSalesFunnel()) } catch (caught) { error(caught instanceof Error ? caught.message : 'No fue posible cancelar el pedido.', 'Error al cancelar') } }
  const exportCsv = () => { const rows = [['N° Pedido', 'Cliente', 'Producto', 'Monto Total (COP)', 'Estado', 'Fecha'], ...filteredSales.map((sale) => [`#${sale.id}`, sale.customer, sale.product, String(sale.total), sale.status, sale.date])]; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' })); link.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`; link.click(); info('Ventas exportadas a formato CSV', 'Descarga Completa') }

  return <>
    <SalesHeader tab={tab} onTab={setTab} onExport={exportCsv} onNew={() => tab === 'pedidos' ? openOrder() : setModalOpen(true)} />
    {tab === 'embudo' && (funnel ? <FunnelBoard data={funnel} /> : <p style={{ color: 'var(--text-dim)' }}>Cargando embudo de ventas...</p>)}
    {tab === 'pedidos' && <OrdersBoard orders={orders} onComplete={complete} onEdit={editOrder} onCancel={cancel} />}
    {tab === 'ventas' && <><SalesSummary revenue={totals.revenue} completed={totals.completed} pending={totals.pending} /><SalesFilters search={search} statusFilter={statusFilter} onSearchChange={setSearch} onStatusChange={setStatusFilter} /><SalesTable sales={filteredSales} onReceipt={setReceiptSale} /></>}
    <SaleFormModal open={isModalOpen} customers={customers} sellers={sellers} products={products} form={form} newCustomer={newCustomer} saving={saving} onForm={setForm} onCustomer={setNewCustomer} onCreateCustomer={() => void createCustomer()} onProduct={handleProduct} onClose={() => setModalOpen(false)} onSubmit={submitSale} />
    <OrderFormModal open={isOrderModalOpen} editingId={editingOrderId} customers={customers} sellers={sellers} products={products} form={form} newCustomer={newCustomer} saving={saving} items={orderItems} onForm={setForm} onCustomer={setNewCustomer} onCreateCustomer={() => void createCustomer()} onItems={setOrderItems} onClose={() => setOrderModalOpen(false)} onSubmit={submitOrder} onProduct={handleProduct} />
    <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />
  </>
}
