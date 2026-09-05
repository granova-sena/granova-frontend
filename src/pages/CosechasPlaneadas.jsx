import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { toastErrorUnico } from '../utils/toastError'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState, BotonPrimario, Paginado } from '../components/ui/panel/PanelKit'

function authHeaders() {
  const token = localStorage.getItem('token_empleado')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function CosechasPlaneadas() {
  const navigate = useNavigate()
  const [cosechas, setCosechas] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [confirmacion, setConfirmacion] = useState({ abierto: false, mensaje: '', accion: null, cosecha: null })
  const [pagina, setPagina] = useState(1)

  function cargar() {
    setLoading(true)
    api.get('/inventario/cosechas?estado=planeada', { headers: authHeaders() })
      .then((res) => setCosechas(res.data.cosechas))
      .catch((err) => toastErrorUnico(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  async function confirmarLlegada(cosecha) {
    setConfirmacion({ abierto: false, mensaje: '', accion: null, cosecha: null })
    if (!cosecha) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/cosechas/${cosecha.id_cosecha}/confirmar`, {}, { headers: authHeaders() })
      // Overlay sigue visible: espera 1.5s para que el usuario vea la animación
      await new Promise((r) => setTimeout(r, 1500))
      toast.success('Café sumado al catálogo')
    } catch (err) {
      await new Promise((r) => setTimeout(r, 1500))
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
      cargar()
    }
  }

  async function cancelarPlan(cosecha) {
    setConfirmacion({ abierto: false, mensaje: '', accion: null, cosecha: null })
    if (!cosecha) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/cosechas/${cosecha.id_cosecha}/cancelar`, {}, { headers: authHeaders() })
      toast.success('Plan eliminado — kg devueltos al lote')
      // Restablece al control de inventario en la finca/lote de esa cosecha
      if (cosecha.id_finca) {
        navigate(`/panel-empleado?finca=${cosecha.id_finca}&lote=${cosecha.id_lote ?? ''}`)
      } else {
        cargar()
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
      cargar()
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
                  onClick={() => setConfirmacion({ abierto: true, mensaje: `¿Eliminar este plan? Como el café aún no se procesó, se devolverá a ${c.finca_nombre} / Lote ${c.codigo_lote} en el control de inventario.`, accion: cancelarPlan, cosecha: c })}
                  className="flex-1 text-xs py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                >
                  Eliminar plan
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
        onConfirmar={() => confirmacion.accion?.(confirmacion.cosecha)}
        onCancelar={() => setConfirmacion({ abierto: false, mensaje: '', accion: null, cosecha: null })}
      />

      {guardando && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-black/40 anim-overlay">
          <div className="flex flex-col items-center gap-3 panel-card bg-white rounded-2xl border border-gray-200 px-8 py-8 shadow-xl anim-pop">
            <div
              className="w-12 h-12 rounded-full border-4 border-[#1D9E75]/25 border-t-[#1D9E75] animate-spin"
            />
            <p className="text-sm font-medium text-admin-heading">Confirmando llegada…</p>
            <p className="text-xs text-gray-500 -mt-2">Sumando el café al catálogo</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CosechasPlaneadas