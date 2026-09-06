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
    const raw = localStorage.getItem('velas_products')
    if (!raw) return []
    const parsed = JSON.parse(raw) as Product[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistProducts(products: Product[]): void {
  localStorage.setItem('velas_products', JSON.stringify(products))
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
    const raw = localStorage.getItem('velas_users')
    if (!raw) return []
    const parsed = JSON.parse(raw) as User[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistUsers(users: User[]): void {
  localStorage.setItem('velas_users', JSON.stringify(users))
}

const DEMO_COLORS: CatalogOption[] = [
  { id: 1, name: 'Blanco' }, { id: 2, name: 'Rojo' }, { id: 3, name: 'Azul' }, { id: 4, name: 'Verde' }, { id: 5, name: 'Amarillo' }, { id: 6, name: 'Morado' },
]
const DEMO_REFERENCES: CatalogOption[] = [
  { id: 1, name: 'Clásica' }, { id: 2, name: 'Aromática' }, { id: 3, name: 'Decorativa' }, { id: 4, name: 'Premium' }, { id: 5, name: 'Navideña' }, { id: 6, name: 'Religiosa' },
]

function getStoredSales(): Sale[] {
  try {
    const raw = localStorage.getItem('velas_sales')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as Sale[] : []
  } catch { return [] }
}

function persistSales(sales: Sale[]): void { localStorage.setItem('velas_sales', JSON.stringify(sales)) }

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
    username: String(raw.usuario_login ?? raw.username ?? ''),
    phone: String(raw.telefono ?? raw.phone ?? ''),
    address: String(raw.direccion ?? raw.address ?? ''),
    cityId: raw.id_ciudad ? Number(raw.id_ciudad) : undefined,
    backendRole: String(raw.rol ?? raw.role ?? ''),
  }
}

export async function fetchColors(): Promise<CatalogOption[]> {
  try {
    const colors = await apiFetch<Array<Record<string, unknown>>>('/colores')
    if (Array.isArray(colors) && colors.length) {
      return colors.map((color) => ({
        id: Number(color.id_color ?? color.id ?? 0),
        name: String(color.nombre ?? color.name ?? 'Color'),
      }))
    }
  } catch {
    /* catálogo local si el backend no responde */
  }
  return DEMO_COLORS
}

export async function fetchReferences(): Promise<CatalogOption[]> {
  try {
    const references = await apiFetch<Array<Record<string, unknown>>>('/referencias')
    if (Array.isArray(references) && references.length) {
      return references.map((reference) => ({
        id: Number(reference.id_referencia ?? reference.id ?? 0),
        name: String(reference.nombre_referencia ?? reference.name ?? 'Referencia'),
      }))
    }
  } catch {
    /* catálogo local si el backend no responde */
  }
  return DEMO_REFERENCES
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

function isConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : ''
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message)
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
    rol: user.role === 'supremo' ? 'super_admin' : 'admin',
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
    const products = await apiFetchAny<Array<Record<string, unknown>>>(['/productos', '/products'])
    if (Array.isArray(products) && products.length) {
      return products.map((product) => normalizeProduct(product))
    }
  } catch {
    /* inventario local si el backend no responde */
  }
  const stored = getStoredProducts()
  if (stored.length) return stored
  const products = DEMO_PRODUCTS.map((product) => normalizeProduct(product))
  persistProducts(products)
  return products
}

export async function createProduct(product: ProductForm): Promise<Product> {
  try {
    const created = await apiFetch<Record<string, unknown>>('/productos', {
      method: 'POST',
      body: JSON.stringify(toBackendProduct(product)),
    })
    return normalizeProduct(created)
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  const existing = await fetchProducts()
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
      colorId: product.colorId,
      referenceId: product.referenceId,
  }
  persistProducts([createdProduct, ...existing])
  return createdProduct
}

