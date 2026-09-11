import type {
  AuditEntry,
  DashboardData,
  InventoryMovement,
  InventoryMovementForm,
  Product,
  ProductForm,
  ReportData,
  Sale,
  SalesFunnelData,
  StockItem,
  User,
  UserForm,
  CatalogOption,
  CustomerAuditEntry,
  CustomerOrder,
  OrderLine,
} from '../types'
import { formatCurrency } from '../utils/formatters'
const API_BASE_URLS = [import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api']
// Las consultas de pedidos incluyen cliente, vendedor y detalles; 1.2 segundos
// provoca cancelaciones falsas aun cuando el backend termina la operación.
const API_TIMEOUT_MS = 10_000

function getStoredToken(): string {
  return sessionStorage.getItem('velas_token') || ''
}

async function apiRequest<T>(path: string, options: RequestInit = {}, urlCandidates = API_BASE_URLS): Promise<T> {
  let lastError: Error | null = null

  for (const baseUrl of urlCandidates) {
    try {
      const headers = new Headers(options.headers ?? {})
      headers.set('Content-Type', 'application/json')

      const token = getStoredToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

      let response: Response
      try {
        response = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        })
      } finally {
        window.clearTimeout(timeoutId)
      }

      if (response.status === 204) {
        return undefined as T
      }

      if (response.status === 401) {
        sessionStorage.removeItem('velas_token')
        sessionStorage.removeItem('velas_user')
        window.dispatchEvent(new Event('auth:expired'))
      }

      const payload = await response.text()
      const data = payload ? JSON.parse(payload) : null

      if (!response.ok) {
        throw new Error(readResponseError(data))
      }

      return data as T
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de la API'
      lastError = new Error(message)
      if (path === '/auth/login' || path === '/login') {
        continue
      }
      if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('404') || message.includes('aborted')) {
        continue
      }
      throw error
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error('Error de la API')
}

function toFrontendRole(role?: string): User['role'] {
  switch ((role || '').toLowerCase()) {
    case 'super_admin':
      return 'supremo'
    case 'admin':
    case 'cliente':
    default:
      return 'normal'
  }
}

function toFrontendStatus(status?: string): User['estado'] {
  return (status || '').toLowerCase() === 'inactivo' ? 'inactivo' : 'activo'
}

function toDisplayName(source: Record<string, unknown>): string {
  const direct =
    (source.nombre_completo as string | undefined) ||
    (source.name as string | undefined) ||
    [source.nombre_usuario, source.apellidos_usuario].filter(Boolean).join(' ') ||
    (source.usuario_login as string | undefined) ||
    'Usuario'

  return typeof direct === 'string' ? direct.trim() || 'Usuario' : 'Usuario'
}

function normalizeUser(raw: Record<string, unknown>): User {
  const fullName = toDisplayName(raw)
  const initials =
    (raw.initials as string | undefined) ||
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') ||
    'US'

  return {
    id: Number(raw.id_usuario ?? raw.id ?? 0),
    dni: String(raw.documento ?? raw.dni ?? ''),
    name: fullName,
    initials,
    email: String(raw.correo ?? raw.email ?? raw.usuario_login ?? ''),
    role: toFrontendRole(String(raw.rol ?? raw.role ?? '')),
    estado: toFrontendStatus(String(raw.estado ?? (raw.activo === false ? 'Inactivo' : 'Activo'))),
    username: String(raw.usuario_login ?? raw.username ?? ''),
    phone: String(raw.telefono ?? raw.phone ?? ''),
    address: String(raw.direccion ?? raw.address ?? ''),
    cityId: raw.id_ciudad ? Number(raw.id_ciudad) : undefined,
    backendRole: String(raw.rol ?? raw.role ?? ''),
  }
}

export async function fetchColors(): Promise<CatalogOption[]> {
  const colors = await apiFetch<Array<Record<string, unknown>>>('/colores')
  return colors.map((color) => ({
    id: Number(color.id_color ?? color.id ?? 0),
    name: String(color.nombre ?? color.name ?? 'Color'),
  }))
}

