import { useState, useEffect, useCallback } from 'react'
import { useModalBehavior } from '../hooks/useModalBehavior'
import api from '../services/api'
import toast from 'react-hot-toast'
import { toastErrorUnico } from '../utils/toastError'
import EstadoPagoBadge from '../components/ui/EstadoPagoBadge'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState } from '../components/ui/panel/PanelKit'
import { formatFecha, formatMoney } from '../utils/format'

const ESTADOS = ['Preparando', 'En ruta', 'Entregado', 'Novedad']

const ESTADO_DESPACHO = {
  Preparando: { label: 'Preparando', color: '#D8A92E', bg: 'rgba(216,169,46,0.14)', border: 'rgba(216,169,46,0.4)' },
  'En ruta': { label: 'En ruta', color: '#0ea5e9', bg: 'rgba(14,165,233,0.14)', border: 'rgba(14,165,233,0.4)' },
  Entregado: { label: 'Entregado', color: '#1D9E75', bg: 'rgba(29,158,117,0.14)', border: 'rgba(29,158,117,0.4)' },
  Novedad: { label: 'Novedad', color: '#D85A30', bg: 'rgba(216,90,48,0.14)', border: 'rgba(216,90,48,0.4)' },
}

const ETIQUETA_METODO = {
  tarjeta: 'Tarjeta', pse: 'PSE', nequi: 'Nequi', daviplata: 'Daviplata',
  transferencia: 'Transferencia', efectivo: 'Efectivo', contra_entrega: 'Contra entrega',
}

