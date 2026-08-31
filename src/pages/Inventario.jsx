import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { existeDuplicado } from '../utils/validacion'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'

const ROLES = ['empleado', 'gerente', 'admin']

const rolLabel = { admin: 'Admin', gerente: 'Gerente', empleado: 'Empleado' }
const rolBadge = {
  admin: 'bg-green-100 text-green-700',
  gerente: 'bg-sky-100 text-sky-700',
  empleado: 'bg-gray-100 text-gray-600',
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO')
}

function Inventario() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [formError, setFormError] = useState(null)
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', contraseña: '', rol: 'empleado' })

  const cargarUsuarios = () => {
    setLoading(true)
    api.get('/usuarios')
      .then(res => setUsers(res.data.usuarios))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const toggleStatus = async (id) => {
    try {
      const res = await api.patch(`/usuarios/${id}/estado`)
      setUsers(prev => prev.map(u => u.id_usuario === id ? { ...u, estado: res.data.usuario.estado } : u))
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cambiar el estado.')
    }
  }

  const deleteUser = async () => {
    setConfirmandoEliminar(false)
    if (!eliminandoId) return
    try {
      await api.delete(`/usuarios/${eliminandoId}`)
      setUsers(prev => prev.filter(u => u.id_usuario !== eliminandoId))
      toast.success('Usuario eliminado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el usuario.')
    }
    setEliminandoId(null)
  }

  const crearUsuario = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!form.nombre || !form.apellido || !form.email || !form.contraseña) {
      setFormError('Completa todos los campos.')
      return
    }
    if (existeDuplicado(users, 'email', form.email)) {
      setFormError('Ya existe un usuario con ese correo.')
      return
    }

    setGuardando(true)
    try {
      const res = await api.post('/usuarios', form)
      setUsers(prev => [res.data.usuario, ...prev])
      setShowModal(false)
      setForm({ nombre: '', apellido: '', email: '', contraseña: '', rol: 'empleado' })
    } catch (err) {
      setFormError(err.response?.data?.error || 'No se pudo crear el usuario.')
    } finally {
      setGuardando(false)
    }
  }

  const activos = users.filter(u => u.estado === 'activo').length
  const administradores = users.filter(u => u.rol === 'admin').length

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.2s ease forwards; }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-in { animation: modalIn 0.25s ease forwards; }
        .row-hover:hover { background: rgba(47, 227, 126, 0.07); }
        .toggle-bg { transition: background 0.25s ease; }
        .toggle-dot { transition: transform 0.25s ease; }
      `}</style>

      <PageHeader
        titulo="Gestión de usuarios"
        subtitulo="Administra los usuarios y sus roles dentro de Granova."
        acciones={
          <BotonPrimario onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Agregar usuario
          </BotonPrimario>
        }
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 panel-come">
          Error al cargar usuarios: {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`bg-white rounded-2xl border border-gray-200 p-5 h-24 animate-pulse ${i ? 'hidden sm:block' : ''}`}></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard icono="👥" label="Total usuarios" value={String(users.length)} sub="en el sistema" tono="verde" delay="panel-come-d1" />
          <StatCard icono="✅" label="Activos" value={String(activos)} sub="cuentas operativas" tono="cielo" delay="panel-come-d2" />
          <StatCard icono="🛡️" label="Administradores" value={String(administradores)} sub="con acceso total" tono="violeta" delay="panel-come-d3" />
        </div>
      )}

      <PanelCard className="overflow-x-auto">
        {loading ? (
          <div className="p-5"><PanelSkeleton filas={4} columnas={5} /></div>
        ) : users.length === 0 ? (
          <EmptyState
            icono="👥"
            titulo="No hay usuarios registrados"
            descripcion="Crea el primer usuario para comenzar a gestionar acceso al panel."
          />
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Correo</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Registro</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id_usuario} className="row-hover border-b border-gray-100 last:border-0 transition-colors">
                  <td className="px-5 py-3.5 text-gray-800 font-medium">{user.nombre} {user.apellido}</td>
                  <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rolBadge[user.rol] || 'bg-gray-100 text-gray-600'}`}>
                      {rolLabel[user.rol] || user.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleStatus(user.id_usuario)}
                      className="toggle-bg relative w-11 h-6 rounded-full"
                      style={{ background: user.estado === 'activo' ? '#2fe37e' : '#d1d5db' }}
                      title={user.estado === 'activo' ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                    >
                      <span
                        className="toggle-dot absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                        style={{ transform: user.estado === 'activo' ? 'translateX(20px)' : 'translateX(0)' }}
                      ></span>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatFecha(user.fecha_creacion)}</td>
                  <td className="px-5 py-3.5 text-right relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(menuOpenId === user.id_usuario ? null : user.id_usuario)}
                      className="p-1.5 hover:bg-gray-50 rounded-lg transition"
                      title="Opciones"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="6" r="1.5" fill="#6b7280"/>
                        <circle cx="12" cy="12" r="1.5" fill="#6b7280"/>
                        <circle cx="12" cy="18" r="1.5" fill="#6b7280"/>
                      </svg>
                    </button>

                    {menuOpenId === user.id_usuario && (
                      <div className="fade-in absolute right-6 top-10 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-36 z-10 text-left">
                        <button
                          type="button"
                          onClick={() => { setMenuOpenId(null); setEliminandoId(user.id_usuario); setConfirmandoEliminar(true) }}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PanelCard>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
          onClick={() => setShowModal(false)}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setShowModal(false) }}
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="modal-in panel-card bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-admin-heading mb-4">Agregar nuevo usuario</h3>

            <form onSubmit={crearUsuario}>
              {formError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="nombre-usuario" className="block text-sm text-gray-600 mb-1.5">Nombre</label>
                  <input
                    id="nombre-usuario"
                    type="text"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="apellido-usuario" className="block text-sm text-gray-600 mb-1.5">Apellido</label>
                  <input
                    id="apellido-usuario"
                    type="text"
                    placeholder="Apellido"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email-usuario" className="block text-sm text-gray-600 mb-1.5">Correo electrónico</label>
                <input
                  id="email-usuario"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="password-usuario" className="block text-sm text-gray-600 mb-1.5">Contraseña</label>
                <input
                  id="password-usuario"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.contraseña}
                  onChange={(e) => setForm({ ...form, contraseña: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="rol-usuario" className="block text-sm text-gray-600 mb-1.5">Rol</label>
                <select
                  id="rol-usuario"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition"
                >
                  {ROLES.map(r => <option key={r} value={r}>{rolLabel[r]}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-medium hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={confirmandoEliminar}
        titulo="¿Eliminar este usuario?"
        mensaje="Podrás verlo de nuevo solo si lo restauras desde la base de datos."
        confirmarTexto="Eliminar"
        onConfirmar={deleteUser}
        onCancelar={() => { setConfirmandoEliminar(false); setEliminandoId(null) }}
      />
    </div>
  )
}

export default Inventario