export async function fetchReferences(): Promise<CatalogOption[]> {
  const references = await apiFetch<Array<Record<string, unknown>>>('/referencias')
  return references.map((reference) => ({
    id: Number(reference.id_referencia ?? reference.id ?? 0),
    name: String(reference.nombre_referencia ?? reference.name ?? 'Referencia'),
  }))
}

export async function fetchCities(): Promise<CatalogOption[]> {
  const cities = await apiFetch<Array<Record<string, unknown>>>('/ciudades')
  return cities.map((city) => ({ id: Number(city.id_ciudad), name: String(city.nombre) }))
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  const id = Number(raw.id_producto ?? raw.id ?? 0)
  const stock = Number(raw.stock_actual ?? raw.stock ?? 0)
  const minStock = Number(raw.stock_minimo ?? raw.minStock ?? 0)
  const price = Number(raw.precio ?? raw.price ?? 0)
  const name = String(raw.nombre ?? raw.name ?? 'Producto')
  const category = String(raw.referencia_nombre ?? raw.category ?? 'General')
  const presentation = String(raw.presentacion ?? raw.presentation ?? 'unidad')
  const status = stock > minStock ? 'active' : 'inactive'

  return {
    id,
    name,
    sku: String(raw.sku ?? `VEL-${id || 'NEW'}`),
    category,
    price,
    stock,
    minStock,
    measures: String(raw.medidas ?? raw.measures ?? presentation),
    presentation,
    colors: String(raw.color_nombre ?? raw.colors ?? 'Sin color'),
    description: String(raw.descripcion ?? raw.description ?? ''),
    status,
    colorId: raw.id_color ? Number(raw.id_color) : undefined,
    referenceId: raw.id_referencia ? Number(raw.id_referencia) : undefined,
  }
}

function toBackendProduct(product: ProductForm) {
  return {
    nombre: product.name.trim(),
    descripcion: product.description.trim() || null,
    id_color: product.colorId,
    presentacion: product.presentation,
    precio: Number(product.price),
    stock_actual: Number(product.stock),
    stock_minimo: Number(product.minStock),
    id_referencia: product.referenceId,
  }
}

function toBackendUser(user: UserForm, includePassword: boolean) {
  const names = user.name.trim().split(/\s+/).filter(Boolean)
  const username = user.username?.trim() || user.email.trim().split('@')[0] || `usuario${Date.now()}`
  return {
    nombre_usuario: names[0] || 'Usuario',
    apellidos_usuario: names.slice(1).join(' ') || 'Sin apellido',
    usuario_login: username,
    documento: user.dni.trim(),
    correo: user.email.trim(),
    rol: user.role === 'supremo' ? 'super_admin' : user.role === 'cliente' ? 'cliente' : 'admin',
    estado: user.estado === 'activo' ? 'Activo' : 'Inactivo',
    activo: user.estado === 'activo',
    telefono: user.phone?.trim() || null,
    direccion: user.address?.trim() || null,
    id_ciudad: user.cityId || null,
    ...(includePassword || user.password?.trim() ? { password: user.password?.trim() } : {}),
  }
}

function readResponseError(data: unknown): string {
  if (!data) return 'Error de la API'

  if (typeof data === 'string') return data

  if (Array.isArray(data)) {
    return data.map((item) => (typeof item === 'string' ? item : item?.msg || item?.detail || 'Error de la API')).join(', ')
  }

  if (typeof data === 'object') {
    const detail = (data as Record<string, unknown>).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => (typeof item === 'object' && item ? (item.msg as string | undefined) || 'Error de la API' : String(item))).join(', ')
    }
    const message = (data as Record<string, unknown>).message
    if (typeof message === 'string') return message
  }

  return 'Error de la API'
}

async function apiFetchAny<T>(paths: string[], options: RequestInit = {}): Promise<T> {
  let lastError: Error | null = null

  for (const path of paths) {
    try {
      return await apiRequest<T>(path, options, API_BASE_URLS)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de la API'
      lastError = new Error(message)
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error('Error de la API')
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiFetchAny<T>([path], options)
}

export async function loginUser(identifier: string, password: string): Promise<User | null> {
  const data = await apiFetch<{ access_token: string; token_type: string; user: Record<string, unknown> }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario_login: identifier.trim(), password }),
  })

  sessionStorage.setItem('velas_token', data.access_token)
  const user = normalizeUser(data.user)
  sessionStorage.setItem('velas_user', JSON.stringify(user))
  return user
}

