import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import registerBg from '../assets/register-bg.mp4'
import toast from 'react-hot-toast'
import { API_URL } from "../config";


function OlvidePasswordAdmin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    toast.dismiss('error-olvide-admin')

    if (!email.trim()) {
      toast.error('Ingresa tu correo electrónico', { id: 'error-olvide-admin' })
      return
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailValido) {
      toast.error('Ingresa un correo electrónico válido', { id: 'error-olvide-admin' })
      return
    }

    setCargando(true)

    try {
      const respuesta = await fetch(`${API_URL}/auth/recuperar-password-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const datos = await respuesta.json()

      // Antes no se revisaba respuesta.ok, así que un 429/500 se mostraba
      // como si fuera un éxito (fetch no lanza excepción por errores HTTP,
      // solo por fallos de red).
      if (!respuesta.ok) {
        toast.error(datos.error || 'No se pudo enviar el correo', { id: 'error-olvide-admin' })
        return
      }

      toast.success(datos.mensaje || 'Correo enviado correctamente')
      setTimeout(() => navigate('/control-interno'), 3000)
    } catch (error) {
      console.error('Error en OlvidePasswordAdmin:', error)
      toast.error('No se pudo conectar con el servidor', { id: 'error-olvide-admin' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={registerBg} />
      <div className="absolute inset-0 bg-[#0a1a0a]/80"></div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}>

        <div className="flex justify-center mb-6">
          <span className="text-[#E1F5EE] text-2xl font-medium tracking-tight">Granova</span>
        </div>

        <h2 className="text-xl font-medium text-white mb-1 text-center">¿Olvidaste tu contraseña?</h2>
        <p className="text-sm text-white/60 mb-6 text-center">Ingresa tu correo de administrador y te enviaremos un enlace</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm text-white/70 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@granova.com"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>

          <button type="submit" disabled={cargando} className="w-full py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-medium hover:bg-[#0F6E56] transition disabled:opacity-50 mb-4">
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>

          <p className="text-center text-sm text-white/50">
            <span className="text-[#5DCAA5] cursor-pointer hover:underline" onClick={() => navigate('/control-interno')}>
              Volver al panel administrativo
            </span>
          </p>
        </form>

      </div>
    </div>
  )
}

export default OlvidePasswordAdmin