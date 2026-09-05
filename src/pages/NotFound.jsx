import { useNavigate } from 'react-router-dom'
import LogoGranova from '../components/ui/LogoGranova'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-white text-center" style={{ background: '#0a1a0a' }}>
      <div className="mb-8">
        <LogoGranova />
      </div>

      <p className="text-[10px] font-bold text-[#6FA98C] uppercase tracking-[0.25em] mb-3 font-mono">Error 404</p>
      <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">Página no encontrada</h1>
      <p className="text-sm sm:text-base text-white/50 max-w-md mb-8">
        El enlace que seguiste no existe o se movió. Vuelve al inicio o explora el catálogo.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-7 py-3.5 bg-[#6FA98C] hover:bg-[#4F8A70] text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
        >
          ← Volver al inicio
        </button>
        <button
          type="button"
          onClick={() => navigate('/catalogo')}
          className="px-7 py-3.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/[0.04] text-sm transition"
        >
          Ver el catálogo
        </button>
      </div>
    </div>
  )
}

export default NotFound