export async function fetchDashboard(): Promise<DashboardData> {
  const dashboard = await apiFetch<Record<string, unknown>>('/reportes/dashboard')
  const salesSeries = Array.isArray(dashboard.sales_series) ? dashboard.sales_series.map((item) => ({
    month: String((item as Record<string, unknown>).month ?? ''),
    value: Number((item as Record<string, unknown>).value ?? 0),
    orders: Number((item as Record<string, unknown>).orders ?? 0),
    units: Number((item as Record<string, unknown>).units ?? 0),
  })) : []
  const categoryItems = Array.isArray(dashboard.category_share) ? dashboard.category_share.map((item) => ({
    label: String((item as Record<string, unknown>).label ?? 'General'),
    percent: Number((item as Record<string, unknown>).percent ?? 0),
    color: String((item as Record<string, unknown>).color ?? '#8f7b50'),
    units: Number((item as Record<string, unknown>).units ?? 0),
  })) : []
  const bestSellers = Array.isArray(dashboard.best_sellers) ? dashboard.best_sellers.map((item) => {
    const product = item as Record<string, unknown>
    return {
      name: String(product.name ?? 'Producto'),
      sku: String(product.sku ?? 'SIN-SKU'),
      category: String(product.category ?? 'General'),
      units: Number(product.units ?? 0),
      revenue: Number(product.revenue ?? 0),
      trend: 'Actual',
      trendType: 'badge-success' as const,
    }
  }) : []

  return {
    metrics: [
      { label: 'Pedidos', value: String(Number(dashboard.total_pedidos ?? 0)), subtext: 'Total del sistema', trendType: 'delta-up', icon: 'ti-shopping-cart' },
      { label: 'Ventas', value: formatCurrency(Number(dashboard.total_ventas_monto ?? 0)), subtext: 'Monto registrado', trendType: 'delta-up', icon: 'ti-cash' },
      { label: 'Bajo stock', value: String(Number(dashboard.productos_bajo_stock ?? 0)), subtext: 'Productos a revisar', trendType: 'delta-down', icon: 'ti-package' },
      { label: 'Usuarios', value: String(Number(dashboard.total_usuarios ?? 0)), subtext: 'Activos en el sistema', trendType: 'delta-up', icon: 'ti-users' },
    ],
    salesSeries,
    categoryShare: { total: 100, items: categoryItems },
    bestSellers,
  }
}

let productsRequest: Promise<Product[]> | null = null

export async function fetchProducts(): Promise<Product[]> {
  if (!productsRequest) {
    productsRequest = apiFetch<Array<Record<string, unknown>>>('/productos')
      .then((products) => products.map((product) => normalizeProduct(product)))
      .finally(() => {
        productsRequest = null
      })
  }
  return productsRequest
}

export async function createProduct(product: ProductForm): Promise<Product> {
  const created = await apiFetch<Record<string, unknown>>('/productos', {
    method: 'POST',
    body: JSON.stringify(toBackendProduct(product)),
  })
  return normalizeProduct(created)
}

export async function updateProduct(id: number, product: ProductForm): Promise<Product> {
  const updated = await apiFetch<Record<string, unknown>>(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toBackendProduct(product)),
  })
  return normalizeProduct(updated)
}

export async function deleteProduct(id: number): Promise<void> {
  await apiFetch(`/productos/${id}`, { method: 'DELETE' })
}

export async function fetchUsers(): Promise<User[]> {
  const users = await apiFetch<Array<Record<string, unknown>>>('/usuarios')
  return users.map(normalizeUser)
}

export async function createUser(user: UserForm): Promise<User> {
  const created = await apiFetch<Record<string, unknown>>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(toBackendUser(user, true)),
  })
  return normalizeUser(created)
}

export async function updateUser(id: number, user: UserForm): Promise<User> {
  const updated = await apiFetch<Record<string, unknown>>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toBackendUser(user, false)),
  })
  return normalizeUser(updated)
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch(`/usuarios/${id}`, { method: 'DELETE' })
}

