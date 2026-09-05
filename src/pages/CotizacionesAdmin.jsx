import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState, BotonPrimario, Paginado } from '../components/ui/panel/PanelKit'

function normalizar(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

const ESTADOS = [
  { valor: 'emitida', etiqueta: 'Emitida', color: 'bg-sky-100 text-sky-700' },
  { valor: 'aceptada', etiqueta: 'Aceptada', color: 'bg-emerald-100 text-emerald-700' },
  { valor: 'vencida', etiqueta: 'Vencida', color: 'bg-amber-100 text-amber-700' },
  { valor: 'anulada', etiqueta: 'Anulada', color: 'bg-red-100 text-red-600' },
  { valor: 'activa', etiqueta: 'Activa', color: 'bg-lime-100 text-lime-700' },
  { valor: 'comprada', etiqueta: 'Comprada', color: 'bg-teal-100 text-teal-700' },
  { valor: 'eliminada', etiqueta: 'Eliminada', color: 'bg-stone-100 text-stone-600' },
]

function CotizacionesAdmin() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [cambiandoEstado, setCambiandoEstado] = useState(null)

  async function cargar() {
    try {
      const { data } = await api.get('/admin/cotizaciones')
      setCotizaciones(data?.cotizaciones || [])
    } catch (error) {
      console.error('Error cargando cotizaciones:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const q = normalizar(busqueda)
  const filtradas = cotizaciones.filter(c =>
    normalizar(c.numero_cotizacion || '').includes(q) ||
    normalizar(c.nombre || '').includes(q) ||
    normalizar(c.email || '').includes(q)
  )
  const POR_PAGINA = 8
  const totalPaginas = Math.max(Math.ceil(filtradas.length / POR_PAGINA), 1)
  const visibles = filtradas.slice((pagina - 1) * POR_PAGINA, (pagina - 1) * POR_PAGINA + POR_PAGINA)

  async function cambiarEstado(c, estado) {
    setCambiandoEstado(`${c.id_cotizacion}:${estado}`)
    try {
      await api.patch(`/admin/cotizaciones/${c.id_cotizacion}/estado`, { estado })
      toast.success(`Cotización ${c.numero_cotizacion || c.id_cotizacion} → ${estado}`)
      await cargar()
    } catch (error) {
      toast.error(error?.response?.data?.error || 'No se pudo actualizar el estado')
    } finally {
      setCambiandoEstado(null)
    }
  }

  const totalEmitidas = cotizaciones.filter(c => c.estado === 'emitida').length
  const totalAceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length
  const totalImporte = cotizaciones.reduce((acc, c) => acc + (Number(c.total) || 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Cotizaciones"
        subtitulo="Cotizaciones emitidas por los clientes desde la tienda"
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Cotizaciones' }]}
        volverA="/dashboard"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="panel-card rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600">{totalEmitidas}</p>
        </div>
        <div className="panel-card rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">Aceptadas</p>
          <p className="text-2xl font-bold text-emerald-600">{totalAceptadas}</p>
        </div>
        <div className="panel-card rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">Importe total</p>
          <p className="text-2xl font-bold text-gray-800">${totalImporte.toLocaleString('es-CO')}</p>
        </div>
      </div>

      <PanelCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
            placeholder="Buscar por N°, cliente o correo…"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] w-full sm:w-72"
          />
          <button
            type="button"
            onClick={cargar}
            className="text-sm text-[#1D9E75] hover:underline"
          >
            ↻ Actualizar
          </button>
        </div>

        {cargando ? (
          <PanelSkeleton filas={5} columnas={4} />
        ) : visibles.length === 0 ? (
          <EmptyState icono="🧾" titulo="Sin cotizaciones" descripcion="Aún no hay cotizaciones registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500">N°</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500">Productos</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => {
                  const items = Array.isArray(c.items) ? c.items : []
                  const estadoActual = ESTADOS.find(e => e.valor === c.estado) || ESTADOS[0]
                  return (
                    <tr key={c.id_cotizacion} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium">{c.numero_cotizacion || `COT-${c.id_cotizacion}`}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{c.razon_social || `${c.nombre || ''} ${c.apellido || ''}`.trim() || '—'}</span>
                        <span className="block text-xs text-gray-400">{c.email || ''}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(c.creada_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)} unid.
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">${Number(c.total).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.estado}
                          onChange={(e) => cambiarEstado(c, e.target.value)}
                          disabled={cambiandoEstado === `${c.id_cotizacion}:${c.estado}`}
                          className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer ${estadoActual.color} disabled:opacity-60`}
                        >
                          {ESTADOS.map(est => (
                            <option key={est.valor} value={est.valor}>{est.etiqueta}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && totalPaginas > 1 && (
          <div className="mt-4">
            <Paginado pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
          </div>
        )}
      </PanelCard>
    </div>
  )
}

export default CotizacionesAdmin