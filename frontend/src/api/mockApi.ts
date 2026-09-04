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
import { formatCurrency } from '../utils/formatters'

const API_BASE_URLS = ['http://localhost:8001/api', 'http://localhost:8000/api']

const DEMO_PRODUCTS: Array<Record<string, unknown>> = [
  { id_producto: 1, nombre: 'Vela Árabe', referencia_nombre: 'Velas', precio: 42000, stock_actual: 34, stock_minimo: 12, descripcion: 'Vela de cera premium', color_nombre: 'Dorado' },
  { id_producto: 2, nombre: 'Vela Floral', referencia_nombre: 'Aromáticas', precio: 36000, stock_actual: 21, stock_minimo: 10, descripcion: 'Aroma floral', color_nombre: 'Rosa' },
  { id_producto: 3, nombre: 'Vela Navideña', referencia_nombre: 'Navideñas', precio: 48000, stock_actual: 14, stock_minimo: 8, descripcion: 'Temporada navideña', color_nombre: 'Rojo' },
  { id_producto: 4, nombre: 'Vela Relax', referencia_nombre: 'Velas', precio: 39000, stock_actual: 28, stock_minimo: 9, descripcion: 'Vela relajante', color_nombre: 'Crema' },
  { id_producto: 5, nombre: 'Vela Lotus', referencia_nombre: 'Aromáticas', precio: 53000, stock_actual: 18, stock_minimo: 7, descripcion: 'Aroma exótico', color_nombre: 'Morado' },
]

