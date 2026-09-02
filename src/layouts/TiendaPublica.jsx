import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoGranova from '../components/ui/LogoGranova'

// Header público: se puede ver el catálogo sin cuenta; comprar exige iniciar sesión.
export default function TiendaPublica({ children }) {
  const navigate = useNavigate()
  const [logueado, setLogueado] = useState(false)

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

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a1a0a' }}>
      <header className="sticky top-0 z-40 h-16 flex items-center border-b border-white/10" style={{ background: '#0a1a0a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between gap-3">
          <Link to="/" aria-label="Ir al inicio">
            <LogoGranova tamano="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <Link to="/" className="text-sm text-white/70 hover:text-[#9DC9B4] transition">Inicio</Link>
            <Link to="/catalogo" className="text-sm text-white/70 hover:text-[#9DC9B4] transition">Catálogo</Link>
            <Link to="/registro-empresa" className="text-sm text-white/70 hover:text-[#9DC9B4] transition">Empresas</Link>
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
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}