import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'
import '../panel-tema.css'

function EmpleadoLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modoOscuro, setModoOscuro] = useState(() => {
    const guardado = localStorage.getItem('modoOscuro')
    return guardado !== null ? guardado === 'true' : true
  })
  const [misReportes, setMisReportes] = useState([])
  const [mostrarReportes, setMostrarReportes] = useState(false)

  useEffect(() => {
    api.get('/empleados/mis-reportes')
      .then((res) => setMisReportes(res.data.reportes))
      .catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    localStorage.setItem('modoOscuro', String(modoOscuro))
    document.documentElement.classList.toggle('dark', modoOscuro)
  }, [modoOscuro])

  const token = localStorage.getItem('token_empleado')
  let nombreEmpleado = 'Empleado'
  if (token) {
    try {
      nombreEmpleado = jwtDecode(token).nombre || 'Empleado'
    } catch {
      nombreEmpleado = 'Empleado'
    }
  }

  const TITULOS_NAV = {
    '/panel-empleado': 'Control de inventario',
    '/panel-empleado/cosechas': 'Cosechas planeadas',
    '/panel-empleado/lotes': 'Control de lotes',
    '/panel-empleado/pedidos': 'Pedidos',
    '/panel-empleado/ventas': 'Ventas',
    '/panel-empleado/transportadoras': 'Transportadoras',
    '/panel-empleado/envios': 'Envíos',
    '/panel-empleado/reportes': 'Mis reportes',
  }
  const tituloSeccion = TITULOS_NAV[location.pathname] || 'Panel empleado'
  const fechaHoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  const [seccionesAbiertas, setSeccionesAbiertas] = useState([])

  const menuGrupos = [
    {
      id: 'finca',
      titulo: 'Finca',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
      items: [
        { label: 'Control de inventario', path: '/panel-empleado', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
        ) },
        { label: 'Cosechas planeadas', path: '/panel-empleado/cosechas', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 22h20M1 3l7 7M16 3l-7 7M17 14a5 5 0 0 1-5-5M5 14a5 5 0 0 1 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) },
        { label: 'Control de lotes', path: '/panel-empleado/lotes', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12h20M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
        ) },
      ],
    },
    {
      id: 'operacion',
      titulo: 'Operación',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      items: [
        { label: 'Pedidos', path: '/panel-empleado/pedidos', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        ) },
        { label: 'Ventas', path: '/panel-empleado/ventas', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        ) },
        { label: 'Transportadoras', path: '/panel-empleado/transportadoras', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 8l-9-5-9 5 9 5 9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M3 8v8l9 5 9-5V8M12 13v8" stroke="currentColor" strokeWidth="2"/></svg>
        ) },
        { label: 'Envíos', path: '/panel-empleado/envios', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/></svg>
        ) },
      ],
    },
    {
      id: 'reportes',
      titulo: 'Reportes',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      items: [
        { label: 'Mis reportes', path: '/panel-empleado/reportes', icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) },
      ],
    },
  ]

  function toggleGrupo(id) {
    setSeccionesAbiertas((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  useEffect(() => {
    const grupoActivo = menuGrupos.find((g) => g.items.some((item) => item.path === location.pathname))
    if (grupoActivo) {
      setSeccionesAbiertas((prev) => (prev.includes(grupoActivo.id) ? prev : [...prev, grupoActivo.id]))
    }
  }, [location.pathname])

  function handleLogout() {
    localStorage.removeItem('token_empleado')
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
          {menuGrupos.map((grupo) => {
            const abierto = seccionesAbiertas.includes(grupo.id)
            const grupoTieneActivo = grupo.items.some((item) => item.path === location.pathname)
            return (
              <div key={grupo.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleGrupo(grupo.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                  style={
                    grupoTieneActivo && !abierto
                      ? { background: 'rgba(29,158,117,0.08)', color: '#1D9E75', fontWeight: 500 }
                      : { background: 'transparent', color: modoOscuro ? 'rgba(234,255,242,0.55)' : 'rgba(31,42,36,0.55)' }
                  }
                  onMouseEnter={(e) => { if (!grupoTieneActivo) e.currentTarget.style.background = modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(20,40,32,0.05)' }}
                  onMouseLeave={(e) => { if (!(grupoTieneActivo && !abierto)) e.currentTarget.style.background = 'transparent' }}
                >
                  {grupo.icon}
                  <span className="flex-1 text-left">{grupo.titulo}</span>
                  {grupo.id === 'reportes' && misReportes.length > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ background: 'rgba(220,38,38,0.12)', color: modoOscuro ? '#fca5a5' : '#b91c1c' }}
                    >
                      {misReportes.length}
                    </span>
                  )}
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    className="transition-transform duration-200 flex-shrink-0"
                    style={{ transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: abierto ? `${grupo.items.length * 40 + 8}px` : '0px' }}
                >
                  <div className="flex flex-col gap-0.5 pt-1 pb-1 pl-4">
                    {grupo.items.map((item) => {
                      const activo = location.pathname === item.path
                      return (
                        <button
                          type="button"
                          key={item.path}
                          onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                          style={{
                            borderLeft: activo ? '2px solid #1D9E75' : `2px solid ${modoOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(20,40,32,0.10)'}`,
                            color: activo ? '#1D9E75' : (modoOscuro ? 'rgba(234,255,242,0.55)' : 'rgba(31,42,36,0.55)'),
                            fontWeight: activo ? 500 : 400,
                            background: activo ? 'rgba(29,158,117,0.08)' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(20,40,32,0.05)' }}
                          onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = 'transparent' }}
                        >
                          {item.icon}
                          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
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

          {/* Cabecera de orientación en escritorio */}
          <div className="hidden lg:flex items-end justify-between mb-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Panel empleado · Granova</p>
              <h1 className="text-lg font-semibold tracking-tight text-admin-heading">{tituloSeccion}</h1>
            </div>
            <div className="flex items-center gap-3 pb-0.5">
              <span className="text-xs text-gray-500 capitalize">{fechaHoy}</span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ background: '#1D9E75', boxShadow: '0 4px 12px rgba(29,158,117,0.35)' }}
              >
                {String(nombreEmpleado.charAt(0)).toUpperCase()}
              </span>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default EmpleadoLayout
