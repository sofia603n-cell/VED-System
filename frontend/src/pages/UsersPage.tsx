import { useEffect, useMemo, useState } from 'react'
import { createUser, deleteUser, fetchSales, fetchUsers, updateUser } from '../api/mockApi'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { UserFormModal } from '../components/users/UserFormModal'
import { UserSummary } from '../components/users/UserSummary'
import { UserTable } from '../components/users/UserTable'
import { useToast } from '../context/ToastContext'
import type { Sale, User, UserForm } from '../types'

function buildUserStats(users: User[], sales: Sale[]) {
  const byUser = new Map<number, number>()
  for (const sale of sales) if (sale.sellerId) byUser.set(sale.sellerId, (byUser.get(sale.sellerId) ?? 0) + 1)
  return users.map((user) => ({ ...user, salesCount: byUser.get(user.id) ?? 0, lastAccess: 'Sin registro' }))
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [query, setQuery] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const { success, warning, info } = useToast()
  const [form, setForm] = useState<UserForm>({ dni: '', name: '', initials: '', email: '', password: '', role: 'normal', estado: 'activo' })

  useEffect(() => { void Promise.all([fetchUsers(), fetchSales()]).then(([usersFromApi, salesFromApi]) => { setUsers(usersFromApi); setSales(salesFromApi) }) }, [])
  const enrichedUsers = useMemo(() => buildUserStats(users, sales), [sales, users])
  const filteredUsers = useMemo(() => { const search = query.trim().toLowerCase(); return !search ? enrichedUsers : enrichedUsers.filter((user) => [user.name, user.email, user.dni || '', user.role, user.estado].join(' ').toLowerCase().includes(search)) }, [enrichedUsers, query])
  const summary = useMemo(() => ({ active: filteredUsers.filter((user) => user.estado === 'activo').length, superAdmins: filteredUsers.filter((user) => user.role === 'supremo').length, admins: filteredUsers.filter((user) => user.role === 'normal').length }), [filteredUsers])

  const openCreate = () => { setEditingId(null); setForm({ dni: '', name: '', initials: '', email: '', password: '', role: 'normal', estado: 'activo' }); setModalOpen(true) }
  const openEdit = (user: User) => { setEditingId(user.id); setForm({ dni: user.dni || '', name: user.name, initials: user.initials || '', email: user.email, password: '', role: user.role, estado: user.estado }); setModalOpen(true) }
  const handleSubmit = async (event: React.FormEvent) => { event.preventDefault(); if (!form.name || !form.email || !form.dni || (!form.password && editingId === null)) return; if (form.password && form.password.length < 4) { warning('La contraseña debe tener al menos 4 caracteres.', 'Revisa el formulario'); return }; setSaving(true); try { if (editingId !== null) { const updated = await updateUser(editingId, form); setUsers((current) => current.map((item) => item.id === editingId ? updated : item)); success(`Usuario "${form.name}" actualizado correctamente`, 'Usuario Modificado') } else { const created = await createUser(form); setUsers((current) => [created, ...current]); success(`Usuario "${form.name}" creado con éxito`, 'Nuevo Usuario') }; setModalOpen(false) } catch (caught) { warning(caught instanceof Error ? caught.message : 'No fue posible guardar el usuario.', 'Error al guardar') } finally { setSaving(false) } }
  const toggleUserStatus = async (user: User) => { const nextStatus = user.estado === 'activo' ? 'inactivo' : 'activo'; const updated = await updateUser(user.id, { dni: user.dni || '', name: user.name, initials: user.initials || '', email: user.email, role: user.role, estado: nextStatus }); setUsers((current) => current.map((item) => item.id === user.id ? updated : item)); info(`El usuario ${user.name} ahora está ${nextStatus.toUpperCase()}`, 'Estado Actualizado') }
  const confirmDelete = async () => { if (!userToDelete) return; await deleteUser(userToDelete.id); setUsers((current) => current.filter((item) => item.id !== userToDelete.id)); warning(`El usuario "${userToDelete.name}" fue eliminado del sistema`, 'Usuario Eliminado'); setUserToDelete(null) }
  const handleExportCSV = () => { const rows = [['DNI / Documento', 'Nombre Completo', 'Correo Electrónico', 'Rol de Acceso', 'Estado', 'Último Acceso'], ...filteredUsers.map((user) => [user.dni || '', user.name, user.email, user.role === 'supremo' ? 'Super Administrador' : 'Administrador', user.estado, user.lastAccess])]; const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })); link.download = `usuarios_${new Date().toISOString().slice(0, 10)}.csv`; link.click(); info('Listado de usuarios exportado a CSV', 'Descarga Completa') }

  return <>
    <div className="section-header"><div><h2 className="section-title">Control de Usuarios & Accesos</h2><span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Administración del personal autorizado y permisos del taller</span></div><div style={{ display: 'flex', gap: '8px' }}><button type="button" className="btn-outline" onClick={handleExportCSV}><i className="ti ti-download" /> Exportar CSV</button><button type="button" className="btn-primary" onClick={openCreate}><i className="ti ti-user-plus" /> Nuevo Usuario</button></div></div>
    <UserSummary active={summary.active} superAdmins={summary.superAdmins} admins={summary.admins} />
    <div className="filters-row"><input type="text" className="form-input" style={{ maxWidth: '320px' }} placeholder="Buscar por nombre, correo, DNI o rol..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <UserTable users={filteredUsers} onToggleStatus={toggleUserStatus} onEdit={openEdit} onDelete={setUserToDelete} />
    <UserFormModal open={isModalOpen} editing={editingId !== null} saving={saving} form={form} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} onChange={setForm} />
    <ConfirmModal isOpen={userToDelete !== null} danger title="¿Eliminar este usuario?" message={`Esta acción removerá los permisos de acceso para ${userToDelete?.name} (${userToDelete?.email}).`} confirmText="Sí, eliminar usuario" cancelText="Cancelar" onConfirm={confirmDelete} onCancel={() => setUserToDelete(null)} />
  </>
}
