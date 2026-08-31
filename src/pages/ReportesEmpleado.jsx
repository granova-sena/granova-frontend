import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

function authHeaders() {
  const token = localStorage.getItem('token_empleado')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ReportesEmpleado() {
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [respuestas, setRespuestas] = useState({}) // id_reporte -> texto
  const [enviando, setEnviando] = useState(null)

  function cargar() {
    setCargando(true)
    api.get('/empleados/mis-reportes', { headers: authHeaders() })
      .then((res) => setReportes(res.data.reportes))
      .catch(() => toast.error('No se pudieron cargar tus reportes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  async function responder(idReporte) {
    const texto = (respuestas[idReporte] || '').trim()
    if (!texto) return
    setEnviando(idReporte)
    try {
      await api.post(`/empleados/mis-reportes/${idReporte}/responder`, { respuesta: texto }, { headers: authHeaders() })
      setRespuestas((prev) => ({ ...prev, [idReporte]: '' }))
      cargar()
      toast.success('Respuesta enviada')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar la respuesta')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-admin-heading">Mis reportes</h2>
        <span className="text-xs text-gray-400">{reportes.length} reporte{reportes.length === 1 ? '' : 's'}</span>
      </div>

      {cargando ? (
        <p className="text-sm text-gray-400">Cargando reportes...</p>
      ) : reportes.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <p className="text-emerald-700 font-medium">No tienes reportes 🎉</p>
          <p className="text-xs text-emerald-600 mt-1">Aquí verás los reportes que deje el administrador y podrás responderlos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reportes.map((r) => (
            <div key={r.id_reporte} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-800">{r.motivo}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {r.creado_por_nombre || 'Admin'} · {formatFecha(r.fecha)}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium flex-shrink-0">Reporte</span>
              </div>

              {(r.respuestas || []).map((resp) => (
                <div key={resp.id_respuesta} className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <p className="text-emerald-800 text-sm">Tú respondiste: {resp.respuesta}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">{formatFecha(resp.fecha)}</p>
                </div>
              ))}

              <div className="mt-3 flex gap-2">
                <textarea
                  rows={2}
                  value={respuestas[r.id_reporte] || ''}
                  onChange={(e) => setRespuestas((prev) => ({ ...prev, [r.id_reporte]: e.target.value }))}
                  placeholder="Escribe una explicación de por qué ocurrió..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition"
                />
                <button
                  onClick={() => responder(r.id_reporte)}
                  disabled={enviando === r.id_reporte || !(respuestas[r.id_reporte] || '').trim()}
                  className="px-4 py-2 rounded-lg bg-[#1D9E75] text-white text-sm hover:bg-[#178a64] disabled:opacity-40 transition self-end flex-shrink-0"
                >
                  {enviando === r.id_reporte ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReportesEmpleado
