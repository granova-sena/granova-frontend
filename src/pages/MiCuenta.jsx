import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { API_URL } from "../config";
import { useCarrito } from '../context/CarritoContext'

const ETIQUETAS_TIPO_PERSONA = { natural: 'Persona natural', juridica: 'Persona jurídica' }
const ETIQUETAS_TIPO_DOCUMENTO = { CC: 'Cédula de ciudadanía (CC)', CE: 'Cédula de extranjería (CE)', NIT: 'NIT', PASAPORTE: 'Pasaporte' }

const IconoUsuario = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
)
const IconoUbicacion = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>
)
const IconoSalir = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

function MiCuenta() {
  const navigate = useNavigate()
  const { cliente: clienteContexto, actualizarPerfilCliente } = useCarrito()

  // El contexto trae el perfil sincronizado con el servidor (fuente de verdad);
  // si quedó vacío (p. ej. el provider montó antes del login), se cae a la
  // caché de localStorage para no mostrar la cuenta en blanco.
  const clienteLocal = (() => {
    try {
      return JSON.parse(localStorage.getItem('cliente')) || {}
    } catch {
      return {}
    }
  })()
  const cliente = (clienteContexto && clienteContexto.nombre) ? clienteContexto : clienteLocal

  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formIdentificacion, setFormIdentificacion] = useState({
    tipo_persona: cliente.tipo_persona || 'natural',
    tipo_documento: cliente.tipo_documento || 'CC',
    numero_documento: cliente.numero_documento || '',
    digito_verificacion: cliente.digito_verificacion || '',
    razon_social: cliente.razon_social || '',
  })

  const inicial = (cliente.nombre || 'C').charAt(0).toUpperCase()
  const nombreCompleto = [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') || 'Cliente Granova'

  function cerrarSesion() {
    localStorage.removeItem('token')
    localStorage.removeItem('cliente')
    navigate('/login')
  }

  function handleCambioIdentificacion(e) {
    const { name, value } = e.target
    setFormIdentificacion(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'tipo_persona' ? { tipo_documento: value === 'juridica' ? 'NIT' : 'CC' } : {}),
    }))
  }

  async function guardarIdentificacion() {
    toast.dismiss('perfil-identificacion')

    if (!formIdentificacion.numero_documento.trim()) {
      toast.error('El número de documento es obligatorio', { id: 'perfil-identificacion' })
      return
    }

    if (formIdentificacion.tipo_persona === 'juridica') {
      if (!formIdentificacion.razon_social.trim()) {
        toast.error('La razón social es obligatoria para personas jurídicas', { id: 'perfil-identificacion' })
        return
      }
      if (!formIdentificacion.digito_verificacion.trim()) {
        toast.error('El dígito de verificación del NIT es obligatorio', { id: 'perfil-identificacion' })
        return
      }
    }

    setGuardando(true)
    try {
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/api/clientes/${cliente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo_persona: formIdentificacion.tipo_persona,
          tipo_documento: formIdentificacion.tipo_documento,
          numero_documento: formIdentificacion.numero_documento.trim(),
          digito_verificacion: formIdentificacion.tipo_persona === 'juridica' ? formIdentificacion.digito_verificacion.trim() : null,
          razon_social: formIdentificacion.tipo_persona === 'juridica' ? formIdentificacion.razon_social.trim() : null,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        toast.error(datos.mensaje || 'Error al actualizar', { id: 'perfil-identificacion' })
        return
      }

      // El contexto refresca la caché y re-renderiza la pantalla al instante
      // (sin window.location.reload: el barco no necesita hundirse para repararse)
      actualizarPerfilCliente(datos.data)
      toast.success('Identificación actualizada', { id: 'perfil-identificacion' })
      setEditando(false)
    } catch (error) {
      console.error('Error actualizando identificación:', error)
      toast.error('No se pudo conectar con el servidor', { id: 'perfil-identificacion' })
    } finally {
      setGuardando(false)
    }
  }

  const tieneDocumento = Boolean(cliente.numero_documento)
  const tienePremio = cliente.descuento_proxima_compra === true
  const esJuridica = cliente.tipo_persona === 'juridica'

  const campos = [
    { label: 'Nombre completo', valor: [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') || '—' },
    { label: 'Correo electrónico', valor: cliente.email || '—' },
    { label: 'Miembro desde', valor: cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-CO', { day: 'numeric', year: 'numeric', month: 'long' }) : '—' },
  ]

  const camposIdentificacion = [
    { label: 'Tipo de persona', valor: ETIQUETAS_TIPO_PERSONA[cliente.tipo_persona] || '—' },
    { label: 'Tipo de documento', valor: ETIQUETAS_TIPO_DOCUMENTO[cliente.tipo_documento] || '—' },
    { label: 'Número de documento', valor: cliente.numero_documento || '—' },
    ...(cliente.tipo_persona === 'juridica' ? [
      { label: 'Razón social', valor: cliente.razon_social || '—' },
      { label: 'Dígito de verificación', valor: cliente.digito_verificacion || '—' },
    ] : []),
  ]

  const estilosInput = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Tu perfil</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2 mb-8 sm:mb-10 tracking-tight">Mi cuenta</h1>

        {/* CABECERA DE PERFIL */}
        <div className="rounded-2xl p-6 sm:p-8 flex items-center gap-5 mb-5 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          {cliente.foto ? (
            <img src={cliente.foto} alt={cliente.nombre} className="w-16 h-16 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#6FA98C] text-white flex items-center justify-center text-2xl font-semibold shrink-0">
              {inicial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-lg font-semibold truncate">{nombreCompleto}</p>
            <p className="text-white/45 text-sm truncate">{cliente.email}</p>
          </div>
        </div>

        {/* DATOS ACTUALES */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <IconoUsuario className="text-white/40" />
            <p className="text-sm font-semibold text-white">Información de la cuenta</p>
          </div>
          <div className="flex flex-col">
            {campos.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-3.5 border-b border-white/15 last:border-0 last:pb-0">
                <span className="text-white/45 text-sm">{c.label}</span>
                <span className="text-white text-sm font-medium">{c.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DESCUENTOS (EMPRESA / PREMIO) */}
        <div className={`rounded-2xl p-6 sm:p-8 mb-5 border shadow-sm ${(esJuridica || tienePremio) ? 'bg-[#6FA98C]/15 border-[#6FA98C]/40' : 'bg-white/[0.08] border-white/15'}`}>
          {esJuridica ? (
            <>
              <p className="text-lg font-semibold text-white mb-1">🏢 Tienes 10% de descuento en todos tus pedidos</p>
              <p className="text-sm text-white/60 leading-relaxed">
                Por comprar como empresa, el 10% se aplica automáticamente en cada pedido.
              </p>
            </>
          ) : tienePremio ? (
            <>
              <p className="text-lg font-semibold text-white mb-1">🎉 ¡Tienes 10% de descuento disponible!</p>
              <p className="text-sm text-white/60 leading-relaxed">
                Gracias a tu última compra al por mayor. Se aplicará automáticamente en tu próxima compra.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-white mb-1">🔥 Compra al por mayor y gana descuento</p>
              <p className="text-sm text-white/60 leading-relaxed">
                Lleva 5 o más productos en un pedido y ganas 10% de descuento para tu próxima compra.
              </p>
              {!tieneDocumento && (
                <p className="text-sm text-[#9DC9B4] mt-3 leading-relaxed">
                  💡 ¿Compras como empresa? Registra tu NIT en la sección Identificación y obtén 10% en todos tus pedidos.
                </p>
              )}
            </>
          )}
        </div>

        {/* IDENTIFICACIÓN */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <IconoUbicacion className="text-white/40" />
              <p className="text-sm font-semibold text-white">Identificación</p>
            </div>
            {!editando && (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-xs font-medium text-[#9DC9B4] hover:underline bg-transparent border-0 p-0 cursor-pointer"
              >
                {tieneDocumento ? 'Editar' : 'Completar'}
              </button>
            )}
          </div>

          {!editando ? (
            <div className="flex flex-col">
              {camposIdentificacion.map((campo) => (
                <div key={campo.label} className="flex items-center justify-between py-3 border-b border-white/15 last:border-0 last:pb-0">
                  <span className="text-white/45 text-sm">{campo.label}</span>
                  <span className="text-white text-sm font-medium">{campo.valor}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { valor: 'natural', etiqueta: 'Persona natural' },
                  { valor: 'juridica', etiqueta: 'Persona jurídica' },
                ].map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => handleCambioIdentificacion({ target: { name: 'tipo_persona', value: opcion.valor } })}
                    className="py-2.5 rounded-xl text-sm font-medium transition"
                    style={formIdentificacion.tipo_persona === opcion.valor
                      ? { background: 'rgba(111,169,140,0.15)', border: '1px solid #6FA98C', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="tipo-documento-perfil" className="block text-sm text-white/70 mb-1.5">Tipo de documento</label>
                <select
                  id="tipo-documento-perfil"
                  name="tipo_documento"
                  value={formIdentificacion.tipo_documento}
                  onChange={handleCambioIdentificacion}
                  disabled={formIdentificacion.tipo_persona === 'juridica'}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none transition disabled:opacity-50"
                  style={estilosInput}
                >
                  {formIdentificacion.tipo_persona === 'juridica' ? (
                    <option value="NIT">NIT</option>
                  ) : (
                    <>
                      <option value="CC">Cédula de ciudadanía (CC)</option>
                      <option value="CE">Cédula de extranjería (CE)</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="numero-documento-perfil" className="block text-sm text-white/70 mb-1.5">Número de documento</label>
                <input
                  id="numero-documento-perfil"
                  type="text"
                  name="numero_documento"
                  value={formIdentificacion.numero_documento}
                  onChange={handleCambioIdentificacion}
                  placeholder={formIdentificacion.tipo_persona === 'juridica' ? 'Número del NIT' : 'Número de cédula'}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                  style={estilosInput}
                />
              </div>

              {formIdentificacion.tipo_persona === 'juridica' && (
                <>
                  <div>
                    <label htmlFor="razon-social-perfil" className="block text-sm text-white/70 mb-1.5">Razón social</label>
                    <input
                      id="razon-social-perfil"
                      type="text"
                      name="razon_social"
                      value={formIdentificacion.razon_social}
                      onChange={handleCambioIdentificacion}
                      placeholder="Nombre de la empresa"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                      style={estilosInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="digito-verificacion-perfil" className="block text-sm text-white/70 mb-1.5">Dígito de verificación</label>
                    <input
                      id="digito-verificacion-perfil"
                      type="text"
                      name="digito_verificacion"
                      value={formIdentificacion.digito_verificacion}
                      onChange={handleCambioIdentificacion}
                      placeholder="Último dígito del NIT"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
                      style={estilosInput}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  disabled={guardando}
                  className="flex-1 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 transition disabled:opacity-50"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarIdentificacion}
                  disabled={guardando}
                  className="flex-1 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#D85A30] hover:bg-[#D85A30]/5 border border-[#D85A30]/25 transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D85A30] focus-visible:ring-offset-2"
        >
          <IconoSalir /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default MiCuenta