import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorModal from '../components/ui/ErrorModal'
import toast from 'react-hot-toast'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'

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

  function cargar() {
    setLoading(true)
    return api.get('/inventario/cosechas?estado=planeada', { headers: authHeaders() })
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
      await cargar()
      toast.success(cosecha.origen === 'proceso-lote' ? 'Listo, se agregó al catálogo' : 'Listo, el café se sumó al catálogo')
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
          subtitulo="Registros listos para sumarse al catálogo. Nada se suma hasta que lo confirmes aquí."
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

      <ErrorModal mensaje={error} onClose={() => setError(null)} />

      {cosechas.length === 0 ? (
        <EmptyState
          icono="🌱"
          titulo="No hay cosechas planeadas"
          descripcion="Cuando se planeen nuevas cosechas, aparecerán aquí para confirmarlas en cuanto lleguen."
        />
      ) : (
        <div className="space-y-3">
          {cosechas.map((c) => (
            <PanelCard key={c.id_cosecha} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.finca_nombre} · Lote {c.codigo_lote}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.origen === 'proceso-lote' ? (
                      <>Se van a convertir {c.kg_estimados} kg en el producto listo para el catálogo</>
                    ) : (
                      <>{c.kg_estimados} kg de {c.tipo_cafe} estimados · {formatMoney(c.valor_estimado)} por recibir</>
                    )}
                    {' '}· planeada por {c.planeado_por_nombre || 'Empleado'}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap self-start ${
                  c.origen === 'proceso-lote'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {c.origen === 'proceso-lote' ? 'En proceso — listo para el catálogo' : 'Esperando que llegue'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {c.repartos.map((r, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {r.cantidad} × {r.presentacion_nombre}
                  </span>
                ))}
              </div>

              {c.origen === 'proceso-lote' && (
                <p className="text-xs text-gray-400 mb-3">
                  Al agregarlo, las unidades se suman al catálogo sin eliminar el stock existente y los kg
                  de este lote dejan de estar disponibles (no se duplican).
                </p>
              )}

              <div className="flex gap-2">
                <BotonPrimario
                  disabled={guardando}
                  onClick={() => setConfirmacion({
                    abierto: true,
                    mensaje: c.origen === 'proceso-lote'
                      ? `¿Agregar a catálogo el café de ${c.finca_nombre} (lote ${c.codigo_lote})? Las unidades se suman al stock sin borrar lo que ya había, y esos kg se descuentan del lote.`
                      : `¿Confirmar que llegó el café de ${c.finca_nombre}? Esto lo suma al catálogo automáticamente.`,
                    accion: confirmarLlegada,
                    cosecha: c,
                  })}
                  className="flex-1 justify-center"
                >
                  {c.origen === 'proceso-lote' ? 'Agregar a catálogo' : 'Ya llegó el café — confirmar'}
                </BotonPrimario>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setConfirmacion({
                    abierto: true,
                    mensaje: c.origen === 'proceso-lote'
                      ? '¿Cancelar este proceso? Nada se ha sumado al catálogo todavía; los kg vuelven a estar disponibles en el lote.'
                      : '¿Cancelar este plan? No se pierde nada porque todavía no se aplicó a la DB.',
                    accion: cancelarPlan,
                    cosecha: c,
                  })}
                  className="flex-1 text-xs py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                >
                  Cancelar plan
                </button>
              </div>
            </PanelCard>
          ))}
        </div>
      )}

      <ConfirmDialog
        abierto={confirmacion.abierto}
        titulo="¿Estás seguro?"
        mensaje={confirmacion.mensaje}
        confirmarTexto="Confirmar"
        cargando={guardando}
        onConfirmar={() => confirmacion.accion?.()}
        onCancelar={() => setConfirmacion({ abierto: false, mensaje: '', accion: null, cosecha: null })}
      />
    </div>
  )
}

export default CosechasPlaneadas