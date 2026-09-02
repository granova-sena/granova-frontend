import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario, Paginado } from '../components/ui/panel/PanelKit'

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

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const COLOR_LOGISTICA = { bg: 'rgba(216,169,46,0.10)', border: 'rgba(216,169,46,0.30)', color: '#B8860B' }

function Logistica() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [formulario, setFormulario] = useState({ nombre: '', apellido: '', email: '', contraseña: '' })
  const [reglasContraseña, setReglasContraseña] = useState({ longitud: false, mayuscula: false, numero: false, especial: false })

  const [idEnProceso, setIdEnProceso] = useState(null)
  const [eliminandoUsuario, setEliminandoUsuario] = useState(null)

  async function cargarUsuarios() {
    try {
      const token = localStorage.getItem('token_empleado')
      const respuesta = await fetch(`${API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const datos = await respuesta.json()
      if (respuesta.ok) setUsuarios(datos)
    } catch (error) {
      console.error('Error cargando personal de logística:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarUsuarios() }, [])

  const personal = usuarios.filter(u => u.rol === 'logistica')
  const activos = personal.filter(u => u.estado === 'activo').length
  const inactivos = personal.filter(u => u.estado === 'inactivo').length

  const q = normalizar(busqueda)
  const filtrados = personal.filter(u =>
    normalizar(u.nombre).includes(q) ||
    normalizar(u.apellido).includes(q) ||
    normalizar(u.email).includes(q)
  )
  const totalPaginas = Math.max(Math.ceil(filtrados.length / 5), 1)
  const visibles = filtrados.slice((pagina - 1) * 5, (pagina - 1) * 5 + 5)

  function abrirModal() {
    setFormulario({ nombre: '', apellido: '', email: '', contraseña: '' })
    setReglasContraseña({ longitud: false, mayuscula: false, numero: false, especial: false })
    setErrorFormulario('')
    setModalAbierto(true)
    window.dispatchEvent(new CustomEvent('granova:modal', { detail: { abierto: true } }))
  }

  function cerrarModal() {
    if (guardando) return
    setModalAbierto(false)
    window.dispatchEvent(new CustomEvent('granova:modal', { detail: { abierto: false } }))
  }

  function actualizarCampo(campo, valor) {
    setFormulario(prev => ({ ...prev, [campo]: valor }))
    if (campo === 'contraseña') setReglasContraseña(evaluarReglasContraseña(valor))
  }

  async function manejarCrearUsuario(e) {
    e.preventDefault()
    setErrorFormulario('')

    const reglas = evaluarReglasContraseña(formulario.contraseña)
    if (!Object.values(reglas).every(Boolean)) {
      setErrorFormulario('La contraseña debe tener al menos 6 caracteres, una mayúscula, un número y un carácter especial')
      return
    }

    setGuardando(true)
    try {
      const token = localStorage.getItem('token_empleado')
      const respuesta = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formulario, rol: 'logistica' }),
      })
      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorFormulario(datos.error || 'No se pudo crear el usuario')
        return
      }

      setModalAbierto(false)
      window.dispatchEvent(new CustomEvent('granova:modal', { detail: { abierto: false } }))
      await cargarUsuarios()
      toast.success('Personal de logística creado')
    } catch (error) {
      console.error('Error en Logistica:', error)
      setErrorFormulario('Error de conexión con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleEstado(usuario) {
    setIdEnProceso(usuario.id_usuario)
    try {
      const token = localStorage.getItem('token_empleado')
      const respuesta = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/estado`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const datos = await respuesta.json()
      if (!respuesta.ok) {
        toast.error(datos.error || 'No se pudo cambiar el estado')
        return
      }
      await cargarUsuarios()
      toast.success(usuario.estado === 'activo' ? 'Desactivado' : 'Activado')
    } catch (error) {
      console.error('Error en Logistica:', error)
      toast.error('Error de conexión con el servidor')
    } finally {
      setIdEnProceso(null)
    }
  }

  async function eliminarUsuarioAccion() {
    const usuario = eliminandoUsuario
    setEliminandoUsuario(null)
    if (!usuario) return

    setIdEnProceso(usuario.id_usuario)
    try {
      const token = localStorage.getItem('token_empleado')
      const respuesta = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const datos = await respuesta.json()
      if (!respuesta.ok) {
        toast.error(datos.error || 'No se pudo eliminar el usuario')
        return
      }
      await cargarUsuarios()
      toast.success('Personal eliminado')
    } catch (error) {
      console.error('Error en Logistica:', error)
      toast.error('Error de conexión con el servidor')
    } finally {
      setIdEnProceso(null)
    }
  }

  const reglas = [
    { ok: reglasContraseña.longitud, texto: '6+ caracteres' },
    { ok: reglasContraseña.mayuscula, texto: 'Una mayúscula' },
    { ok: reglasContraseña.numero, texto: 'Un número' },
    { ok: reglasContraseña.especial, texto: 'Un carácter especial' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Logística"
        subtitulo="Crea y gestiona el personal de logística de Granova"
        acciones={(
          <BotonPrimario onClick={abrirModal}>+ Nuevo personal</BotonPrimario>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icono="👥" label="Personal de logística" value={String(personal.length)} tono="cielo" delay="panel-come-d1" />
        <StatCard icono="✅" label="Activos" value={String(activos)} tono="verde" delay="panel-come-d2" />
        <StatCard icono="⛔" label="Inactivos" value={String(inactivos)} tono="rojo" delay="panel-come-d3" />
      </div>

      <PanelCard animado={false} className="overflow-hidden">
        <div className="p-4 sm:px-5 border-b border-gray-100">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
              placeholder="Buscar por nombre, apellido o correo..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition placeholder:text-gray-400 text-admin-heading"
            />
          </div>
        </div>

        {cargando ? (
          <PanelSkeleton filas={3} columnas={4} />
        ) : visibles.length === 0 ? (
          <EmptyState
            icono="🚚"
            titulo="No hay personal de logística"
            descripcion={busqueda ? 'Prueba con otro término de búsqueda.' : 'Crea la primera persona de logística con el botón "+ Nuevo personal".'}
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {visibles.map((u) => (
                <div key={u.id_usuario} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: COLOR_LOGISTICA.bg }}>
                    <span className="font-semibold text-sm" style={{ color: COLOR_LOGISTICA.color }}>
                      {(u.nombre || '?')[0]}{(u.apellido || '')[0] || ''}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-admin-heading">
                      {u.nombre} {u.apellido}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start sm:self-center" style={{ background: COLOR_LOGISTICA.bg, border: `1px solid ${COLOR_LOGISTICA.border}`, color: COLOR_LOGISTICA.color }}>
                    Logística
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full self-start sm:self-center ${u.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => toggleEstado(u)}
                      disabled={idEnProceso === u.id_usuario}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEliminandoUsuario(u)}
                      disabled={idEnProceso === u.id_usuario}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="px-4 sm:px-5 py-3 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-gray-500">Mostrando {visibles.length} de {filtrados.length} personas</p>
                  <Paginado pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
                </div>
              </div>
            )}
          </>
        )}
      </PanelCard>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-admin-heading mb-4">Nuevo personal de logística</h3>
            <form onSubmit={manejarCrearUsuario} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nombre</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => actualizarCampo('nombre', e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Apellido</label>
                <input
                  type="text"
                  value={formulario.apellido}
                  onChange={(e) => actualizarCampo('apellido', e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Correo</label>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) => actualizarCampo('email', e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Contraseña</label>
                <input
                  type="password"
                  value={formulario.contraseña}
                  onChange={(e) => actualizarCampo('contraseña', e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {reglas.map((r) => (
                    <span key={r.texto} className={`text-[10px] px-2 py-0.5 rounded-full ${r.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {r.ok ? '✓' : '○'} {r.texto}
                    </span>
                  ))}
                </div>
              </div>

              {errorFormulario && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorFormulario}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
                >
                  {guardando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!eliminandoUsuario}
        titulo="¿Eliminar este personal?"
        mensaje={eliminandoUsuario ? `Se eliminará a ${eliminandoUsuario.nombre} ${eliminandoUsuario.apellido}. Esta acción no se puede deshacer.` : ''}
        confirmarTexto="Eliminar"
        onConfirmar={eliminarUsuarioAccion}
        onCancelar={() => setEliminandoUsuario(null)}
      />
    </div>
  )
}

export default Logistica