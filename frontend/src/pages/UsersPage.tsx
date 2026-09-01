import { useEffect, useMemo, useState } from 'react'
import { createUser, deleteUser, fetchSales, fetchUsers, updateUser } from '../api/mockApi'
import type { Sale, User, UserForm } from '../types'

const DEFAULT_ACCESS = ['Hace 2 horas', 'Hoy 09:30', 'Hace 1 día', 'Ayer 18:10', 'Hace 3 horas']

function buildUserStats(users: User[], sales: Sale[]) {
  const byUser = new Map<number, number>()

  for (const sale of sales) {
    const saleUser = Number(sale.id) % Math.max(users.length, 1)
    byUser.set(saleUser, (byUser.get(saleUser) ?? 0) + 1)
  }

  return users.map((user, index) => ({
    ...user,
    salesCount: byUser.get(user.id) ?? Math.max(2, (index + 2) * 3),
    lastAccess: DEFAULT_ACCESS[index % DEFAULT_ACCESS.length],
  }))
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [query, setQuery] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UserForm>({
    nombre_usuario: '',
    apellidos_usuario: '',
    usuario_login: '',
    documento: '',
    rol: 'admin',
    correo: '',
    telefono: '',
    direccion: '',
    id_ciudad: 0,
    password: '',
    estado: 'Activo',
    activo: true,
  })

  useEffect(() => {
    Promise.all([fetchUsers(), fetchSales()]).then(([usersFromApi, salesFromApi]) => {
      setUsers(usersFromApi)
      setSales(salesFromApi)
    })
  }, [])

  const enrichedUsers = useMemo(() => buildUserStats(users, sales), [sales, users])

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return enrichedUsers

    return enrichedUsers.filter((user) => [user.name, user.email, user.initials || '', user.estado, String(user.salesCount), user.lastAccess].join(' ').toLowerCase().includes(search))
  }, [enrichedUsers, query])

  const summary = useMemo(() => {
    const active = filteredUsers.filter((user) => user.estado === 'activo').length
    const highAccess = filteredUsers.filter((user) => user.salesCount >= 10).length
    const totalSales = filteredUsers.reduce((sum, user) => sum + user.salesCount, 0)

    return {
      active,
      highAccess,
      totalSales,
    }
  }, [filteredUsers])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      nombre_usuario: '',
      apellidos_usuario: '',
      usuario_login: '',
      documento: '',
      rol: 'admin',
      correo: '',
      telefono: '',
      direccion: '',
      id_ciudad: 0,
      password: '',
      estado: 'Activo',
      activo: true,
    })
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingId(user.id)
    setForm({
      nombre_usuario: user.name.split(' ')[0] || '',
      apellidos_usuario: user.name.split(' ').slice(1).join(' ') || '',
      usuario_login: (user.email || '').split('@')[0] || '',
      documento: user.dni || '',
      rol: user.role === 'supremo' ? 'super_admin' : 'admin',
      correo: user.email,
      telefono: '',
      direccion: '',
      id_ciudad: 0,
      password: '',
      estado: user.estado === 'inactivo' ? 'Inactivo' : 'Activo',
      activo: user.estado !== 'inactivo',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.nombre_usuario || !form.apellidos_usuario || !form.usuario_login || !form.documento || !form.correo || (!form.password && editingId === null)) return

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

      <div className="filters-row users-filter-row">
        <input
          type="text"
          className="form-input small"
          placeholder="Buscar usuario, ventas o último acceso…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="users-summary-grid">
        <div className="user-summary-card primary">
          <span><i className="ti ti-users" /> Activos</span>
          <strong>{summary.active}</strong>
          <small>Usuarios en línea</small>
        </div>
        <div className="user-summary-card success">
          <span><i className="ti ti-chart-bar" /> Destacados</span>
          <strong>{summary.highAccess}</strong>
          <small>Con alto volumen</small>
        </div>
        <div className="user-summary-card warning">
          <span><i className="ti ti-bag" /> Ventas</span>
          <strong>{summary.totalSales}</strong>
          <small>Total registrado</small>
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-card-top">
              <div className="user-avatar large">{user.initials || user.name.slice(0, 2).toUpperCase()}</div>
              <div className="user-card-copy">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            </div>
            <div className="user-meta">
              <span className={`badge ${user.role === 'supremo' ? 'badge-success' : 'badge-neutral'}`}>
                {user.role === 'supremo' ? 'Supremo' : 'Normal'}
              </span>
              <span className={`user-state ${user.estado === 'activo' ? 'active' : 'inactive'}`}>{user.estado}</span>
            </div>
            <div className="user-stats-list">
              <div>
                <span>Ventas</span>
                <strong>{user.salesCount}</strong>
              </div>
              <div>
                <span>Último acceso</span>
                <strong>{user.lastAccess}</strong>
              </div>
            </div>
            <div className="action-buttons spaced">
              <button type="button" className="btn-outline" onClick={() => openEdit(user)}>Editar</button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(user.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 ? <div className="empty-state">No se encontraron usuarios con ese filtro.</div> : null}

      {isModalOpen ? (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">{editingId !== null ? 'Editar usuario' : 'Crear usuario'}</div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre usuario *</label>
                  <input className="form-input" value={form.nombre_usuario} onChange={(event) => setForm({ ...form, nombre_usuario: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos usuario *</label>
                  <input className="form-input" value={form.apellidos_usuario} onChange={(event) => setForm({ ...form, apellidos_usuario: event.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Usuario login *</label>
                  <input className="form-input" value={form.usuario_login} onChange={(event) => setForm({ ...form, usuario_login: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Documento *</label>
                  <input type="text" className="form-input" value={form.documento} onChange={(event) => setForm({ ...form, documento: event.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rol *</label>
                  <select className="form-input" value={form.rol} onChange={(event) => setForm({ ...form, rol: event.target.value as UserForm['rol'] })}>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Correo *</label>
                  <input type="email" className="form-input" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input type="text" className="form-input" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input type="text" className="form-input" value={form.direccion} onChange={(event) => setForm({ ...form, direccion: event.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">id_ciudad</label>
                  <input type="number" min={0} className="form-input" value={form.id_ciudad} onChange={(event) => setForm({ ...form, id_ciudad: Number(event.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-input" value={form.estado} onChange={(event) => {
                    const nextEstado = event.target.value as UserForm['estado']
                    setForm({ ...form, estado: nextEstado, activo: nextEstado === 'Activo' })
                  }}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Activo</label>
                  <input
                    type="checkbox"
                    className="form-input"
                    checked={form.activo}
                    onChange={(event) => setForm({ ...form, activo: event.target.checked, estado: event.target.checked ? 'Activo' : 'Inactivo' })}
                  />
                </div>
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
