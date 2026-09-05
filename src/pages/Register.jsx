import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import registerBg from '../assets/register-bg.mp4'
import toast from 'react-hot-toast'
import { API_URL, TURNSTILE_SITE_KEY } from "../config";

// ═══════════════════════════════════════════════════════════════
// CLOUDFLARE TURNSTILE — Configuración
// ═══════════════════════════════════════════════════════════════
// Para obtener tu Site Key:
// 1. Crea cuenta gratis en https://dash.cloudflare.com/sign-up
// 2. Ve a Turnstile → Manage Widgets → Create Widget
// 3. Copia la "Site Key" y pégala en tu .env como VITE_TURNSTILE_SITE_KEY
// 4. La "Secret Key" va en el backend (.env → TURNSTILE_SECRET_KEY)
// ═══════════════════════════════════════════════════════════════
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
// ═══════════════════════════════════════════════════════════════

const REGEX_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,24}$/
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

function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    contraseña: '',
    confirmarContraseña: '',
  })
  const [cargando, setCargando] = useState(false)
  const [verificandoEmail, setVerificandoEmail] = useState(false)
  const [verContraseña, setVerContraseña] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [contraseñaFocus, setContraseñaFocus] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [modalTerminosAbierto, setModalTerminosAbierto] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef(null)
  const turnstileWidgetId = useRef(null)

  const [reglasContraseña, setReglasContraseña] = useState({
    longitud: false,
    mayuscula: false,
    numero: false,
    especial: false,
  })
  const [erroresNombre, setErroresNombre] = useState('')
  const [erroresEmail, setErroresEmail] = useState('')

  // ── Cloudflare Turnstile: cargar script y renderizar widget en el Paso 2 ──
  useEffect(() => {
    if (step !== 2) return
    if (turnstileWidgetId.current) return

    function onTurnstileReady() {
      if (!turnstileRef.current || !window.turnstile) return
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token),
        'error-callback': () => setTurnstileToken(''),
        theme: 'dark',
        size: 'normal',
      })
    }

    if (window.turnstile) {
      onTurnstileReady()
    } else {
      const script = document.createElement('script')
      script.src = TURNSTILE_SCRIPT
      script.async = true
      script.onload = onTurnstileReady
      document.head.appendChild(script)
    }

    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetId.current) } catch {}
        turnstileWidgetId.current = null
        setTurnstileToken('')
      }
    }
  }, [step])

  const contraseñaValida = Object.values(reglasContraseña).every(Boolean)
  const confirmarTocado = formData.confirmarContraseña.length > 0
  const contraseñasCoinciden = formData.contraseña === formData.confirmarContraseña
  const puedeContinuarPaso2 = contraseñaValida && confirmarTocado && contraseñasCoinciden

  const nombreCompletoValido = (() => {
    const partes = formData.nombreCompleto.trim().split(/\s+/).filter(Boolean)
    return partes.length >= 2 && partes.every(p => p.length >= 2)
  })()
  const emailValidoPaso1 = REGEX_EMAIL.test(formData.email.trim())
  const puedeContinuarPaso1 = nombreCompletoValido && emailValidoPaso1

  function handleChange(e) {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === 'contraseña') {
      setReglasContraseña(evaluarReglasContraseña(value))
    }

    if (name === 'nombreCompleto') {
      const partes = value.trim().split(/\s+/).filter(Boolean)
      if (partes.length < 2) {
        setErroresNombre('Falta el apellido')
      } else if (!partes.every(p => p.length >= 2)) {
        setErroresNombre('Cada nombre debe tener mínimo 2 letras')
      } else {
        setErroresNombre('')
      }
    }

    if (name === 'email') {
      const emailValido = REGEX_EMAIL.test(value)
      setErroresEmail(value && !emailValido ? 'Correo no válido' : '')
    }
  }

  async function handleSiguientePaso1() {
    toast.dismiss('error-register')

    if (!formData.nombreCompleto.trim() || !formData.email.trim()) {
      toast.error('Todos los campos son obligatorios', { id: 'error-register' })
      return
    }

    const partes = formData.nombreCompleto.trim().split(/\s+/).filter(Boolean)

    if (partes.length < 2) {
      toast.error('Ingresa tu nombre y apellido', { id: 'error-register' })
      return
    }

    const todasValidas = partes.every(p => p.length >= 2)
    if (!todasValidas) {
      toast.error('Cada nombre y apellido debe tener al menos 2 letras', { id: 'error-register' })
      return
    }

    const emailValido = REGEX_EMAIL.test(formData.email.trim())
    if (!emailValido) {
      toast.error('Ingresa un correo electrónico válido', { id: 'error-register' })
      return
    }

    setVerificandoEmail(true)
    try {
      const respuesta = await fetch(`${API_URL}/auth/verificar-email?email=${encodeURIComponent(formData.email.trim())}`)
      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.error('No se pudo verificar el correo, intenta de nuevo', { id: 'error-register' })
        return
      }

      if (!datos.disponible) {
        toast.error('Ese correo ya está registrado', { id: 'error-register' })
        return
      }

      setStep(2)
    } catch (error) {
      console.error('Error en Register:', error)
      toast.error('No se pudo conectar con el servidor', { id: 'error-register' })
    } finally {
      setVerificandoEmail(false)
    }
  }

  async function handleRegister() {
    toast.dismiss('error-register')

    if (!formData.contraseña || !formData.confirmarContraseña) {
      toast.error('Todos los campos son obligatorios', { id: 'error-register' })
      return
    }

    if (!contraseñaValida) {
      toast.error('La contraseña debe tener al menos 6 caracteres, una mayúscula, un número y un carácter especial', { id: 'error-register' })
      return
    }

    if (!contraseñasCoinciden) {
      toast.error('Las contraseñas no coinciden', { id: 'error-register' })
      return
    }

    if (!aceptaTerminos) {
      toast.error('Debes aceptar los Términos y Condiciones', { id: 'error-register' })
      return
    }

    if (!turnstileToken) {
      toast.error('Completa la verificación anti-bot', { id: 'error-register' })
      return
    }

    setCargando(true)

    const [nombre, ...resto] = formData.nombreCompleto.trim().split(' ')
    const apellido = resto.join(' ')

    try {
      const respuesta = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          email: formData.email,
          contraseña: formData.contraseña,
          turnstileToken,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.error(datos.error || 'Error al registrar', { id: 'error-register' })
        return
      }

      setStep(3)
    } catch (error) {
      console.error('Error en Register:', error)
      toast.error('No se pudo conectar con el servidor', { id: 'error-register' })
    } finally {
      setCargando(false)
    }
  }

  const reglasLista = [
    { id: 'longitud', label: 'Mínimo 6 caracteres', cumplida: reglasContraseña.longitud },
    { id: 'mayuscula', label: 'Una letra mayúscula', cumplida: reglasContraseña.mayuscula },
    { id: 'numero', label: 'Un número', cumplida: reglasContraseña.numero },
    { id: 'especial', label: 'Un carácter especial', cumplida: reglasContraseña.especial },
  ]

  return (

    
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">

      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={registerBg} />
      <div className="absolute inset-0 bg-[#0a1a0a]/75"></div>
      <div className="absolute inset-0 bg-[#0a1a0a]/75"></div>

        <button
  type="button"
  onClick={() => navigate('/')}
  className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/50 text-sm hover:bg-white/[0.06] hover:text-white active:scale-[0.97] transition"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
  </svg>
  Volver
</button>  
      <div className="relative z-10 w-full max-w-md mx-4 my-10 rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}>

        <div className="flex justify-center mb-6">
          <span className="text-[#E1F5EE] text-2xl font-medium tracking-tight">Granova</span>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${step >= s ? 'bg-[#6FA98C] text-white' : 'bg-white/10 text-white/40'}`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-px transition-all ${step > s ? 'bg-[#6FA98C]' : 'bg-white/20'}`}></div>}
            </div>
          ))}
        </div>

        {/* Paso 1 */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-medium text-white mb-1">Datos personales</h2>
            <p className="text-sm text-white/60 mb-6">Cuéntanos quién eres</p>

            <div className="mb-4">
              <label htmlFor="nombre-register" className="block text-sm text-white/70 mb-1.5">Nombre completo</label>
              <input
                id="nombre-register"
                type="text"
                name='nombreCompleto'
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              {erroresNombre && <p className="text-xs text-[#D85A30] mt-1">{erroresNombre}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="email-register" className="block text-sm text-white/70 mb-1.5">Correo electrónico</label>
              <input
                id="email-register"
                type="email"
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder="tucorreo@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              {erroresEmail && <p className="text-xs text-[#D85A30] mt-1">{erroresEmail}</p>}
            </div>

            <button type="button" onClick={handleSiguientePaso1} disabled={!puedeContinuarPaso1 || verificandoEmail} className="w-full py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition disabled:opacity-50">
              {verificandoEmail ? 'Verificando...' : 'Continuar'}
            </button>
          </div>
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-medium text-white mb-1">Crea tu acceso</h2>
            <p className="text-sm text-white/60 mb-6">Elige una contraseña segura</p>

            {/* Contraseña */}
            <div className="mb-2 relative">
              <label htmlFor="password-register" className="block text-sm text-white/70 mb-1.5">Contraseña</label>
              <input
                id="password-register"
                type={verContraseña ? 'text' : 'password'}
                name='contraseña'
                value={formData.contraseña}
                onChange={handleChange}
                onFocus={() => setContraseñaFocus(true)}
                onBlur={() => setContraseñaFocus(false)}
                disabled={cargando}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition pr-10 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <button
                type="button"
                onClick={() => setVerContraseña(!verContraseña)}
                aria-label={verContraseña ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
              >
                <IconoOjo ver={verContraseña} />
              </button>
            </div>

            {/* Reglas de contraseña, con desaparición animada */}
            <div className={`overflow-hidden transition-all duration-300 ${(contraseñaFocus || formData.contraseña) && !contraseñaValida ? 'max-h-32 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}>
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
            {contraseñaValida && formData.contraseña && (
              <p className="text-xs text-[#9DC9B4] mb-4">✓ Contraseña segura</p>
            )}

            {/* Confirmar contraseña */}
            <div className="mb-2 relative">
              <label htmlFor="confirmar-password-register" className="block text-sm text-white/70 mb-1.5">Confirmar contraseña</label>
              <input
                id="confirmar-password-register"
                type={verConfirmar ? 'text' : 'password'}
                name='confirmarContraseña'
                value={formData.confirmarContraseña}
                onChange={handleChange}
                disabled={cargando}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition pr-10 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <button
                type="button"
                onClick={() => setVerConfirmar(!verConfirmar)}
                aria-label={verConfirmar ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
              >
                <IconoOjo ver={verConfirmar} />
              </button>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${confirmarTocado && !contraseñasCoinciden ? 'max-h-6 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
              <p className="text-xs text-[#D85A30]">Las contraseñas no coinciden</p>
            </div>
            {confirmarTocado && contraseñasCoinciden && (
              <p className="text-xs text-[#9DC9B4] mb-6">✓ Coinciden</p>
            )}

            {/* Cloudflare Turnstile — verificación anti-bot */}
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-2">Verificación de seguridad</p>
              <div ref={turnstileRef} className="flex justify-center" />
              {!turnstileToken && (
                <p className="text-[11px] text-white/30 mt-1.5 text-center">Esperando verificación...</p>
              )}
            </div>

            {/* Términos y Condiciones */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#6FA98C] cursor-pointer"
              />
              <span className="text-xs text-white/60 leading-relaxed group-hover:text-white/80 transition">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setModalTerminosAbierto(true) }}
                  className="text-[#9DC9B4] underline underline-offset-2 hover:text-white transition"
                >
                  Términos y Condiciones
                </button>
                {' '}y la Política de Privacidad
              </span>
            </label>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} disabled={cargando} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 transition disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
                </svg>
                Atrás
              </button>
              <button type="button" onClick={handleRegister} disabled={cargando || !puedeContinuarPaso2 || !aceptaTerminos || !turnstileToken} className="flex-1 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition disabled:opacity-50">
                {cargando ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Confirmación */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#6FA98C] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium text-white mb-2">¡Ya casi!</h2>
            <p className="text-sm text-white/60 mb-8">
              Te enviamos un correo a <span className="text-[#9DC9B4]">{formData.email}</span>. Confirma tu cuenta desde ese enlace antes de iniciar sesión.
            </p>
            <button type="button" onClick={() => navigate('/login')} className="w-full py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition">
              Iniciar sesión
            </button>
          </div>
        )}

        {step !== 3 && (
          <p className="text-center text-sm text-white/50 mt-6">
            ¿Ya tienes cuenta?{' '}
            <button type="button" className="text-[#9DC9B4] cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit" onClick={() => navigate('/login')}>
              Inicia sesión
            </button>
          </p>
        )}

        {/* Modal de Términos y Condiciones */}
        {modalTerminosAbierto && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setModalTerminosAbierto(false)}
          >
            <div
              className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: 'rgba(15,29,19,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Términos y Condiciones</h3>
                <button
                  type="button"
                  onClick={() => setModalTerminosAbierto(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 text-xs text-white/60 leading-relaxed space-y-4">
                <p><strong className="text-white/80">1. Aceptación de los Términos</strong><br />
                Al crear una cuenta en Granova, usted acepta estos Términos y Condiciones de uso. Si no está de acuerdo, por favor no utilice nuestro servicio.</p>

                <p><strong className="text-white/80">2. Registro de Cuenta</strong><br />
                Para acceder a nuestros servicios, usted debe crear una cuenta proporcionando información veraz y actualizada. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>

                <p><strong className="text-white/80">3. Productos y Precios</strong><br />
                Todos los precios mostrados incluyen los impuestos aplicables salvo indicación contraria. Los precios pueden cambiar sin previo aviso. Nos reservamos el derecho de modificar el catálogo de productos en cualquier momento.</p>

                <p><strong className="text-white/80">4. Pedidos y Pagos</strong><br />
                Al realizar un pedido, usted está realizando una oferta de compra. Nos reservamos el derecho de aceptar o rechazar cualquier pedido. Los pagos se procesan de forma segura a través de nuestras pasarelas de pago habilitadas.</p>

                <p><strong className="text-white/80">5. Envíos y Entregas</strong><br />
                Los tiempos de entrega son estimados y pueden variar según la ubicación y disponibilidad del producto. Granova no se hace responsable por retrasos causados por terceros.</p>

                <p><strong className="text-white/80">6. Devoluciones</strong><br />
                Si no está satisfecho con su compra, puede solicitar una devolución dentro de los 14 días posteriores a la recepción del producto, siempre que este se encuentre en condiciones originales.</p>

                <p><strong className="text-white/80">7. Programa de Lealtad</strong><br />
                Los puntos de lealtad son acumulables según las condiciones del programa. Granova se reserva el derecho de modificar o cancelar el programa de lealtad en cualquier momento con aviso previo.</p>

                <p><strong className="text-white/80">8. Protección de Datos</strong><br />
                Sus datos personales serán tratados de conformidad con nuestra Política de Privacidad y la normatividad vigente en materia de protección de datos personales (Ley 1581 de 2012 en Colombia).</p>

                <p><strong className="text-white/80">9. Uso del Servicio</strong><br />
                Usted se compromete a utilizar el servicio de manera lícita y respetuosa. Está prohibido el uso fraudulento, la suplantación de identidad o cualquier actividad que pueda dañar la integridad del servicio.</p>

                <p><strong className="text-white/80">10. Limitación de Responsabilidad</strong><br />
                Granova no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de nuestro servicio. Nuestra responsabilidad máxima será limitada al valor del último pedido realizado.</p>

                <p className="text-white/40 italic">Última actualización: Septiembre 2026</p>
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalTerminosAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 transition"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => { setAceptaTerminos(true); setModalTerminosAbierto(false) }}
                  className="flex-1 py-2.5 rounded-xl bg-[#6FA98C] text-white text-sm font-medium hover:bg-[#4F8A70] transition"
                >
                  Acepto
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Register
