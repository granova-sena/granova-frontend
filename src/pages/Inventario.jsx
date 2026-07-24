import { useState } from 'react'

const mockUsers = [
  { id: 1, name: 'Carlos Ramírez', email: 'carlos.ramirez@granova.com', role: 'Admin', status: 'Activo', date: '12/01/2026' },
  { id: 2, name: 'Laura Gómez', email: 'laura.gomez@gmail.com', role: 'Cliente', status: 'Activo', date: '15/02/2026' },
  { id: 3, name: 'Andrés Pérez', email: 'andres.perez@gmail.com', role: 'Cliente', status: 'Inactivo', date: '03/03/2026' },
  { id: 4, name: 'María Torres', email: 'maria.torres@gmail.com', role: 'Cliente', status: 'Activo', date: '20/03/2026' },
  { id: 5, name: 'Jhon Pinzón', email: 'jhon.pinzon@granova.com', role: 'Admin', status: 'Activo', date: '01/04/2026' },
]

function Inventario() {
  const [users, setUsers] = useState(mockUsers)
  const [showModal, setShowModal] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)

  const toggleStatus = (id) => {
    setUsers(users.map(u =>
      u.id === id ? { ...u, status: u.status === 'Activo' ? 'Inactivo' : 'Activo' } : u
    ))
  }

  const deleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id))
    setMenuOpenId(null)
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <div className="panel-card rounded-xl p-4">
          <p className="text-xs text-[#5f7268]">Total usuarios</p>
          <p className="text-2xl font-semibold text-[#11261d] mt-1">{users.length}</p>
        </div>
        <div className="panel-card rounded-xl p-4">
          <p className="text-xs text-[#5f7268]">Activos</p>
          <p className="text-2xl font-semibold text-[#16a65a] mt-1">{users.filter(u => u.status === 'Activo').length}</p>
        </div>
        <div className="panel-card rounded-xl p-4">
          <p className="text-xs text-[#5f7268]">Administradores</p>
          <p className="text-2xl font-semibold text-[#11261d] mt-1">{users.filter(u => u.role === 'Admin').length}</p>
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
            {users.map((user) => (
              <tr key={user.id} className="row-hover border-b border-[#eef4ef] transition-colors">
                <td className="px-6 py-3.5 text-[#11261d] font-medium">{user.name}</td>
                <td className="px-6 py-3.5 text-[#5f7268]">{user.email}</td>
                <td className="px-6 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'Admin' ? 'bg-[#e8f9ee] text-[#2c7b4b]' : 'bg-[#f1f5f2] text-[#5f7268]'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <button
                    onClick={() => toggleStatus(user.id)}
                    className="toggle-bg relative w-11 h-6 rounded-full"
                    style={{ background: user.status === 'Activo' ? '#2fe37e' : '#d1d5db' }}
                  >
                    <span
                      className="toggle-dot absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                      style={{ transform: user.status === 'Activo' ? 'translateX(20px)' : 'translateX(0)' }}
                    ></span>
                  </button>
                </td>
                <td className="px-6 py-3.5 text-[#5f7268]">{user.date}</td>
                <td className="px-6 py-3.5 text-right relative">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === user.id ? null : user.id)}
                    className="p-1.5 hover:bg-[#f2f7f2] rounded-lg transition"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="6" r="1.5" fill="#6b7280"/>
                      <circle cx="12" cy="12" r="1.5" fill="#6b7280"/>
                      <circle cx="12" cy="18" r="1.5" fill="#6b7280"/>
                    </svg>
                  </button>

                  {menuOpenId === user.id && (
                    <div className="fade-in absolute right-6 top-10 bg-white rounded-xl shadow-lg border border-[#e7f0e8] py-1 w-36 z-10 text-left">
                      <button className="w-full text-left px-4 py-2 text-sm text-[#30483b] hover:bg-[#f5fdf7] transition">
                        Editar
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="w-full text-left px-4 py-2 text-sm text-[#A32D2D] hover:bg-red-50 transition"
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="modal-in panel-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[#11261d] mb-4">Agregar nuevo usuario</h3>

            <div className="mb-3">
              <label className="block text-sm text-[#5f7268] mb-1.5">Nombre completo</label>
              <input type="text" placeholder="Nombre del usuario" className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition" />
            </div>

            <div className="mb-3">
              <label className="block text-sm text-[#5f7268] mb-1.5">Correo electrónico</label>
              <input type="email" placeholder="correo@ejemplo.com" className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition" />
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[#5f7268] mb-1.5">Rol</label>
              <select className="input-field w-full px-4 py-2.5 rounded-xl text-sm transition">
                <option>Cliente</option>
                <option>Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-2.5 rounded-xl text-sm font-medium transition">
                Cancelar
              </button>
              <button onClick={() => setShowModal(false)} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-medium transition">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventario