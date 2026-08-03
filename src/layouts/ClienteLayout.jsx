import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import AsistenteWidgetCliente from '../components/AsistenteWidgetCliente'

const ENLACES = [
  { to: '/cliente', label: 'Inicio', end: true },
  { to: '/cliente/catalogo', label: 'Catálogo' },
  { to: '/cliente/pedidos', label: 'Mis pedidos' },
  { to: '/cliente/promociones', label: 'Promociones' },
]

function ClienteLayout() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cuentaOpen, setCuentaOpen] = useState(false)
  const cuentaRef = useRef(null)

  const cliente = (() => {
    try {
      return JSON.parse(localStorage.getItem('cliente')) || {}
    } catch {
      return {}
    }
  })()

  const inicial = (cliente.nombre || 'C').charAt(0).toUpperCase()

  useEffect(() => {
    function cerrarSiClicFuera(e) {
      if (cuentaRef.current && !cuentaRef.current.contains(e.target)) {
        setCuentaOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrarSiClicFuera)
    return () => document.removeEventListener('mousedown', cerrarSiClicFuera)
  }, [])

  function cerrarSesion() {
    localStorage.removeItem('token')
    localStorage.removeItem('cliente')
    navigate('/')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      {/* NAVBAR */}
      <nav
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ background: 'rgba(10,26,10,0.85)', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 sm:gap-10">
            <button onClick={() => navigate('/cliente')} className="flex items-center gap-2.5 shrink-0">
              <span className="w-9 h-9 rounded-full bg-[#6FA98C] flex items-center justify-center p-[7px] shrink-0">
                <img src={logo} alt="Granova" className="w-full h-full object-contain" />
              </span>
              <span className="text-[#E1F5EE] text-lg font-medium tracking-tight">Granova</span>
            </button>
            <div className="hidden md:flex items-center gap-7">
              {ENLACES.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className="text-sm transition">
                  {({ isActive }) => (
                    <span className={`relative pb-5 -mb-5 ${isActive ? 'text-white font-medium' : 'text-white/50 hover:text-white'}`}>
                      {l.label}
                      {isActive && <span className="absolute left-0 right-0 bottom-[18px] h-[2px] bg-[#6FA98C] rounded-full"></span>}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cuenta (desktop) */}
            <div className="relative hidden md:block" ref={cuentaRef}>
              <button
                onClick={() => setCuentaOpen((o) => !o)}
                className="w-9 h-9 rounded-full bg-[#6FA98C] text-white text-sm font-semibold flex items-center justify-center hover:bg-[#4F8A70] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0a]"
              >
                {inicial}
              </button>
              {cuentaOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden py-1"
                  style={{ background: 'rgba(20,40,20,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <p className="px-4 py-2 text-xs text-white/40 truncate border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{cliente.email}</p>
                  <button
                    onClick={() => { setCuentaOpen(false); navigate('/cliente/cuenta') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                  >
                    Mi cuenta
                  </button>
                  <button
                    onClick={cerrarSesion}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#D85A30] hover:bg-white/10 transition"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            {/* Hamburguesa móvil */}
            <button className="md:hidden text-white/70 hover:text-white transition p-2" onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {menuOpen && (
          <div
            className="md:hidden backdrop-blur-md border-t px-4 sm:px-6 py-4 flex flex-col gap-1"
            style={{ background: 'rgba(10,26,10,0.98)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {ENLACES.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `text-sm py-2.5 transition ${isActive ? 'text-white font-medium' : 'text-white/60'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex flex-col gap-1 pt-2 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => { setMenuOpen(false); navigate('/cliente/cuenta') }}
                className="text-left text-sm py-2.5 text-white/60"
              >
                Mi cuenta
              </button>
              <button onClick={cerrarSesion} className="text-left text-sm py-2.5 text-[#D85A30]">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      <Outlet />
      <AsistenteWidgetCliente />
    </div>
  )
}

export default ClienteLayout