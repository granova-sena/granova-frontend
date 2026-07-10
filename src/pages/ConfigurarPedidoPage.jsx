import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCarrito } from '../context/CarritoContext'

const pasos = ['Datos y dirección', 'Método de pago', 'Confirmación']

const metodosPago = [
  { id: 'pse',            nombre: 'PSE',                   descripcion: 'Pagos en línea de forma segura.',        badge: 'ipse',      badgeColor: 'bg-[#2D5A27]' },
  { id: 'nequi',          nombre: 'Nequi',                 descripcion: 'Paga fácilmente desde tu cuenta Nequi.', badge: 'NEQUI',     badgeColor: 'bg-[#7B2D8B]' },
  { id: 'daviplata',      nombre: 'Daviplata',             descripcion: 'Paga fácilmente tu cuenta Daviplata.',   badge: 'Daviplata', badgeColor: 'bg-[#C8102E]' },
  { id: 'transferencia',  nombre: 'Transferencia bancaria',descripcion: 'Te enviaremos los datos para realizar la transferencia.', badge: null, icono: '🏦' },
  { id: 'contra_entrega', nombre: 'Pago contra entrega',   descripcion: 'Pagas cuando recibas tu pedido.',        badge: null, icono: '🚚' },
]

const camposObligatorios = ['nombre', 'correo', 'telefono', 'direccion', 'ciudad']

