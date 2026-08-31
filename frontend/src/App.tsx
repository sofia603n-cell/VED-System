import { useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import logoImg from '/logo.jpeg'
import {
  createProduct,
  createUser,
  deleteProduct,
  deleteUser,
  fetchAudit,
  fetchDashboard,
  fetchProducts,
  fetchReports,
  fetchSales,
  fetchStock,
  fetchUsers,
  loginUser,
  updateProduct,
  updateUser,
} from './api/mockApi'
import type {
  DashboardData,
  Product,
  ProductForm,
  Sale,
  User,
  UserForm,
  StockItem,
  AuditEntry,
  ReportData,
} from './types'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('velas_user')
    return stored ? JSON.parse(stored) : null
  })

  return (
    <Routes>
      <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />
      <Route element={<ProtectedLayout user={user} setUser={setUser} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/entradas" element={<EntriesPage />} />
        <Route path="/ventas" element={<SalesPage />} />
        <Route path="/reportes" element={<ReportsPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/auditoria" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

function ProtectedLayout({
  user,
  setUser,
}: {
  user: User | null
  setUser: (user: User | null) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const handleLogout = () => {
    sessionStorage.removeItem('velas_user')
    sessionStorage.removeItem('velas_token')
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-img-wrap">
            <img src={logoImg} alt="Estrella de David" />
          </div>
          <div className="brand-name">Velas Estrella de David</div>
          <div className="brand-sub">Fábrica de veladoras</div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user.initials || 'AS'}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.email}</div>
          </div>
          <span className="role-badge">{user.role === 'supremo' ? 'Supremo' : 'Normal'}</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">General</div>
          <NavLink to="/dashboard" label="Dashboard" icon="ti-layout-dashboard" />

          <div className="nav-section-label">Inventario</div>
          <NavLink to="/productos" label="Productos" icon="ti-candle" />
          <NavLink to="/stock" label="Stock" icon="ti-package" badge="3" />
          <NavLink to="/entradas" label="Entradas" icon="ti-arrow-bar-to-down" />

          <div className="nav-section-label">Ventas</div>
          <NavLink to="/ventas" label="Ventas" icon="ti-shopping-bag" />
          <NavLink to="/reportes" label="Reportes" icon="ti-chart-bar" />

          <div className="nav-section-label">Sistema</div>
          <NavLink to="/usuarios" label="Usuarios" icon="ti-users" />
          <NavLink to="/auditoria" label="Auditoría" icon="ti-clipboard-list" />
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" type="button" onClick={handleLogout}>
            <i className="ti ti-logout" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">{titleFromPath(location.pathname)}</div>
          <div className="search-bar">
            <i className="ti ti-search" />
            <input type="text" placeholder="Buscar…" />
          </div>
          <div className="topbar-actions">
            <Link className="icon-btn" to="/auditoria" title="Notificaciones">
              <i className="ti ti-bell" />
              <span className="notif-dot" />
            </Link>
            <Link className="icon-btn" to="/usuarios" title="Configuración">
              <i className="ti ti-settings" />
            </Link>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function NavLink({ to, label, icon, badge }: { to: string; label: string; icon: string; badge?: string }) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link className={`nav-item ${active ? 'active' : ''}`} to={to}>
      <i className={`ti ${icon}`} />
      <span>{label}</span>
      {badge ? <span className="nav-badge">{badge}</span> : null}
    </Link>
  )
}

function titleFromPath(pathname: string) {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/productos': 'Catálogo de productos',
    '/stock': 'Control de stock',
    '/entradas': 'Entradas de inventario',
    '/ventas': 'Ventas',
    '/reportes': 'Reportes',
    '/usuarios': 'Gestión de usuarios',
    '/auditoria': 'Auditoría del sistema',
  }

  return map[pathname] ?? 'Panel'
}

function LoginPage({
  user,
  setUser,
}: {
  user: User | null
  setUser: (user: User | null) => void
}) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(() => parseInt(sessionStorage.getItem('loginAttempts') || '0', 10))
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const maxAttempts = 3

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (loginAttempts >= maxAttempts) {
      setError('Cuenta bloqueada por demasiados intentos fallidos.')
      return
    }

    const result = await loginUser(email.trim(), password)
    if (!result) {
      const nextAttempts = loginAttempts + 1
      setLoginAttempts(nextAttempts)
      sessionStorage.setItem('loginAttempts', String(nextAttempts))
      setError(nextAttempts >= maxAttempts ? 'Cuenta bloqueada por 3 intentos fallidos.' : 'Usuario o contraseña incorrectos.')
      return
    }

    sessionStorage.setItem('velas_user', JSON.stringify(result))
    sessionStorage.setItem('loginAttempts', '0')
    setUser(result)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <img src={logoImg} alt="Estrella de David" />
          </div>

          <div className="login-title">Bienvenido</div>
          <div className="login-sub">Accede al panel de administración</div>

          {error ? (
            <div className={`login-error ${loginAttempts >= maxAttempts ? 'blocked' : ''}`}>
              <i className="ti ti-alert-circle" /> {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Usuario / DNI / correo</label>
              <input
                type="text"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario, DNI o correo"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword((value) => !value)}>
                  <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              <div className="attempts-left">
                {loginAttempts > 0 ? `Intentos restantes: ${Math.max(0, maxAttempts - loginAttempts)}` : ''}
              </div>
            </div>

            <a href="#" className="login-forgot">¿Olvidaste tu contraseña?</a>

            <button type="submit" className="btn-primary full-width">
              <i className="ti ti-login" /> Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetchDashboard().then(setData)
  }, [])

  if (!data) return <LoadingState />

  return (
    <>
      <div className="metrics-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Ventas mensuales</div>
              <div className="card-sub">Ingresos acumulados 2026</div>
            </div>
            <div className="period-pills">
              <button className="pill active" type="button">6M</button>
              <button className="pill" type="button">1A</button>
            </div>
          </div>
          <div className="chart-bars">
            {data.salesSeries.map((bar) => (
              <div key={bar.month} className="bar-group">
                <div className="bar" style={{ height: `${bar.value}%` }} />
                <span>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Categorías</div>
              <div className="card-sub">Distribución por tipo</div>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut-chart">
              <div className="donut-inner">{data.categoryShare.total}%</div>
            </div>
          </div>
          <div className="legend-list">
            {data.categoryShare.items.map((item) => (
              <div key={item.label} className="legend-item">
                <span className="legend-dot">
                  <span className="dot" style={{ background: item.color }} />
                  {item.label}
                </span>
                <span className="legend-pct">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Productos más vendidos</div>
        <Link className="btn-outline" to="/productos">
          <i className="ti ti-arrow-right" /> Ver todos
        </Link>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Unidades</th>
              <th>Ingresos</th>
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {data.bestSellers.map((product) => (
              <tr key={product.name}>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">🕯️</div>
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-sku">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{product.category}</span></td>
                <td>{product.units}</td>
                <td>{formatCurrency(product.revenue)}</td>
                <td>
                  <span className={`badge ${product.trendType}`}>
                    <i className="ti ti-trending-up" /> {product.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [sort, setSort] = useState('name')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyProductForm())

  useEffect(() => {
    fetchProducts().then(setItems)
  }, [])

  const filteredItems = useMemo(() => {
    const search = query.toLowerCase()
    const result = items.filter((product) => {
      const matchText = !search || [product.name, product.sku, product.category].join(' ').toLowerCase().includes(search)
      const matchCategory = !category || product.category === category
      const matchState = !stateFilter || getProductState(product) === stateFilter
      return matchText && matchCategory && matchState
    })

    result.sort((a, b) => {
      switch (sort) {
        case 'ref':
          return a.sku.localeCompare(b.sku)
        case 'price':
          return b.price - a.price
        case 'stock':
          return b.stock - a.stock
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [items, query, category, stateFilter, sort])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyProductForm())
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock,
      measures: product.measures,
      presentation: product.presentation,
      colors: product.colors,
      description: product.description,
      status: product.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.sku || !form.category || form.price <= 0 || form.stock < 0) {
      return
    }

    if (editingId !== null) {
      const updated = await updateProduct(editingId, { ...form })
      setItems((current) => current.map((item) => (item.id === editingId ? updated : item)))
    } else {
      const created = await createProduct(form)
      setItems((current) => [created, ...current])
    }
    setModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    await deleteProduct(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Todos los productos</div>
        <div className="button-row">
          <button className="btn-outline" type="button">
            <i className="ti ti-download" /> Exportar
          </button>
          <button className="btn-primary" type="button" onClick={openCreate}>
            <i className="ti ti-plus" /> Nuevo producto
          </button>
        </div>
      </div>

      <div className="filters-row">
        <input
          type="text"
          className="form-input small"
          placeholder="Buscar producto…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="form-input small" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Todas las categorías</option>
          <option value="Veladora">Veladora</option>
          <option value="Veladora Especial">Veladora Especial</option>
          <option value="Pebetero">Pebetero</option>
          <option value="Vela Lisa">Vela Lisa</option>
          <option value="Vela Acanalada">Vela Acanalada</option>
          <option value="Vela Aromatizada">Vela Aromatizada</option>
          <option value="Vela Personalizada">Vela Personalizada</option>
          <option value="Parafina">Parafina</option>
        </select>
        <select className="form-input small" value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
          <option value="">Todos los estados</option>
          <option value="success">En stock</option>
          <option value="danger">Sin stock</option>
          <option value="warning">Stock bajo</option>
        </select>
        <select className="form-input small" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="name">Ordenar: nombre A-Z</option>
          <option value="ref">Ordenar: referencia</option>
          <option value="price">Ordenar: precio ↑</option>
          <option value="stock">Ordenar: stock ↓</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Disponibilidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((product) => {
              const state = getProductState(product)
              return (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb">🕯️</div>
                      <div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-sku">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{product.category}</span></td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>{product.stock > product.minStock ? 'Disponible' : 'Bajo mínimo'}</td>
                  <td>
                    <span className={`badge ${stateClass(state)}`}>
                      {state === 'success' ? 'En stock' : state === 'warning' ? 'Stock bajo' : 'Sin stock'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" className="icon-btn ghost" onClick={() => openEdit(product)}>
                        <i className="ti ti-edit" />
                      </button>
                      <button type="button" className="icon-btn ghost danger" onClick={() => handleDelete(product.id)}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">{editingId !== null ? 'Editar producto' : 'Nuevo producto'}</div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Referencia *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.sku}
                    onChange={(event) => setForm({ ...form, sku: event.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select className="form-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    <option value="Veladora">Veladora</option>
                    <option value="Veladora Especial">Veladora Especial</option>
                    <option value="Pebetero">Pebetero</option>
                    <option value="Vela Lisa">Vela Lisa</option>
                    <option value="Vela Acanalada">Vela Acanalada</option>
                    <option value="Vela Aromatizada">Vela Aromatizada</option>
                    <option value="Vela Personalizada">Vela Personalizada</option>
                    <option value="Parafina">Parafina</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio ($) *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stock inicial *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={form.stock}
                    onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock mínimo</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={form.minStock}
                    onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Medidas</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.measures}
                    onChange={(event) => setForm({ ...form, measures: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Presentación</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.presentation}
                    onChange={(event) => setForm({ ...form, presentation: event.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Colores</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.colors}
                  onChange={(event) => setForm({ ...form, colors: event.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input textarea"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  <i className="ti ti-check" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])

  useEffect(() => {
    fetchStock().then(setItems)
  }, [])

  return (
    <>
      <div className="alert-bar">
        <i className="ti ti-alert-triangle" /> Hay 3 productos por debajo del stock mínimo.
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock actual</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.stock}</td>
                <td>{item.minStock}</td>
                <td>
                  <span className={`badge ${stateClass(getProductState(item))}`}>
                    {item.stock <= item.minStock ? 'Revisar' : 'OK'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function EntriesPage() {
  const [entries, setEntries] = useState<Array<{ id: number; product: string; quantity: number; type: string; date: string }>>([])

  useEffect(() => {
    setEntries([
      { id: 1, product: 'Vela Lavanda & Vainilla', quantity: 40, type: 'Compra', date: '2026-08-24' },
      { id: 2, product: 'Vela Coco & Sándalo', quantity: 25, type: 'Ajuste', date: '2026-08-22' },
      { id: 3, product: 'Vela Eucalipto Natural', quantity: 18, type: 'Producción', date: '2026-08-20' },
    ])
  }, [])

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Tipo</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.product}</td>
              <td>{entry.quantity}</td>
              <td>{entry.type}</td>
              <td>{entry.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    fetchSales().then(setSales)
  }, [])

  return (
    <>
      <div className="section-header">
        <div className="section-title">Registro de ventas</div>
        <button type="button" className="btn-primary">
          <i className="ti ti-plus" /> Nueva venta
        </button>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.customer}</td>
                <td>{sale.product}</td>
                <td>{formatCurrency(sale.total)}</td>
                <td><span className="badge badge-success">{sale.status}</span></td>
                <td>{sale.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null)

  useEffect(() => {
    fetchReports().then(setReport)
  }, [])

  if (!report) return <LoadingState />

  return (
    <>
      <div className="metrics-grid">
        {report.cards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Ingresos</th>
              <th>Ganancia</th>
              <th>Margen</th>
            </tr>
          </thead>
          <tbody>
            {report.table.map((row) => (
              <tr key={row.period}>
                <td>{row.period}</td>
                <td>{formatCurrency(row.income)}</td>
                <td>{formatCurrency(row.profit)}</td>
                <td>{row.margin}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UserForm>({
    name: '',
    initials: '',
    email: '',
    password: '',
    role: 'normal',
    estado: 'activo',
  })

  useEffect(() => {
    fetchUsers().then(setUsers)
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', initials: '', email: '', password: '', role: 'normal', estado: 'activo' })
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingId(user.id)
    setForm({
      name: user.name,
      initials: user.initials || '',
      email: user.email,
      password: '',
      role: user.role,
      estado: user.estado,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.email || !form.password && editingId === null) return

    if (editingId !== null) {
      const updated = await updateUser(editingId, form)
      setUsers((current) => current.map((item) => (item.id === editingId ? updated : item)))
    } else {
      const created = await createUser(form)
      setUsers((current) => [created, ...current])
    }

    setModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    await deleteUser(id)
    setUsers((current) => current.filter((user) => user.id !== id))
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Administradores del sistema</div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <i className="ti ti-user-plus" /> Crear usuario
        </button>
      </div>

      <div className="users-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-card-top">
              <div className="user-avatar large">{user.initials || user.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            </div>
            <div className="user-meta">
              <span className={`badge ${user.role === 'supremo' ? 'badge-success' : 'badge-neutral'}`}>
                {user.role === 'supremo' ? 'Supremo' : 'Normal'}
              </span>
              <span>{user.estado}</span>
            </div>
            <div className="action-buttons spaced">
              <button type="button" className="btn-outline" onClick={() => openEdit(user)}>Editar</button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(user.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">{editingId !== null ? 'Editar usuario' : 'Crear usuario'}</div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Iniciales</label>
                  <input className="form-input" value={form.initials} onChange={(event) => setForm({ ...form, initials: event.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo electrónico *</label>
                <input type="email" className="form-input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contraseña *</label>
                  <input type="password" className="form-input" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol *</label>
                  <select className="form-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as User['role'] })}>
                    <option value="normal">Admin Normal</option>
                    <option value="supremo">Admin Supremo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-input" value={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.value as User['estado'] })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    fetchAudit().then(setEntries)
  }, [])

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Modulo</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.user}</td>
              <td>{entry.action}</td>
              <td>{entry.module}</td>
              <td>{entry.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MetricCard({ metric }: { metric: DashboardData['metrics'][number] }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{metric.label}</div>
      <div className="metric-value">{metric.value}</div>
      <div className="metric-sub">
        <i className={`ti ${metric.icon}`} />
        <span className={metric.trendType}>{metric.subtext}</span>
      </div>
    </div>
  )
}

function LoadingState() {
  return <div className="empty-state">Cargando información...</div>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function getProductState(product: Pick<Product, 'stock' | 'minStock'>) {
  if (product.stock <= 0) return 'danger'
  if (product.stock <= product.minStock) return 'warning'
  return 'success'
}

function stateClass(state: 'success' | 'warning' | 'danger') {
  return {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
  }[state]
}

function emptyProductForm(): ProductForm {
  return {
    name: '',
    sku: '',
    category: 'Veladora',
    price: 0,
    stock: 0,
    minStock: 10,
    measures: '',
    presentation: '',
    colors: '',
    description: '',
    status: 'active',
  }
}

export default App
