import type { User } from '../../types'

interface UserRow extends User {
  lastAccess: string
}

interface UserTableProps {
  users: UserRow[]
  onToggleStatus: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function UserTable({ users, onToggleStatus, onEdit, onDelete }: UserTableProps) {
  return (
    <div className="table-card">
      <table>
        <thead><tr><th>Personal</th><th>Documento (DNI)</th><th>Rol del Sistema</th><th>Estado</th><th>Último Ingreso</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
        <tbody>
          {users.map((user) => {
            const isSuper = user.role === 'supremo'
            const isActive = user.estado === 'activo'
            return (
              <tr key={user.id}>
                <td><div className="product-cell"><div className={`user-avatar ${isSuper ? 'avatar-super' : ''}`} style={{ width: '36px', height: '36px' }}>{user.initials || user.name.slice(0, 2).toUpperCase()}</div><div><div className="product-name">{user.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</div></div></div></td>
                <td><span style={{ fontFamily: 'monospace' }}>{user.dni || 'Sin DNI'}</span></td>
                <td><span className={`role-badge ${isSuper ? 'badge-gold' : 'badge-subtle'}`}><i className={`ti ${isSuper ? 'ti-crown' : 'ti-shield-check'}`} /> {isSuper ? 'Super Admin' : 'Admin'}</span></td>
                <td><button type="button" onClick={() => onToggleStatus(user)} className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer', border: 'none' }}><i className={`ti ${isActive ? 'ti-check' : 'ti-ban'}`} /> {isActive ? 'Activo' : 'Inactivo'}</button></td>
                <td><span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{user.lastAccess}</span></td>
                <td style={{ textAlign: 'right' }}><div style={{ display: 'inline-flex', gap: '6px' }}><button type="button" className="icon-action-btn" onClick={() => onEdit(user)} title="Editar usuario"><i className="ti ti-edit" /></button><button type="button" className="icon-action-btn delete" onClick={() => onDelete(user)} title="Eliminar usuario" disabled={user.email === 'ana@velas.test'}><i className="ti ti-trash" /></button></div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
