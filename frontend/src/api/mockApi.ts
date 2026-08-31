import type {
  AuditEntry,
  DashboardData,
  Product,
  ProductForm,
  ReportData,
  Sale,
  StockItem,
  User,
  UserForm,
} from '../types'

const API_BASE_URLS = ['http://localhost:8001/api', 'http://localhost:8000/api']

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

      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      })

      if (response.status === 204) {
        return undefined as T
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
      if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('404')) {
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
  }
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
  try {
    const legacy = await apiFetch<{ id: number; dni?: string; name: string; initials?: string; email: string; password?: string; role: User['role']; estado: User['estado'] }>('/login', {
      method: 'POST',
      body: JSON.stringify({ dni: identifier.trim(), password }),
    }).catch(() => null)

    if (legacy) {
      sessionStorage.removeItem('velas_token')
      sessionStorage.setItem('velas_user', JSON.stringify(legacy))
      return legacy
    }

    const data = await apiFetch<{ access_token: string; token_type: string; user: Record<string, unknown> }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario_login: identifier.trim(), password }),
    })

    sessionStorage.setItem('velas_token', data.access_token)
    const user = normalizeUser(data.user)
    sessionStorage.setItem('velas_user', JSON.stringify(user))
    return user
  } catch (error) {
    throw error
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  const dashboard = (await apiFetchAny<Record<string, unknown>>(['/dashboard', '/reportes/dashboard'], {}).catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>
  const products = (await apiFetchAny<Array<Record<string, unknown>>>(['/products', '/productos'], {}).catch(() => [])) as Array<Record<string, unknown>>

  const metrics = [
    {
      label: 'Pedidos',
      value: String(Number(dashboard.total_pedidos ?? products.length ?? 0)),
      subtext: 'Total del sistema',
      trendType: 'delta-up' as const,
      icon: 'ti-shopping-cart',
    },
    {
      label: 'Ventas',
      value: `$${Number(dashboard.total_ventas_monto ?? 0).toLocaleString('es-CO')}`,
      subtext: 'Monto registrado',
      trendType: 'delta-up' as const,
      icon: 'ti-cash',
    },
    {
      label: 'Bajo stock',
      value: String(dashboard.productos_bajo_stock ?? 0),
      subtext: 'Productos a revisar',
      trendType: 'delta-down' as const,
      icon: 'ti-package',
    },
    {
      label: 'Usuarios',
      value: String(dashboard.total_usuarios ?? 0),
      subtext: 'Activos en el sistema',
      trendType: 'delta-up' as const,
      icon: 'ti-users',
    },
  ]

  const salesSeries = [
    { month: 'Ene', value: 18 },
    { month: 'Feb', value: 28 },
    { month: 'Mar', value: 24 },
    { month: 'Abr', value: 34 },
    { month: 'May', value: 42 },
    { month: 'Jun', value: 58 },
  ]

  const bestSellers: DashboardData['bestSellers'] = products.slice(0, 5).map((product, index) => ({
    name: String(product.nombre ?? `Producto ${index + 1}`),
    sku: `VEL-${Number(product.id_producto ?? index + 1)}`,
    category: String(product.referencia_nombre ?? 'General'),
    units: Math.max(1, Number(product.stock_actual ?? 0) || 1),
    revenue: Number(product.precio ?? 0) * (Math.max(1, Number(product.stock_actual ?? 0) || 1)),
    trend: index % 2 === 0 ? '+8%' : '+12%',
    trendType: index % 2 === 0 ? 'badge-success' : 'badge-warning',
  }))

  return {
    metrics,
    salesSeries,
    categoryShare: {
      total: 68,
      items: [
        { label: 'Velas', percent: 48, color: '#d4af37' },
        { label: 'Aromáticas', percent: 27, color: '#e7c76c' },
        { label: 'Navideñas', percent: 25, color: '#8f7b50' },
      ],
    },
    bestSellers,
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const products = await apiFetchAny<Array<Record<string, unknown>>>(['/products', '/productos'])
  return products.map(normalizeProduct)
}

export async function createProduct(product: ProductForm): Promise<Product> {
  const payload = {
    nombre: product.name,
    descripcion: product.description,
    id_color: 1,
    presentacion: (product.presentation || 'unidad').toLowerCase().replace(/\s+/g, '_'),
    precio: Number(product.price),
    stock_actual: Number(product.stock),
    stock_minimo: Number(product.minStock),
    id_referencia: 1,
  }

  const created = await apiFetchAny<Record<string, unknown>>(['/productos', '/products'], {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeProduct(created)
}

export async function updateProduct(id: number, product: ProductForm): Promise<Product> {
  const payload = {
    nombre: product.name,
    descripcion: product.description,
    id_color: 1,
    presentacion: (product.presentation || 'unidad').toLowerCase().replace(/\s+/g, '_'),
    precio: Number(product.price),
    stock_actual: Number(product.stock),
    stock_minimo: Number(product.minStock),
    id_referencia: 1,
  }

  const updated = await apiFetchAny<Record<string, unknown>>([`/productos/${id}`, `/products/${id}`], {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return normalizeProduct(updated)
}

export async function deleteProduct(id: number): Promise<void> {
  await apiFetchAny<void>([`/productos/${id}`, `/products/${id}`], { method: 'DELETE' })
}

export async function fetchUsers(): Promise<User[]> {
  const users = await apiFetchAny<Array<Record<string, unknown>>>(['/usuarios', '/users'])
  return users.map(normalizeUser)
}

export async function createUser(user: UserForm): Promise<User> {
  const [nombre_usuario, ...rest] = (user.name || '').trim().split(/\s+/)
  const apellidos_usuario = rest.join(' ')
  const documento = String(Date.now() % 1000000000)
  const usuario_login = (user.email || '').split('@')[0] || `usuario_${Date.now()}`

  const payload = {
    nombre_usuario: nombre_usuario || 'Usuario',
    apellidos_usuario: apellidos_usuario || 'Sistema',
    usuario_login,
    documento,
    rol: user.role === 'supremo' ? 'super_admin' : 'admin',
    correo: user.email,
    password: user.password,
    estado: user.estado === 'inactivo' ? 'Inactivo' : 'Activo',
    activo: user.estado !== 'inactivo',
  }

  const created = await apiFetchAny<Record<string, unknown>>(['/usuarios', '/users'], {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeUser(created)
}

export async function updateUser(id: number, user: UserForm): Promise<User> {
  const [nombre_usuario, ...rest] = (user.name || '').trim().split(/\s+/)
  const apellidos_usuario = rest.join(' ')

  const payload = {
    nombre_usuario: nombre_usuario || 'Usuario',
    apellidos_usuario: apellidos_usuario || 'Sistema',
    correo: user.email,
    rol: user.role === 'supremo' ? 'super_admin' : 'admin',
    estado: user.estado === 'inactivo' ? 'Inactivo' : 'Activo',
    activo: user.estado !== 'inactivo',
    ...(user.password ? { password: user.password } : {}),
  }

  const updated = await apiFetchAny<Record<string, unknown>>([`/usuarios/${id}`, `/users/${id}`], {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return normalizeUser(updated)
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetchAny<void>([`/usuarios/${id}`, `/users/${id}`], { method: 'DELETE' })
}

export async function fetchSales(): Promise<Sale[]> {
  const sales = await apiFetchAny<Array<Record<string, unknown>>>(['/pedidos', '/sales'])

  return sales.map((sale, index) => {
    const details = Array.isArray(sale.detalles) ? (sale.detalles as Array<Record<string, unknown>>) : []
    const firstDetail = details[0]

    return {
      id: Number(sale.id_pedido ?? index + 1),
      customer: String(sale.cliente_nombre ?? 'Cliente'),
      product: String(firstDetail?.nombre_producto ?? 'Producto'),
      total: Number(sale.total ?? 0),
      status: String(sale.estado_pedido ?? 'Pendiente'),
      date: String(sale.fecha_registro ?? sale.fecha_entrega ?? new Date().toISOString().slice(0, 10)),
    }
  })
}

export async function fetchStock(): Promise<StockItem[]> {
  const products = await apiFetchAny<Array<Record<string, unknown>>>(['/stock', '/productos', '/products'])

  return products.map((product, index) => {
    const normalized = product as Record<string, unknown>
    return {
      id: Number(normalized.id_producto ?? normalized.id ?? index + 1),
      name: String(normalized.nombre ?? normalized.name ?? 'Producto'),
      category: String(normalized.referencia_nombre ?? normalized.category ?? 'General'),
      stock: Number(normalized.stock_actual ?? normalized.stock ?? 0),
      minStock: Number(normalized.stock_minimo ?? normalized.minStock ?? 0),
    }
  })
}

export async function fetchReports(): Promise<ReportData> {
  const dashboard = (await apiFetchAny<Record<string, unknown>>(['/reportes/dashboard', '/dashboard'], {}).catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>
  const products = (await apiFetchAny<Array<Record<string, unknown>>>(['/reportes', '/products', '/productos'], {}).catch(() => [])) as Array<Record<string, unknown>>

  const cards = [
    {
      label: 'Ingresos',
      value: `$${Number(dashboard.total_ventas_monto ?? 0).toLocaleString('es-CO')}`,
      subtext: 'Total ventas',
      trendType: 'delta-up' as const,
      icon: 'ti-cash',
    },
    {
      label: 'Pedidos',
      value: String(dashboard.total_pedidos ?? 0),
      subtext: 'Total registrados',
      trendType: 'delta-up' as const,
      icon: 'ti-shopping-cart',
    },
    {
      label: 'Bajo stock',
      value: String(dashboard.productos_bajo_stock ?? 0),
      subtext: 'Productos críticos',
      trendType: 'delta-down' as const,
      icon: 'ti-alert-circle',
    },
  ]

  const table = [
    { period: 'Ene', income: 4500000, profit: 1700000, margin: 38 },
    { period: 'Feb', income: 5100000, profit: 1900000, margin: 37 },
    { period: 'Mar', income: 5400000, profit: 2200000, margin: 41 },
    { period: 'Abr', income: 6200000, profit: 2600000, margin: 42 },
  ]

  if (products.length > 0) {
    table[0].income = products.reduce((sum, product) => sum + Number(product.precio ?? 0), 0)
  }

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