export async function fetchSales(): Promise<Sale[]> {
  const [orders, products] = await Promise.all([
    apiFetch<Array<Record<string, unknown>>>('/pedidos'),
    fetchProducts(),
  ])
  return orders.map((order) => {
    const normalized = normalizeOrder(order, products)
    return {
      id: normalized.id,
      sellerId: normalized.sellerId,
      customer: normalized.customer,
      product: normalized.items.map((item) => item.productName).join(', ') || 'Sin productos',
      total: normalized.total,
      status: normalized.status === 'Entregado' ? 'Completada' : normalized.status,
      date: normalized.date,
    }
  })
}

function normalizeOrderLine(raw: Record<string, unknown>, products: Product[]): OrderLine {
  const productId = Number(raw.id_producto ?? raw.productId ?? 0)
  const product = products.find((item) => item.id === productId)
  const ordered = Number(raw.cantidad ?? raw.ordered ?? 0)
  const unitPrice = Number(raw.precio_acordado ?? raw.unitPrice ?? product?.price ?? 0)
  return {
    productId,
    productName: String(raw.nombre_producto ?? raw.productName ?? product?.name ?? 'Vela'),
    ordered,
    stock: Number(product?.stock ?? raw.stock ?? 0),
    prepared: Number(raw.alistamiento ?? raw.prepared ?? 0),
    unitPrice,
    subtotal: Number(raw.subtotal ?? ordered * unitPrice),
  }
}

function normalizeOrder(raw: Record<string, unknown>, products: Product[]): CustomerOrder {
  const details = Array.isArray(raw.detalles) ? raw.detalles : Array.isArray(raw.items) ? raw.items : []
  const items = (details as Array<Record<string, unknown>>).map((detail) => normalizeOrderLine(detail, products))
  return {
    id: Number(raw.id_pedido ?? raw.id ?? 0),
    customerId: raw.id_cliente ? Number(raw.id_cliente) : undefined,
    sellerId: raw.id_vendedor ? Number(raw.id_vendedor) : undefined,
    customer: String(raw.cliente_nombre ?? raw.customer ?? 'Cliente'),
    seller: raw.vendedor_nombre ? String(raw.vendedor_nombre) : undefined,
    canal: String(raw.canal ?? 'persona'),
    status: String(raw.estado_pedido ?? raw.status ?? 'Pendiente'),
    paymentStatus: String(raw.estado_pago ?? raw.paymentStatus ?? 'Pendiente'),
    paymentType: String(raw.tipo_pago ?? raw.paymentType ?? 'Efectivo'),
    date: String(raw.fecha_registro ?? raw.date ?? new Date().toISOString().slice(0, 10)),
    deliveryDate: raw.fecha_entrega ? String(raw.fecha_entrega) : undefined,
    total: Number(raw.total ?? items.reduce((sum, item) => sum + item.subtotal, 0)),
    items,
  }
}

export async function fetchPedidos(): Promise<CustomerOrder[]> {
  const [pedidos, products] = await Promise.all([
    apiFetch<Array<Record<string, unknown>>>('/pedidos'),
    fetchProducts(),
  ])
  return pedidos.map((pedido) => normalizeOrder(pedido, products))
}

export async function fetchSalesFunnel(): Promise<SalesFunnelData> {
  const [dashboard, channels] = await Promise.all([
    apiFetch<Record<string, unknown>>('/reportes/dashboard'),
    apiFetch<Array<Record<string, unknown>>>('/reportes/ventas-por-canal'),
  ])
  const salesSeries = Array.isArray(dashboard.sales_series) ? dashboard.sales_series as Array<Record<string, unknown>> : []
  const amountByMonth = new Map(salesSeries.map((item) => [String(item.month), Number(item.value ?? 0)]))
  return {
    stages: [
      { key: 'Pendiente', label: 'Contacto / Pendiente', count: Number(dashboard.pedidos_pendientes ?? 0), amount: 0 },
      { key: 'Alistamiento', label: 'Alistamiento', count: Number(dashboard.pedidos_alistamiento ?? 0), amount: 0 },
      { key: 'Entregado', label: 'Entregado', count: Number(dashboard.pedidos_entregados ?? 0), amount: 0 },
    ],
    channels: channels.map((channel) => ({
      canal: String(channel.canal ?? 'canal'),
      orders: Number(channel.cantidad_pedidos ?? 0),
      sales: Number(channel.cantidad_ventas ?? 0),
      amount: Number(channel.total_ventas ?? 0),
    })),
    totalOrders: Number(dashboard.total_pedidos ?? 0),
    totalAmount: Number(dashboard.total_ventas_monto ?? [...amountByMonth.values()].reduce((sum, value) => sum + value, 0)),
  }
}

