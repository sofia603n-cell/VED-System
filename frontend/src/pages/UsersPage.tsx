import { useEffect, useMemo, useState } from 'react'
import { createUser, deleteUser, fetchSales, fetchUsers, updateUser } from '../api/mockApi'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { useToast } from '../context/ToastContext'
import type { Sale, User, UserForm } from '../types'

const DEFAULT_ACCESS = ['Hace 10 min', 'Hoy 14:20', 'Hoy 09:30', 'Ayer 18:10', 'Hace 2 días']

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
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { success, warning, info } = useToast()

  const [form, setForm] = useState<UserForm>({
    dni: '',
    name: '',
    initials: '',
    email: '',
    password: '',
    role: 'normal',
    estado: 'activo',
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

    return enrichedUsers.filter((user) =>
      [user.name, user.email, user.dni || '', user.role, user.estado].join(' ').toLowerCase().includes(search)
    )
  }, [enrichedUsers, query])

  const summary = useMemo(() => {
    const active = filteredUsers.filter((user) => user.estado === 'activo').length
    const superAdmins = filteredUsers.filter((user) => user.role === 'supremo').length
    const admins = filteredUsers.filter((user) => user.role === 'normal').length

    return { active, superAdmins, admins }
  }, [filteredUsers])

  const openCreate = () => {
    setEditingId(null)
    setForm({ dni: '', name: '', initials: '', email: '', password: '', role: 'normal', estado: 'activo' })
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingId(user.id)
    setForm({
      dni: user.dni || '',
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
    if (!form.name || !form.email || !form.dni || (!form.password && editingId === null)) return

    if (editingId !== null) {
      const updated = await updateUser(editingId, form)
      setUsers((current) => current.map((item) => (item.id === editingId ? updated : item)))
      success(`Usuario "${form.name}" actualizado correctamente`, 'Usuario Modificado')
    } else {
      const created = await createUser(form)
      setUsers((current) => [created, ...current])
      success(`Usuario "${form.name}" creado con éxito`, 'Nuevo Usuario')
    }

    setModalOpen(false)
  }

  const toggleUserStatus = async (user: User) => {
    const nextStatus = user.estado === 'activo' ? 'inactivo' : 'activo'
    const updated = await updateUser(user.id, {
      dni: user.dni || '',
      name: user.name,
      initials: user.initials || '',
      email: user.email,
      role: user.role,
      estado: nextStatus,
    })
    setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)))
    info(`El usuario ${user.name} ahora está ${nextStatus.toUpperCase()}`, 'Estado Actualizado')
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    await deleteUser(userToDelete.id)
    setUsers((current) => current.filter((item) => item.id !== userToDelete.id))
    warning(`El usuario "${userToDelete.name}" fue eliminado del sistema`, 'Usuario Eliminado')
    setUserToDelete(null)
  }

  const handleExportCSV = () => {
    const rows = [
      ['DNI / Documento', 'Nombre Completo', 'Correo Electrónico', 'Rol de Acceso', 'Estado', 'Último Acceso'],
      ...filteredUsers.map((u) => [
        u.dni || '',
        u.name,
        u.email,
        u.role === 'supremo' ? 'Super Administrador' : 'Administrador',
        u.estado,
        u.lastAccess,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `usuarios_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    info('Listado de usuarios exportado a CSV', 'Descarga Completa')
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Control de Usuarios & Accesos</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Administración del personal autorizado y permisos del taller
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-outline" onClick={handleExportCSV}>
            <i className="ti ti-download" /> Exportar CSV
          </button>
          <button type="button" className="btn-primary" onClick={openCreate}>
            <i className="ti ti-user-plus" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Resumen de Usuarios */}
      <div className="stock-summary-grid">
        <div className="stock-summary-card primary">
          <div className="summary-label">Usuarios Activos</div>
          <div className="summary-value">{summary.active}</div>
          <div className="summary-foot">Con acceso habilitado</div>
        </div>
        <div className="stock-summary-card success">
          <div className="summary-label">Super Administradores</div>
          <div className="summary-value">{summary.superAdmins}</div>
          <div className="summary-foot">Control total del sistema</div>
        </div>
        <div className="stock-summary-card warning">
          <div className="summary-label">Administradores Regulares</div>
          <div className="summary-value">{summary.admins}</div>
          <div className="summary-foot">Operación diaria y ventas</div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="filters-row">
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '320px' }}
          placeholder="Buscar por nombre, correo, DNI o rol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Personal</th>
              <th>Documento (DNI)</th>
              <th>Rol del Sistema</th>
              <th>Estado</th>
              <th>Último Ingreso</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const isSuper = user.role === 'supremo'
              const isActive = user.estado === 'activo'

              return (
                <tr key={user.id}>
                  <td>
                    <div className="product-cell">
                      <div
                        className={`user-avatar ${isSuper ? 'avatar-super' : ''}`}
                        style={{ width: '36px', height: '36px' }}
                      >
                        {user.initials || user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="product-name">{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace' }}>{user.dni || 'Sin DNI'}</span>
                  </td>
                  <td>
                    <span className={`role-badge ${isSuper ? 'badge-gold' : 'badge-subtle'}`}>
                      <i className={`ti ${isSuper ? 'ti-crown' : 'ti-shield-check'}`} />
                      {isSuper ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(user)}
                      className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Clic para alternar estado"
                    >
                      <i className={`ti ${isActive ? 'ti-check' : 'ti-ban'}`} />
                      {isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{user.lastAccess}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => openEdit(user)}
                        title="Editar usuario"
                      >
                        <i className="ti ti-edit" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn delete"
                        onClick={() => setUserToDelete(user)}
                        title="Eliminar usuario"
                        disabled={user.email === 'ana@velas.test'}
                      >
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

      {/* Modal Crear / Editar Usuario */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h3>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. Juan Camilo Quintero"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Documento / DNI *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ej. 1020304050"
                      value={form.dni}
                      onChange={(e) => setForm({ ...form, dni: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correo Electrónico *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="ej. juan@velas.test"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      {editingId ? 'Nueva Contraseña (opcional)' : 'Contraseña de Acceso *'}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={editingId === null}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rol Asignado *</label>
                    <select
                      className="form-input"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}
                    >
                      <option value="normal">Administrador Regular</option>
                      <option value="supremo">Super Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado Inicial</label>
                  <select
                    className="form-input"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value as User['estado'] })}
                  >
                    <option value="activo">Activo (Habilitado)</option>
                    <option value="inactivo">Inactivo (Suspendido)</option>
                  </select>
                </div>
              </div>

              <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <i className="ti ti-device-floppy" /> {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={userToDelete !== null}
        danger
        title="¿Eliminar este usuario?"
        message={`Esta acción removerá los permisos de acceso para ${userToDelete?.name} (${userToDelete?.email}).`}
        confirmText="Sí, eliminar usuario"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </>
  )
}
