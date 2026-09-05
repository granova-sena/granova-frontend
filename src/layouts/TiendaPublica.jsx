import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import LogoGranova from '../components/ui/LogoGranova'

const EASE = [0.22, 1, 0.36, 1]

export default function TiendaPublica({ children }) {
  const navigate = useNavigate()
  const [logueado, setLogueado] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    const checar = () => setLogueado(Boolean(localStorage.getItem('token_cliente')))
    checar()
    window.addEventListener('storage', checar)
    window.addEventListener('focus', checar)
    return () => {
      window.removeEventListener('storage', checar)
      window.removeEventListener('focus', checar)
    }
  }, [])

  const navLinks = [
    { texto: 'Inicio', ruta: '/' },
    { texto: 'Catálogo', ruta: '/catalogo' },
    { texto: 'Empresas', ruta: '/cliente/empresas' },
  ]

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a1a0a' }}>
      <header className="sticky top-0 z-40 h-16 flex items-center border-b border-white/10" style={{ background: '#0a1a0a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between gap-3">
          <Link to="/" aria-label="Ir al inicio">
            <LogoGranova tamano="sm" />
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((l) => (
              <Link key={l.ruta} to={l.ruta} className="text-sm text-white/70 hover:text-[#9DC9B4] transition">
                {l.texto}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {logueado ? (
              <button
                type="button"
                onClick={() => navigate('/cliente')}
                className="text-sm px-4 py-2 rounded-lg bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition"
              >
                Mi cuenta
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm px-4 py-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition"
              >
                Ingresar
              </button>
            )}

            <button
              type="button"
              className="lg:hidden text-white/70 hover:text-white transition p-1 ml-1"
              onClick={() => setMenuAbierto(!menuAbierto)}
              aria-label="Abrir menú"
            >
              {menuAbierto ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="lg:hidden absolute top-full left-0 right-0 overflow-hidden border-t border-white/10 px-4 pb-4 flex flex-col gap-1 pt-3"
              style={{ background: '#0a1a0a' }}
            >
              {navLinks.map((l) => (
                <Link
                  key={l.ruta}
                  to={l.ruta}
                  onClick={() => setMenuAbierto(false)}
                  className="text-sm text-white/70 hover:text-[#9DC9B4] transition py-2.5"
                >
                  {l.texto}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {children}
    </div>
  )
}