import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import registerBg from '../assets/register-bg.mp4'
import logo from '../assets/logo.png'
import toast from 'react-hot-toast'
import { API_URL } from "../config";

function AdminLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', contraseña: '' })
  const [cargando, setCargando] = useState(false)
  const [verContraseña, setVerContraseña] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleLogin(e) {
    e.preventDefault()
    toast.dismiss('error-admin')

    if (!formData.email.trim() || !formData.contraseña) {
      toast.error('Completa tu correo y contraseña', { id: 'error-admin' })
      return
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    if (!emailValido) {
      toast.error('Ingresa un correo electrónico válido', { id: 'error-admin' })
      return
    }

    setCargando(true)

    try {
      const respuesta = await fetch(`${API_URL}/auth/login-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          contraseña: formData.contraseña,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.error(datos.error || 'Error al iniciar sesión', { id: 'error-admin' })
        return
      }

      localStorage.setItem('token', datos.token)
      localStorage.setItem('usuario', JSON.stringify(datos.usuario))
      navigate('/dashboard')
    } catch (error) {
      toast.error('No se pudo conectar con el servidor', { id: 'error-admin' })
    } finally {
      setCargando(false)
    }
  }

  const IconoOjo = ({ ver }) => ver ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-y-auto px-4 py-10">

      <video autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={registerBg}
      />
      <div className="absolute inset-0 bg-[#0a1a0a]/80"></div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl p-6 sm:p-8 my-auto"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}>

        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <img src={logo} alt="Granova" className="w-8 h-8 sm:w-9 sm:h-9 object-contain object-top flex-shrink-0" />
          <span className="text-[#E1F5EE] text-base sm:text-lg font-medium tracking-tight text-center">Panel Administrativo</span>
        </div>

        <form onSubmit={handleLogin}>

          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-1.5">Correo</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@granova.com"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>

          <div className="mb-2 relative">
            <label className="block text-sm text-white/70 mb-1.5">Contraseña</label>
            <input
              type={verContraseña ? 'text' : 'password'}
              name="contraseña"
              value={formData.contraseña}
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

          <p
            className="text-right text-xs text-[#5DCAA5] mb-6 cursor-pointer hover:underline"
            onClick={() => navigate('/olvide-password-admin')}
          >
            ¿Olvidaste tu contraseña?
          </p>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-medium hover:bg-[#0F6E56] transition disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

        </form>

      </div>
    </div>
  )
}

export default AdminLogin