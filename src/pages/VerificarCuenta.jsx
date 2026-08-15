import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../assets/logo.png'
import { API_URL } from "../config";


function VerificarCuenta() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const yaProcesado = useRef(false)

  const [estado, setEstado] = useState('cargando') // cargando | exito | error | expirado
  const [mensaje, setMensaje] = useState('')
  const [email, setEmail] = useState('')
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  useEffect(() => {
    if (yaProcesado.current) return
    yaProcesado.current = true

    const token = searchParams.get('token')

    if (!token) {
      setEstado('error')
      setMensaje('El enlace de verificación no es válido.')
      return
    }

    async function verificar() {
      try {
        const respuesta = await fetch(`${API_URL}/auth/verificar-cuenta?token=${encodeURIComponent(token)}`)
        const datos = await respuesta.json()

        if (!respuesta.ok) {
          setEstado(datos.expirado ? 'expirado' : 'error')
          setMensaje(datos.error || 'No se pudo verificar la cuenta.')
          return
        }

        setEstado('exito')
        setMensaje(datos.mensaje || '¡Cuenta verificada!')
      } catch (error) {
        console.error('Error en VerificarCuenta:', error)
        setEstado('error')
        setMensaje('No se pudo conectar con el servidor.')
      }
    }

    verificar()
  }, [searchParams])

  async function handleReenviar(e) {
    e.preventDefault()
    if (!email.trim()) return

    setReenviando(true)
    try {
      const respuesta = await fetch(`${API_URL}/auth/reenviar-verificacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setMensaje(datos.error || 'No se pudo reenviar el correo.')
        return
      }

      setReenviado(true)
      setMensaje(datos.mensaje || 'Si el correo existe, te reenviamos el enlace.')
    } catch (error) {
      console.error('Error en VerificarCuenta:', error)
      setMensaje('No se pudo conectar con el servidor.')
    } finally {
      setReenviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8 text-center bg-white border border-[#17140F]/8 shadow-2xl"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-full bg-[#17140F] flex items-center justify-center p-[7px]">
            <img src={logo} alt="Granova logo" className="w-full h-full object-contain" />
          </span>
          <span className="text-[#17140F] text-xl font-semibold tracking-tight">Granova</span>
        </div>

        {estado === 'cargando' && (
          <>
            <div className="w-10 h-10 mx-auto mb-4 border-2 border-[#1D9E75]/20 border-t-[#17140F] rounded-full animate-spin" />
            <p className="text-[#17140F]/70 text-sm">Verificando tu cuenta...</p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <div className="w-16 h-16 bg-[#1D9E75] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium text-[#17140F] mb-2">¡Cuenta verificada!</h2>
            <p className="text-sm text-[#17140F]/60 mb-8">{mensaje}</p>
            <button type="button" onClick={() => navigate('/login')} className="w-full py-3 bg-[#17140F] text-[#FFFFFF] rounded-xl text-sm font-medium hover:bg-[#2B271F] transition">
              Iniciar sesión
            </button>
          </>
        )}

        {(estado === 'error' || estado === 'expirado') && (
          <>
            <div className="w-16 h-16 bg-[#B5451F] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium text-[#17140F] mb-2">
              {estado === 'expirado' ? 'El enlace expiró' : 'No se pudo verificar'}
            </h2>
            <p className="text-sm text-[#17140F]/60 mb-6">{mensaje}</p>

            {!reenviado ? (
              <form onSubmit={handleReenviar} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-[#17140F] placeholder-[#17140F]/30 focus:outline-none transition"
                  style={{ background: '#FAFAF7', border: '1px solid rgba(23,20,15,0.12)' }}
                />
                <button
                  type="submit"
                  disabled={reenviando}
                  className="w-full py-2.5 bg-[#17140F] text-[#FFFFFF] rounded-xl text-sm font-medium hover:bg-[#2B271F] transition disabled:opacity-50"
                >
                  {reenviando ? 'Enviando...' : 'Reenviar enlace de verificación'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-[#1D9E75]">{mensaje}</p>
            )}

            <p className="text-center text-sm text-[#17140F]/50 mt-6">
              <button type="button" className="text-[#1D9E75] cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit" onClick={() => navigate('/login')}>
                Volver a iniciar sesión
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default VerificarCuenta
