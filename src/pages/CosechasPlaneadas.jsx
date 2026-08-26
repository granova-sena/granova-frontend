import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function CosechasPlaneadas() {
  const [cosechas, setCosechas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    setLoading(true)
    api.get('/inventario/cosechas?estado=planeada', { headers: authHeaders() })
      .then((res) => setCosechas(res.data.cosechas))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  async function confirmarLlegada(cosecha) {
    if (!window.confirm(`¿Confirmar que llegó el café de ${cosecha.finca_nombre}? Esto lo suma al catálogo automáticamente.`)) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/cosechas/${cosecha.id_cosecha}/confirmar`, {}, { headers: authHeaders() })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function cancelarPlan(cosecha) {
    if (!window.confirm('¿Cancelar este plan? No se pierde nada porque todavía no se aplicó a la DB.')) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/cosechas/${cosecha.id_cosecha}/cancelar`, {}, { headers: authHeaders() })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">Cosechas planeadas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Aquí verás las cosechas planeadas. Nada se suma al catálogo hasta que se confirme.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      {cosechas.length === 0 ? (
        <p className="text-sm text-gray-400">No hay cosechas planeadas por ahora.</p>
      ) : (
        <div className="space-y-3">
          {cosechas.map((c) => (
            <div key={c.id_cosecha} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.finca_nombre} · Lote {c.codigo_lote}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.kg_estimados} kg de {c.tipo_cafe} estimados · {formatMoney(c.valor_estimado)} · planeada por {c.planeado_por_nombre || 'Empleado'}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Esperando que llegue</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {c.repartos.map((r, i) => (
                  <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">
                    {r.cantidad} × {r.presentacion_nombre}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => confirmarLlegada(c)}
                  className="flex-1 text-xs py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50"
                >
                  Ya llegó el café — confirmar
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => cancelarPlan(c)}
                  className="flex-1 text-xs py-2 rounded-lg border border-red-200 text-red-500 disabled:opacity-50"
                >
                  Cancelar plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CosechasPlaneadas
