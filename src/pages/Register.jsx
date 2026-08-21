import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import registerBg from '../assets/register-bg.mp4'
import toast from 'react-hot-toast'
import { API_URL } from "../config";



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
    tipoPersona: 'natural',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    digitoVerificacion: '',
    razonSocial: '',
    tipoCliente: 'minorista',
  })
  const [cargando, setCargando] = useState(false)
  const [verificandoEmail, setVerificandoEmail] = useState(false)
  const [verContraseña, setVerContraseña] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [contraseñaFocus, setContraseñaFocus] = useState(false)

  const [reglasContraseña, setReglasContraseña] = useState({
    longitud: false,
    mayuscula: false,
    numero: false,
    especial: false,
  })
  const [erroresNombre, setErroresNombre] = useState('')
  const [erroresEmail, setErroresEmail] = useState('')

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

    if (name === 'tipoPersona') {
      // Al cambiar a jurídica forzamos NIT; al volver a natural, CC por defecto
      setFormData(prev => ({ ...prev, tipoPersona: value, tipoDocumento: value === 'juridica' ? 'NIT' : 'CC' }))
    }

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

  function handleSiguientePaso2() {
    toast.dismiss('error-register')

    if (!formData.numeroDocumento.trim()) {
      toast.error('El número de documento es obligatorio', { id: 'error-register' })
      return
    }

    if (formData.tipoPersona === 'juridica') {
      if (!formData.razonSocial.trim()) {
        toast.error('La razón social es obligatoria para personas jurídicas', { id: 'error-register' })
        return
      }
      if (!formData.digitoVerificacion.trim()) {
        toast.error('El dígito de verificación del NIT es obligatorio', { id: 'error-register' })
        return
      }
    }

    setStep(3)
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
          tipo_persona: formData.tipoPersona,
          tipo_documento: formData.tipoDocumento,
          numero_documento: formData.numeroDocumento.trim(),
          digito_verificacion: formData.tipoPersona === 'juridica' ? formData.digitoVerificacion.trim() : null,
          razon_social: formData.tipoPersona === 'juridica' ? formData.razonSocial.trim() : null,
          tipo_cliente: formData.tipoCliente,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.error(datos.error || 'Error al registrar', { id: 'error-register' })
        return
      }

      toast.success('¡Cuenta creada exitosamente! 🎉')
      setStep(4)
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
  className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition"
>
  ← Volver
</button>  
      <div className="relative z-10 w-full max-w-md mx-4 my-10 rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}>

        <div className="flex justify-center mb-6">
          <span className="text-[#E1F5EE] text-2xl font-medium tracking-tight">Granova</span>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${step >= s ? 'bg-[#6FA98C] text-white' : 'bg-white/10 text-white/40'}`}>
                {s}
              </div>
              {s < 4 && <div className={`w-8 h-px transition-all ${step > s ? 'bg-[#6FA98C]' : 'bg-white/20'}`}></div>}
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
            <h2 className="text-xl font-medium text-white mb-1">Identificación</h2>
            <p className="text-xs text-white/60 mb-4">Para tu factura y tu descuento</p>

            {/* Selector persona natural / jurídica */}
            <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              {['natural', 'juridica'].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'tipoPersona', value: valor } })}
                  className={`flex-1 py-2 text-xs font-medium transition ${formData.tipoPersona === valor ? 'bg-[#6FA98C] text-white' : 'text-white/60 hover:text-white'}`}
                >
                  {valor === 'natural' ? 'Persona natural' : 'Persona jurídica'}
                </button>
              ))}
            </div>

            {/* Tipo de documento + número en una sola fila */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="tipo-documento-register" className="block text-xs text-white/60 mb-1">Tipo de documento</label>
                <select
                  id="tipo-documento-register"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  disabled={formData.tipoPersona === 'juridica'}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none transition disabled:opacity-50 appearance-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  {formData.tipoPersona === 'juridica' ? (
                    <option value="NIT">NIT</option>
                  ) : (
                    <>
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="numero-documento-register" className="block text-xs text-white/60 mb-1">Número</label>
                <input
                  id="numero-documento-register"
                  type="text"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  placeholder={formData.tipoPersona === 'juridica' ? 'Número del NIT' : 'Tu cédula'}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none transition"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              </div>
            </div>

            {/* Campos condicionales para persona jurídica (sin recargar la página) */}
            {formData.tipoPersona === 'juridica' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="razon-social-register" className="block text-xs text-white/60 mb-1">Razón social</label>
                  <input
                    id="razon-social-register"
                    type="text"
                    name="razonSocial"
                    value={formData.razonSocial}
                    onChange={handleChange}
                    placeholder="Nombre de la empresa"
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none transition"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  />
                </div>
                <div>
                  <label htmlFor="digito-verificacion-register" className="block text-xs text-white/60 mb-1">Dígito de verificación</label>
                  <input
                    id="digito-verificacion-register"
                    type="text"
                    name="digitoVerificacion"
                    value={formData.digitoVerificacion}
                    onChange={handleChange}
                    placeholder="Último dígito del NIT"
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none transition"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  />
                </div>
              </div>
            )}

            {/* Tipo de cliente */}
            <div className="mb-5">
              <label className="block text-xs text-white/60 mb-1">Tipo de cliente</label>
              <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {[
                  { valor: 'minorista', etiqueta: 'Minorista' },
                  { valor: 'mayorista', etiqueta: 'Mayorista · -12%' },
                ].map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'tipoCliente', value: opcion.valor } })}
                    className={`flex-1 py-2 text-xs font-medium transition ${formData.tipoCliente === opcion.valor ? 'bg-[#6FA98C] text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 transition" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                Atrás
              </button>
              <button type="button" onClick={handleSiguientePaso2} className="flex-1 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition">
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 */}
        {step === 3 && (
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
                className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
                tabIndex={-1}
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
                className="absolute right-3 top-9 text-white/40 hover:text-white/80 transition"
                tabIndex={-1}
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

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} disabled={cargando} className="flex-1 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 transition disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                Atrás
              </button>
              <button type="button" onClick={handleRegister} disabled={cargando || !puedeContinuarPaso2} className="flex-1 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition disabled:opacity-50">
                {cargando ? 'Registrando...' : 'Continuar'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 4 */}
        {step === 4 && (
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

        {step !== 4 && (
          <p className="text-center text-sm text-white/50 mt-6">
            ¿Ya tienes cuenta?{' '}
            <button type="button" className="text-[#9DC9B4] cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit" onClick={() => navigate('/login')}>
              Inicia sesión
            </button>
          </p>
        )}

      </div>
    </div>
  )
}

export default Register