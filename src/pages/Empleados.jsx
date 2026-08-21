import { useState, useEffect } from 'react'
import api from '../services/api'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function iniciales(nombre, apellido) {
  return `${(nombre || '?')[0]}${(apellido || '')[0] || ''}`.toUpperCase()
}

function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalNuevo, setModalNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [credenciales, setCredenciales] = useState(null)

  const [seleccionado, setSeleccionado] = useState(null)
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({ nombre: '', apellido: '', estado: 'activo' })
  const [reportes, setReportes] = useState([])
  const [modalReporte, setModalReporte] = useState(false)
  const [motivoReporte, setMotivoReporte] = useState('')
  const [vista, setVista] = useState(null) // null | 'reportes' | 'historial'
  const [historial, setHistorial] = useState([])
  const [resumenHistorial, setResumenHistorial] = useState(null)

  function cargar() {
    setCargando(true)
    api.get('/empleados', { headers: authHeaders() })
      .then((res) => setEmpleados(res.data.empleados))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  async function crearEmpleado(e) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim()) return
    setGuardando(true)
    try {
      const res = await api.post('/empleados', { nombre, apellido }, { headers: authHeaders() })
      setCredenciales({ email: res.data.email, password: res.data.password })
      setNombre('')
      setApellido('')
      setModalNuevo(false)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function abrirDetalle(emp) {
    setSeleccionado(emp)
    setFormEdit({ nombre: emp.nombre, apellido: emp.apellido, estado: emp.estado })
    setEditando(false)
    setVista(null)
    api.get(`/empleados/${emp.id_usuario}`, { headers: authHeaders() })
      .then((res) => {
        setReportes(res.data.reportes)
        setHistorial(res.data.historial || [])
        setResumenHistorial(res.data.resumenHistorial || null)
      })
      .catch(() => { setReportes([]); setHistorial([]); setResumenHistorial(null) })
  }

  async function enviarReporte(e) {
    e.preventDefault()
    if (!motivoReporte.trim()) return
    setGuardando(true)
    try {
      await api.post(`/empleados/${seleccionado.id_usuario}/reportes`, { motivo: motivoReporte }, { headers: authHeaders() })
      setMotivoReporte('')
      setModalReporte(false)
      abrirDetalle(seleccionado)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function borrarReporte(idReporte) {
    setGuardando(true)
    try {
      await api.delete(`/empleados/${seleccionado.id_usuario}/reportes/${idReporte}`, { headers: authHeaders() })
      abrirDetalle(seleccionado)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function borrarTodosLosReportes() {
    if (!window.confirm('¿Eliminar todos los reportes de este empleado?')) return
    setGuardando(true)
    try {
      await api.delete(`/empleados/${seleccionado.id_usuario}/reportes`, { headers: authHeaders() })
      abrirDetalle(seleccionado)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function toggleBloqueo() {
    const accion = seleccionado.estado === 'bloqueado' ? 'desbloquear' : 'bloquear'
    setGuardando(true)
    try {
      await api.patch(`/empleados/${seleccionado.id_usuario}/${accion}`, {}, { headers: authHeaders() })
      setSeleccionado(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function guardarEdicion() {
    setGuardando(true)
    try {
      await api.patch(`/empleados/${seleccionado.id_usuario}`, formEdit, { headers: authHeaders() })
      setSeleccionado(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarEmpleado() {
    if (!window.confirm(`¿Eliminar a ${seleccionado.nombre} ${seleccionado.apellido}?`)) return
    setGuardando(true)
    try {
      await api.delete(`/empleados/${seleccionado.id_usuario}`, { headers: authHeaders() })
      setSeleccionado(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function resetearPassword() {
    setGuardando(true)
    try {
      const res = await api.patch(`/empleados/${seleccionado.id_usuario}/reset-password`, {}, { headers: authHeaders() })
      setCredenciales({ email: seleccionado.email, password: res.data.password })
      setSeleccionado(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#1F2A24]">Empleados</h1>
        <button
          type="button"
          onClick={() => setModalNuevo(true)}
          className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition"
        >
          + Nuevo empleado
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400">✕</button>
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-[#1F2A24]/40">Cargando...</p>
      ) : empleados.length === 0 ? (
        <p className="text-sm text-[#1F2A24]/40">Aún no hay empleados registrados.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {empleados.map((emp) => (
            <button
              key={emp.id_usuario}
              type="button"
              onClick={() => abrirDetalle(emp)}
              className="text-left rounded-2xl p-5 bg-white border border-gray-100 hover:border-[#1D9E75]/40 hover:shadow-md transition flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] font-semibold flex items-center justify-center flex-shrink-0">
                {iniciales(emp.nombre, emp.apellido)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[#1F2A24] truncate">{emp.nombre} {emp.apellido}</p>
                <p className="text-xs text-[#1F2A24]/50 truncate">{emp.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    emp.estado === 'bloqueado' ? 'bg-red-50 text-red-500' :
                    emp.estado === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {emp.estado === 'bloqueado' ? 'Bloqueado' : emp.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                  {emp.reportes > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      emp.reportes >= 3 ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {emp.reportes} reporte{emp.reportes === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-[#1F2A24] mb-4">Nuevo empleado</h2>
            <form onSubmit={crearEmpleado} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Apellido</label>
                <input value={apellido} onChange={(e) => setApellido(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" required />
              </div>
              <p className="text-xs text-gray-400">El correo y la contraseña se generan solos al guardar.</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalNuevo(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50">
                  {guardando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {credenciales && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#1D9E75] flex items-center justify-center mx-auto mb-3">✓</div>
            <h2 className="font-semibold text-[#1F2A24] mb-1">Credenciales generadas</h2>
            <p className="text-xs text-gray-400 mb-4">Cópialas ahora, no se van a volver a mostrar.</p>
            <div className="bg-gray-50 rounded-lg p-3 text-left text-sm space-y-1 mb-4">
              <p><span className="text-gray-400">Correo:</span> {credenciales.email}</p>
              <p><span className="text-gray-400">Contraseña:</span> {credenciales.password}</p>
            </div>
            <button onClick={() => setCredenciales(null)}
              className="w-full text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white">Listo</button>
          </div>
        </div>
      )}

      {modalReporte && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-[#1F2A24] mb-1">Reportar a {seleccionado.nombre}</h2>
            <p className="text-xs text-gray-400 mb-4">Este reporte queda en su historial.</p>
            <form onSubmit={enviarReporte} className="space-y-3">
              <textarea
                rows={3}
                value={motivoReporte}
                onChange={(e) => setMotivoReporte(e.target.value)}
                placeholder="Explica qué pasó"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#1D9E75]"
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalReporte(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-red-500 text-white disabled:opacity-50">
                  {guardando ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {seleccionado && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] font-semibold flex items-center justify-center">
                {iniciales(seleccionado.nombre, seleccionado.apellido)}
              </div>
              <div>
                <p className="font-medium text-[#1F2A24]">{seleccionado.nombre} {seleccionado.apellido}</p>
                <p className="text-xs text-[#1F2A24]/50">{seleccionado.email}</p>
              </div>
            </div>

            {vista === 'reportes' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1F2A24]">Reportes ({reportes.length})</p>
                  {reportes.length > 0 && (
                    <button onClick={borrarTodosLosReportes} className="text-xs text-red-500">Eliminar todos</button>
                  )}
                </div>
                {reportes.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin reportes.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {reportes.map((r) => (
                      <div key={r.id_reporte} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[#1F2A24]">{r.motivo}</p>
                          <button onClick={() => borrarReporte(r.id_reporte)} className="text-gray-300 hover:text-red-500 flex-shrink-0">✕</button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {r.creado_por_nombre || 'Admin'} · {new Date(r.fecha).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setVista(null)} className="w-full text-sm px-4 py-2 rounded-lg text-gray-400">Volver</button>
              </div>
            ) : vista === 'historial' ? (
              <div className="space-y-3">
                {resumenHistorial && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-[#1F2A24]">{resumenHistorial.productosAgregados}</p>
                      <p className="text-[10px] text-gray-500">Productos</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-[#1F2A24]">{resumenHistorial.entregasRegistradas}</p>
                      <p className="text-[10px] text-gray-500">Entregas</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-[#1F2A24]">{resumenHistorial.pagosMarcados}</p>
                      <p className="text-[10px] text-gray-500">Pagos</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-[#1F2A24]">{resumenHistorial.lotesProcesados}</p>
                      <p className="text-[10px] text-gray-500">Procesados</p>
                    </div>
                  </div>
                )}
                {historial.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin actividad registrada todavía.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {historial.map((h, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-[#1F2A24]">{h.detalle}</p>
                        <p className="text-xs text-gray-400 mt-1">{h.fecha ? new Date(h.fecha).toLocaleString('es-CO') : '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setVista(null)} className="w-full text-sm px-4 py-2 rounded-lg text-gray-400">Volver</button>
              </div>
            ) : editando ? (
              <div className="space-y-3">
                <input value={formEdit.nombre} onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Nombre" />
                <input value={formEdit.apellido} onChange={(e) => setFormEdit({ ...formEdit, apellido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Apellido" />
                <select value={formEdit.estado} onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditando(false)} className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                  <button onClick={guardarEdicion} disabled={guardando} className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50">Guardar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">Estado: <span className="text-[#1F2A24]">{seleccionado.estado}</span></p>
                <p className="text-gray-500">Desde: <span className="text-[#1F2A24]">{new Date(seleccionado.fecha_creacion).toLocaleDateString('es-CO')}</span></p>

                <div className="flex flex-col gap-2 pt-4">
                  <button onClick={() => setVista('historial')} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-between">
                    <span>Historial</span>
                  </button>
                  <button onClick={() => setVista('reportes')} className="text-xs text-gray-400 underline text-left">Ver reportes ({reportes.length})</button>
                  <button onClick={() => setModalReporte(true)}
                    className="text-sm px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center justify-between">
                    <span>Reporte</span>
                    {reportes.length > 0 && <span className="text-xs">{reportes.length}</span>}
                  </button>
                  <button onClick={() => setEditando(true)} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Editar</button>
                  <button onClick={resetearPassword} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Generar nueva contraseña</button>
                  <button onClick={toggleBloqueo} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    {seleccionado.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                  </button>
                  <button onClick={eliminarEmpleado} className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Eliminar</button>
                  <button onClick={() => setSeleccionado(null)} className="text-sm px-4 py-2 rounded-lg text-gray-400">Cerrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Empleados
