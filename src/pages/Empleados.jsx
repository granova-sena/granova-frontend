import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { toastErrorUnico } from '../utils/toastError'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PageHeader, EmptyState, PanelSkeleton } from '../components/ui/panel/PanelKit'

function authHeaders() {
  const token = localStorage.getItem('token_empleado')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function iniciales(nombre, apellido) {
  return `${(nombre || '?')[0]}${(apellido || '')[0] || ''}`.toUpperCase()
}

function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)

  const [modalNuevo, setModalNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmacion, setConfirmacion] = useState({ abierto: false, mensaje: '', accion: null })

  const [credenciales, setCredenciales] = useState(null)

  const [seleccionado, setSeleccionado] = useState(null)
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({ nombre: '', apellido: '', estado: 'activo' })
  const [reportes, setReportes] = useState([])
  const [modalReporte, setModalReporte] = useState(false)
  const [motivoReporte, setMotivoReporte] = useState('')
  const [reportearA, setReportearA] = useState(null)
  const [vista, setVista] = useState(null) // null | 'reportes' | 'historial'
  const [historial, setHistorial] = useState([])
  const [resumenHistorial, setResumenHistorial] = useState(null)

  function cargar() {
    setCargando(true)
    api.get('/empleados', { headers: authHeaders() })
      .then((res) => setEmpleados(res.data.empleados))
      .catch((err) => toastErrorUnico(err.response?.data?.error || err.message))
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
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function abrirDetalle(emp) {
    setSeleccionado(emp)
    setFormEdit({ nombre: emp.nombre, apellido: emp.apellido, estado: emp.estado })
    setEditando(false)
    setVista(null)
    refrescarDetalle(emp.id_usuario)
  }

  // Refresca SOLO el detalle (reportes + historial + resumen) y ajusta el
  // contador de la tarjeta, sin volver a bajar toda la lista de empleados
  // (ese doble fetch era el que congelaba la ventana tras reportar).
  // Recibe el id explícito: el estado `seleccionado` se setea de forma
  // asíncrona, así que leerlo acá dentro daba null al abrir el detalle y
  // dejaba reportes/historial vacíos la primera vez.
  async function refrescarDetalle(id = seleccionado?.id_usuario) {
    if (!id) return 0
    try {
      const res = await api.get(`/empleados/${id}`, { headers: authHeaders() })
      const lista = res.data.reportes || []
      setReportes(lista)
      setHistorial(res.data.historial || [])
      setResumenHistorial(res.data.resumenHistorial || null)
      setEmpleados(prev => prev.map(e =>
        e.id_usuario === id ? { ...e, reportes: lista.length } : e
      ))
      return lista.length
    } catch {
      setReportes([])
      setHistorial([])
      setResumenHistorial(null)
      return 0
    }
  }

  async function enviarReporte(e) {
    e.preventDefault()
    if (!motivoReporte.trim() || !reportearA) return
    const objetivo = reportearA
    setGuardando(true)
    try {
      await api.post(`/empleados/${objetivo.id_usuario}/reportes`, { motivo: motivoReporte }, { headers: authHeaders() })
      setMotivoReporte('')
      setModalReporte(false)
      setReportearA(null)
      await refrescarDetalle(objetivo.id_usuario)
      toast.success('Reporte enviado')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function borrarReporte(idReporte) {
    setGuardando(true)
    try {
      await api.delete(`/empleados/${seleccionado.id_usuario}/reportes/${idReporte}`, { headers: authHeaders() })
      await refrescarDetalle(seleccionado.id_usuario)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function borrarTodosLosReportes() {
    setGuardando(true)
    try {
      await api.delete(`/empleados/${seleccionado.id_usuario}/reportes`, { headers: authHeaders() })
      await refrescarDetalle(seleccionado.id_usuario)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
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
      toast.error(err.response?.data?.error || err.message)
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
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarEmpleado() {
    setGuardando(true)
    try {
      await api.delete(`/empleados/${seleccionado.id_usuario}`, { headers: authHeaders() })
      setSeleccionado(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
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
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Empleados"
        subtitulo="Gestiona la nómina y reportes del personal"
        acciones={
          <button
            type="button"
            onClick={() => setModalNuevo(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] active:scale-[0.98] transition shadow-sm shadow-[#1D9E75]/20"
          >
            + Nuevo empleado
          </button>
        }
      />

      {cargando ? (
        <PanelSkeleton filas={2} columnas={3} />
      ) : empleados.length === 0 ? (
        <EmptyState icono="👥" titulo="Sin empleados" descripcion="Aún no hay empleados registrados. Crea el primero para comenzar." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {empleados.map((emp, i) => (
            <button
              key={emp.id_usuario}
              type="button"
              onClick={() => abrirDetalle(emp)}
              className={`panel-card panel-come${i ? ` panel-come-d${Math.min(i + 1, 5)}` : ''} text-left rounded-2xl p-5 bg-white border border-gray-200 hover:border-[#1D9E75]/40 hover:shadow-lg transition-all duration-200 flex items-center gap-4 group`}
            >
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] font-semibold flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                {iniciales(emp.nombre, emp.apellido)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-admin-heading truncate">{emp.nombre} {emp.apellido}</p>
                <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    emp.estado === 'bloqueado' ? 'bg-red-50 text-red-600' :
                    emp.estado === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {emp.estado === 'bloqueado' ? 'Bloqueado' : emp.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                  {emp.reportes > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      emp.reportes >= 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {emp.reportes} reporte{emp.reportes === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setReportearA(emp); setMotivoReporte(''); setModalReporte(true) }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setReportearA(emp); setMotivoReporte(''); setModalReporte(true) } }}
                title="Reportar a este empleado"
                className="w-9 h-9 rounded-lg border border-orange-200 text-orange-500 hover:bg-orange-50 hover:border-orange-300 flex items-center justify-center flex-shrink-0 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </button>
          ))}
        </div>
      )}

      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm panel-come">
            <h2 className="font-semibold text-admin-heading mb-4">Nuevo empleado</h2>
            <form onSubmit={crearEmpleado} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Apellido</label>
                <input value={apellido} onChange={(e) => setApellido(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition" required />
              </div>
              <p className="text-xs text-gray-400">El correo y la contraseña se generan solos al guardar.</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalNuevo(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] disabled:opacity-50 transition">
                  {guardando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {credenciales && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center panel-come">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#1D9E75] flex items-center justify-center mx-auto mb-3 text-lg">✓</div>
            <h2 className="font-semibold text-admin-heading mb-1">Credenciales generadas</h2>
            <p className="text-xs text-gray-400 mb-4">Cópialas ahora, no se van a volver a mostrar.</p>
            <div className="bg-gray-50 rounded-lg p-3 text-left text-sm space-y-1 mb-4">
              <p><span className="text-gray-400">Correo:</span> {credenciales.email}</p>
              <p><span className="text-gray-400">Contraseña:</span> {credenciales.password}</p>
            </div>
            <button onClick={() => setCredenciales(null)}
              className="w-full text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition">Listo</button>
          </div>
        </div>
      )}

      {modalReporte && reportearA && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm panel-come">
            <h2 className="font-semibold text-admin-heading mb-1">Reportar a {reportearA.nombre} {reportearA.apellido}</h2>
            <p className="text-xs text-gray-400 mb-4">Este reporte queda en su historial. El empleado podrá responderlo.</p>
            <form onSubmit={enviarReporte} className="space-y-3">
              <textarea
                rows={3}
                value={motivoReporte}
                onChange={(e) => setMotivoReporte(e.target.value)}
                placeholder="Explica qué pasó"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setModalReporte(false); setMotivoReporte(''); setReportearA(null) }}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition">
                  {guardando ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {seleccionado && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm panel-come">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] font-semibold flex items-center justify-center">
                {iniciales(seleccionado.nombre, seleccionado.apellido)}
              </div>
              <div>
                <p className="font-medium text-admin-heading">{seleccionado.nombre} {seleccionado.apellido}</p>
                <p className="text-xs text-gray-500">{seleccionado.email}</p>
              </div>
            </div>

            {vista === 'reportes' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-admin-heading">Reportes ({reportes.length})</p>
                  {reportes.length > 0 && (
                    <button onClick={() => setConfirmacion({ abierto: true, mensaje: '¿Eliminar todos los reportes de este empleado?', accion: borrarTodosLosReportes })} className="text-xs text-red-500 hover:text-red-600 transition">Eliminar todos</button>
                  )}
                </div>
                {reportes.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin reportes.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {reportes.map((r) => (
                      <div key={r.id_reporte} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-gray-800">{r.motivo}</p>
                          <button onClick={() => borrarReporte(r.id_reporte)} className="text-gray-300 hover:text-red-500 flex-shrink-0 transition">✕</button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {r.creado_por_nombre || 'Admin'} · {new Date(r.fecha).toLocaleDateString('es-CO')}
                        </p>
                        {(r.respuestas?.length || 0) > 0 && (
                          <div className="mt-3 space-y-2 border-t border-gray-200 pt-2">
                            {r.respuestas.map((res) => (
                              <div key={res.id_respuesta} className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                <p className="text-emerald-800 text-sm">El empleado respondió: {res.respuesta}</p>
                                <p className="text-[10px] text-emerald-600 mt-0.5">
                                  {res.fecha ? new Date(res.fecha).toLocaleString('es-CO') : '—'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setVista(null)} className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
                  </svg>
                  Volver
                </button>
              </div>
            ) : vista === 'respuestas' ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-admin-heading">Respuestas del empleado a sus reportes</p>
                {(() => {
                  const todas = reportes.flatMap((r) =>
                    (r.respuestas || []).map((res) => ({
                      ...res,
                      motivo: r.motivo,
                      reporteFecha: r.fecha,
                    }))
                  ).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  if (todas.length === 0) {
                    return <p className="text-sm text-gray-400">El empleado aún no ha respondido ningún reporte.</p>
                  }
                  return (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {todas.map((res) => (
                        <div key={res.id_respuesta} className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                          <p className="text-emerald-800 text-sm">El empleado respondió: {res.respuesta}</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">
                            Sobre: {res.motivo} · {res.fecha ? new Date(res.fecha).toLocaleString('es-CO') : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                <button onClick={() => setVista(null)} className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
                  </svg>
                  Volver
                </button>
              </div>
            ) : vista === 'historial' ? (
              <div className="space-y-3">
                {resumenHistorial && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-admin-heading">{resumenHistorial.productosAgregados}</p>
                      <p className="text-[10px] text-gray-500">Productos</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-admin-heading">{resumenHistorial.entregasRegistradas}</p>
                      <p className="text-[10px] text-gray-500">Entregas</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-admin-heading">{resumenHistorial.pagosMarcados}</p>
                      <p className="text-[10px] text-gray-500">Pagos</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-admin-heading">{resumenHistorial.lotesProcesados}</p>
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
                        <p className="text-gray-800">{h.detalle}</p>
                        <p className="text-xs text-gray-400 mt-1">{h.fecha ? new Date(h.fecha).toLocaleString('es-CO') : '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setVista(null)} className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
                  </svg>
                  Volver
                </button>
              </div>
            ) : editando ? (
              <div className="space-y-3">
                <input value={formEdit.nombre} onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition" placeholder="Nombre" />
                <input value={formEdit.apellido} onChange={(e) => setFormEdit({ ...formEdit, apellido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition" placeholder="Apellido" />
                <select value={formEdit.estado} onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditando(false)} className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                  <button onClick={guardarEdicion} disabled={guardando} className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] disabled:opacity-50 transition">Guardar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">Estado: <span className="text-admin-heading">{seleccionado.estado}</span></p>
                <p className="text-gray-500">Desde: <span className="text-admin-heading">{new Date(seleccionado.fecha_creacion).toLocaleDateString('es-CO')}</span></p>

                <div className="flex flex-col gap-2 pt-4">
                  <button onClick={() => setVista('historial')} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center justify-between">
                    <span>Historial</span>
                  </button>
                  <button onClick={() => setVista('reportes')} className="text-xs text-gray-400 underline text-left hover:text-gray-600 transition">Ver reportes ({reportes.length})</button>
                  <button onClick={() => setVista('respuestas')} className="text-sm px-4 py-2 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition flex items-center justify-between">
                    <span>Respuestas del empleado</span>
                  </button>
                  <button onClick={() => setEditando(true)} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Editar</button>
                  <button onClick={resetearPassword} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Generar nueva contraseña</button>
                  <button onClick={toggleBloqueo} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                    {seleccionado.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                  </button>
                  <button onClick={() => setConfirmacion({ abierto: true, mensaje: `¿Eliminar a ${seleccionado.nombre} ${seleccionado.apellido}?`, accion: eliminarEmpleado })} className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">Eliminar</button>
                  <button onClick={() => setSeleccionado(null)} className="text-sm px-4 py-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">Cerrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={confirmacion.abierto}
        titulo="¿Estás seguro?"
        mensaje={confirmacion.mensaje}
        confirmarTexto="Confirmar"
        onConfirmar={() => { if (confirmacion.accion) confirmacion.accion(); setConfirmacion({ abierto: false, mensaje: '', accion: null }) }}
        onCancelar={() => setConfirmacion({ abierto: false, mensaje: '', accion: null })}
      />
    </div>
  )
}

export default Empleados
