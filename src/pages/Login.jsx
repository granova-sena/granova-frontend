// GRN-21 - Pantalla de Login de Granova
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import logo from '../assets/logo.png'
import registerBg from '../assets/register-bg.mp4'
import toast from 'react-hot-toast'
import { API_URL, FRONTEND_URL } from "../config";

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [verContraseña, setVerContraseña] = useState(false)
  const loginEnCurso = useRef(false)

  const [formData, setFormData] = useState({
    email: '',
    contraseña: ''
  })

  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (loginEnCurso.current) return

    setError('')

    toast.dismiss()

    if (!formData.email.trim() || !formData.contraseña.trim()) {
      toast.error('Todos los campos son obligatorios')
      return
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

    if (!emailValido) {
      toast.error('Ingresa un correo electrónico válido')
      return
    }

    loginEnCurso.current = true
    setLoading(true)

    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          contraseña: formData.contraseña,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.dismiss()
        toast.error(
          datos.error || 'Error al iniciar sesion'
        )
        return
      }

      toast.dismiss()

      localStorage.setItem('token', datos.token)
      localStorage.setItem(
        'cliente',
        JSON.stringify(datos.cliente)
      )

      navigate('/cliente')

    } catch (error) {
      console.error('Error en Login:', error)
      toast.dismiss()
      toast.error('Error al iniciar sesion')
    } finally {
      setLoading(false)
      loginEnCurso.current = false
    }
  }

  function iniciarLoginGoogle() {
    const ancho = 480
    const alto = 600
    const izquierda = (window.screen.width - ancho) / 2
    const arriba = (window.screen.height - alto) / 2

    const popup = window.open(
      `${API_URL}/auth/google`,
      'googleLogin',
      `width=${ancho},height=${alto},left=${izquierda},top=${arriba}`
    )

    if (!popup) {
      toast.error('Tu navegador bloqueó la ventana de Google. Habilita los popups e intenta de nuevo.')
      return
    }

    function manejarMensaje(evento) {
      if (evento.origin !== FRONTEND_URL) return

      const { token, cliente, error } = evento.data

      if (error) {
        toast.dismiss()
        toast.error(error)
        window.removeEventListener(
          'message',
          manejarMensaje
        )
        popup.close()
        return
      }

      if (token && cliente) {
        localStorage.setItem('token', token)
        localStorage.setItem('cliente', cliente)

        window.removeEventListener(
          'message',
          manejarMensaje
        )

        popup.close()
        navigate('/cliente')
      }
    }

    window.addEventListener(
      'message',
      manejarMensaje
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .spinner {
          animation: spin 0.6s linear infinite;
        }

        .input-glow:focus {
          box-shadow: 0 0 0 3px rgba(29, 158, 117, 0.15);
        }
      `}</style>

      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={registerBg}
      />

      <div className="absolute inset-0 bg-[#0a1a0a]/75"></div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition"
      >
        ← Volver
      </button>

      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8 my-10"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)'
        }}
      >

        <div className="flex items-center justify-center gap-2 mb-8">

          <img
            src={logo}
            alt="Granova logo"
            className="w-9 h-9 object-contain object-top"
          />

          <span className="text-[#E1F5EE] text-xl font-medium tracking-tight">
            Granova
          </span>

        </div>

        <h2 className="text-2xl font-medium text-white mb-1 text-center">
          Bienvenido de nuevo
        </h2>

        <p className="text-sm text-white/60 mb-8 text-center">
          Inicia sesión en tu cuenta de Granova
        </p>

        <form onSubmit={handleLogin}>

          <button
            type="button"
            onClick={iniciarLoginGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm text-white hover:bg-white/10 transition mb-6"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />

              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 1 9 18z"
              />

              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />

              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>

            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-6">

            <div className="flex-1 h-px bg-white/15"></div>

            <span className="text-xs text-white/40">
              o continúa con tu correo
            </span>

            <div className="flex-1 h-px bg-white/15"></div>

          </div>

          <div className="mb-4">

            <label className="block text-sm text-white/70 mb-1.5">
              Correo electrónico
            </label>

            <input
              type="email"
              value={formData.email}
              onChange={handleChange}
              name="email"
              placeholder="tucorreo@ejemplo.com"
              className="input-glow w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            />

          </div>

          <div className="mb-6 relative">

            <label className="block text-sm text-white/70 mb-1.5">
              Contraseña
            </label>

            <input
              type={verContraseña ? 'text' : 'password'}
              name="contraseña"
              value={formData.contraseña}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition pr-10"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            />

            <button
              type="button"
              onClick={() =>
                setVerContraseña(!verContraseña)
              }
              className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
            >
              {verContraseña ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <path
                    d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <line
                    x1="1"
                    y1="1"
                    x2="23"
                    y2="23"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>

          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">
              {error}
            </p>
          )}

          <p
            className="text-right text-xs text-[#9DC9B4] mb-6 cursor-pointer hover:underline"
            onClick={() =>
              navigate('/olvide-password')
            }
          >
            ¿Olvidaste tu contraseña?
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition mb-6 flex items-center justify-center gap-2 disabled:opacity-80"
          >
            {loading ? (
              <>
                <svg
                  className="spinner"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="3"
                    strokeOpacity="0.3"
                  />

                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          <p className="text-center text-sm text-white/50">

            ¿No tienes cuenta?{' '}

            <span
              className="text-[#9DC9B4] cursor-pointer hover:underline"
              onClick={() => navigate('/register')}
            >
              Regístrate aquí
            </span>

          </p>

        </form>

      </div>

    </div>
  )
}

export default Login