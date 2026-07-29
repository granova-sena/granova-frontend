import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCarrito } from '../context/CarritoContext'

const pasos = ['Datos y dirección', 'Método de pago', 'Confirmación']

const metodosPago = [
  { id: 'pse', nombre: 'PSE', descripcion: 'Pagos en línea de forma segura.', badge: 'PSE', badgeColor: 'bg-[#6FA98C]' },
  { id: 'nequi', nombre: 'Nequi', descripcion: 'Paga fácilmente desde tu cuenta Nequi.', badge: 'NEQUI', badgeColor: 'bg-[#7B2D8B]' },
  { id: 'daviplata', nombre: 'Daviplata', descripcion: 'Paga fácilmente tu cuenta Daviplata.', badge: 'Daviplata', badgeColor: 'bg-[#C8102E]' },
  { id: 'transferencia', nombre: 'Transferencia bancaria', descripcion: 'Te enviaremos los datos para realizar la transferencia.', badge: null, icono: '🏦' },
  { id: 'efectivo', nombre: 'Pago contra entrega', descripcion: 'Pagas cuando recibas tu pedido.', badge: null, icono: '🚚' },
]

const camposObligatorios = ['nombre', 'correo', 'telefono', 'direccion', 'ciudad']

function ResumenLateral() {
  const { subtotal, descuentoMonto, ivaMonto, total, DESCUENTO, IVA, productos } = useCarrito()

  return (
    <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
      <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Resumen del pedido</h3>
        <div className="flex justify-between mb-4">
          <span className="text-sm text-white/50">{productos.length} productos</span>
        </div>
        <div className="flex flex-col gap-3 text-sm border-t border-white/10 pt-3">
          <div className="flex justify-between">
            <span className="text-white/60">Subtotal</span>
            <span className="text-white">${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Descuento ({(DESCUENTO * 100).toFixed(0)}%)</span>
            <span className="text-[#9DC9B4]">- ${descuentoMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">IVA ({(IVA * 100).toFixed(0)}%)</span>
            <span className="text-white">${ivaMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="font-semibold text-white">Total</span>
            <span className="font-semibold text-white">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">🛡️</span>
          <div>
            <p className="text-sm font-semibold text-white">Pago 100% seguro</p>
            <p className="text-xs text-white/40">Tus transacciones están protegidas.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-sm font-semibold text-white">Atención personalizada</p>
            <p className="text-xs text-white/40">Estamos para ayudarte.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-lg">🚚</span>
          <div>
            <p className="text-sm font-semibold text-white">Envíos a todo el país</p>
            <p className="text-xs text-white/40">Entregas rápidas y seguras.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfigurarPedidoPage() {
  const navigate = useNavigate()
  const { guardarDatosCliente, confirmarPedido } = useCarrito()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [idPedido, setIdPedido] = useState(null)
  const [pasoActual, setPasoActual] = useState(0)
  const [metodoPago, setMetodoPago] = useState('pse')
  const [intentoContinuar, setIntentoContinuar] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    telefonoAlt: '',
    direccion: '',
    ciudad: '',
    observaciones: '',
  })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const errores = {
    nombre: form.nombre.trim() === '',
    correo: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo),
    telefono: !/^\d{7,15}$/.test(form.telefono.replace(/\s/g, '')),
    direccion: form.direccion.trim() === '',
    ciudad: form.ciudad.trim() === '',
  }

  const formularioValido = camposObligatorios.every(campo => !errores[campo])

  const siguientePaso = () => {
    if (pasoActual === 0) {
      setIntentoContinuar(true)
      if (!formularioValido) return
      guardarDatosCliente(form)
    }
    setPasoActual(p => Math.min(p + 1, pasos.length - 1))
    setIntentoContinuar(false)
  }

  const pasoAnterior = () => {
    setPasoActual(p => Math.max(p - 1, 0))
    setIntentoContinuar(false)
  }

  const inputClase = (campo) => `
    border rounded-lg px-4 py-3 text-sm outline-none transition-colors bg-white/[0.06] text-white placeholder-white/30
    ${intentoContinuar && errores[campo]
      ? 'border-[#D85A30] focus:border-[#D85A30]'
      : 'border-white/15 focus:border-[#6FA98C]'
    }
  `

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Volver */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#9DC9B4] text-sm mb-6 hover:underline">
          ← Volver
        </button>

        {/* Indicador de pasos */}
        <div className="w-full overflow-x-auto pb-2 mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-0 min-w-max px-2">
          {pasos.map((paso, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2
                  ${i <= pasoActual
                    ? 'bg-[#6FA98C] text-white border-[#6FA98C]'
                    : 'bg-transparent text-white/40 border-white/25'
                  }`}>
                  {i < pasoActual ? '✓' : i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${i <= pasoActual ? 'text-[#9DC9B4] font-semibold' : 'text-white/40'}`}>
                  {paso}
                </span>
              </div>
              {i < pasos.length - 1 && (
                <div className={`w-16 sm:w-24 h-px mb-4 mx-2 ${i < pasoActual ? 'bg-[#6FA98C]' : 'bg-white/15'}`} />
              )}
            </div>
          ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 items-stretch lg:items-start">

          {/* Paso 1 — Datos y dirección */}
          {pasoActual === 0 && (
            <div className="w-full min-w-0 flex-1 rounded-xl p-4 sm:p-6 lg:p-8 border border-white/15 bg-white/[0.08] backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-6">Datos personales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Nombre completo *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange}
                    placeholder="Juan Pérez" className={inputClase('nombre')} />
                  {intentoContinuar && errores.nombre &&
                    <span className="text-xs text-[#D85A30]">El nombre es obligatorio</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Correo electrónico *</label>
                  <input name="correo" value={form.correo} onChange={handleChange}
                    type="email" placeholder="correo@ejemplo.com" className={inputClase('correo')} />
                  {intentoContinuar && errores.correo &&
                    <span className="text-xs text-[#D85A30]">Ingresa un correo válido</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Teléfono *</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange}
                    type="tel" placeholder="300 123 4567" className={inputClase('telefono')} />
                  {intentoContinuar && errores.telefono &&
                    <span className="text-xs text-[#D85A30]">Ingresa un teléfono válido</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Número alternativo</label>
                  <input name="telefonoAlt" value={form.telefonoAlt} onChange={handleChange}
                    type="tel" placeholder="300 123 4567"
                    className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C]" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Dirección *</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange}
                    type="text" placeholder="Calle 123 # 45-67" className={inputClase('direccion')} />
                  {intentoContinuar && errores.direccion &&
                    <span className="text-xs text-[#D85A30]">La dirección es obligatoria</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Ciudad *</label>
                  <input name="ciudad" value={form.ciudad} onChange={handleChange}
                    type="text" placeholder="Bogotá" className={inputClase('ciudad')} />
                  {intentoContinuar && errores.ciudad &&
                    <span className="text-xs text-[#D85A30]">La ciudad es obligatoria</span>}
                </div>

                <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-white/60">Observaciones (opcional)</label>
                  <textarea name="observaciones" value={form.observaciones} onChange={handleChange}
                    placeholder="Ej: Instrucciones de entrega, horario, etc." rows={4}
                    className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C] resize-none" />
                </div>

              </div>
            </div>
          )}

          {/* Paso 2 — Método de pago */}
          {pasoActual === 1 && (
            <div className="w-full min-w-0 flex-1 rounded-xl p-4 sm:p-6 lg:p-8 border border-white/15 bg-white/[0.08] backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-1">Selecciona tu método de pago</h2>
              <p className="text-xs text-white/40 mb-6">Elige la opción que más te convenga.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metodosPago.map(m => (
                  <button key={m.id} onClick={() => setMetodoPago(m.id)}
                    className={`flex items-start justify-between p-4 rounded-xl border-2 text-left transition-colors
                      ${metodoPago === m.id ? 'border-[#6FA98C] bg-[#6FA98C]/10' : 'border-white/15 bg-white/[0.04] hover:border-[#6FA98C]/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 mt-1 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                        ${metodoPago === m.id ? 'border-[#6FA98C]' : 'border-white/30'}`}>
                        {metodoPago === m.id && <div className="w-2 h-2 rounded-full bg-[#6FA98C]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{m.nombre}</p>
                        <p className="text-xs text-white/40 mt-1">{m.descripcion}</p>
                      </div>
                    </div>
                    {m.badge && <span className={`text-white text-xs px-2 py-1 rounded font-bold ${m.badgeColor}`}>{m.badge}</span>}
                    {m.icono && <span className="text-xl">{m.icono}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 3 — Confirmación */}
          {pasoActual === 2 && (
            <div className="w-full min-w-0 flex-1 rounded-xl p-5 sm:p-8 border border-white/15 bg-white/[0.08] backdrop-blur-xl flex flex-col items-center justify-center gap-4 py-16">
              {!idPedido ? (
                <>
                  <div className="w-16 h-16 bg-[#6FA98C]/15 rounded-full flex items-center justify-center text-3xl">
                    🛒
                  </div>
                  <h2 className="text-xl font-semibold text-white">Confirmar pedido</h2>
                  <p className="text-sm text-white/50 text-center max-w-xs">
                    Método de pago: <span className="font-semibold text-white">{metodoPago}</span>
                  </p>
                  {error && (
                    <p className="text-sm text-[#D85A30] text-center">{error}</p>
                  )}
                  <button
                    onClick={async () => {
                      setCargando(true)
                      setError(null)
                      const resultado = await confirmarPedido(form, metodoPago)
                      if (resultado.ok) {
                        setIdPedido(resultado.id_pedido)
                      } else {
                        setError(resultado.mensaje)
                      }
                      setCargando(false)
                    }}
                    disabled={cargando}
                    className="mt-4 bg-[#6FA98C] text-white text-sm px-10 py-3 rounded-xl hover:bg-[#4F8A70] transition-colors disabled:opacity-50"
                  >
                    {cargando ? 'Procesando...' : 'Confirmar pedido'}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-[#6FA98C]/15 rounded-full flex items-center justify-center text-3xl">
                    ✅
                  </div>
                  <h2 className="text-xl font-semibold text-white">¡Pedido confirmado!</h2>
                  <p className="text-sm text-white/50 text-center max-w-xs">
                    Tu pedido ha sido recibido. Te enviaremos un correo con los detalles.
                  </p>
                  <button
                    onClick={() => navigate('/cliente/pedidos')}
                    className="mt-4 bg-[#6FA98C] text-white text-sm px-10 py-3 rounded-xl hover:bg-[#4F8A70] transition-colors"
                  >
                    Ver mis pedidos
                  </button>
                </>
              )}
            </div>
          )}
          <ResumenLateral />
        </div>

        {/* Botones navegación */}
        {pasoActual < 2 && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6 sm:mt-8">
            <button
              onClick={pasoActual === 0 ? () => navigate(-1) : pasoAnterior}
              className="w-full sm:w-auto border border-white/15 bg-white/[0.06] text-white/70 text-sm px-6 sm:px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              ← Volver
            </button>
            <button
              onClick={siguientePaso}
              className={`w-full sm:w-auto text-white text-sm px-8 sm:px-16 py-3 rounded-xl transition-colors
                ${pasoActual === 0 && intentoContinuar && !formularioValido
                  ? 'bg-white/15 cursor-not-allowed'
                  : 'bg-[#6FA98C] hover:bg-[#4F8A70]'
                }`}
            >
              Continuar
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default ConfigurarPedidoPage
