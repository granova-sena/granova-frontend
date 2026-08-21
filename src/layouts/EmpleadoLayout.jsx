import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'

function EmpleadoLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modoOscuro') === 'true')
  const [misReportes, setMisReportes] = useState([])
  const [mostrarReportes, setMostrarReportes] = useState(false)

  useEffect(() => {
    api.get('/empleados/mis-reportes')
      .then((res) => setMisReportes(res.data.reportes))
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem('modoOscuro', String(modoOscuro))
  }, [modoOscuro])

  const token = localStorage.getItem('token')
  let nombreEmpleado = 'Empleado'
  if (token) {
    try {
      nombreEmpleado = jwtDecode(token).nombre || 'Empleado'
    } catch {
      nombreEmpleado = 'Empleado'
    }
  }

  const menu = [
    { label: 'Control de inventario', path: '/panel-empleado' },
    { label: 'Control de lotes', path: '/panel-empleado/lotes' },
    { label: 'Pedidos', path: '/panel-empleado/pedidos' },
    { label: 'Ventas', path: '/panel-empleado/ventas' },
  ]

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/control-interno')
  }

  const glass = modoOscuro ? {
    background: 'rgba(17,28,23,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    boxShadow: '0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  } : {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(20,40,32,0.14)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    boxShadow: '0 8px 28px rgba(20,40,32,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
  }

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: modoOscuro ? 'linear-gradient(160deg, #0b130f 0%, #0f1a15 100%)' : 'linear-gradient(160deg, #EAF1EC 0%, #DCE7DF 100%)' }}>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setSidebarOpen(false) }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 flex flex-col py-6 px-4 z-40 m-0 lg:my-3 lg:ml-3 lg:rounded-3xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={glass}
      >
        <div className="flex items-center gap-2 px-3 mb-8">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 text-white"
            style={{ background: '#1D9E75', boxShadow: '0 4px 12px rgba(29,158,117,0.35)' }}
          >
            G
          </span>
          <span className="text-lg font-medium tracking-tight" style={{ color: modoOscuro ? '#eafff2' : '#1F2A24' }}>Granova</span>
          <span className="text-xs ml-1" style={{ color: modoOscuro ? 'rgba(234,255,242,0.35)' : 'rgba(31,42,36,0.35)' }}>Empleado</span>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
          {menu.map((item) => {
            const activo = location.pathname === item.path
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-lg text-sm transition-all duration-200 text-left"
                style={
                  activo
                    ? { background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontWeight: 500 }
                    : { background: 'transparent', color: modoOscuro ? 'rgba(234,255,242,0.55)' : 'rgba(31,42,36,0.55)' }
                }
                onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(20,40,32,0.05)' }}
                onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = 'transparent' }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div
          className="px-3 py-3 mb-2 rounded-2xl"
          style={modoOscuro
            ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
            : { background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.12)' }
          }
        >
          <p className="text-xs mb-0.5" style={{ color: modoOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(31,42,36,0.4)' }}>Sesión activa</p>
          <p className="text-sm truncate" style={{ color: modoOscuro ? 'rgba(255,255,255,0.85)' : 'rgba(31,42,36,0.8)' }}>{nombreEmpleado}</p>
          {misReportes.length > 0 && (
            <button
              type="button"
              onClick={() => setMostrarReportes(true)}
              className="text-xs mt-1.5 underline"
              style={{ color: modoOscuro ? '#fca5a5' : '#b91c1c' }}
            >
              {misReportes.length} reporte{misReportes.length === 1 ? '' : 's'} en tu cuenta
            </button>
          )}
        </div>

        {mostrarReportes && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setMostrarReportes(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-semibold text-[#1F2A24] mb-1">Tus reportes</h2>
              <p className="text-xs text-gray-400 mb-4">Los deja el administrador, no se pueden borrar desde aquí.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {misReportes.map((r) => (
                  <div key={r.id_reporte} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-[#1F2A24]">{r.motivo}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {r.creado_por_nombre || 'Admin'} · {new Date(r.fecha).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={() => setMostrarReportes(false)} className="w-full mt-4 text-sm px-4 py-2 rounded-lg text-gray-400">Cerrar</button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setModoOscuro((v) => !v)}
          className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl text-sm transition-all duration-200"
          style={{
            color: modoOscuro ? '#e8f5ee' : '#1F2A24',
            background: modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(20,40,32,0.06)',
            border: modoOscuro ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(20,40,32,0.12)',
          }}
        >
          {modoOscuro ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Modo claro
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
              Modo oscuro
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
          style={{
            color: '#dc2626',
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.45)',
            boxShadow: '0 0 0 1px rgba(220,38,38,0.12), 0 0 10px rgba(220,38,38,0.35)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.14)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Cerrar sesión
        </button>
      </aside>

      <div className="relative flex-1 flex flex-col overflow-hidden">
        <header
          className="lg:hidden flex items-center justify-between px-4 py-4 m-3 rounded-2xl"
          style={glass}
        >
          <button type="button" onClick={() => setSidebarOpen(true)} style={{ color: modoOscuro ? 'rgba(234,255,242,0.6)' : 'rgba(31,42,36,0.6)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-base font-medium" style={{ color: modoOscuro ? '#eafff2' : '#1F2A24' }}>Granova Empleado</span>
          <div className="w-6" />
        </header>

        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default EmpleadoLayout
