import { useState, useEffect } from 'react'
import api from '../services/api'

const ROLES = ['empleado', 'gerente', 'admin']

const rolLabel = { admin: 'Admin', gerente: 'Gerente', empleado: 'Empleado' }
const rolBadge = {
  admin: 'bg-[#e8f9ee] text-[#2c7b4b]',
  gerente: 'bg-[#eef2fb] text-[#3a4fb0]',
  empleado: 'bg-[#f1f5f2] text-[#5f7268]',
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
      alert(err.response?.data?.error || 'No se pudo cambiar el estado.')
    }
  }

  const deleteUser = async (id) => {
    setMenuOpenId(null)
    if (!confirm('¿Eliminar este usuario? Podrás verlo de nuevo solo si lo restauras desde la base de datos.')) return
    try {
      await api.delete(`/usuarios/${id}`)
      setUsers(prev => prev.filter(u => u.id_usuario !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el usuario.')
    }
  }

  const crearUsuario = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!form.nombre || !form.apellido || !form.email || !form.contraseña) {
      setFormError('Completa todos los campos.')
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

  return (
    <div>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#f7fffb]">Gestión de usuarios</h1>
          <p className="text-[#5f7268] mt-1 text-sm">Administra los usuarios y sus roles dentro de Granova</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition w-full sm:w-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Agregar usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          Error al cargar usuarios: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <div className="panel-card rounded-xl p-4">
          <p className="text-xs text-[#5f7268]">Total usuarios</p>
          <p className="text-2xl font-semibold text-[#11261d] mt-1">{users.length}</p>
        </div>
        <div className="panel-card rounded-xl p-4">
          <p className="text-xs text-[#5f7268]">Activos</p>
          <p className="text-2xl font-semibold text-[#16a65a] mt-1">{users.filter(u => u.estado === 'activo').length}</p>
        </div>
        <div className="panel-card rounded-xl p-4">
          <p className="text-xs text-[#5f7268]">Administradores</p>
          <p className="text-2xl font-semibold text-[#11261d] mt-1">{users.filter(u => u.rol === 'admin').length}</p>
        </div>
      </div>

      <div className="panel-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-[#e7f0e8] bg-[rgba(247,255,249,0.8)]">
              <th className="text-left px-6 py-3 font-medium text-[#5f7268]">Nombre</th>
              <th className="text-left px-6 py-3 font-medium text-[#5f7268]">Correo</th>
              <th className="text-left px-6 py-3 font-medium text-[#5f7268]">Rol</th>
              <th className="text-left px-6 py-3 font-medium text-[#5f7268]">Estado</th>
              <th className="text-left px-6 py-3 font-medium text-[#5f7268]">Registro</th>
              <th className="text-right px-6 py-3 font-medium text-[#5f7268]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 px-6 text-center text-[#5f7268]">Cargando usuarios...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 px-6 text-center text-[#5f7268]">No hay usuarios registrados.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id_usuario} className="row-hover border-b border-[#eef4ef] transition-colors">
                  <td className="px-6 py-3.5 text-[#11261d] font-medium">{user.nombre} {user.apellido}</td>
                  <td className="px-6 py-3.5 text-[#5f7268]">{user.email}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rolBadge[user.rol] || 'bg-[#f1f5f2] text-[#5f7268]'}`}>
                      {rolLabel[user.rol] || user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => toggleStatus(user.id_usuario)}
                      className="toggle-bg relative w-11 h-6 rounded-full"
                      style={{ background: user.estado === 'activo' ? '#2fe37e' : '#d1d5db' }}
                    >
                      <span
                        className="toggle-dot absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                        style={{ transform: user.estado === 'activo' ? 'translateX(20px)' : 'translateX(0)' }}
                      ></span>
                    </button>
                  </td>
                  <td className="px-6 py-3.5 text-[#5f7268]">{formatFecha(user.fecha_creacion)}</td>
                  <td className="px-6 py-3.5 text-right relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === user.id_usuario ? null : user.id_usuario)}
                      className="p-1.5 hover:bg-[#f2f7f2] rounded-lg transition"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="6" r="1.5" fill="#6b7280"/>
                        <circle cx="12" cy="12" r="1.5" fill="#6b7280"/>
                        <circle cx="12" cy="18" r="1.5" fill="#6b7280"/>
                      </svg>
                    </button>

                    {menuOpenId === user.id_usuario && (
                      <div className="fade-in absolute right-6 top-10 bg-white rounded-xl shadow-lg border border-[#e7f0e8] py-1 w-36 z-10 text-left">
                        <button
                          onClick={() => deleteUser(user.id_usuario)}
                          className="w-full text-left px-4 py-2 text-sm text-[#A32D2D] hover:bg-red-50 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="modal-in panel-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[#11261d] mb-4">Agregar nuevo usuario</h3>

            <form onSubmit={crearUsuario}>
              {formError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-[#5f7268] mb-1.5">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#5f7268] mb-1.5">Apellido</label>
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm text-[#5f7268] mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-[#5f7268] mb-1.5">Contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.contraseña}
                  onChange={(e) => setForm({ ...form, contraseña: e.target.value })}
                  className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm text-[#5f7268] mb-1.5">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition"
                >
                  {ROLES.map(r => <option key={r} value={r}>{rolLabel[r]}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-2.5 rounded-xl text-sm font-medium transition">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventario
