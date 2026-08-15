import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import registerBg from '../assets/register-bg.mp4'
import toast from 'react-hot-toast'
import { API_URL } from "../config";


const REGEX_MAYUSCULA = /[A-Z]/
const REGEX_NUMERO = /[0-9]/
const REGEX_ESPECIAL = /[!@#$%^&*(),.?":{}|<>_-]/

function evaluarReglasContraseña(value) {
  return {
    longitud: value.length >= 6,
    mayuscula: REGEX_MAYUSCULA.test(value),
    numero: REGEX_NUMERO.test(value),
    especial: REGEX_ESPECIAL.test(value),
  }
}

function ResetPassword() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ nuevaContraseña: '', confirmarContraseña: '' })
  const [token, setToken] = useState('')
  const [cargando, setCargando] = useState(false)
  const yaProcesado = useRef(false)

  const [verContraseña, setVerContraseña] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [contraseñaFocus, setContraseñaFocus] = useState(false)

  const [reglasContraseña, setReglasContraseña] = useState({
    longitud: false,
    mayuscula: false,
    numero: false,
    especial: false,
  })

  const contraseñaValida = Object.values(reglasContraseña).every(Boolean)
  const confirmarTocado = formData.confirmarContraseña.length > 0
  const contraseñasCoinciden = formData.nuevaContraseña === formData.confirmarContraseña
  const puedeActualizar = contraseñaValida && confirmarTocado && contraseñasCoinciden

  useEffect(() => {
    if (yaProcesado.current) return
    yaProcesado.current = true

    const params = new URLSearchParams(window.location.search)
    const tokenUrl = params.get('token')

    if (!tokenUrl) {
      toast.error('Enlace inválido', { id: 'error-reset' })
      navigate('/')
      return
    }

    setToken(tokenUrl)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === 'nuevaContraseña') {
      setReglasContraseña(evaluarReglasContraseña(value))
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    toast.dismiss('error-reset')

    if (!formData.nuevaContraseña || !formData.confirmarContraseña) {
      toast.error('Completa todos los campos', { id: 'error-reset' })
      return
    }

    if (!contraseñaValida) {
      toast.error('La contraseña no cumple los requisitos de seguridad', { id: 'error-reset' })
      return
    }

    if (!contraseñasCoinciden) {
      toast.error('Las contraseñas no coinciden', { id: 'error-reset' })
      return
    }

    setCargando(true)

    try {
      const respuesta = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nuevaContraseña: formData.nuevaContraseña,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.error(datos.error || 'Error al restablecer', { id: 'error-reset' })
        return
      }

      toast.success('¡Contraseña actualizada correctamente!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      console.error('Error en Reset-Password:', error)
      toast.error('No se pudo conectar con el servidor', { id: 'error-reset' })
    } finally {
      setCargando(false)
    }
  }

  const IconoOjo = ({ ver }) => ver ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

  const reglasLista = [
    { id: 'longitud', label: 'Mínimo 6 caracteres', cumplida: reglasContraseña.longitud },
    { id: 'mayuscula', label: 'Una letra mayúscula', cumplida: reglasContraseña.mayuscula },
    { id: 'numero', label: 'Un número', cumplida: reglasContraseña.numero },
    { id: 'especial', label: 'Un carácter especial', cumplida: reglasContraseña.especial },
  ]

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
        <p className="text-sm text-white/60 mb-6 text-center">Elige una contraseña segura para tu cuenta</p>

        <form onSubmit={handleReset}>
          <div className="mb-2 relative">
            <label htmlFor="nueva-password-reset" className="block text-sm text-white/70 mb-1.5">Nueva contraseña</label>
            <input
              id="nueva-password-reset"
              type={verContraseña ? 'text' : 'password'}
              name="nuevaContraseña"
              value={formData.nuevaContraseña}
              onChange={handleChange}
              onFocus={() => setContraseñaFocus(true)}
              onBlur={() => setContraseñaFocus(false)}
              disabled={cargando}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button
              type="button"
              onClick={() => setVerContraseña(!verContraseña)}
              className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
              tabIndex={-1}
            >
              <IconoOjo ver={verContraseña} />
            </button>
          </div>

          {/* Reglas de contraseña, con desaparición animada */}
          <div className={`overflow-hidden transition-all duration-300 ${(contraseñaFocus || formData.nuevaContraseña) && !contraseñaValida ? 'max-h-32 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}>
            <div className="flex flex-col gap-1 py-1">
              {reglasLista.map((regla) => (
                <div
                  key={regla.id}
                  className={`overflow-hidden transition-all duration-300 ${regla.cumplida ? 'max-h-0 opacity-0' : 'max-h-6 opacity-100'}`}
                >
                  <p className="text-xs text-white/40">○ {regla.label}</p>
                </div>
              ))}
            </div>
          </div>
          {contraseñaValida && formData.nuevaContraseña && (
            <p className="text-xs text-[#1D9E75] mb-4">✓ Contraseña segura</p>
          )}

          <div className="mb-2 relative">
            <label htmlFor="confirmar-password-reset" className="block text-sm text-white/70 mb-1.5">Confirmar contraseña</label>
            <input
              id="confirmar-password-reset"
              type={verConfirmar ? 'text' : 'password'}
              name="confirmarContraseña"
              value={formData.confirmarContraseña}
              onChange={handleChange}
              disabled={cargando}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button
              type="button"
              onClick={() => setVerConfirmar(!verConfirmar)}
              className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
              tabIndex={-1}
            >
              <IconoOjo ver={verConfirmar} />
            </button>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${confirmarTocado && !contraseñasCoinciden ? 'max-h-6 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
            <p className="text-xs text-red-400">Las contraseñas no coinciden</p>
          </div>
          {confirmarTocado && contraseñasCoinciden && (
            <p className="text-xs text-[#1D9E75] mb-6">✓ Coinciden</p>
          )}

          <button
            type="submit"
            disabled={cargando || !puedeActualizar}
            className="w-full py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-medium hover:bg-[#0F6E56] transition disabled:opacity-50 mt-2"
          >
            {cargando ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

      </div>
    </div>
  )
}

export default ResetPassword