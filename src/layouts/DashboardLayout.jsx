import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import * as ReactJoyride from 'react-joyride'
import { jwtDecode } from 'jwt-decode'
import AsistenteWidget from '../components/AsistenteWidget'

const { Joyride, STATUS, EVENTS } = ReactJoyride

function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [seccionAbierta, setSeccionAbierta] = useState(null)

  const [correrTutorial, setCorrerTutorial] = useState(() => {
    return !localStorage.getItem('tutorial_completado')
  })
  const [modalAbiertoEnPagina, setModalAbiertoEnPagina] = useState(false)

  useEffect(() => {
    function manejarEventoModal(e) {
      setModalAbiertoEnPagina(!!e.detail?.abierto)
    }
    window.addEventListener('granova:modal', manejarEventoModal)
    return () => window.removeEventListener('granova:modal', manejarEventoModal)
  }, [])

  const pasos = [
    {
      target: '.sidebar-logo',
      content: '¡Bienvenido al Panel Administrativo de Granova! Desde aquí controlas todo el negocio.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.menu-dashboard',
      content: 'Aquí ves el resumen general del negocio: usuarios, pedidos, inventario, todo de un vistazo.',
      placement: 'right',
    },
    {
      target: '.menu-usuarios',
      content: 'Gestiona los usuarios del sistema — puedes ver, editar y administrar roles.',
      placement: 'right',
    },
    {
      target: '.grupo-ventas',
      content: 'Aquí está todo lo de Ventas: registro de ventas y reportes. Haz clic para desplegar las opciones.',
      placement: 'right',
      abrirGrupo: 'ventas',
    },
    {
      target: '.grupo-pedidos',
      content: 'En Pedidos gestionas las órdenes, los envíos y las transportadoras que trabajan con Granova.',
      placement: 'right',
      abrirGrupo: 'pedidos',
    },
    {
      target: '.grupo-inventario',
      content: 'Y en Inventario controlas el stock disponible y las alertas de productos por agotarse.',
      placement: 'right',
      abrirGrupo: 'inventario',
    },
    {
      target: '.boton-cerrar-sesion',
      content: 'Cuando termines, cierra sesión aquí para proteger tu cuenta.',
      placement: 'right',
    },
  ]

  function handleTutorialFinalizado(data) {
    const { status, type, index } = data

    // Cuando el tour está a punto de mostrar un paso que apunta a un grupo colapsable,
    // lo abrimos automáticamente para que el usuario vea las opciones reales, no un botón cerrado.
    if (type === EVENTS.STEP_BEFORE && pasos[index]?.abrirGrupo) {
      setSeccionAbierta(pasos[index].abrirGrupo)
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem('tutorial_completado', 'true')
      setCorrerTutorial(false)
    }
  }

  const menuPrincipal = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      label: 'Dashboard',
      path: '/dashboard',
      clase: 'menu-dashboard',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      label: 'Usuarios',
      path: '/dashboard/usuarios',
      clase: 'menu-usuarios',
    },
  ]

  const menuGrupos = [
    {
      id: 'ventas',
      titulo: 'Ventas',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      items: [
        { label: 'Registro de ventas', path: '/dashboard/ventas' },
        { label: 'Reportes', path: '/dashboard/reportes' },
      ],
    },
    {
      id: 'pedidos',
      titulo: 'Pedidos',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 8l-9-5-9 5 9 5 9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M3 8v8l9 5 9-5V8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M12 13v8" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      items: [
        { label: 'Gestión de pedidos', path: '/dashboard/pedidos' },
        { label: 'Envíos', path: '/dashboard/envios' },
        { label: 'Transportadoras', path: '/dashboard/transportadoras' },
      ],
    },
    {
      id: 'inventario',
      titulo: 'Inventario',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 9h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M17 9h2a3 3 0 0 1 0 6h-2" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 2v3M10 2v3M14 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      items: [
        { label: 'Control de stock', path: '/dashboard/inventario' },
        { label: 'Alertas de stock', path: '/dashboard/inventario/alertas' },
      ],
    },
  ]

  // Si la ruta activa vive dentro de un grupo, ese grupo debe abrirse solo al cargar/navegar.
  useEffect(() => {
    const grupoActivo = menuGrupos.find((g) => g.items.some((item) => item.path === location.pathname))
    if (grupoActivo) setSeccionAbierta(grupoActivo.id)
  }, [location.pathname])

  function toggleGrupo(id) {
    setSeccionAbierta((actual) => (actual === id ? null : id))
  }

  const handleNavigate = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('cliente')
    navigate('/control-interno')
  }

  const token = localStorage.getItem('token')
  let nombreAdmin = 'Administrador'
  if (token) {
    try {
      const decoded = jwtDecode(token)
      nombreAdmin = decoded.nombre || decoded.email || 'Administrador'
    } catch (e) {}
  }

  // Sistema de vidrio compartido — tema claro
  const glass = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(20,40,32,0.14)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    boxShadow: '0 8px 28px rgba(20,40,32,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
  }

  return (
    <>
      <Joyride
        steps={pasos}
        run={correrTutorial && !modalAbiertoEnPagina}
        continuous
        showSkipButton
        showProgress
        callback={handleTutorialFinalizado}
        styles={{
          options: {
            primaryColor: '#1D9E75',
            backgroundColor: '#ffffff',
            textColor: '#1F2A24',
            arrowColor: '#ffffff',
            zIndex: 20,
          },
          tooltip: {
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(20,40,32,0.15)',
          },
          buttonNext: {
            backgroundColor: '#1D9E75',
            borderRadius: '8px',
          },
          buttonSkip: {
            color: '#8A9A93',
          },
        }}
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: '¡Listo!',
          next: 'Siguiente',
          skip: 'Saltar tutorial',
        }}
      />

      <div className="relative flex h-screen overflow-hidden" style={{ background: 'linear-gradient(160deg, #EAF1EC 0%, #DCE7DF 100%)' }}>

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-[-10rem] right-[-8rem] w-[30rem] h-[30rem] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)' }}
          />
        </div>

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed lg:static top-0 left-0 h-full w-64 flex flex-col py-6 px-4 z-40 m-0 lg:my-3 lg:ml-3 lg:rounded-3xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={glass}
        >

          {/* Logo */}
          <div className="flex items-center gap-2 px-3 mb-8">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 text-white"
              style={{ background: '#1D9E75', boxShadow: '0 4px 12px rgba(29,158,117,0.35)' }}
            >
              G
            </span>
            <span className="sidebar-logo text-[#1F2A24] text-lg font-medium tracking-tight">Granova</span>
            <span className="text-xs text-[#1F2A24]/35 ml-1">Admin</span>
          </div>

          {/* Menú */}
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            {menuPrincipal.map((item) => {
              const activo = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`${item.clase || ''} flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200`}
                  style={
                    activo
                      ? { background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontWeight: 500 }
                      : { background: 'transparent', color: 'rgba(31,42,36,0.55)' }
                  }
                  onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = 'rgba(20,40,32,0.05)' }}
                  onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = 'transparent' }}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}

            <div className="h-px my-2" style={{ background: 'rgba(20,40,32,0.08)' }} />

            {menuGrupos.map((grupo) => {
              const abierto = seccionAbierta === grupo.id
              const grupoTieneActivo = grupo.items.some((item) => item.path === location.pathname)
              return (
                <div key={grupo.id} className="flex flex-col">
                  <button
                    onClick={() => toggleGrupo(grupo.id)}
                    className={`grupo-${grupo.id} flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200`}
                    style={
                      grupoTieneActivo && !abierto
                        ? { background: 'rgba(29,158,117,0.08)', color: '#1D9E75', fontWeight: 500 }
                        : { background: 'transparent', color: 'rgba(31,42,36,0.55)' }
                    }
                    onMouseEnter={(e) => { if (!grupoTieneActivo) e.currentTarget.style.background = 'rgba(20,40,32,0.05)' }}
                    onMouseLeave={(e) => { if (!(grupoTieneActivo && !abierto)) e.currentTarget.style.background = 'transparent' }}
                  >
                    {grupo.icon}
                    <span className="flex-1 text-left">{grupo.titulo}</span>
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
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-lg text-sm transition-all duration-200 text-left"
                            style={{
                              borderLeft: activo ? '2px solid #1D9E75' : '2px solid rgba(20,40,32,0.10)',
                              color: activo ? '#1D9E75' : 'rgba(31,42,36,0.55)',
                              fontWeight: activo ? 500 : 400,
                              background: activo ? 'rgba(29,158,117,0.08)' : 'transparent',
                            }}
                            onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = 'rgba(20,40,32,0.05)' }}
                            onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = 'transparent' }}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Usuario */}
          <div
            className="px-3 py-3 mb-2 rounded-2xl"
            style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.12)' }}
          >
            <p className="text-xs text-[#1F2A24]/40 mb-0.5">Sesión activa</p>
            <p className="text-sm text-[#1F2A24]/80 truncate">{nombreAdmin}</p>
          </div>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="boton-cerrar-sesion flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
            style={{ color: 'rgba(31,42,36,0.55)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#dc2626' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(31,42,36,0.55)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesión
          </button>

        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative flex-1 flex flex-col overflow-hidden">

          {/* Header móvil */}
          <header
            className="lg:hidden flex items-center justify-between px-4 py-4 m-3 rounded-2xl"
            style={glass}
          >
            <button onClick={() => setSidebarOpen(true)} className="text-[#1F2A24]/60 hover:text-[#1F2A24] transition">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="text-[#1F2A24] text-base font-medium">Granova Admin</span>
            <div className="w-6" />
          </header>

          {/* Outlet */}
          <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

        </div>

      </div>

      {/* Widget flotante del Asistente IA — visible en cualquier página del dashboard */}
      <AsistenteWidget />
    </>
  )
}

export default DashboardLayout