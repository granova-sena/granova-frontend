import { useState, useEffect, useRef } from 'react'
import { API_URL } from "../config";


const ROLES_DISPONIBLES = ['admin', 'gerente', 'empleado']

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

function Users() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [metricas, setMetricas] = useState(null)
  const [cargandoMetricas, setCargandoMetricas] = useState(true)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [formulario, setFormulario] = useState({
    nombre: '', apellido: '', email: '', contraseña: '', rol: 'empleado',
  })
  const [reglasContraseña, setReglasContraseña] = useState({
    longitud: false, mayuscula: false, numero: false, especial: false,
  })
  const [contraseñaFocus, setContraseñaFocus] = useState(false)

  const [idEnProceso, setIdEnProceso] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  const [importando, setImportando] = useState(false)
  const [resumenImportacion, setResumenImportacion] = useState(null)
  const inputArchivoRef = useRef(null)

  async function cargarUsuarios() {
    try {
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const datos = await respuesta.json()
      if (respuesta.ok) setUsuarios(datos)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setCargando(false)
    }
  }

  async function cargarMetricas() {
    try {
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/usuarios/metricas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const datos = await respuesta.json()
      if (respuesta.ok) setMetricas(datos)
    } catch (error) {
      console.error('Error cargando métricas:', error)
    } finally {
      setCargandoMetricas(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
    cargarMetricas()
  }, [])

  function abrirModal() {
    setFormulario({ nombre: '', apellido: '', email: '', contraseña: '', rol: 'empleado' })
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
    setFormulario((prev) => ({ ...prev, [campo]: valor }))
    if (campo === 'contraseña') {
      setReglasContraseña(evaluarReglasContraseña(valor))
    }
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
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formulario),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorFormulario(datos.error || 'No se pudo crear el usuario')
        return
      }

      setModalAbierto(false)
      window.dispatchEvent(new CustomEvent('granova:modal', { detail: { abierto: false } }))
      await Promise.all([cargarUsuarios(), cargarMetricas()])

    } catch (error) {
      console.error('Error en Users:', error)
      setErrorFormulario('Error de conexión con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleEstado(usuario) {
    setErrorAccion('')
    setIdEnProceso(usuario.id_usuario)

    try {
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/estado`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorAccion(datos.error || 'No se pudo cambiar el estado')
        return
      }

      await Promise.all([cargarUsuarios(), cargarMetricas()])

    } catch (error) {
      console.error('Error en Users:', error)
      setErrorAccion('Error de conexión con el servidor')
    } finally {
      setIdEnProceso(null)
    }
  }

  async function cambiarRol(usuario, nuevoRol) {
    if (nuevoRol === usuario.rol) return

    setErrorAccion('')
    setIdEnProceso(usuario.id_usuario)

    try {
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/rol`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rol: nuevoRol }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorAccion(datos.error || 'No se pudo cambiar el rol')
        return
      }

      await Promise.all([cargarUsuarios(), cargarMetricas()])

    } catch (error) {
      console.error('Error en Users:', error)
      setErrorAccion('Error de conexión con el servidor')
    } finally {
      setIdEnProceso(null)
    }
  }

  async function eliminarUsuarioAccion(usuario) {
    const confirmado = window.confirm(
      `¿Eliminar a ${usuario.nombre} ${usuario.apellido}? Podrás recuperarlo desde la base de datos si es necesario, pero dejará de aparecer aquí.`
    )
    if (!confirmado) return

    setErrorAccion('')
    setIdEnProceso(usuario.id_usuario)

    try {
      const token = localStorage.getItem('token')
      const respuesta = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorAccion(datos.error || 'No se pudo eliminar el usuario')
        return
      }

      await Promise.all([cargarUsuarios(), cargarMetricas()])

    } catch (error) {
      console.error('Error en Users:', error)
      setErrorAccion('Error de conexión con el servidor')
    } finally {
      setIdEnProceso(null)
    }
  }

  function abrirSelectorArchivo() {
    inputArchivoRef.current?.click()
  }

  async function manejarImportarExcel(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setResumenImportacion(null)
    setErrorAccion('')
    setImportando(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('archivo', archivo)

      // OJO: no se pone 'Content-Type' a mano — el navegador arma el header
      // multipart/form-data con el boundary correcto solo si lo dejamos solo.
      const respuesta = await fetch(`${API_URL}/usuarios/importar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorAccion(datos.error || 'No se pudo importar el archivo')
        return
      }

      setResumenImportacion(datos)
      await Promise.all([cargarUsuarios(), cargarMetricas()])

    } catch (error) {
      console.error('Error en Users:', error)
      setErrorAccion('Error de conexión con el servidor')
    } finally {
      setImportando(false)
      e.target.value = '' // permite volver a elegir el mismo archivo si hace falta reintentar
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

  const qBusqueda = normalizar(busqueda)
  const usuariosFiltrados = usuarios.filter(u =>
    normalizar(u.nombre).includes(qBusqueda) ||
    normalizar(u.apellido).includes(qBusqueda) ||
    normalizar(u.email).includes(qBusqueda)
  )

  const getRolColor = (rol) => {
    switch (rol) {
      case 'admin': return { bg: 'rgba(29,158,117,0.10)', border: 'rgba(29,158,117,0.25)', color: '#1D9E75' }
      case 'gerente': return { bg: 'rgba(20,40,32,0.06)', border: 'rgba(20,40,32,0.12)', color: 'rgba(31,42,36,0.65)' }
      default: return { bg: 'rgba(20,40,32,0.05)', border: 'rgba(20,40,32,0.10)', color: 'rgba(31,42,36,0.5)' }
    }
  }

  const glass = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(20,40,32,0.14)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    boxShadow: '0 8px 28px rgba(20,40,32,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
  }

  return (
    <div className="min-h-full">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1F2A24]">Usuarios</h1>
        <p className="text-[#1F2A24]/45 text-sm mt-1">Gestiona el personal interno de Granova</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="rounded-2xl p-5 flex items-center gap-4" style={glass}>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(29,158,117,0.10)', color: '#1D9E75' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold text-[#1F2A24]">{cargandoMetricas ? '—' : metricas?.total ?? 0}</p>
            <p className="text-xs text-[#1F2A24]/50 mt-0.5">Total de usuarios</p>
          </div>
        </div>

        <div className="rounded-2xl p-5 flex items-center gap-4" style={glass}>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(29,158,117,0.10)', color: '#1D9E75' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold text-[#1F2A24]">{cargandoMetricas ? '—' : metricas?.activos ?? 0}</p>
            <p className="text-xs text-[#1F2A24]/50 mt-0.5">Activos</p>
          </div>
        </div>

        <div className="rounded-2xl p-5 flex items-center gap-4" style={glass}>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold text-[#1F2A24]">{cargandoMetricas ? '—' : metricas?.inactivos ?? 0}</p>
            <p className="text-xs text-[#1F2A24]/50 mt-0.5">Inactivos</p>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={glass}>
          <p className="text-xs text-[#1F2A24]/50 mb-2">Por rol</p>
          {cargandoMetricas ? (
            <p className="text-sm text-[#1F2A24]/40">—</p>
          ) : metricas?.por_rol?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {metricas.por_rol.map((item) => (
                <span
                  key={item.rol}
                  className="text-xs px-2.5 py-1 rounded-full capitalize"
                  style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.12)', color: 'rgba(31,42,36,0.7)' }}
                >
                  {item.rol}: {item.cantidad}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#1F2A24]/40">Sin datos</p>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div
        className="rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
        style={glass}
      >
        <div className="relative flex-1 w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1F2A24]/30" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-[#1F2A24] placeholder-[#1F2A24]/30 focus:outline-none transition"
            style={{
              background: 'rgba(20,40,32,0.06)',
              border: '1px solid rgba(20,40,32,0.14)',
            }}
            onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(29,158,117,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.12)' }}
            onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(20,40,32,0.10)'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span
            className="text-xs px-2.5 py-1 rounded-full text-[#1F2A24]/50"
            style={{ background: 'rgba(20,40,32,0.07)', border: '1px solid rgba(20,40,32,0.14)' }}
          >
            {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={abrirModal}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl text-white transition-transform duration-150 hover:-translate-y-0.5"
            style={{ background: '#1D9E75', boxShadow: '0 4px 14px rgba(29,158,117,0.3)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Agregar usuario
          </button>

          <input
            ref={inputArchivoRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={manejarImportarExcel}
            className="hidden"
          />
          <button
            onClick={abrirSelectorArchivo}
            disabled={importando}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition disabled:opacity-60 disabled:cursor-wait"
            style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.14)', color: 'rgba(31,42,36,0.7)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {importando ? 'Importando...' : 'Importar Excel'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      {resumenImportacion && (
        <div
          className="rounded-xl mb-3 p-4"
          style={{ background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-[#1F2A24]">{resumenImportacion.mensaje}</p>
            <button onClick={() => setResumenImportacion(null)} className="text-[#1F2A24]/40 hover:text-[#1F2A24] flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {resumenImportacion.errores?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {resumenImportacion.errores.map((err, i) => (
                <li key={i} className="text-xs text-[#dc2626]">
                  Fila {err.fila}: {err.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {errorAccion && (
        <div
          className="text-xs px-4 py-2.5 rounded-xl mb-3 flex items-center justify-between"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
        >
          <span>{errorAccion}</span>
          <button onClick={() => setErrorAccion('')} className="opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        {/* Header tabla (oculto en móvil, la vista de tarjetas no lo necesita) */}
        <div
          className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-xs text-[#1F2A24]/40 uppercase tracking-wider"
          style={{ borderBottom: '1px solid rgba(20,40,32,0.12)', background: 'rgba(20,40,32,0.045)' }}
        >
          <div className="col-span-1">#</div>
          <div className="col-span-4">Usuario</div>
          <div className="col-span-2">Correo</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[#1F2A24]/40 text-sm">Cargando usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-3 text-[#1F2A24]/20" width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-[#1F2A24]/40 text-sm">
              {busqueda ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <div>
            {usuariosFiltrados.map((usuario, i) => (
              <div key={usuario.id_usuario}>
                {/* Fila de escritorio (sm y mayor) */}
                <div
                  className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 hover:bg-[#1D9E75]/[0.04] group"
                  style={{ borderBottom: i < usuariosFiltrados.length - 1 ? '1px solid rgba(20,40,32,0.06)' : 'none' }}
                >
                  {/* Número */}
                  <div className="col-span-1 text-xs text-[#1F2A24]/30">{i + 1}</div>

                  {/* Usuario */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                      style={{
                        background: 'rgba(29,158,117,0.12)',
                        color: '#1D9E75',
                      }}
                    >
                      {usuario.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-[#1F2A24]/85 font-medium">{usuario.nombre} {usuario.apellido}</p>
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="col-span-2">
                    <p className="text-sm text-[#1F2A24]/50 truncate">{usuario.email}</p>
                  </div>

                  {/* Rol */}
                  <div className="col-span-2">
                    <select
                      value={usuario.rol}
                      disabled={idEnProceso === usuario.id_usuario}
                      onChange={(e) => cambiarRol(usuario, e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-full capitalize cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-wait"
                      style={{ background: getRolColor(usuario.rol).bg, border: `1px solid ${getRolColor(usuario.rol).border}`, color: getRolColor(usuario.rol).color }}
                    >
                      {ROLES_DISPONIBLES.map((rol) => (
                        <option key={rol} value={rol} className="capitalize">{rol}</option>
                      ))}
                    </select>
                  </div>

                  {/* Estado */}
                  <div className="col-span-2">
                    <button
                      onClick={() => toggleEstado(usuario)}
                      disabled={idEnProceso === usuario.id_usuario}
                      className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                      title={usuario.estado === 'activo' ? 'Clic para desactivar' : 'Clic para activar'}
                    >
                      <span
                        className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0"
                        style={{ background: usuario.estado === 'activo' ? '#1D9E75' : 'rgba(20,40,32,0.18)' }}
                      >
                        <span
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200"
                          style={{ left: usuario.estado === 'activo' ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
                        />
                      </span>
                      <span
                        className="text-xs capitalize"
                        style={{ color: usuario.estado === 'activo' ? '#1D9E75' : 'rgba(31,42,36,0.5)' }}
                      >
                        {usuario.estado}
                      </span>
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => eliminarUsuarioAccion(usuario)}
                      disabled={idEnProceso === usuario.id_usuario}
                      className="p-1.5 rounded-lg text-[#1F2A24]/30 hover:text-[#dc2626] hover:bg-[#dc2626]/[0.08] transition disabled:opacity-40 disabled:cursor-wait"
                      title="Eliminar usuario"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Tarjeta de móvil (oculta en sm y mayor) */}
                <div
                  className="sm:hidden px-4 py-4 flex flex-col gap-3"
                  style={{ borderBottom: i < usuariosFiltrados.length - 1 ? '1px solid rgba(20,40,32,0.06)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                      style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}
                    >
                      {usuario.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#1F2A24]/85 font-medium truncate">{usuario.nombre} {usuario.apellido}</p>
                      <p className="text-xs text-[#1F2A24]/45 truncate">{usuario.email}</p>
                    </div>
                    <button
                      onClick={() => eliminarUsuarioAccion(usuario)}
                      disabled={idEnProceso === usuario.id_usuario}
                      className="p-2 -mr-2 rounded-lg text-[#1F2A24]/30 hover:text-[#dc2626] hover:bg-[#dc2626]/[0.08] transition disabled:opacity-40 disabled:cursor-wait flex-shrink-0"
                      title="Eliminar usuario"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={usuario.rol}
                      disabled={idEnProceso === usuario.id_usuario}
                      onChange={(e) => cambiarRol(usuario, e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-full capitalize cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-wait"
                      style={{ background: getRolColor(usuario.rol).bg, border: `1px solid ${getRolColor(usuario.rol).border}`, color: getRolColor(usuario.rol).color }}
                    >
                      {ROLES_DISPONIBLES.map((rol) => (
                        <option key={rol} value={rol} className="capitalize">{rol}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => toggleEstado(usuario)}
                      disabled={idEnProceso === usuario.id_usuario}
                      className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                      title={usuario.estado === 'activo' ? 'Clic para desactivar' : 'Clic para activar'}
                    >
                      <span
                        className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0"
                        style={{ background: usuario.estado === 'activo' ? '#1D9E75' : 'rgba(20,40,32,0.18)' }}
                      >
                        <span
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200"
                          style={{ left: usuario.estado === 'activo' ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
                        />
                      </span>
                      <span
                        className="text-xs capitalize"
                        style={{ color: usuario.estado === 'activo' ? '#1D9E75' : 'rgba(31,42,36,0.5)' }}
                      >
                        {usuario.estado}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Agregar usuario */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(20,40,32,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={cerrarModal}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ ...glass, background: 'rgba(255,255,255,0.98)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1F2A24]">Agregar usuario</h2>
              <button onClick={cerrarModal} className="text-[#1F2A24]/40 hover:text-[#1F2A24] transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={manejarCrearUsuario} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#1F2A24]/50 mb-1 block">Nombre</label>
                  <input
                    required
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) => actualizarCampo('nombre', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-[#1F2A24] focus:outline-none"
                    style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.14)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#1F2A24]/50 mb-1 block">Apellido</label>
                  <input
                    required
                    type="text"
                    value={formulario.apellido}
                    onChange={(e) => actualizarCampo('apellido', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-[#1F2A24] focus:outline-none"
                    style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.14)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#1F2A24]/50 mb-1 block">Correo</label>
                <input
                  required
                  type="email"
                  value={formulario.email}
                  onChange={(e) => actualizarCampo('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[#1F2A24] focus:outline-none"
                  style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.14)' }}
                />
              </div>

              <div>
                <label className="text-xs text-[#1F2A24]/50 mb-1 block">Contraseña</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={formulario.contraseña}
                  onChange={(e) => actualizarCampo('contraseña', e.target.value)}
                  onFocus={() => setContraseñaFocus(true)}
                  onBlur={() => setContraseñaFocus(false)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[#1F2A24] focus:outline-none"
                  style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.14)' }}
                />
                {(() => {
                  const contraseñaValida = Object.values(reglasContraseña).every(Boolean)
                  const reglasLista = [
                    { id: 'longitud', label: 'Mínimo 6 caracteres', cumplida: reglasContraseña.longitud },
                    { id: 'mayuscula', label: 'Una letra mayúscula', cumplida: reglasContraseña.mayuscula },
                    { id: 'numero', label: 'Un número', cumplida: reglasContraseña.numero },
                    { id: 'especial', label: 'Un carácter especial (!@#...)', cumplida: reglasContraseña.especial },
                  ]
                  return (
                    <>
                      <div className={`overflow-hidden transition-all duration-300 ${(contraseñaFocus || formulario.contraseña) && !contraseñaValida ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                        <div className="flex flex-col gap-1">
                          {reglasLista.map((regla) => (
                            <p
                              key={regla.id}
                              className="text-xs"
                              style={{ color: regla.cumplida ? '#1D9E75' : 'rgba(31,42,36,0.4)' }}
                            >
                              {regla.cumplida ? '✓' : '○'} {regla.label}
                            </p>
                          ))}
                        </div>
                      </div>
                      {contraseñaValida && formulario.contraseña && (
                        <p className="text-xs mt-1" style={{ color: '#1D9E75' }}>✓ Contraseña segura</p>
                      )}
                    </>
                  )
                })()}
              </div>

              <div>
                <label className="text-xs text-[#1F2A24]/50 mb-1 block">Rol</label>
                <select
                  value={formulario.rol}
                  onChange={(e) => actualizarCampo('rol', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[#1F2A24] focus:outline-none capitalize"
                  style={{ background: 'rgba(20,40,32,0.06)', border: '1px solid rgba(20,40,32,0.14)' }}
                >
                  {ROLES_DISPONIBLES.map((rol) => (
                    <option key={rol} value={rol} className="capitalize">{rol}</option>
                  ))}
                </select>
              </div>

              {errorFormulario && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
                  {errorFormulario}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 text-sm px-4 py-2.5 rounded-xl text-[#1F2A24]/60 transition"
                  style={{ background: 'rgba(20,40,32,0.06)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !Object.values(reglasContraseña).every(Boolean)}
                  className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl text-white transition disabled:opacity-60"
                  style={{ background: '#1D9E75' }}
                >
                  {guardando ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Users