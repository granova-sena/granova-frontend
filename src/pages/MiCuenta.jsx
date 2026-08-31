import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { API_URL } from '../config'

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

  const [cliente, setCliente] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cliente')) || {}
    } catch {
      return {}
    }
  })

  const [form, setForm] = useState(() => ({
    telefono: cliente.telefono || '',
    direccion: cliente.direccion || '',
    ciudad: cliente.ciudad || '',
    departamento: cliente.departamento || '',
  }))

  const [guardando, setGuardando] = useState(false)

  const inicial = (cliente.nombre || 'C').charAt(0).toUpperCase()
  const nombreCompleto = [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') || 'Cliente Granova'

  function cerrarSesion() {
    localStorage.removeItem('token')
    localStorage.removeItem('cliente')
    navigate('/login')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function guardarDatosEnvio(e) {
    e.preventDefault()

    const id = cliente.id
    if (!id) {
      toast.error('No hay sesión activa')
      return
    }

    setGuardando(true)
    try {
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telefono: form.telefono.trim(),
          direccion: form.direccion.trim(),
          ciudad: form.ciudad.trim(),
          departamento: form.departamento.trim(),
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudieron guardar los datos')
      }

      // Actualizamos el cliente guardado en localStorage para que el checkout autocomplete.
      const clienteActualizado = { ...cliente, ...datos.cliente }
      localStorage.setItem('cliente', JSON.stringify(clienteActualizado))
      setCliente(clienteActualizado)

      toast.success('Datos de envío guardados correctamente')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setGuardando(false)
    }
  }

  const campos = [
    { label: 'Nombre completo', valor: [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') || '—' },
    { label: 'Correo electrónico', valor: cliente.email || '—' },
    { label: 'Miembro desde', valor: cliente.fecha_creacion ? new Date(cliente.fecha_creacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }) : '—' },
  ]

  const inputClase = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition bg-white/[0.06] border border-white/15 focus:border-[#6FA98C]'

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

        {/* DATOS DE ENVÍO — editable */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <IconoUbicacion className="text-white/40" />
            <p className="text-sm font-semibold text-white">Datos de envío</p>
          </div>
          <p className="text-white/40 text-xs mb-6 leading-relaxed">
            Estos datos se guardan en tu cuenta y se autocompletan al confirmar un pedido.
          </p>

          <form onSubmit={guardarDatosEnvio} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange}
                  type="tel" placeholder="300 123 4567" className={inputClase} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Departamento</label>
                <input name="departamento" value={form.departamento} onChange={handleChange}
                  type="text" placeholder="Cundinamarca" className={inputClase} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Ciudad</label>
                <input name="ciudad" value={form.ciudad} onChange={handleChange}
                  type="text" placeholder="Bogotá" className={inputClase} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Dirección</label>
                <input name="direccion" value={form.direccion} onChange={handleChange}
                  type="text" placeholder="Calle 123 # 45-67" className={inputClase} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-1">
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar datos de envío'}
              </button>
            </div>
          </form>
        </div>

        <button
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
