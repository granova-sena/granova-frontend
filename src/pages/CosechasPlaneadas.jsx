import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState, BotonPrimario, Paginado } from '../components/ui/panel/PanelKit'

function authHeaders() {
  const token = localStorage.getItem('token_empleado')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function CosechasPlaneadas() {
  const [cosechas, setCosechas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmacion, setConfirmacion] = useState({ abierto: false, mensaje: '', accion: null, cosecha: null })
  const [pagina, setPagina] = useState(1)

  function cargar() {
    setLoading(true)
    api.get('/inventario/cosechas?estado=planeada', { headers: authHeaders() })
      .then((res) => setCosechas(res.data.cosechas))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  async function confirmarLlegada() {
    const cosecha = confirmacion.cosecha
    setConfirmacion({ abierto: false, mensaje: '', accion: null, cosecha: null })
    if (!cosecha) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/cosechas/${cosecha.id_cosecha}/confirmar`, {}, { headers: authHeaders() })
      cargar()
      toast.success('Café sumado al catálogo')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function cancelarPlan() {
    const cosecha = confirmacion.cosecha
    setConfirmacion({ abierto: false, mensaje: '', accion: null, cosecha: null })
    if (!cosecha) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/cosechas/${cosecha.id_cosecha}/cancelar`, {}, { headers: authHeaders() })
      cargar()
      toast.success('Plan cancelado')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          titulo="Cosechas planeadas"
          subtitulo="Aquí verás las cosechas planeadas. Nada se suma al catálogo hasta que se confirme."
        />
        <PanelSkeleton filas={3} columnas={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Cosechas planeadas"
        subtitulo="Aquí verás las cosechas planeadas. Nada se suma al catálogo hasta que se confirme."
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex justify-between items-center panel-come">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      {cosechas.length === 0 ? (
        <EmptyState
          icono="🌱"
          titulo="No hay cosechas planeadas"
          descripcion="Cuando se planeen nuevas cosechas, aparecerán aquí para confirmarlas en cuanto lleguen."
        />
      ) : (
        <>
        <div className="space-y-3">
          {cosechas.slice((pagina - 1) * 5, (pagina - 1) * 5 + 5).map((c) => (
            <PanelCard key={c.id_cosecha} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.finca_nombre} · Lote {c.codigo_lote}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.kg_estimados} kg de {c.tipo_cafe} estimados · {formatMoney(c.valor_estimado)} · planeada por {c.planeado_por_nombre || 'Empleado'}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap self-start">Esperando que llegue</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {c.repartos.map((r, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {r.cantidad} × {r.presentacion_nombre}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <BotonPrimario
                  disabled={guardando}
                  onClick={() => setConfirmacion({ abierto: true, mensaje: `¿Confirmar que llegó el café de ${c.finca_nombre}? Esto lo suma al catálogo automáticamente.`, accion: confirmarLlegada, cosecha: c })}
                  className="flex-1 justify-center"
                >
                  Ya llegó el café — confirmar
                </BotonPrimario>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setConfirmacion({ abierto: true, mensaje: '¿Cancelar este plan? No se pierde nada porque todavía no se aplicó a la DB.', accion: cancelarPlan, cosecha: c })}
                  className="flex-1 text-xs py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                >
                  Cancelar plan
                </button>
              </div>
            </PanelCard>
          ))}
        </div>
        {Math.ceil(cosechas.length / 5) > 1 && (
          <div className="pt-1">
            <Paginado pagina={pagina} totalPaginas={Math.ceil(cosechas.length / 5)} onChange={setPagina} />
          </div>
        )}
        </>
      )}

      <ConfirmDialog
        abierto={confirmacion.abierto}
        titulo="¿Estás seguro?"
        mensaje={confirmacion.mensaje}
        confirmarTexto="Confirmar"
        onConfirmar={() => confirmacion.accion?.()}
        onCancelar={() => setConfirmacion({ abierto: false, mensaje: '', accion: null, cosecha: null })}
      />
    </div>
  )
}

export default CosechasPlaneadas