function BadgeEstado({ estado }) {
  const cfg = ESTADO_DESPACHO[estado] || ESTADO_DESPACHO.Preparando
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

function FotoTransportadora({ url, vehiculo }) {
  if (url) {
    return (
      <img src={url} alt={vehiculo} className="w-11 h-11 rounded-lg object-cover bg-gray-100 flex-shrink-0" loading="lazy" />
    )
  }
  return (
    <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-lg flex-shrink-0">🚚</div>
  )
}

// Vista SOBRE las salidas/despachos reales del reparto (read-only).
// La consulta la puede hacer admin, empleado y logística; el CRUD
// de salidas vive en el panel de logística. Se actualiza sola cada 10s.
function Envios() {
  const [despachos, setDespachos] = useState([])
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTransportadora, setFiltroTransportadora] = useState('')

  const [detalleId, setDetalleId] = useState(null)
  const [detalleData, setDetalleData] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const cargar = useCallback(() => {
    api.get('/despachos')
      .then((res) => {
        setDespachos(res.data.despachos || [])
        setUltimaActualizacion(new Date())
      })
      .catch((err) => toastErrorUnico(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 10000)

    function onVisibilidad() {
      if (document.visibilityState === 'visible') cargar()
    }
    document.addEventListener('visibilitychange', onVisibilidad)
    window.addEventListener('focus', cargar)

    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', onVisibilidad)
      window.removeEventListener('focus', cargar)
    }
  }, [cargar])

  useModalBehavior(() => setDetalleId(null))

  const abrirDetalle = async (id) => {
    setDetalleId(id)
    setDetalleData(null)
    setCargandoDetalle(true)
    try {
      const res = await api.get(`/despachos/${id}`)
      setDetalleData(res.data.despacho)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
      setDetalleId(null)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const nombresTransportadoras = [...new Set(despachos.map((d) => d.transportadora).filter(Boolean))]

  const filtrados = despachos.filter((d) => {
    const coincideEstado = filtroEstado === '' || d.estado === filtroEstado
    const coincideTransportadora = filtroTransportadora === '' || d.transportadora === filtroTransportadora
    return coincideEstado && coincideTransportadora
  })

  const totalSalidas = despachos.length
  const enRuta = despachos.filter((d) => d.estado === 'En ruta').length
  const entregados = despachos.filter((d) => d.estado === 'Entregado').length
  const novedades = despachos.filter((d) => d.estado === 'Novedad').length
  const pedidosTotal = despachos.reduce((s, d) => s + (d.num_pedidos || 0), 0)
  const unidadesTotal = despachos.reduce((s, d) => s + (d.total_unidades || 0), 0)

  const stats = [
    { label: 'Total salidas', valor: totalSalidas, descripcion: `${pedidosTotal} pedidos · ${unidadesTotal} kg`, tono: 'verde',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /></svg>) },
    { label: 'En ruta', valor: enRuta, descripcion: 'Vehículos en camino', tono: 'ambar',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" /><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" /></svg>) },
    { label: 'Entregadas', valor: entregados, descripcion: 'Repartos completados', tono: 'cielo',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
    { label: 'Novedades', valor: novedades, descripcion: 'Requieren atención', tono: 'rojo',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>) },
  ]

  if (loading) return <PanelSkeleton filas={4} columnas={4} />

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Salidas"
        subtitulo="Seguimiento en tiempo real de los despachos de reparto"
        acciones={null}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.valor}
            sub={stat.descripcion}
            icono={stat.icono}
            tono={stat.tono}
            delay={i ? `panel-come-d${i + 1}` : ''}
          />
        ))}
      </div>

      <PanelCard animado={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {ESTADOS.map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(prev => prev === estado ? '' : estado)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${filtroEstado === estado ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {nombresTransportadoras.length > 0 && (
            <>
              <div className="w-px h-10 bg-gray-200"></div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transportadora</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {nombresTransportadoras.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFiltroTransportadora(prev => prev === t ? '' : t)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition ${filtroTransportadora === t ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {ultimaActualizacion && (
            <div className="ml-auto text-xs text-gray-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse"></span>
              Actualizado {ultimaActualizacion.toLocaleTimeString()}
            </div>
          )}
        </div>
      </PanelCard>

      <PanelCard animado={false} className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">N° guía</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Transportadora</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Sector</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Pedidos</th>
                <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Unidades</th>
                <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8">
                    <EmptyState icono="🚚" titulo="Sin salidas" descripcion="No hay despachos con los filtros seleccionados" />
                  </td>
                </tr>
              ) : (
                filtrados.map((d, idx) => (
                  <tr key={d.id} className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx === filtrados.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4"><p className="font-medium text-admin-heading">{d.guia}</p></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FotoTransportadora url={d.imagen_url} vehiculo={d.tipo_vehiculo} />
                        <div>
                          <p className="text-sm font-medium text-admin-heading">{d.transportadora || 'Sin asignar'}</p>
                          <p className="text-xs text-gray-400">{d.tipo_vehiculo || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><p className="text-sm font-medium text-[#B8860B]">{d.sector_destino || '—'}</p></td>
                    <td className="px-5 py-4"><p className="text-sm text-gray-600">{formatFecha(d.fecha_programada)}</p></td>
                    <td className="px-5 py-4 text-center"><p className="text-sm font-medium text-admin-heading">{d.num_pedidos}</p></td>
                    <td className="px-5 py-4 text-center"><p className="text-sm text-gray-600">{d.total_unidades} kg</p></td>
                    <td className="px-5 py-4 text-center"><BadgeEstado estado={d.estado} /></td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => abrirDetalle(d.id)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[#1D9E75]/10 text-[#0F6E56] hover:bg-[#1D9E75]/20 transition font-medium">
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
          {filtrados.length === 0 ? (
            <p className="md:hidden py-8 text-center text-sm text-gray-400">No hay salidas con los filtros seleccionados</p>
          ) : (
            filtrados.map((d) => (
              <div key={d.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <FotoTransportadora url={d.imagen_url} vehiculo={d.tipo_vehiculo} />
                    <div>
                      <p className="font-medium text-admin-heading">{d.guia}</p>
                      <p className="text-xs text-gray-400">{d.transportadora || 'Sin asignar'} {d.tipo_vehiculo ? `· ${d.tipo_vehiculo}` : ''}</p>
                    </div>
                  </div>
                  <BadgeEstado estado={d.estado} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Sector</p>
                    <p className="font-medium text-[#B8860B]">{d.sector_destino || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Fecha programada</p>
                    <p className="text-gray-700">{formatFecha(d.fecha_programada)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Pedidos</p>
                    <p className="text-gray-700">{d.num_pedidos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Unidades</p>
                    <p className="text-gray-700">{d.total_unidades} kg</p>
                  </div>
                </div>
                <button onClick={() => abrirDetalle(d.id)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-[#1D9E75]/10 text-[#0F6E56] hover:bg-[#1D9E75]/20 transition font-medium self-start">
                  Ver detalle
                </button>
              </div>
            ))
          )}
        </div>
      </PanelCard>

      {detalleId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl panel-come">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-admin-heading">
                  {detalleData ? `Salida ${detalleData.guia}` : 'Cargando salida...'}
                </h3>
                {detalleData && <BadgeEstado estado={detalleData.estado} />}
              </div>
              <button onClick={() => setDetalleId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {cargandoDetalle ? (
              <div className="p-10 text-center text-sm text-gray-400">Cargando detalle...</div>
            ) : detalleData ? (
              <>
                <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Vehículo / transportadora</p>
                    <p className="text-sm font-medium text-admin-heading">{detalleData.transportadora || '—'} {detalleData.tipo_vehiculo ? `(${detalleData.tipo_vehiculo})` : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sector</p>
                    <p className="text-sm font-medium text-[#B8860B]">{detalleData.sector_destino || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Fecha programada</p>
                    <p className="text-sm font-medium text-admin-heading">{formatFecha(detalleData.fecha_programada)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Unidades / pedidos</p>
                    <p className="text-sm font-medium text-admin-heading">{detalleData.total_unidades} kg · {detalleData.num_pedidos} pedido(s)</p>
                  </div>
                </div>

                <div className="px-6 py-3 flex flex-wrap gap-4 text-xs text-gray-500 border-b border-gray-100">
                  <span>Creado por <b className="text-admin-heading">{detalleData.creado_por_nombre || '—'}</b> · {formatFecha(detalleData.fecha_creacion)}</span>
                  {detalleData.fecha_salida && <span>Salida: {formatFecha(detalleData.fecha_salida)}</span>}
                  {detalleData.fecha_entrega && <span>Entrega: {formatFecha(detalleData.fecha_entrega)}</span>}
                  {detalleData.confirmado_por_nombre && <span>Confirmado por <b className="text-admin-heading">{detalleData.confirmado_por_nombre}</b></span>}
                </div>

                <div className="px-6 py-4">
                  <h4 className="text-sm font-semibold text-admin-heading mb-3">Pedidos de la salida ({detalleData.pedidos?.length || 0})</h4>

                  {!detalleData.pedidos?.length ? (
                    <p className="text-sm text-gray-400 py-6 text-center">Esta salida aún no tiene pedidos.</p>
                  ) : (
                    <div className="space-y-2">
                      {detalleData.pedidos.map((p) => (
                        <div key={p.id} className="rounded-xl border border-gray-200 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-admin-heading">{p.pedido}</p>
                            <span className="text-xs text-gray-400">{formatFecha(p.fecha)}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{p.cliente} · {p.producto}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{p.cantidad} kg</span>
                            <span className="text-xs font-medium">{formatMoney(p.total)}</span>
                            <EstadoPagoBadge estadoPago={p.estado_pago} compacto />
                            <span className="text-xs text-gray-400">{ETIQUETA_METODO[p.metodo_pago] || p.metodo_pago}</span>
                            <span className="text-xs text-gray-400">{p.estado}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-gray-400">No se pudo cargar el detalle.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Envios