function ResumenLateral() {
  const { subtotal, descuentoMonto, ivaMonto, total, DESCUENTO, IVA, productos } = useCarrito()

  return (
    <div className="w-72 flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-[#E7E7E7] p-6">
        <h3 className="text-sm font-semibold text-[#010101] mb-4">Resumen del pedido</h3>
        <div className="flex justify-between mb-4">
          <span className="text-sm text-[#888888]">{productos.length} productos</span>
          <button className="text-xs text-[#2D5A27] hover:underline">Ver detalle</button>
        </div>
        <div className="flex flex-col gap-3 text-sm border-t border-[#E7E7E7] pt-3">
          <div className="flex justify-between">
            <span className="text-[#3D3D3D]">Subtotal</span>
            <span className="text-[#3D3D3D]">${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#3D3D3D]">Descuento ({(DESCUENTO * 100).toFixed(0)}%)</span>
            <span className="text-[#2D5A27]">- ${descuentoMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#3D3D3D]">IVA ({(IVA * 100).toFixed(0)}%)</span>
            <span className="text-[#3D3D3D]">${ivaMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-[#E7E7E7] pt-3">
            <span className="font-semibold text-[#010101]">Total</span>
            <span className="font-semibold text-[#010101]">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E7E7E7] p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">🛡️</span>
          <div>
            <p className="text-sm font-semibold text-[#010101]">Pago 100% seguro</p>
            <p className="text-xs text-[#888888]">Tus transacciones están protegidas.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-sm font-semibold text-[#010101]">Atención personalizada</p>
            <p className="text-xs text-[#888888]">Estamos para ayudarte.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-lg">🚚</span>
          <div>
            <p className="text-sm font-semibold text-[#010101]">Envíos a todo el país</p>
            <p className="text-xs text-[#888888]">Entregas rápidas y seguras.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfigurarPedidoPage() {
  const navigate = useNavigate()
  const [pasoActual, setPasoActual] = useState(0)
  const [metodoPago, setMetodoPago] = useState('pse')
  const [intentoContinuar, setIntentoContinuar] = useState(false)
  const { guardarDatosCliente } = useCarrito()
  const [form, setForm] = useState({
    nombre:    '',
    correo:    '',
    telefono:  '',
    telefonoAlt: '',
    direccion: '',
    ciudad:    '',
    observaciones: '',
  })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Validaciones individuales
  const errores = {
    nombre:    form.nombre.trim() === '',
    correo:    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo),
    telefono:  !/^\d{7,15}$/.test(form.telefono.replace(/\s/g, '')),
    direccion: form.direccion.trim() === '',
    ciudad:    form.ciudad.trim() === '',
  }

  const formularioValido = camposObligatorios.every(campo => !errores[campo])

  const siguientePaso = () => {
  if (pasoActual === 0) {
    setIntentoContinuar(true)
    if (!formularioValido) return
    guardarDatosCliente(form)  // ← agrega esta línea
  }
  setPasoActual(p => Math.min(p + 1, pasos.length - 1))
  setIntentoContinuar(false)
}

  const pasoAnterior = () => {
    setPasoActual(p => Math.max(p - 1, 0))
    setIntentoContinuar(false)
  }

  // Clases reutilizables para inputs
  const inputClase = (campo) => `
    border rounded-lg px-4 py-3 text-sm outline-none transition-colors
    ${intentoContinuar && errores[campo]
      ? 'border-red-400 focus:border-red-500 bg-red-50'
      : 'border-[#E7E7E7] focus:border-[#2D5A27]'
    }
  `

  return (
    <div className="min-h-screen bg-[#F7F2E8]">

      

      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Volver */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#2D5A27] text-sm mb-6 hover:underline">
          ← Volver
        </button>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {pasos.map((paso, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2
                  ${i < pasoActual
                    ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                    : i === pasoActual
                    ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                    : 'bg-transparent text-[#888888] border-[#888888]'
                  }`}>
                  {i < pasoActual ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i <= pasoActual ? 'text-[#2D5A27] font-semibold' : 'text-[#888888]'}`}>
                  {paso}
                </span>
              </div>
              {i < pasos.length - 1 && (
                <div className={`w-24 h-px mb-4 mx-2 ${i < pasoActual ? 'bg-[#2D5A27]' : 'bg-[#888888]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-8 items-start">

          {/* Paso 1 — Datos y dirección */}
          {pasoActual === 0 && (
            <div className="flex-1 bg-white rounded-xl p-8 border border-[#E7E7E7]">
              <h2 className="text-xl font-semibold text-[#010101] mb-6">Datos personales</h2>
              <div className="grid grid-cols-2 gap-4">

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#3D3D3D]">Nombre completo *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange}
                    placeholder="Juan Pérez" className={inputClase('nombre')} />
                  {intentoContinuar && errores.nombre &&
                    <span className="text-xs text-red-500">El nombre es obligatorio</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#3D3D3D]">Correo electrónico *</label>
                  <input name="correo" value={form.correo} onChange={handleChange}
                    type="email" placeholder="correo@ejemplo.com" className={inputClase('correo')} />
                  {intentoContinuar && errores.correo &&
                    <span className="text-xs text-red-500">Ingresa un correo válido</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#3D3D3D]">Teléfono *</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange}
                    type="tel" placeholder="300 123 4567" className={inputClase('telefono')} />
                  {intentoContinuar && errores.telefono &&
                    <span className="text-xs text-red-500">Ingresa un teléfono válido</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#3D3D3D]">Número alternativo</label>
                  <input name="telefonoAlt" value={form.telefonoAlt} onChange={handleChange}
                    type="tel" placeholder="300 123 4567"
                    className="border border-[#E7E7E7] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2D5A27]" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#3D3D3D]">Dirección *</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange}
                    type="text" placeholder="Calle 123 # 45-67" className={inputClase('direccion')} />
                  {intentoContinuar && errores.direccion &&
                    <span className="text-xs text-red-500">La dirección es obligatoria</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#3D3D3D]">Ciudad *</label>
                  <input name="ciudad" value={form.ciudad} onChange={handleChange}
                    type="text" placeholder="Bogotá" className={inputClase('ciudad')} />
                  {intentoContinuar && errores.ciudad &&
                    <span className="text-xs text-red-500">La ciudad es obligatoria</span>}
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-[#3D3D3D]">Observaciones (opcional)</label>
                  <textarea name="observaciones" value={form.observaciones} onChange={handleChange}
                    placeholder="Ej: Instrucciones de entrega, horario, etc." rows={4}
                    className="border border-[#E7E7E7] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2D5A27] resize-none" />
                </div>

              </div>
            </div>
          )}

          {/* Paso 2 — Método de pago */}
          {pasoActual === 1 && (
            <div className="flex-1 bg-white rounded-xl p-8 border border-[#E7E7E7]">
              <h2 className="text-xl font-semibold text-[#010101] mb-1">Selecciona tu método de pago</h2>
              <p className="text-xs text-[#888888] mb-6">Elige la opción que más te convenga.</p>
              <div className="grid grid-cols-2 gap-4">
                {metodosPago.map(m => (
                  <button key={m.id} onClick={() => setMetodoPago(m.id)}
                    className={`flex items-start justify-between p-4 rounded-xl border-2 text-left transition-colors
                      ${metodoPago === m.id ? 'border-[#2D5A27] bg-[#f0f7ee]' : 'border-[#E7E7E7] bg-white hover:border-[#2D5A27]'}
                      ${m.id === 'contra_entrega' ? 'col-span-2' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 mt-1 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                        ${metodoPago === m.id ? 'border-[#2D5A27]' : 'border-[#888888]'}`}>
                        {metodoPago === m.id && <div className="w-2 h-2 rounded-full bg-[#2D5A27]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#010101]">{m.nombre}</p>
                        <p className="text-xs text-[#888888] mt-1">{m.descripcion}</p>
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
            <div className="flex-1 bg-white rounded-xl p-8 border border-[#E7E7E7] flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-16 h-16 bg-[#f0f7ee] rounded-full flex items-center justify-center text-3xl">✅</div>
              <h2 className="text-xl font-semibold text-[#010101]">¡Pedido confirmado!</h2>
              <p className="text-sm text-[#888888] text-center max-w-xs">
                Tu pedido ha sido recibido. Te enviaremos un correo con los detalles de tu compra.
              </p>
              <button onClick={() => navigate('/')}
                className="mt-4 bg-[#2D5A27] text-white text-sm px-10 py-3 rounded-xl hover:bg-[#215511] transition-colors">
                Volver al inicio
              </button>
            </div>
          )}

          <ResumenLateral />
        </div>

        {/* Botones navegación */}
        {pasoActual < 2 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={pasoActual === 0 ? () => navigate(-1) : pasoAnterior}
              className="border border-[#E7E7E7] bg-white text-[#3D3D3D] text-sm px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Volver
            </button>
            <button
              onClick={siguientePaso}
              className={`text-white text-sm px-16 py-3 rounded-xl transition-colors
                ${pasoActual === 0 && intentoContinuar && !formularioValido
                  ? 'bg-[#888888] cursor-not-allowed'
                  : 'bg-[#2D5A27] hover:bg-[#215511]'
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