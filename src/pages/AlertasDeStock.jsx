import { useState, useEffect } from 'react'
import api from '../services/api'

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
  const [error, setError] = useState(null)

  const [productoModal, setProductoModal] = useState(null)
  const [cantidad, setCantidad] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)

  const cargarDatos = () => {
    api.get('/alertas/resumen')
      .then(res => setResumen(res.data))
      .catch(err => setError(err.message))

    api.get('/alertas/listado')
      .then(res => setAlertas(res.data.alertas))
      .catch(err => setError(err.message))
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

  if (error) return <p className="text-red-500">Error al cargar alertas: {error}</p>

  const stats = resumen ? [
    { label: 'Alertas activas', value: String(resumen.alertasActivas), change: 'requieren atención', valueClass: 'text-amber-500', changeClass: 'text-amber-500' },
    { label: 'Agotados', value: String(resumen.agotados), change: 'acción requerida', valueClass: 'text-red-500', changeClass: 'text-red-500' },
    { label: 'Resueltas hoy', value: String(resumen.resueltasHoy), change: 'reabastecidos', valueClass: 'text-gray-800', changeClass: 'text-[#1D9E75]' },
  ] : []

  return (
    <div className="space-y-4">
      {!resumen ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${stat.valueClass}`}>{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.changeClass}`}>{stat.change}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-admin-heading">Alertas de stock</h2>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
            Cargando alertas...
          </div>
        ) : alertas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
            No hay alertas activas — todo el inventario está en buen nivel.
          </div>
        ) : (
          alertas.map((a) => {
            const estilo = estiloPorEstado(a.estado)
            return (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-l-4"
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
                    <button
                      type="button"
                      onClick={() => abrirModal(a)}
                      className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap"
                    >
                      {estilo.accion}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirModal(a)}
                      className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
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
            <h3 className="text-base font-semibold text-gray-800 mb-1">Restablecer stock de {productoModal.nombre}</h3>
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
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej: 80"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] mb-5"
              />

              <div className="flex gap-3">
                <button type="button" onClick={() => setProductoModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
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