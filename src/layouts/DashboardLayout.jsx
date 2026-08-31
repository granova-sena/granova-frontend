import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import * as ReactJoyride from 'react-joyride'
import { jwtDecode } from 'jwt-decode'
import AsistenteWidget from '../components/AsistenteWidget'
import '../panel-tema.css'

const { Joyride, STATUS, EVENTS } = ReactJoyride

function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [seccionesAbiertas, setSeccionesAbiertas] = useState([])

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
      content: 'Aquí ves el resumen general del negocio: ingresos, costos y qué tan rentable va todo.',
      placement: 'right',
    },
    {
      target: '.menu-usuarios',
      content: 'Aquí administras los empleados que operan el sistema.',
      placement: 'right',
    },
    {
      target: '.grupo-pedidos',
      content: 'Aquí gestionas cada pedido de principio a fin: aceptarlo, empacarlo, enviarlo, entregarlo y cobrar el pago manual.',
      placement: 'right',
      abrirGrupo: 'pedidos',
    },
    {
      target: '.grupo-inventario',
      content: 'Aquí controlas el stock de productos y las alertas de inventario bajo.',
      placement: 'right',
      abrirGrupo: 'inventario',
    },
    {
      target: '.grupo-ventas',
      content: 'Aquí está todo lo de Ventas: registro de ventas y reportes. Haz clic para desplegar las opciones.',
      placement: 'right',
      abrirGrupo: 'ventas',
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
      const grupo = pasos[index].abrirGrupo
      setSeccionesAbiertas((prev) => (prev.includes(grupo) ? prev : [...prev, grupo]))
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
      label: 'Empleados',
      path: '/dashboard/empleados',
      clase: 'menu-usuarios',
    },
  ]

  const menuGrupos = [
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
        { label: 'Gestión de pedidos', path: '/dashboard/pedidos', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) },
        { label: 'Envíos', path: '/dashboard/envios', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/></svg>
          ) },
        { label: 'Transportadoras', path: '/dashboard/transportadoras', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
          ) },
      ],
    },
    {
      id: 'ventas',
      titulo: 'Ventas',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      items: [
        { label: 'Registro de ventas', path: '/dashboard/ventas', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) },
        { label: 'Reportes', path: '/dashboard/reportes', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) },
        { label: 'Promociones', path: '/dashboard/promociones', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
          ) },
        { label: 'Reseñas', path: '/dashboard/resenas', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
          ) },
      ],
    },
    {
      id: 'inventario',
      titulo: 'Inventario',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
      items: [
        { label: 'Stock de productos', path: '/dashboard/inventario', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
          ) },
        { label: 'Alertas de stock', path: '/dashboard/inventario/alertas', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) },
      ],
    },
  ]

  // Si la ruta activa vive dentro de un grupo, ese grupo debe abrirse solo al cargar/navegar.
  useEffect(() => {
    const grupoActivo = menuGrupos.find((g) => g.items.some((item) => item.path === location.pathname))
    if (grupoActivo) {
      setSeccionesAbiertas((prev) => (prev.includes(grupoActivo.id) ? prev : [...prev, grupoActivo.id]))
    }
  }, [location.pathname])

  function toggleGrupo(id) {
    setSeccionesAbiertas((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const handleNavigate = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  function handleLogout() {
    localStorage.removeItem('token_empleado')
    localStorage.removeItem('usuario')
    localStorage.removeItem('cliente')
    navigate('/control-interno')
  }

  const token = localStorage.getItem('token_empleado')
  let nombreAdmin = 'Administrador'
  if (token) {
    try {
      const decoded = jwtDecode(token)
      nombreAdmin = decoded.nombre || decoded.email || 'Administrador'
    } catch {
      // Token inválido o corrupto: seguimos con el nombre por defecto
    }
  }

  const TITULOS_NAV = {
    '/dashboard': 'Dashboard',
    '/dashboard/empleados': 'Empleados',
    '/dashboard/pedidos': 'Gestión de pedidos',
    '/dashboard/envios': 'Envíos',
    '/dashboard/transportadoras': 'Transportadoras',
    '/dashboard/ventas': 'Registro de ventas',
    '/dashboard/reportes': 'Reportes',
    '/dashboard/promociones': 'Promociones',
    '/dashboard/resenas': 'Reseñas',
    '/dashboard/inventario/alertas': 'Alertas de stock',
    '/dashboard/inventario': 'Stock de productos',
  }
  const tituloSeccion = TITULOS_NAV[location.pathname] || 'Dashboard'
  const fechaHoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  // Sistema de vidrio compartido — cambia según modo claro/oscuro
  // Por defecto arranca en oscuro (estética Granova); respeta la preferencia guardada.
  const [modoOscuro, setModoOscuro] = useState(() => {
    const guardado = localStorage.getItem('modoOscuro')
    if (guardado !== null) return guardado === 'true'
    const legado = localStorage.getItem('granova_modo_oscuro')
    return legado ? legado === '1' : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modoOscuro)
    localStorage.setItem('modoOscuro', String(modoOscuro))
  }, [modoOscuro])

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

      <div className="relative flex h-screen overflow-hidden" style={{ background: modoOscuro ? 'linear-gradient(160deg, #0b130f 0%, #0f1a15 100%)' : 'linear-gradient(160deg, #EAF1EC 0%, #DCE7DF 100%)' }}>

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
    onKeyDown={(e) => { if (e.key === 'Escape') setSidebarOpen(false) }}
    role="button"
    tabIndex={0}
    aria-label="Cerrar menú"
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
            <span className="sidebar-logo text-lg font-medium tracking-tight" style={{ color: modoOscuro ? '#eafff2' : '#1F2A24' }}>Granova</span>
            <span className="text-xs ml-1" style={{ color: modoOscuro ? 'rgba(234,255,242,0.35)' : 'rgba(31,42,36,0.35)' }}>Admin</span>
          </div>

          {/* Menú */}
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            {menuPrincipal.map((item) => {
              const activo = location.pathname === item.path
              return (
                <button
                            type="button"
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-lg text-sm transition-all duration-200 text-left"
                  style={
                    activo
                      ? { background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontWeight: 500 }
                      : { background: 'transparent', color: modoOscuro ? 'rgba(234,255,242,0.55)' : 'rgba(31,42,36,0.55)' }
                  }
                  onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(20,40,32,0.05)' }}
                  onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = 'transparent' }}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}

            <div className="h-px my-2" style={{ background: modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(20,40,32,0.08)' }} />

            {menuGrupos.map((grupo) => {
              const abierto = seccionesAbiertas.includes(grupo.id)
              const grupoTieneActivo = grupo.items.some((item) => item.path === location.pathname)
              return (
                <div key={grupo.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggleGrupo(grupo.id)}
                    className={`grupo-${grupo.id} flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200`}
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
                  onClick={() => handleNavigate(item.path)}
                  className={`${item.clase || ''} flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200`}
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

          {/* Usuario */}
          <div
            className="px-3 py-3 mb-2 rounded-2xl"
            style={modoOscuro
              ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
              : { background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.12)' }
            }
          >
            <p className="text-xs mb-0.5" style={{ color: modoOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(31,42,36,0.4)' }}>Sesión activa</p>
            <p className="text-sm truncate" style={{ color: modoOscuro ? 'rgba(255,255,255,0.85)' : 'rgba(31,42,36,0.8)' }}>{nombreAdmin}</p>
          </div>

          {/* Modo oscuro */}
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

          {/* Cerrar sesión */}
          <button
            type="button"
            onClick={handleLogout}
            className="boton-cerrar-sesion flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
            style={{
              color: '#dc2626',
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.45)',
              boxShadow: '0 0 0 1px rgba(220,38,38,0.12), 0 0 10px rgba(220,38,38,0.35)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.14)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(220,38,38,0.2), 0 0 16px rgba(220,38,38,0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(220,38,38,0.12), 0 0 10px rgba(220,38,38,0.35)' }}
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
            <button type="button" onClick={() => setSidebarOpen(true)} className="transition" style={{ color: modoOscuro ? 'rgba(234,255,242,0.6)' : 'rgba(31,42,36,0.6)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="text-base font-medium" style={{ color: modoOscuro ? '#eafff2' : '#1F2A24' }}>Granova Admin</span>
            <div className="w-6" />
          </header>

          {/* Outlet */}
          <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">

            {/* Cabecera de orientación en escritorio */}
            <div className="hidden lg:flex items-end justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Granova Admin</p>
                <h1 className="text-lg font-semibold tracking-tight text-admin-heading">{tituloSeccion}</h1>
              </div>
              <div className="flex items-center gap-3 pb-0.5">
                <span className="text-xs text-gray-500 capitalize">{fechaHoy}</span>
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                  style={{ background: '#1D9E75', boxShadow: '0 4px 12px rgba(29,158,117,0.35)' }}
                >
                  {String(nombreAdmin.charAt(0)).toUpperCase()}
                </span>
              </div>
            </div>

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