export async function fetchStock(): Promise<StockItem[]> {
  const products = await apiFetch<Array<Record<string, unknown>>>('/productos')
  return products.map((product, index) => {
      const normalized = product as Record<string, unknown>
      return {
        id: Number(normalized.id_producto ?? normalized.id ?? index + 1),
        name: String(normalized.nombre ?? normalized.name ?? 'Producto'),
        category: String(normalized.referencia_nombre ?? normalized.category ?? 'General'),
        stock: Number(normalized.stock_actual ?? normalized.stock ?? 0),
        minStock: Number(normalized.stock_minimo ?? normalized.minStock ?? 0),
        sku: String(normalized.sku ?? `VEL-${Number(normalized.id_producto ?? normalized.id ?? index + 1)}`),
      }
  })
}

export async function fetchReports(): Promise<ReportData> {
  const [dashboard, balance] = await Promise.all([
    apiFetch<Record<string, unknown>>('/reportes/dashboard'),
    apiFetch<Record<string, unknown>>('/reportes/balance-periodo?meses=12'),
  ])
  const series = Array.isArray(balance.periodos) ? balance.periodos as Array<Record<string, unknown>> : []
  const table = series.map((item) => ({
    period: String(item.periodo ?? ''),
    income: Number(item.valor_pedidos ?? 0),
    profit: 0,
    margin: 0,
    salesCount: Number(item.cantidad_pedidos ?? 0),
  }))

  const cards = [
    {
      label: 'Ingresos',
      value: formatCurrency(Number(balance.total_valor ?? 0)),
      subtext: 'Pedidos no cancelados',
      trendType: 'delta-up' as const,
      icon: 'ti-cash',
    },
    {
      label: 'Pedidos',
      value: String(Number(balance.total_pedidos ?? 0)),
      subtext: 'En el período seleccionado',
      trendType: 'delta-up' as const,
      icon: 'ti-shopping-cart',
    },
    {
      label: 'Bajo stock',
      value: String(Number(dashboard.productos_bajo_stock ?? 0)),
      subtext: 'Productos críticos',
      trendType: 'delta-down' as const,
      icon: 'ti-alert-circle',
    },
  ]

  return { cards, table }
}

export async function fetchAudit(): Promise<AuditEntry[]> {
  const movements = await apiFetchAny<Array<Record<string, unknown>>>(['/inventario/movimientos', '/audit'], {}).catch(() => [])

  return movements.slice(0, 10).map((movement, index) => ({
    id: Number(movement.id_movimiento ?? movement.id ?? index + 1),
    user: String(movement.usuario_nombre ?? movement.user ?? 'Sistema'),
    action: String(movement.motivo ?? movement.tipo_movimiento ?? movement.action ?? 'Movimiento'),
    module: 'Inventario',
    date: String(movement.fecha_hora ?? movement.date ?? new Date().toISOString()),
  }))
}

/**
 * Construye la auditoría de clientes con los recursos existentes. No requiere
 * endpoints, tablas ni migraciones adicionales.
 */
