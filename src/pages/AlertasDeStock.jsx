import { useState, useEffect } from 'react'
import api from '../services/api'
import { PageHeader, StatCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'
import { normalizarNumerico } from '../utils/validacion'
import { toastErrorUnico } from '../utils/toastError'

// Bloquea letras, símbolos y notación científica (e/+/-) en inputs numéricos.
function bloquearNoNumerico(e) {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault()
  }
}

const coloresProducto = ['#E8C786', '#2B1B12', '#8B4A3C', '#5C7A4A', '#A65A3C', '#6B4226']

function colorParaProducto(id) {
  return coloresProducto[id % coloresProducto.length]
}

function estiloPorEstado(estado) {
  if (estado === 'Agotado') {
    return {
      borderColor: '#E11D48',
      textColor: 'text-red-500',
      badgeClass: 'bg-red-100 text-red-700',
      accion: 'Restablecer',
      accionTipo: 'primaria',
    }
  }
  return {
    borderColor: '#D8932F',
    textColor: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700',
    accion: 'Restablecer',
    accionTipo: 'secundaria',
  }
}

function AlertasStock() {
  const [resumen, setResumen] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  const [productoModal, setProductoModal] = useState(null)
  const [cantidad, setCantidad] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)

  const cargarDatos = () => {
    api.get('/alertas/resumen')
      .then(res => setResumen(res.data))
      .catch(err => toastErrorUnico(err.message))

    api.get('/alertas/listado')
      .then(res => setAlertas(res.data.alertas))
      .catch(err => toastErrorUnico(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const abrirModal = (producto) => {
    setProductoModal(producto)
    setCantidad('')
    setErrorModal(null)
  }

  const confirmarReabastecimiento = async (e) => {
    e.preventDefault()
    setErrorModal(null)

    if (cantidad === '' || Number.isNaN(Number(cantidad)) || Number(cantidad) < 0) {
      setErrorModal('Ingresa una cantidad válida en kg (puede ser 0).')
      return
    }

    setGuardando(true)
    try {
      await api.patch(`/inventario/productos/${productoModal.id}/restablecer`, {
        cantidad: Number(cantidad),
      })
      setProductoModal(null)
      cargarDatos() // recarga resumen + listado; si ya superó el umbral, desaparece sola
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'No se pudo restablecer el stock.')
    } finally {
      setGuardando(false)
    }
  }

  const stats = resumen ? [
    { label: 'Alertas activas', value: String(resumen.alertasActivas), sub: 'requieren atención', tono: 'ambar', icono: '⚠️' },
    { label: 'Agotados', value: String(resumen.agotados), sub: 'acción requerida', tono: 'rojo', icono: '✕' },
    { label: 'Resueltas hoy', value: String(resumen.resueltasHoy), sub: 'reabastecidos', tono: 'verde', icono: '✅' },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Alertas de stock"
        subtitulo="Productos que requieren reabastecimiento para mantener el inventario en buen nivel."
      />

      {!resumen ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`bg-white rounded-2xl border border-gray-200 p-5 h-24 animate-pulse ${i ? 'hidden sm:block' : ''}`}></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              icono={stat.icono}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              tono={stat.tono}
              delay={`panel-come-d${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <PanelSkeleton filas={3} columnas={3} />
        ) : alertas.length === 0 ? (
          <EmptyState
            icono="✅"
            titulo="Todo en orden"
            descripcion="No hay alertas activas — todo el inventario está en buen nivel."
          />
        ) : (
          alertas.map((a) => {
            const estilo = estiloPorEstado(a.estado)
            return (
              <div
                key={a.id}
                className="panel-card panel-come bg-white rounded-2xl border border-gray-200 border-l-4 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                style={{ borderLeftColor: estilo.borderColor }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {a.imagen ? (
                    <img src={a.imagen} alt={a.nombre} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex-shrink-0" style={{ backgroundColor: colorParaProducto(a.id) }}></div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium truncate">{a.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{a.origen || 'Sin origen registrado'}</p>
                    <p className={`text-xs mt-1 ${estilo.textColor}`}>
                      {a.stock} kg disponibles{a.capacidad > 0 ? ` · ${a.pct}% del stock máximo` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:ml-auto sm:flex-shrink-0">
                  <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${estilo.badgeClass}`}>
                    {a.estado}
                  </span>

                  {estilo.accionTipo === 'primaria' ? (
                    <BotonPrimario onClick={() => abrirModal(a)}>
                      {estilo.accion}
                    </BotonPrimario>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirModal(a)}
                      className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
                    >
                      {estilo.accion}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {productoModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal"
          onClick={() => setProductoModal(null)}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setProductoModal(null) }}
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="text-base font-semibold text-admin-heading mb-1">Restablecer stock de {productoModal.nombre}</h3>
            <p className="text-xs text-gray-400 mb-4">
              Stock actual: {productoModal.stock} kg{productoModal.capacidad > 0 ? ` de ${productoModal.capacidad} kg del lote` : ''}
            </p>

            <form onSubmit={confirmarReabastecimiento}>
              {errorModal && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorModal}
                </div>
              )}

              <label htmlFor="cantidad-reabastecimiento" className="block text-sm text-gray-600 mb-1.5">Nueva cantidad total (kg)</label>
              <input
                id="cantidad-reabastecimiento"
                type="number"
                min="0"
                onKeyDown={bloquearNoNumerico}
                step="0.1"
                autoFocus
                value={cantidad}
                 onChange={(e) => setCantidad(normalizarNumerico(e.target.value))}
                placeholder="Ej: 80"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] mb-5 transition placeholder:text-gray-400"
              />

              <div className="flex gap-3">
                <button type="button" onClick={() => setProductoModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 py-2.5 rounded-lg bg-[#1D9E75] text-white text-sm hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertasStock