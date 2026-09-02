import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PageHeader, PanelSkeleton, EmptyState } from '../components/ui/panel/PanelKit'

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function RespuestasEmpleados() {
  const [respuestas, setRespuestas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    api
      .get('/empleados/todas-respuestas')
      .then((res) => setRespuestas(res.data.respuestas || []))
      .catch((err) => toast.error(err.response?.data?.error || 'No se pudieron cargar las respuestas'))
      .finally(() => setCargando(false))
  }, [])

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return respuestas
    return respuestas.filter((r) => {
      const nombre = `${r.empleado_nombre || ''} ${r.empleado_apellido || ''}`.toLowerCase()
      const email = (r.empleado_email || '').toLowerCase()
      return nombre.includes(q) || email.includes(q)
    })
  }, [respuestas, busqueda])

  const empleadosUnicos = useMemo(() => {
    const mapa = new Map()
    respuestas.forEach((r) => {
      const id = r.id_empleado
      if (!mapa.has(id)) {
        mapa.set(id, `${r.empleado_nombre} ${r.empleado_apellido}`)
      }
    })
    return [...mapa.values()].sort((a, b) => a.localeCompare(b))
  }, [respuestas])

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Respuestas de empleados"
        subtitulo="Explicaciones que los empleados han dado a sus reportes"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo del empleado..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition"
        />
        <select
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1D9E75] transition"
        >
          <option value="">Todos los empleados</option>
          {empleadosUnicos.map((nombre) => (
            <option key={nombre} value={nombre}>{nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtradas.length} respuesta{filtradas.length === 1 ? '' : 's'}
          {busqueda ? ' filtradas' : ''}
        </p>
      </div>

      {cargando ? (
        <PanelSkeleton filas={3} columnas={1} />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icono="💬"
          titulo="Sin respuestas"
          descripcion={
            busqueda
              ? 'Ningún empleado coincide con tu búsqueda.'
              : 'Aún no hay respuestas de empleados a sus reportes.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <div key={r.id_respuesta} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] font-semibold flex items-center justify-center flex-shrink-0">
                  {`${(r.empleado_nombre || '?')[0]}${(r.empleado_apellido || '')[0] || ''}`.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-admin-heading truncate">{r.empleado_nombre} {r.empleado_apellido}</p>
                  <p className="text-xs text-gray-400 truncate">{r.empleado_email}</p>
                </div>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium flex-shrink-0">{formatFecha(r.fecha)}</span>
              </div>

              <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-emerald-800 text-sm">" {r.respuesta} "</p>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Sobre el reporte: <span className="text-gray-600">{r.motivo}</span> · {formatFecha(r.reporte_fecha)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RespuestasEmpleados