export async function updateProduct(id: number, product: ProductForm): Promise<Product> {
  try {
    const updated = await apiFetch<Record<string, unknown>>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toBackendProduct(product)),
    })
    return normalizeProduct(updated)
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  const existing = await fetchProducts()
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
      colorId: product.colorId,
      referenceId: product.referenceId,
  }
  persistProducts(existing.map((item) => (item.id === id ? updatedProduct : item)))
  return updatedProduct
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    await apiFetch(`/productos/${id}`, { method: 'DELETE' })
    return
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  persistProducts((await fetchProducts()).filter((product) => product.id !== id))
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const users = await apiFetch<Array<Record<string, unknown>>>('/usuarios')
    if (Array.isArray(users)) return users.map(normalizeUser)
  } catch {
    /* modo demo sin servidor */
  }
  const stored = getStoredUsers()
  if (stored.length) return stored
  const localUsers = DEMO_USERS.map((user) => ({
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

export async function createUser(user: UserForm): Promise<User> {
  try {
    const created = await apiFetch<Record<string, unknown>>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(toBackendUser(user, true)),
    })
    return normalizeUser(created)
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  const documento = String(user.dni || Date.now() % 1000000000)
  const existing = await fetchUsers()
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
  persistUsers([createdUser, ...existing])
  return createdUser
}

export async function updateUser(id: number, user: UserForm): Promise<User> {
  try {
    const updated = await apiFetch<Record<string, unknown>>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toBackendUser(user, false)),
    })
    return normalizeUser(updated)
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  const existing = await fetchUsers()
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
  persistUsers(existing.map((item) => (item.id === id ? updatedUser : item)))
  return updatedUser
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await apiFetch(`/usuarios/${id}`, { method: 'DELETE' })
    return
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  persistUsers((await fetchUsers()).filter((user) => user.id !== id))
}

export async function fetchSales(): Promise<Sale[]> {
  try {
    const [orders, products] = await Promise.all([
      apiFetch<Array<Record<string, unknown>>>('/pedidos'),
      fetchProducts(),
    ])
    return orders.map((order) => {
      const normalized = normalizeOrder(order, products)
      return {
        id: normalized.id,
        customer: normalized.customer,
        product: normalized.items.map((item) => item.productName).join(', ') || 'Sin productos',
        total: normalized.total,
        status: normalized.status === 'Entregado' ? 'Completada' : normalized.status,
        date: normalized.date,
      }
    })
  } catch {
    /* modo demo sin servidor */
  }
  const stored = getStoredSales()
  if (stored.length) return stored
  const fallback = [
      { id: 1, customer: 'Distribuidora La Milagrosa', product: 'Vela Árabe Dorada', total: 420000, status: 'Completada', date: '2026-09-02' },
      { id: 2, customer: 'Comercializadora San Judas', product: 'Vela Floral Aromaterapia', total: 180000, status: 'Completada', date: '2026-09-01' },
      { id: 3, customer: 'Almacén El Centenario', product: 'Vela Navideña Estrella', total: 240000, status: 'Pendiente', date: '2026-08-31' },
      { id: 4, customer: 'Boutique Aromas & Luz', product: 'Vela Relajante Brisa', total: 156000, status: 'Completada', date: '2026-08-29' },
      { id: 5, customer: 'Parroquia San Juan', product: 'Vela Cirio Pascual', total: 310000, status: 'Completada', date: '2026-08-27' },
  ]
  persistSales(fallback)
  return fallback
}

function demoOrders(products: Product[]): CustomerOrder[] {
  const byName = (name: string, fallbackIndex: number) =>
    products.find((item) => item.name.toLowerCase().includes(name.toLowerCase())) ?? products[fallbackIndex] ?? products[0]

  const classic = byName('Árabe', 0) ?? {
    id: 1, name: 'Vela Árabe', price: 42000, stock: 1,
  }
  const floral = byName('Floral', 1) ?? {
    id: 2, name: 'Vela Floral', price: 36000, stock: 21,
  }
  const festive = byName('Navideña', 2) ?? {
    id: 3, name: 'Vela Navideña', price: 48000, stock: 14,
  }

  const line = (
    product: { id: number; name: string; price: number; stock: number },
    ordered: number,
    prepared = 0,
  ): OrderLine => ({
    productId: product.id,
    productName: product.name,
    ordered,
    stock: product.stock,
    prepared,
    unitPrice: product.price,
    subtotal: ordered * product.price,
  })

  const multiItems = [
    line({ id: classic.id, name: classic.name, price: classic.price, stock: 1 }, 10, 1),
    line({ id: floral.id, name: floral.name, price: floral.price, stock: floral.stock }, 8, 4),
    line({ id: festive.id, name: festive.name, price: festive.price, stock: festive.stock }, 5, 2),
  ]

  return [
    {
      id: 101,
      customer: 'Laura Gómez',
      seller: 'Administrador Principal',
      canal: 'whatsapp',
      status: 'Alistamiento',
      paymentStatus: 'Parcial',
      paymentType: 'Transferencia',
      date: '2026-09-03',
      deliveryDate: '2026-09-10',
      total: multiItems.reduce((sum, item) => sum + item.subtotal, 0),
      items: multiItems,
    },
    {
      id: 102,
      customer: 'Carlos Rodríguez',
      seller: 'Administrador Principal',
      canal: 'facebook',
      status: 'Pendiente',
      paymentStatus: 'Pagado',
      paymentType: 'Transferencia',
      date: '2026-09-02',
      deliveryDate: '2026-09-09',
      total: 192000,
      items: [line({ id: festive.id, name: festive.name, price: festive.price, stock: festive.stock }, 4, 0)],
    },
    {
      id: 103,
      customer: 'Distribuidora La Milagrosa',
      seller: 'Ana Suárez',
      canal: 'persona',
      status: 'Entregado',
      paymentStatus: 'Pagado',
      paymentType: 'Efectivo',
      date: '2026-08-28',
      deliveryDate: '2026-08-30',
      total: 210000,
      items: [
        line({ id: classic.id, name: classic.name, price: classic.price, stock: classic.stock }, 5, 5),
        line({ id: floral.id, name: floral.name, price: floral.price, stock: floral.stock }, 3, 3),
      ],
    },
  ]
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
  const products = await fetchProducts().catch(() => DEMO_PRODUCTS.map((product) => normalizeProduct(product)))
  try {
    const pedidos = await apiFetchAny<Array<Record<string, unknown>>>(['/pedidos', '/sales'])
    if (Array.isArray(pedidos) && pedidos.length && (pedidos[0].detalles || pedidos[0].items || pedidos[0].id_pedido)) {
      return pedidos.map((pedido) => normalizeOrder(pedido, products))
    }
  } catch {
    /* pedidos locales si el backend no responde */
  }
  return demoOrders(products)
}