export async function fetchCustomerAudit(): Promise<CustomerAuditEntry[]> {
  const [customersResult, ordersResult] = await Promise.allSettled([
    apiFetch<Array<Record<string, unknown>>>('/usuarios?rol=cliente'),
    fetchPedidos(),
  ])

  const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : []
  const customerRows = customersResult.status === 'fulfilled' && Array.isArray(customersResult.value)
    ? customersResult.value
    : []
  const byCustomerId = new Map<number, CustomerOrder[]>()
  const byCustomerName = new Map<string, CustomerOrder[]>()

  for (const order of orders) {
    if (order.customerId) {
      byCustomerId.set(order.customerId, [...(byCustomerId.get(order.customerId) ?? []), order])
    }
    const key = order.customer.trim().toLocaleLowerCase()
    byCustomerName.set(key, [...(byCustomerName.get(key) ?? []), order])
  }

  const toAuditEntry = (raw: Record<string, unknown>): CustomerAuditEntry => {
    const id = Number(raw.id_usuario ?? raw.id ?? 0)
    const name = toDisplayName(raw)
    const customerOrders = byCustomerId.get(id) ?? byCustomerName.get(name.toLocaleLowerCase()) ?? []
    const dates = customerOrders.map((order) => order.date).filter(Boolean).sort()
    return {
      id,
      name,
      document: String(raw.documento ?? raw.dni ?? 'Sin documento'),
      email: String(raw.correo ?? raw.email ?? 'Sin correo'),
      phone: String(raw.telefono ?? raw.phone ?? 'Sin teléfono'),
      status: toFrontendStatus(String(raw.estado ?? (raw.activo === false ? 'Inactivo' : 'Activo'))),
      registered: true,
      orders: customerOrders.length,
      totalSpent: customerOrders.reduce((total, order) => total + Number(order.total || 0), 0),
      lastOrderDate: dates.at(-1),
    }
  }

  if (customerRows.length) return customerRows.map(toAuditEntry)

  // Si el servicio aún no está disponible, se muestran solo clientes ya
  // presentes en pedidos visibles, sin crear ni modificar registros.
  return [...byCustomerName.entries()].map(([name, customerOrders], index) => {
    const dates = customerOrders.map((order) => order.date).filter(Boolean).sort()
    return {
      id: index + 1,
      name: customerOrders[0]?.customer || name,
      document: 'No disponible',
      email: 'No disponible',
      phone: 'No disponible',
      status: 'activo',
      registered: false,
      orders: customerOrders.length,
      totalSpent: customerOrders.reduce((total, order) => total + Number(order.total || 0), 0),
      lastOrderDate: dates.at(-1),
    }
  })
}

export type OrderItemInput = {
  productId: number
  quantity: number
  unitPrice: number
  alistamiento: number
}

export type OrderInput = {
  customerId: number
  sellerId?: number
  discount: number
  status: 'Pendiente' | 'Alistamiento' | 'Entregado'
  deliveryDate: string
  paymentType: 'Efectivo' | 'Transferencia' | 'Crédito'
  paymentStatus: 'Pendiente' | 'Pagado' | 'Parcial'
  channel: 'persona' | 'facebook' | 'whatsapp'
  items: OrderItemInput[]
}

export async function createOrder(input: OrderInput): Promise<CustomerOrder> {
  const products = await fetchProducts()
  const created = await apiFetch<Record<string, unknown>>('/pedidos', {
    method: 'POST',
    body: JSON.stringify({
      id_cliente: input.customerId,
      id_vendedor: input.sellerId || null,
      porcentaje: input.discount,
      estado_pedido: input.status,
      fecha_entrega: input.deliveryDate,
      tipo_pago: input.paymentType,
      estado_pago: input.paymentStatus,
      canal: input.channel,
      items: input.items.map((item) => ({
        id_producto: item.productId,
        cantidad: item.quantity,
        precio_acordado: item.unitPrice,
        alistamiento: item.alistamiento,
      })),
    }),
  })
  return normalizeOrder(created, products)
}

export async function updateOrder(orderId: number, input: OrderInput): Promise<CustomerOrder> {
  const products = await fetchProducts()
  const updated = await apiFetch<Record<string, unknown>>(`/pedidos/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({
      id_cliente: input.customerId,
      id_vendedor: input.sellerId || null,
      porcentaje: input.discount,
      estado_pedido: input.status,
      fecha_entrega: input.deliveryDate,
      tipo_pago: input.paymentType,
      estado_pago: input.paymentStatus,
      canal: input.channel,
      items: input.items.map((item) => ({ id_producto: item.productId, cantidad: item.quantity, precio_acordado: item.unitPrice, alistamiento: item.alistamiento })),
    }),
  })
  return normalizeOrder(updated, products)
}

export async function completeOrder(orderId: number, status: 'Alistamiento' | 'Entregado' = 'Entregado'): Promise<CustomerOrder> {
  const [products, response] = await Promise.all([
    fetchProducts(),
    apiFetch<Record<string, unknown>>(`/pedidos/${orderId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_pedido: status }),
    }),
  ])
  return normalizeOrder(response, products)
}

