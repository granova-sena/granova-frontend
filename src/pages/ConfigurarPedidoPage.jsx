import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCarrito } from '../context/CarritoContext'
import toast from 'react-hot-toast'
import { API_URL } from "../config";

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
  const { subtotal, descuentoMonto, total, DESCUENTO, productos, descuentoFuente } = useCarrito()

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
          {descuentoFuente && (
            <div className="flex justify-between">
              <span className="text-white/60">
                {descuentoFuente === 'volumen' ? '📦 Descuento por volumen' : descuentoFuente === 'empresa' ? '🏢 Descuento empresa' : '🎉 Descuento'} ({(DESCUENTO * 100).toFixed(0)}%)
              </span>
              <span className="text-[#9DC9B4]">- ${descuentoMonto.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="font-semibold text-white">Total</span>
            <span className="font-semibold text-white">${total.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-white/40">Todos los precios incluyen IVA</p>
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
  const { guardarDatosCliente, confirmarPedido, actualizarPerfilCliente } = useCarrito()
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

  // Facturación (PN/PJ) — como MercadoLibre: solo si el cliente la necesita.
  // - Si ya guardó su facturación (checkout o Mi Cuenta): se muestra un banner
  //   compacto permanente, sin formulario (la edición se hace desde Mi Cuenta).
  // - Si no tiene datos: toggle "¿Necesitas factura?" + formulario opcional.
  const clienteGuardado = (() => {
    try {
      return JSON.parse(localStorage.getItem('cliente')) || {}
    } catch {
      return {}
    }
  })()

  const tieneFacturacionGuardada = Boolean(clienteGuardado.numero_documento)

  const [necesitaFactura, setNecesitaFactura] = useState(false)
  const [formFactura, setFormFactura] = useState({
    tipo_persona: clienteGuardado.tipo_persona || 'natural',
    tipo_documento: clienteGuardado.tipo_documento || 'CC',
    numero_documento: clienteGuardado.numero_documento || '',
    digito_verificacion: clienteGuardado.digito_verificacion || '',
    razon_social: clienteGuardado.razon_social || '',
  })
  const [cuponCodigo, setCuponCodigo] = useState('')
  const [premioGanado, setPremioGanado] = useState(false)
  const [puntosGanados, setPuntosGanados] = useState(0)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCambioFactura = (e) => {
    const { name, value } = e.target
    setFormFactura(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'tipo_persona' ? { tipo_documento: value === 'juridica' ? 'NIT' : 'CC' } : {}),
    }))
  }

  // Guarda los datos de facturación en el perfil del cliente (para las próximas compras)
  // y actualiza el estado del carrito al instante (si se identifica como empresa,
  // el 10% de empresa se refleja en el resumen de inmediato).
  async function guardarFacturacion() {
    const clienteGuardado = (() => {
      try {
        return JSON.parse(localStorage.getItem('cliente')) || {}
      } catch {
        return {}
      }
    })()

    if (!clienteGuardado.id) {
      return { ok: false, mensaje: 'Debes iniciar sesión para facturar' }
    }

    if (!formFactura.numero_documento.trim()) {
      return { ok: false, mensaje: 'El número de documento es obligatorio para facturar' }
    }

    if (formFactura.tipo_persona === 'juridica') {
      if (!formFactura.razon_social.trim()) {
        return { ok: false, mensaje: 'La razón social es obligatoria para personas jurídicas' }
      }
      if (!formFactura.digito_verificacion.trim()) {
        return { ok: false, mensaje: 'El dígito de verificación del NIT es obligatorio' }
      }
    }

    const token = localStorage.getItem('token')

    try {
      const respuesta = await fetch(`${API_URL}/api/clientes/${clienteGuardado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo_persona: formFactura.tipo_persona,
          tipo_documento: formFactura.tipo_documento,
          numero_documento: formFactura.numero_documento.trim(),
          digito_verificacion: formFactura.tipo_persona === 'juridica' ? formFactura.digito_verificacion.trim() : null,
          razon_social: formFactura.tipo_persona === 'juridica' ? formFactura.razon_social.trim() : null,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        return { ok: false, mensaje: datos.mensaje || 'Error guardando los datos de facturación' }
      }

      actualizarPerfilCliente(datos.data)
      return { ok: true }
    } catch (error) {
      console.error('Error guardando facturación:', error.message)
      return { ok: false, mensaje: 'No se pudo conectar con el servidor' }
    }
  }

  const errores = {
    nombre: form.nombre.trim() === '',
    correo: !/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,24}$/.test(form.correo),
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
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#9DC9B4] text-sm mb-6 hover:underline">
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
                  <label htmlFor="nombre-pedido" className="text-xs text-white/60">Nombre completo *</label>
                  <input id="nombre-pedido" name="nombre" value={form.nombre} onChange={handleChange}
                    placeholder="Juan Pérez" className={inputClase('nombre')} />
                  {intentoContinuar && errores.nombre &&
                    <span className="text-xs text-[#D85A30]">El nombre es obligatorio</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="correo-pedido" className="text-xs text-white/60">Correo electrónico *</label>
                  <input id="correo-pedido" name="correo" value={form.correo} onChange={handleChange}
                    type="email" placeholder="correo@ejemplo.com" className={inputClase('correo')} />
                  {intentoContinuar && errores.correo &&
                    <span className="text-xs text-[#D85A30]">Ingresa un correo válido</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="telefono-pedido" className="text-xs text-white/60">Teléfono *</label>
                  <input id="telefono-pedido" name="telefono" value={form.telefono} onChange={handleChange}
                    type="tel" placeholder="300 123 4567" className={inputClase('telefono')} />
                  {intentoContinuar && errores.telefono &&
                    <span className="text-xs text-[#D85A30]">Ingresa un teléfono válido</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="telefono-alt-pedido" className="text-xs text-white/60">Número alternativo</label>
                  <input id="telefono-alt-pedido" name="telefonoAlt" value={form.telefonoAlt} onChange={handleChange}
                    type="tel" placeholder="300 123 4567"
                    className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C]" />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="direccion-pedido" className="text-xs text-white/60">Dirección *</label>
                  <input id="direccion-pedido" name="direccion" value={form.direccion} onChange={handleChange}
                    type="text" placeholder="Calle 123 # 45-67" className={inputClase('direccion')} />
                  {intentoContinuar && errores.direccion &&
                    <span className="text-xs text-[#D85A30]">La dirección es obligatoria</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="ciudad-pedido" className="text-xs text-white/60">Ciudad *</label>
                  <input id="ciudad-pedido" name="ciudad" value={form.ciudad} onChange={handleChange}
                    type="text" placeholder="Bogotá" className={inputClase('ciudad')} />
                  {intentoContinuar && errores.ciudad &&
                    <span className="text-xs text-[#D85A30]">La ciudad es obligatoria</span>}
                </div>

                <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                  <label htmlFor="observaciones-pedido" className="text-xs text-white/60">Observaciones (opcional)</label>
                  <textarea id="observaciones-pedido" name="observaciones" value={form.observaciones} onChange={handleChange}
                    placeholder="Ej: Instrucciones de entrega, horario, etc." rows={4}
                    className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C] resize-none" />
                </div>

                {/* Facturación */}
                <div className="col-span-1 sm:col-span-2 flex flex-col gap-3 border-t border-white/10 pt-4">
                  {tieneFacturacionGuardada ? (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-[#6FA98C]/10 border border-[#6FA98C]/25">
                      <span className="text-lg">🧾</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          Usando tu facturación guardada: <span className="font-semibold">{formFactura.tipo_persona === 'juridica' ? 'Persona jurídica' : 'Persona natural'}</span> · {formFactura.tipo_documento} {formFactura.numero_documento}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          ¿Cambió tu información?{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/cliente/cuenta')}
                            className="text-[#9DC9B4] hover:underline bg-transparent border-0 p-0 cursor-pointer"
                          >
                            Edítala en Mi cuenta
                          </button>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setNecesitaFactura(!necesitaFactura)}
                        className="flex items-center gap-2 text-left text-sm text-white/70 hover:text-white transition-colors"
                      >
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${necesitaFactura ? 'border-[#6FA98C]' : 'border-white/30'}`}>
                          {necesitaFactura && <span className="w-2 h-2 rounded-full bg-[#6FA98C]" />}
                        </span>
                        ¿Necesitas factura? (opcional)
                      </button>

                      {necesitaFactura && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        {['natural', 'juridica'].map((valor) => (
                          <button
                            key={valor}
                            type="button"
                            onClick={() => handleCambioFactura({ target: { name: 'tipo_persona', value: valor } })}
                            className={`flex-1 py-2 text-xs font-medium transition ${formFactura.tipo_persona === valor ? 'bg-[#6FA98C] text-white' : 'text-white/60 hover:text-white'}`}
                          >
                            {valor === 'natural' ? 'Persona natural' : 'Persona jurídica'}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="tipo-documento-factura" className="text-xs text-white/60">Tipo de documento</label>
                        <select
                          id="tipo-documento-factura"
                          name="tipo_documento"
                          value={formFactura.tipo_documento}
                          onChange={handleCambioFactura}
                          disabled={formFactura.tipo_persona === 'juridica'}
                          className="border border-white/15 bg-white/[0.06] text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C] disabled:opacity-50"
                        >
                          {formFactura.tipo_persona === 'juridica' ? (
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

                      <div className="flex flex-col gap-1">
                        <label htmlFor="numero-documento-factura" className="text-xs text-white/60">Número de documento</label>
                        <input
                          id="numero-documento-factura"
                          name="numero_documento"
                          value={formFactura.numero_documento}
                          onChange={handleCambioFactura}
                          placeholder={formFactura.tipo_persona === 'juridica' ? 'Número del NIT' : 'Tu cédula'}
                          className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C]"
                        />
                      </div>

                      {formFactura.tipo_persona === 'juridica' && (
                        <>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="razon-social-factura" className="text-xs text-white/60">Razón social</label>
                            <input
                              id="razon-social-factura"
                              name="razon_social"
                              value={formFactura.razon_social}
                              onChange={handleCambioFactura}
                              placeholder="Nombre de la empresa"
                              className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="digito-verificacion-factura" className="text-xs text-white/60">Dígito de verificación</label>
                            <input
                              id="digito-verificacion-factura"
                              name="digito_verificacion"
                              value={formFactura.digito_verificacion}
                              onChange={handleCambioFactura}
                              placeholder="Último dígito del NIT"
                              className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C]"
                            />
                          </div>
                        </>
                      )}
                    </div>
                      )}
                    </>
                  )}
                </div>

                {/* Cupón de lealtad (Frente D) */}
                <div className="col-span-1 sm:col-span-2 flex flex-col gap-1 border-t border-white/10 pt-4">
                  <label htmlFor="cupon-checkout" className="text-xs text-white/60">Cupón de lealtad (opcional)</label>
                  <input
                    id="cupon-checkout"
                    type="text"
                    value={cuponCodigo}
                    onChange={e => setCuponCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: GRN-ABC123"
                    className="border border-white/15 bg-white/[0.06] text-white placeholder-white/30 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#6FA98C] uppercase"
                  />
                  <p className="text-xs text-white/40 mt-1">🎟️ Canjea puntos en Mi cuenta y aplica tu código aquí</p>
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
                  <button type="button" key={m.id} onClick={() => setMetodoPago(m.id)}
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
                    type="button"
                    onClick={async () => {
                      setCargando(true)
                      setError(null)

                      if (necesitaFactura && !tieneFacturacionGuardada) {
                        const resultadoFactura = await guardarFacturacion()
                        if (!resultadoFactura.ok) {
                          setError(resultadoFactura.mensaje)
                          setCargando(false)
                          return
                        }
                        toast.success('Datos de facturación guardados')
                      }

                      const resultado = await confirmarPedido(form, metodoPago, cuponCodigo)
                      if (resultado.ok) {
                        setIdPedido(resultado.id_pedido)
                        if (resultado.descuento_empresa) {
                          toast.success('🏢 ¡Descuento de empresa aplicado en tu pedido!')
                        }
                        if (resultado.descuento_fuente === 'cupon') {
                          toast.success('🎟️ ¡Cupón aplicado en tu pedido!')
                        }
                        if (resultado.descuento_ganado) {
                          setPremioGanado(true)
                          toast.success('🎉 ¡Ganaste 10% de descuento en tu próxima compra!')
                        }
                        if (resultado.puntos_ganados > 0) {
                          setPuntosGanados(resultado.puntos_ganados)
                          toast.success(`🎉 ¡Ganaste ${resultado.puntos_ganados} puntos de lealtad!`)
                        }
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
                  {premioGanado && (
                    <p className="text-sm text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/20 rounded-lg px-4 py-2 text-center">
                      🎉 ¡Ganaste 10% de descuento para tu próxima compra!
                    </p>
                  )}
                  {puntosGanados > 0 && (
                    <p className="text-sm text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/20 rounded-lg px-4 py-2 text-center">
                      ⭐ ¡Sumaste {puntosGanados} puntos de lealtad! Canjéalos en Mi cuenta.
                    </p>
                  )}
                  <button
                    type="button"
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
              type="button"
              onClick={pasoActual === 0 ? () => navigate(-1) : pasoAnterior}
              className="w-full sm:w-auto border border-white/15 bg-white/[0.06] text-white/70 text-sm px-6 sm:px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              ← Volver
            </button>
            <button
              type="button"
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
