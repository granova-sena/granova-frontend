import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import registerBg from '../assets/register-bg.mp4'
import toast from 'react-hot-toast'
import { API_URL } from "../config";

function IconoOjo({ ver }) {
  if (ver) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

function ResetPasswordAdmin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ nuevaContraseña: '', confirmarContraseña: '' })
  const [token, setToken] = useState('')
  const [cargando, setCargando] = useState(false)
  const [verContraseña, setVerContraseña] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const yaProcesado = useRef(false)

  const [reglasContraseña, setReglasContraseña] = useState({
    longitud: false,
    mayuscula: false,
    numero: false,
    especial: false,
  })

  useEffect(() => {
    if (yaProcesado.current) return
    yaProcesado.current = true

    const params = new URLSearchParams(window.location.search)
    const tokenUrl = params.get('token')

    if (!tokenUrl) {
      toast.error('Enlace inválido', { id: 'error-reset-admin' })
      navigate('/control-interno')
      return
    }

    setToken(tokenUrl)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === 'nuevaContraseña') {
      setReglasContraseña({
        longitud: value.length >= 6,
        mayuscula: /[A-Z]/.test(value),
        numero: /[0-9]/.test(value),
        especial: /[!@#$%^&*(),.?":{}|<>_-]/.test(value),
      })
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    toast.dismiss('error-reset-admin')

    if (!formData.nuevaContraseña || !formData.confirmarContraseña) {
      toast.error('Completa todos los campos', { id: 'error-reset-admin' })
      return
    }

    if (!reglasContraseña.longitud || !reglasContraseña.mayuscula || !reglasContraseña.numero || !reglasContraseña.especial) {
      toast.error('La contraseña no cumple los requisitos de seguridad', { id: 'error-reset-admin' })
      return
    }

    if (formData.nuevaContraseña !== formData.confirmarContraseña) {
      toast.error('Las contraseñas no coinciden', { id: 'error-reset-admin' })
      return
    }

    setCargando(true)

    try {
      const respuesta = await fetch(`${API_URL}/auth/reset-password-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nuevaContraseña: formData.nuevaContraseña,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.error(datos.error || 'Error al restablecer', { id: 'error-reset-admin' })
        return
      }

      toast.success('¡Contraseña actualizada correctamente!')
      setTimeout(() => navigate('/control-interno'), 2000)
    } catch (error) {
      console.error('Error en ResetPasswordAdmin:', error)
      toast.error('No se pudo conectar con el servidor', { id: 'error-reset-admin' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <video autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={registerBg}
      />
      <div className="absolute inset-0 bg-[#0a1a0a]/80"></div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}>

        <div className="flex justify-center mb-6">
          <span className="text-[#E1F5EE] text-2xl font-medium tracking-tight">Granova</span>
        </div>

        <h2 className="text-xl font-medium text-white mb-1 text-center">Nueva contraseña</h2>
        <p className="text-sm text-white/60 mb-6 text-center">Elige una contraseña segura para el panel administrativo</p>

        <form onSubmit={handleReset}>

          {/* Nueva contraseña */}
          <div className="mb-2 relative">
            <label htmlFor="nueva-password-admin" className="block text-sm text-white/70 mb-1.5">Nueva contraseña</label>
            <input
              id="nueva-password-admin"
              type={verContraseña ? 'text' : 'password'}
              name="nuevaContraseña"
              value={formData.nuevaContraseña}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition pr-10"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button
              type="button"
              onClick={() => setVerContraseña(!verContraseña)}
              className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
            >
              <IconoOjo ver={verContraseña} />
            </button>
          </div>

          {/* Reglas de contraseña */}
          <div className="mb-4 space-y-1">
            {!reglasContraseña.longitud && <p className="text-xs text-white/40">○ Mínimo 6 caracteres</p>}
            {!reglasContraseña.mayuscula && <p className="text-xs text-white/40">○ Una letra mayúscula</p>}
            {!reglasContraseña.numero && <p className="text-xs text-white/40">○ Un número</p>}
            {!reglasContraseña.especial && <p className="text-xs text-white/40">○ Un carácter especial</p>}
            {reglasContraseña.longitud && reglasContraseña.mayuscula && reglasContraseña.numero && reglasContraseña.especial && (
              <p className="text-xs text-[#5DCAA5]">✓ Contraseña segura</p>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="mb-6 relative">
            <label htmlFor="confirmar-password-admin" className="block text-sm text-white/70 mb-1.5">Confirmar contraseña</label>
            <input
              id="confirmar-password-admin"
              type={verConfirmar ? 'text' : 'password'}
              name="confirmarContraseña"
              value={formData.confirmarContraseña}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition pr-10"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button
              type="button"
              onClick={() => setVerConfirmar(!verConfirmar)}
              className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
            >
              <IconoOjo ver={verConfirmar} />
            </button>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-medium hover:bg-[#0F6E56] transition disabled:opacity-50"
          >
            {cargando ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>

        </form>

      </div>
    </div>
  )
}

export default ResetPasswordAdmin