export async function cancelOrder(orderId: number): Promise<CustomerOrder> {
  const [products, response] = await Promise.all([
    fetchProducts(),
    apiFetch<Record<string, unknown>>(`/pedidos/${orderId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_pedido: 'Cancelado' }),
    }),
  ])
  return normalizeOrder(response, products)
}

export async function createSale(input: {
  customerId: number
  sellerId?: number
  productId: number
  quantity: number
  unitPrice: number
  discount: number
  status: 'Pendiente' | 'Alistamiento' | 'Entregado'
  deliveryDate: string
  paymentType: 'Efectivo' | 'Transferencia' | 'Crédito'
  paymentStatus: 'Pendiente' | 'Pagado' | 'Parcial'
  channel: 'persona' | 'facebook' | 'whatsapp'
  alistamiento: number
}): Promise<Sale> {
  const products = await fetchProducts()
  const product = products.find((item) => item.id === input.productId)
  if (!product) throw new Error('El producto seleccionado no existe.')
  if (input.quantity > product.stock) throw new Error('La cantidad supera el stock disponible.')
  const normalized = await createOrder({
    customerId: input.customerId,
    sellerId: input.sellerId,
    discount: input.discount,
    status: input.status,
    deliveryDate: input.deliveryDate,
    paymentType: input.paymentType,
    paymentStatus: input.paymentStatus,
    channel: input.channel,
    items: [{ productId: input.productId, quantity: input.quantity, unitPrice: input.unitPrice, alistamiento: input.alistamiento }],
  })
  return {
    id: normalized.id,
    customer: normalized.customer,
    product: product.name,
    total: normalized.total,
    status: normalized.status === 'Entregado' ? 'Completada' : normalized.status,
    date: normalized.date,
  }
}

function movementTypeFromReason(reason: InventoryMovementForm['reason']): InventoryMovement['type'] {
  return reason === 'Producción' || reason === 'Reembolso' ? 'entrada' : 'salida'
}

export async function fetchInventoryMovements(): Promise<InventoryMovement[]> {
  const movements = await apiFetch<Array<Record<string, unknown>>>('/inventario/movimientos')
  return movements.map((movement, index) => ({
      id: Number(movement.id_movimiento ?? index + 1),
      type: String(movement.tipo_movimiento) as InventoryMovement['type'],
      reason: String(movement.motivo) as InventoryMovement['reason'],
      date: String(movement.fecha_hora ?? new Date().toISOString()),
      user: String(movement.usuario_nombre ?? 'Sistema'),
      items: Array.isArray(movement.detalles) ? movement.detalles.map((detail: Record<string, unknown>) => ({
        productId: Number(detail.id_producto),
        productName: String(detail.nombre_producto ?? 'Producto'),
        quantity: Number(detail.cantidad),
      })) : [],
  }))
}

export async function createInventoryMovement(form: InventoryMovementForm): Promise<InventoryMovement> {
  const product = (await fetchProducts()).find((item) => item.id === form.productId)
  if (!product) throw new Error('El producto seleccionado no existe.')
  const type = movementTypeFromReason(form.reason)
  if (type === 'salida' && form.quantity > product.stock) throw new Error('La cantidad supera el stock disponible.')
  const created = await apiFetch<Record<string, unknown>>('/inventario/movimientos', {
    method: 'POST',
    body: JSON.stringify({
      tipo_movimiento: type,
      motivo: form.reason,
      items: [{ id_producto: form.productId, cantidad: form.quantity }],
    }),
  })
  return {
    id: Number(created.id_movimiento),
    type: String(created.tipo_movimiento) as InventoryMovement['type'],
    reason: String(created.motivo) as InventoryMovement['reason'],
    date: String(created.fecha_hora),
    user: String(created.usuario_nombre ?? 'Sistema'),
    items: Array.isArray(created.detalles) ? created.detalles.map((detail: Record<string, unknown>) => ({
      productId: Number(detail.id_producto),
      productName: String(detail.nombre_producto ?? product.name),
      quantity: Number(detail.cantidad),
    })) : [],
  }
}