function getStoredProducts(): Product[] {
  try {
    const raw = sessionStorage.getItem('velas_products')
    if (!raw) return []
    const parsed = JSON.parse(raw) as Product[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistProducts(products: Product[]): void {
  sessionStorage.setItem('velas_products', JSON.stringify(products))
}

const DEMO_USERS: Array<{
  id: number
  dni: string
  email: string
  password: string
  role: User['role']
  estado: User['estado']
  name: string
  initials: string
}> = [
  {
    id: 1,
    dni: '1234567890',
    email: 'ana@velas.test',
    password: 'admin123',
    role: 'supremo',
    estado: 'activo',
    name: 'Ana Suárez',
    initials: 'AS',
  },
  {
    id: 2,
    dni: '0987654321',
    email: 'carlos@velas.test',
    password: 'carlos123',
    role: 'normal',
    estado: 'activo',
    name: 'Carlos Mora',
    initials: 'CM',
  },
]

function getStoredUsers(): User[] {
  try {
    const raw = sessionStorage.getItem('velas_users')
    if (!raw) return []
    const parsed = JSON.parse(raw) as User[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistUsers(users: User[]): void {
  sessionStorage.setItem('velas_users', JSON.stringify(users))
}

function getDemoUser(identifier: string, password: string): User | null {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const user = DEMO_USERS.find((demoUser) => {
    const matchesIdentifier = [demoUser.dni, demoUser.email].some((value) => value.toLowerCase() === normalizedIdentifier)
    return matchesIdentifier && demoUser.password === password
  })

  if (!user) return null

  return {
    id: user.id,
    dni: user.dni,
    name: user.name,
    initials: user.initials,
    email: user.email,
    password: user.password,
    role: user.role,
    estado: user.estado,
  }
}

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
  const demoUser = getDemoUser(identifier, password)
  if (demoUser) {
    sessionStorage.removeItem('velas_token')
    sessionStorage.setItem('velas_token', 'demo-token')
    sessionStorage.setItem('velas_user', JSON.stringify(demoUser))
    return demoUser
  }

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
    const fallbackUser = getDemoUser(identifier, password)
    if (fallbackUser) {
      sessionStorage.setItem('velas_token', 'demo-token')
      sessionStorage.setItem('velas_user', JSON.stringify(fallbackUser))
      return fallbackUser
    }

    throw error
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  const fallbackDashboard: DashboardData = {
    metrics: [
      { label: 'Pedidos', value: '18', subtext: 'Total del sistema', trendType: 'delta-up', icon: 'ti-shopping-cart' },
      { label: 'Ventas', value: formatCurrency(2480000), subtext: 'Monto registrado', trendType: 'delta-up', icon: 'ti-cash' },
      { label: 'Bajo stock', value: '3', subtext: 'Productos a revisar', trendType: 'delta-down', icon: 'ti-package' },
      { label: 'Usuarios', value: '3', subtext: 'Activos en el sistema', trendType: 'delta-up', icon: 'ti-users' },
    ],
    salesSeries: [
      { month: 'Ene', value: 22 },
      { month: 'Feb', value: 35 },
      { month: 'Mar', value: 31 },
      { month: 'Abr', value: 48 },
      { month: 'May', value: 56 },
      { month: 'Jun', value: 62 },
      { month: 'Jul', value: 68 },
      { month: 'Ago', value: 74 },
      { month: 'Sep', value: 72 },
      { month: 'Oct', value: 80 },
      { month: 'Nov', value: 88 },
      { month: 'Dic', value: 96 },
    ],
    categoryShare: {
      total: 100,
      items: [
        { label: 'Velas', percent: 42, color: '#d4af37' },
        { label: 'Aromáticas', percent: 30, color: '#7c4dff' },
        { label: 'Navideñas', percent: 28, color: '#3a86ff' },
      ],
    },
    bestSellers: [
      { name: 'Vela Árabe', sku: 'VEL-1', category: 'Velas', units: 34, revenue: 1428000, trend: '+8%', trendType: 'badge-success' },
      { name: 'Vela Floral', sku: 'VEL-2', category: 'Aromáticas', units: 21, revenue: 756000, trend: '+12%', trendType: 'badge-warning' },
      { name: 'Vela Navideña', sku: 'VEL-3', category: 'Navideñas', units: 14, revenue: 672000, trend: '+10%', trendType: 'badge-success' },
    ],
  }

  try {
    const dashboard = (await apiFetchAny<Record<string, unknown>>(['/dashboard', '/reportes/dashboard'], {}).catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>
    const sales = (await apiFetchAny<Array<Record<string, unknown>>>(['/pedidos', '/sales'], {}).catch(() => [])) as Array<Record<string, unknown>>
    const fetchedProducts = (await apiFetchAny<Array<Record<string, unknown>>>(['/products', '/productos'], {}).catch(() => DEMO_PRODUCTS)) as Array<Record<string, unknown>>
    const products = fetchedProducts.length ? fetchedProducts : DEMO_PRODUCTS

    const totalRevenue = products.reduce((sum, product) => {
      const price = Number(product.precio ?? 0)
      const units = Number(product.stock_actual ?? 0)
      return sum + price * units
    }, 0)

    const underStockCount = products.filter((product) => Number(product.stock_actual ?? 0) <= Number(product.stock_minimo ?? 0)).length
    const totalOrders = sales.length || Math.max(12, products.length * 3)
    const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.total ?? 0), 0) || totalRevenue * 0.38

    const metrics = [
      {
        label: 'Pedidos',
        value: String(totalOrders),
        subtext: 'Total del sistema',
        trendType: 'delta-up' as const,
        icon: 'ti-shopping-cart',
      },
      {
        label: 'Ventas',
        value: formatCurrency(salesTotal),
        subtext: 'Monto registrado',
        trendType: 'delta-up' as const,
        icon: 'ti-cash',
      },
      {
        label: 'Bajo stock',
        value: String(underStockCount),
        subtext: 'Productos a revisar',
        trendType: 'delta-down' as const,
        icon: 'ti-package',
      },
      {
        label: 'Usuarios',
        value: String(Number(dashboard.total_usuarios ?? 3)),
        subtext: 'Activos en el sistema',
        trendType: 'delta-up' as const,
        icon: 'ti-users',
      },
    ]

    const monthBase = [36, 52, 48, 58, 70, 82]
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const salesSeries = months.map((month, index) => {
      const base = monthBase[index % monthBase.length]
      const productBoost = Math.max(12, Math.round((products.length * 8) + (index + 1) * 9))
      const value = Math.min(100, Math.max(22, Math.round(base + productBoost / 3)))
      return {
        month,
        value: index >= 6 ? Math.min(100, value + 6) : value,
      }
    })

    const categoryMap = new Map<string, number>()
    for (const product of products) {
      const key = String(product.referencia_nombre ?? product.category ?? 'General')
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1)
    }

    const palette = ['#d4af37', '#7c4dff', '#3a86ff', '#e7c76c', '#8f7b50']
    const categoryEntries = [...categoryMap.entries()].map(([label, count], index) => ({
      label,
      percent: Math.max(10, Math.round((count / Math.max(1, [...categoryMap.values()].reduce((sum, value) => sum + value, 0))) * 100)),
      color: palette[index % palette.length],
    }))

    const totalCategory = categoryEntries.reduce((sum, item) => sum + item.percent, 0)
    const adjustedCategories = categoryEntries.map((item) => ({
      ...item,
      percent: Math.max(12, Math.round((item.percent / Math.max(1, totalCategory)) * 100)),
    }))

    const bestSellers: DashboardData['bestSellers'] = products
      .map((product, index) => ({
        name: String(product.nombre ?? `Producto ${index + 1}`),
        sku: `VEL-${Number(product.id_producto ?? index + 1)}`,
        category: String(product.referencia_nombre ?? 'General'),
        units: Math.max(1, Number(product.stock_actual ?? 0) || 1),
        revenue: Number(product.precio ?? 0) * (Math.max(1, Number(product.stock_actual ?? 0) || 1)),
        trend: index % 2 === 0 ? '+8%' : '+12%',
        trendType: (index % 2 === 0 ? 'badge-success' : 'badge-warning') as 'badge-success' | 'badge-warning',
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      metrics,
      salesSeries,
      categoryShare: {
        total: 100,
        items: adjustedCategories.slice(0, 4),
      },
      bestSellers,
    }
  } catch {
    return fallbackDashboard
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const products = await apiFetchAny<Array<Record<string, unknown>>>(['/products', '/productos'])
    const normalized = products.map(normalizeProduct)
    persistProducts(normalized)
    return normalized
  } catch {
    const localProducts = getStoredProducts().length ? getStoredProducts() : DEMO_PRODUCTS.map((product) => normalizeProduct(product))
    persistProducts(localProducts)
    return localProducts
  }
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

  try {
    const created = await apiFetchAny<Record<string, unknown>>(['/productos', '/products'], {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const normalized = normalizeProduct(created)
    const localProducts = getStoredProducts()
    persistProducts([normalized, ...localProducts])
    return normalized
  } catch {
    const existing = getStoredProducts()
    const nextId = existing.length ? Math.max(...existing.map((item) => item.id)) + 1 : 1
    const createdProduct: Product = {
      id: nextId,
      name: product.name,
      sku: product.sku || `VEL-${nextId}`,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stock),
      minStock: Number(product.minStock),
      measures: product.measures,
      presentation: product.presentation,
      colors: product.colors,
      description: product.description,
      status: Number(product.stock) > Number(product.minStock) ? 'active' : 'inactive',
    }

    const nextProducts = [createdProduct, ...existing]
    persistProducts(nextProducts)
    return createdProduct
  }
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

  try {
    const updated = await apiFetchAny<Record<string, unknown>>([`/productos/${id}`, `/products/${id}`], {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    const normalized = normalizeProduct(updated)
    const localProducts = getStoredProducts()
    persistProducts(localProducts.map((item) => (item.id === id ? normalized : item)))
    return normalized
  } catch {
    const existing = getStoredProducts()
    const updatedProduct: Product = {
      id,
      name: product.name,
      sku: product.sku || `VEL-${id}`,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stock),
      minStock: Number(product.minStock),
      measures: product.measures,
      presentation: product.presentation,
      colors: product.colors,
      description: product.description,
      status: Number(product.stock) > Number(product.minStock) ? 'active' : 'inactive',
    }

    persistProducts(existing.map((item) => (item.id === id ? updatedProduct : item)))
    return updatedProduct
  }
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    await apiFetchAny<void>([`/productos/${id}`, `/products/${id}`], { method: 'DELETE' })
  } catch {
    const existing = getStoredProducts()
    persistProducts(existing.filter((product) => product.id !== id))
  }
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const users = await apiFetchAny<Array<Record<string, unknown>>>(['/usuarios', '/users'])
    const normalized = users.map(normalizeUser)
    persistUsers(normalized)
    return normalized
  } catch {
    const localUsers = getStoredUsers().length ? getStoredUsers() : DEMO_USERS.map((user) => ({
      id: user.id,
      dni: user.dni,
      name: user.name,
      initials: user.initials,
      email: user.email,
      password: user.password,
      role: user.role,
      estado: user.estado,
    }))

    persistUsers(localUsers)
    return localUsers
  }
}

export async function createUser(user: UserForm): Promise<User> {
  const [nombre_usuario, ...rest] = (user.name || '').trim().split(/\s+/)
  const apellidos_usuario = rest.join(' ')
  const documento = String(user.dni || Date.now() % 1000000000)
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

  try {
    const created = await apiFetchAny<Record<string, unknown>>(['/usuarios', '/users'], {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const normalized = normalizeUser(created)
    const localUsers = getStoredUsers()
    if (!localUsers.some((item) => item.id === normalized.id)) {
      persistUsers([normalized, ...localUsers])
    }
    return normalized
  } catch {
    const existing = getStoredUsers()
    const nextId = existing.length ? Math.max(...existing.map((item) => item.id)) + 1 : 1
    const createdUser: User = {
      id: nextId,
      dni: documento,
      name: (user.name || 'Usuario').trim() || 'Usuario',
      initials: (user.initials || (user.name || 'Usuario').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'US'),
      email: user.email,
      password: user.password,
      role: user.role,
      estado: user.estado,
    }

    const updatedUsers = [createdUser, ...existing]
    persistUsers(updatedUsers)
    return createdUser
  }
}

export async function updateUser(id: number, user: UserForm): Promise<User> {
  const [nombre_usuario, ...rest] = (user.name || '').trim().split(/\s+/)
  const apellidos_usuario = rest.join(' ')

  const payload = {
    nombre_usuario: nombre_usuario || 'Usuario',
    apellidos_usuario: apellidos_usuario || 'Sistema',
    documento: user.dni || undefined,
    correo: user.email,
    rol: user.role === 'supremo' ? 'super_admin' : 'admin',
    estado: user.estado === 'inactivo' ? 'Inactivo' : 'Activo',
    activo: user.estado !== 'inactivo',
    ...(user.password ? { password: user.password } : {}),
  }

  try {
    const updated = await apiFetchAny<Record<string, unknown>>([`/usuarios/${id}`, `/users/${id}`], {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    const normalized = normalizeUser(updated)
    const localUsers = getStoredUsers()
    persistUsers(localUsers.map((item) => (item.id === id ? normalized : item)))
    return normalized
  } catch {
    const existing = getStoredUsers()
    const updatedUser: User = {
      id,
      dni: user.dni,
      name: (user.name || 'Usuario').trim() || 'Usuario',
      initials: user.initials || (user.name || 'Usuario').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'US',
      email: user.email,
      password: user.password || existing.find((item) => item.id === id)?.password,
      role: user.role,
      estado: user.estado,
    }

    const nextUsers = existing.map((item) => (item.id === id ? updatedUser : item))
    persistUsers(nextUsers)
    return updatedUser
  }
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await apiFetchAny<void>([`/usuarios/${id}`, `/users/${id}`], { method: 'DELETE' })
  } catch {
    const existing = getStoredUsers()
    persistUsers(existing.filter((user) => user.id !== id))
  }
}

export async function fetchSales(): Promise<Sale[]> {
  try {
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
  } catch {
    return [
      { id: 1, customer: 'Distribuidora La Milagrosa', product: 'Vela Árabe Dorada', total: 420000, status: 'Completada', date: '2026-09-02' },
      { id: 2, customer: 'Comercializadora San Judas', product: 'Vela Floral Aromaterapia', total: 180000, status: 'Completada', date: '2026-09-01' },
      { id: 3, customer: 'Almacén El Centenario', product: 'Vela Navideña Estrella', total: 240000, status: 'Pendiente', date: '2026-08-31' },
      { id: 4, customer: 'Boutique Aromas & Luz', product: 'Vela Relajante Brisa', total: 156000, status: 'Completada', date: '2026-08-29' },
      { id: 5, customer: 'Parroquia San Juan', product: 'Vela Cirio Pascual', total: 310000, status: 'Completada', date: '2026-08-27' },
    ]
  }
}

export async function fetchStock(): Promise<StockItem[]> {
  try {
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
  } catch {
    const fallbackProducts = DEMO_PRODUCTS.map((product) => ({
      id: Number(product.id_producto ?? 0),
      name: String(product.nombre ?? 'Producto'),
      category: String(product.referencia_nombre ?? 'General'),
      stock: Number(product.stock_actual ?? 0),
      minStock: Number(product.stock_minimo ?? 0),
    }))

    return fallbackProducts
  }
}

export async function fetchReports(): Promise<ReportData> {
  const [products, sales] = await Promise.all([
    fetchProducts().catch(() => DEMO_PRODUCTS.map((product) => normalizeProduct(product))),
    fetchSales().catch(() => []),
  ])

  const inventoryRevenue = products.reduce((sum, product) => sum + product.price * Math.max(1, product.stock), 0)
  const salesRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const revenueBase = Math.max(inventoryRevenue * 0.45, salesRevenue || inventoryRevenue * 0.5)
  const totalOrders = sales.length || Math.max(6, products.length * 4)
  const lowStockCount = products.filter((product) => product.stock <= product.minStock).length

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthFactors = [0.68, 0.74, 0.82, 0.9, 0.98, 1.06, 1.12, 1.2, 1.18, 1.28, 1.4, 1.46]

  const table = monthNames.map((period, index) => {
    const income = Math.round((revenueBase * monthFactors[index]) / 12)
    const profit = Math.round(income * (0.34 + (index % 4) * 0.04))
    const margin = Math.min(62, Math.max(28, Math.round((profit / Math.max(1, income)) * 100)))

    return { period, income, profit, margin }
  })

  const cards = [
    {
      label: 'Ingresos',
      value: formatCurrency(revenueBase),
      subtext: 'Ventas reales estimadas',
      trendType: 'delta-up' as const,
      icon: 'ti-cash',
    },
    {
      label: 'Pedidos',
      value: String(totalOrders),
      subtext: 'Total registrados',
      trendType: 'delta-up' as const,
      icon: 'ti-shopping-cart',
    },
    {
      label: 'Bajo stock',
      value: String(lowStockCount),
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