export async function fetchSalesFunnel(): Promise<SalesFunnelData> {
  type FunnelChannelLike = SalesFunnelData['channels'][number]
  const orders = await fetchPedidos()
  const fallbackFromOrders = (): SalesFunnelData => {
    const stageKeys = [
      { key: 'Pendiente', label: 'Contacto / Pendiente' },
      { key: 'Alistamiento', label: 'Alistamiento' },
      { key: 'Entregado', label: 'Entregado' },
    ]
    const stages = stageKeys.map((stage) => {
      const matched = orders.filter((order) => order.status === stage.key)
      return {
        key: stage.key,
        label: stage.label,
        count: matched.length,
        amount: matched.reduce((sum, order) => sum + order.total, 0),
      }
    })
    const channelMap = new Map<string, FunnelChannelLike>()
    for (const order of orders) {
      const current = channelMap.get(order.canal) ?? { canal: order.canal, orders: 0, sales: 0, amount: 0 }
      current.orders += 1
      current.sales += order.status === 'Entregado' ? 1 : 0
      current.amount += order.total
      channelMap.set(order.canal, current)
    }
    return {
      stages,
      channels: [...channelMap.values()],
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.total, 0),
    }
  }

  try {
    const [dashboard, channels] = await Promise.all([
      apiFetch<Record<string, unknown>>('/reportes/dashboard').catch(() => ({}) as Record<string, unknown>),
      apiFetch<Array<Record<string, unknown>>>('/reportes/ventas-por-canal').catch(() => [] as Array<Record<string, unknown>>),
    ])

    const local = fallbackFromOrders()
    const stages = [
      {
        key: 'Pendiente',
        label: 'Contacto / Pendiente',
        count: Number(dashboard.pedidos_pendientes ?? local.stages[0]?.count ?? 0),
        amount: local.stages[0]?.amount ?? 0,
      },
      {
        key: 'Alistamiento',
        label: 'Alistamiento',
        count: Number(dashboard.pedidos_alistamiento ?? local.stages[1]?.count ?? 0),
        amount: local.stages[1]?.amount ?? 0,
      },
      {
        key: 'Entregado',
        label: 'Entregado',
        count: Number(dashboard.pedidos_entregados ?? local.stages[2]?.count ?? 0),
        amount: local.stages[2]?.amount ?? 0,
      },
    ]

    const mappedChannels = Array.isArray(channels) && channels.length
      ? channels.map((channel) => ({
          canal: String(channel.canal ?? 'canal'),
          orders: Number(channel.cantidad_pedidos ?? 0),
          sales: Number(channel.cantidad_ventas ?? 0),
          amount: Number(channel.total_ventas ?? 0),
        }))
      : local.channels

    return {
      stages,
      channels: mappedChannels,
      totalOrders: Number(dashboard.total_pedidos ?? local.totalOrders),
      totalAmount: Number(dashboard.total_ventas_monto ?? local.totalAmount),
    }
  } catch {
    return fallbackFromOrders()
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
        sku: String(normalized.sku ?? `VEL-${Number(normalized.id_producto ?? normalized.id ?? index + 1)}`),
      }
    })
  } catch {
    const fallbackProducts = DEMO_PRODUCTS.map((product) => ({
      id: Number(product.id_producto ?? 0),
      name: String(product.nombre ?? 'Producto'),
      category: String(product.referencia_nombre ?? 'General'),
      stock: Number(product.stock_actual ?? 0),
      minStock: Number(product.stock_minimo ?? 0),
      sku: `VEL-${Number(product.id_producto ?? 0)}`,
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

export async function createSale(input: { customer: string; productId: number; quantity: number; unitPrice: number; status: string; date: string }): Promise<Sale> {
  const product = (await fetchProducts()).find((item) => item.id === input.productId)
  if (!product) throw new Error('El producto seleccionado no existe.')
  if (input.quantity > product.stock) throw new Error('La cantidad supera el stock disponible.')
  try {
    const customers = await apiFetch<Array<Record<string, unknown>>>('/usuarios?rol=cliente')
    const requestedName = input.customer.trim().toLocaleLowerCase()
    const customer = customers.find((item) => toDisplayName(item).toLocaleLowerCase() === requestedName)
    if (!customer) {
      throw new Error('El cliente debe estar registrado en la base de datos antes de crear un pedido.')
    }
    const order = await apiFetch<Record<string, unknown>>('/pedidos', {
      method: 'POST',
      body: JSON.stringify({
        id_cliente: Number(customer.id_usuario),
        porcentaje: 0,
        estado_pedido: input.status === 'Completada' ? 'Entregado' : 'Pendiente',
        fecha_entrega: input.date || new Date().toISOString().slice(0, 10),
        tipo_pago: 'Transferencia',
        estado_pago: input.status === 'Completada' ? 'Pagado' : 'Pendiente',
        canal: 'persona',
        items: [{ id_producto: input.productId, cantidad: input.quantity, precio_acordado: input.unitPrice, alistamiento: 0 }],
      }),
    })
    const normalized = normalizeOrder(order, [product])
    return {
      id: normalized.id,
      customer: normalized.customer,
      product: product.name,
      total: normalized.total,
      status: normalized.status === 'Entregado' ? 'Completada' : normalized.status,
      date: normalized.date,
    }
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  const sales = await fetchSales()
  const nextId = sales.length ? Math.max(...sales.map((sale) => sale.id)) + 1 : 1
  const created: Sale = { id: nextId, customer: input.customer.trim(), product: product.name, total: input.quantity * input.unitPrice, status: input.status, date: input.date || new Date().toISOString().slice(0, 10) }
  persistSales([created, ...sales])
  persistProducts((await fetchProducts()).map((item) => item.id === product.id ? { ...item, stock: item.stock - input.quantity, status: item.stock - input.quantity > item.minStock ? 'active' : 'inactive' } : item))
  return {
    ...created,
  }
}

const MOVEMENTS_STORAGE_KEY = 'velas_inventory_movements'

function getStoredMovements(): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(MOVEMENTS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as InventoryMovement[] : []
  } catch { return [] }
}

function persistMovements(movements: InventoryMovement[]): void { localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements)) }

function movementTypeFromReason(reason: InventoryMovementForm['reason']): InventoryMovement['type'] {
  return reason === 'Producción' || reason === 'Reembolso' ? 'entrada' : 'salida'
}

export async function fetchInventoryMovements(): Promise<InventoryMovement[]> {
  try {
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
  } catch {
    /* modo demo sin servidor */
  }
  return getStoredMovements()
}

export async function createInventoryMovement(form: InventoryMovementForm): Promise<InventoryMovement> {
  const product = (await fetchProducts()).find((item) => item.id === form.productId)
  if (!product) throw new Error('El producto seleccionado no existe.')
  const type = movementTypeFromReason(form.reason)
  if (type === 'salida' && form.quantity > product.stock) throw new Error('La cantidad supera el stock disponible.')
  try {
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
      })) : [{ productId: product.id, productName: product.name, quantity: Number(form.quantity) }],
    }
  } catch (error) {
    if (!isConnectionError(error)) throw error
  }
  const movement: InventoryMovement = { id: Date.now(), type, reason: form.reason, date: new Date().toISOString(), user: 'Registro local', items: [{ productId: product.id, productName: product.name, quantity: Number(form.quantity) }] }
  persistMovements([movement, ...getStoredMovements()])
  const nextStock = product.stock + (type === 'entrada' ? form.quantity : -form.quantity)
  persistProducts((await fetchProducts()).map((item) => item.id === product.id ? { ...item, stock: nextStock, status: nextStock > item.minStock ? 'active' : 'inactive' } : item))
  return movement
}
