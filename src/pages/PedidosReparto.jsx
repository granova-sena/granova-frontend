import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EstadoPagoBadge from '../components/ui/EstadoPagoBadge'
import FacturaModal from '../components/FacturaModal'
import {
  PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario,
} from '../components/ui/panel/PanelKit'
import { formatMoney, formatFecha } from '../utils/format'

function esLogistica() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.rol === 'logistica'
  } catch {
    return false
  }
}

const estadoStyles = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Confirmado: 'bg-green-100 text-green-700',
  Empacando: 'bg-sky-100 text-sky-700',
  'En camino': 'bg-violet-100 text-violet-700',
  Entregado: 'bg-emerald-100 text-emerald-800',
  Rechazado: 'bg-red-100 text-red-700',
}

const coloresProducto = ['#8B4A3C', '#2B1B12', '#5C7A4A', '#E8C786', '#A65A3C', '#6B4226']
function colorParaPedido(id) {
  return coloresProducto[id % coloresProducto.length]
}

const ESTADOS_TERMINALES = ['Entregado', 'Rechazado', 'Cancelado']

const METODOS_MANUALES = ['transferencia', 'efectivo', 'contra_entrega']
const esMetodoManual = (p) => METODOS_MANUALES.includes(p?.metodo_pago)

// Pedidos creados en las últimas 24 h se resaltan como nuevos (ya van primero: el listado ordena por fecha DESC).
const esNuevo = (p) => {
  const hace24h = Date.now() - 24 * 60 * 60 * 1000
  const fecha = p.fecha ? new Date(p.fecha).getTime() : 0
  return !isNaN(fecha) && fecha >= hace24h
}

const BadgeNuevo = () => (
  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1D9E75]/10 text-[#0F6E56] border border-[#1D9E75]/30 font-medium ml-2 align-middle">Nuevo</span>
)

function PedidosReparto() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [disponiblesIds, setDisponiblesIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [reclasificar, setReclasificar] = useState(null)
  const [porCobrar, setPorCobrar] = useState(null)
  const [facturaId, setFacturaId] = useState(null)
  const [procesando, setProcesando] = useState(null)
  const [pestaña, setPestaña] = useState('nuevos')
  const [seleccionados, setSeleccionados] = useState([])

  const esEscritor = esLogistica()

  const cargar = async () => {
    setLoading(true)
    try {
      const [lista, disp] = await Promise.all([
        api.get('/admin/pedidos/listado', { params: { tab: 'Todos', page: 1, limit: 500 } }),
        api.get('/despachos/pedidos-disponibles'),
      ])
      const todos = lista.data.pedidos || []
      setPedidos(todos)
      setDisponiblesIds(new Set((disp.data.pedidos || []).map((p) => p.id)))
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const reparto = useMemo(() => pedidos.filter((p) => p.operacion === 'reparto'), [pedidos])

  const nuevos = useMemo(() => reparto.filter((p) => esNuevo(p) && !ESTADOS_TERMINALES.includes(p.estado)), [reparto])

  const basePestaña = useMemo(() => pestaña === 'nuevos' ? nuevos : reparto, [pestaña, nuevos, reparto])

  const visibles = useMemo(() => {
    if (!busqueda.trim()) return basePestaña
    const q = String(busqueda).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return basePestaña.filter((p) =>
      String(p.pedido || '').toLowerCase().includes(q) ||
      String(p.cliente || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q) ||
      String(p.producto || '').toLowerCase().includes(q) ||
      String(p.sector_envio || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
    )
  }, [basePestaña, busqueda])

  const enSalida = (p) => !disponiblesIds.has(p.id) && !ESTADOS_TERMINALES.includes(p.estado)

  const seleccionableId = (p) => esEscritor && !enSalida(p) && !ESTADOS_TERMINALES.includes(p.estado)
  const seleccionables = basePestaña.filter(seleccionableId)
  const todosSeleccionados = seleccionables.length > 0 && seleccionables.every((p) => seleccionados.includes(p.id))

  const alternarSeleccion = (id) => {
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  const alternarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados((prev) => prev.filter((x) => !seleccionables.some((p) => p.id === x)))
    } else {
      setSeleccionados((prev) => [...new Set([...prev, ...seleccionables.map((p) => p.id)])])
    }
  }
  const irASalida = () => {
    if (seleccionados.length === 0) return
    navigate(`/panel-logistica/despachos?nuevos=${seleccionados.join(',')}`)
  }

  const pendientes = reparto.filter((p) => !enSalida(p) && !ESTADOS_TERMINALES.includes(p.estado)).length
  const enSalidas = reparto.filter((p) => enSalida(p)).length
  const totalKg = reparto.reduce((s, p) => s + (p.cantidad || 0), 0)

  const reclasificarPedido = async () => {
    setProcesando(reclasificar)
    try {
      await api.patch(`/despachos/pedidos/${reclasificar}/operacion`, { operacion: 'domicilio' })
      toast.success('Pedido reclasificado a domicilio')
      setReclasificar(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setProcesando(null)
    }
  }

  const cobrarPedido = async () => {
    setProcesando(porCobrar)
    try {
      await api.patch(`/admin/pedidos/${porCobrar}/pago`, { estado_pago: 'pagado' })
      toast.success('Pago confirmado')
      setPorCobrar(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setProcesando(null)
    }
  }

  const stats = [
    { label: 'Reparto pendiente', valor: pendientes, tono: 'ambar', icono: '📦' },
    { label: 'En una salida', valor: enSalidas, tono: 'cielo', icono: '🚚' },
    { label: 'Entregados / cancelados', valor: reparto.filter((p) => ESTADOS_TERMINALES.includes(p.estado)).length, tono: 'neutral', icono: '✅' },
    { label: 'Total unidades', valor: `${totalKg} kg`, tono: 'verde', icono: '⚖️' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Pedidos de reparto"
        subtitulo="Pedidos grandes/empresas que coordina el módulo de Despacho por sector"
      />

      {error && (
        <div className="panel-come text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex justify-between">
          <span>{error} {error.includes('404') ? ' · El backend de despachos aún no está desplegado.' : ''}</span>
          <button onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.valor} icono={s.icono} tono={s.tono} delay={i ? `panel-come-d${i + 1}` : ''} />
        ))}
      </div>

      <PanelCard animado={false} className="overflow-hidden">
        <div className="px-4 sm:px-6 pt-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setPestaña('nuevos')}
                className={`px-4 py-1.5 text-sm rounded-md transition ${pestaña === 'nuevos' ? 'bg-[#1D9E75] text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                🆕 Nuevos ({nuevos.length})
              </button>
              <button
                type="button"
                onClick={() => setPestaña('todos')}
                className={`px-4 py-1.5 text-sm rounded-md transition ${pestaña === 'todos' ? 'bg-[#1D9E75] text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                📦 Todos ({reparto.length})
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {pestaña === 'nuevos'
                ? `${nuevos.length} pedido(s) nuevos en las últimas 24 h`
                : `Mostrando ${visibles.length} de ${reparto.length} pedidos de reparto`}
            </p>
          </div>

          {esEscritor && (
            <div className="flex flex-wrap items-center justify-between gap-3 py-2 mt-1">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={alternarTodos}
                    className="w-4 h-4 accent-[#1D9E75]"
                  />
                  <span className="font-medium text-gray-600">{esEscritor ? 'Seleccionar disponibles' : 'Todos'}</span>
                </label>
                {seleccionados.length > 0 && (
                  <span className="text-[#1D9E75] font-semibold">{seleccionados.length} seleccionado(s)</span>
                )}
              </div>
              <button
                type="button"
                onClick={irASalida}
                disabled={seleccionados.length === 0}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-40"
              >
                ➕ Aplicar a una salida ({seleccionados.length})
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">{esEscritor && seleccionados.length > 0 ? 'Selecciona los nuevos para agruparlos en una salida de despacho.' : 'Marca los pedidos nuevos que van en la próxima salida.'}</p>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar pedido, cliente, producto o sector..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition placeholder:text-[#5c7a6b] text-gray-800"
            />
          </div>
        </div>

        {loading ? (
          <PanelSkeleton filas={4} columnas={7} />
        ) : visibles.length === 0 ? (
          <EmptyState icono="🚚" titulo="Sin pedidos de reparto" descripcion="No hay pedidos de reparto que coincidan con tu búsqueda." />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {esEscritor && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={todosSeleccionados}
                          onChange={alternarTodos}
                          className="w-4 h-4 accent-[#1D9E75]"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Pedido</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Cliente</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Producto</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Cantidad</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Pago</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Sector</th>
                    {esEscritor && <th className="px-6 py-3 text-center font-semibold text-gray-700">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((p) => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      {esEscritor && (
                        <td className="px-4 py-4 w-10">
                          {seleccionableId(p) ? (
                            <input
                              type="checkbox"
                              checked={seleccionados.includes(p.id)}
                              onChange={() => alternarSeleccion(p.id)}
                              className="w-4 h-4 accent-[#1D9E75]"
                            />
                          ) : (
                            <span className="inline-block w-4 h-4" />
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 font-medium text-admin-heading">{p.pedido}{esNuevo(p) && <BadgeNuevo />}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {String(p.cliente || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-gray-800">{p.cliente}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ backgroundColor: colorParaPedido(p.id) }}></div>
                          <span className="text-gray-600">{p.producto}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{p.cantidad} kg</td>
                      <td className="px-6 py-4 text-right font-medium text-admin-heading">{formatMoney(p.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado] || 'bg-gray-100 text-gray-700'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4"><EstadoPagoBadge estadoPago={p.estado_pago} compacto /></td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-[#D8A92E]/15 text-[#B8860B]" style={{ border: '1px solid rgba(216,169,46,0.4)' }}>
                          {p.sector_envio || 'Sin sector'}
                        </span>
                      </td>
                      {esEscritor && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <button type="button" onClick={() => setFacturaId(p.id)} title="Ver/descargar factura"
                              className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap shrink-0">
                              📄
                            </button>
                            {esMetodoManual(p) && p.estado_pago !== 'pagado' && p.estado !== 'Rechazado' && p.estado !== 'Cancelado' && (
                              <button type="button" onClick={() => setPorCobrar(p.id)} disabled={procesando === p.id}
                                className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap disabled:opacity-50">
                                💵 Marcar pagado
                              </button>
                            )}
                            {enSalida(p) ? (
                              <span className="text-[11px] text-sky-600 font-medium whitespace-nowrap">🚚 Ya está en una salida</span>
                            ) : ESTADOS_TERMINALES.includes(p.estado) ? (
                              <span className="text-xs text-gray-400">—</span>
                            ) : (
                              <button type="button" onClick={() => setReclasificar(p.id)}
                                disabled={procesando === p.id}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap disabled:opacity-50">
                                🔁 Reclasificar a domicilio
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
              {visibles.map((p) => (
                <div key={p.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    {esEscritor && seleccionableId(p) && (
                      <input
                        type="checkbox"
                        checked={seleccionados.includes(p.id)}
                        onChange={() => alternarSeleccion(p.id)}
                        className="w-4 h-4 accent-[#1D9E75] flex-shrink-0"
                      />
                    )}
                    <p className="font-medium text-admin-heading flex-1">{p.pedido}{esNuevo(p) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1D9E75]/10 text-[#0F6E56] border border-[#1D9E75]/30 font-medium ml-1.5">Nuevo</span>}</p>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado] || 'bg-gray-100 text-gray-700'}`}>{p.estado}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {String(p.cliente || '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-800 truncate">{p.cliente}</p>
                      <p className="text-xs text-gray-400 truncate">{p.producto}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-gray-400">Cantidad</p><p className="text-gray-700">{p.cantidad} kg</p></div>
                    <div><p className="text-xs text-gray-400">Total</p><p className="font-medium text-admin-heading">{formatMoney(p.total)}</p></div>
                    <div><p className="text-xs text-gray-400">Sector</p><p className="text-[#B8860B] font-medium">{p.sector_envio || '—'}</p></div>
                  </div>
                  <p className="text-xs text-gray-400">{formatFecha(p.fecha)}</p>
                  <EstadoPagoBadge estadoPago={p.estado_pago} compacto />
                  {esEscritor && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setFacturaId(p.id)} title="Ver/descargar factura"
                        className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition flex items-center justify-center">
                        📄
                      </button>
                      {esMetodoManual(p) && p.estado_pago !== 'pagado' && p.estado !== 'Rechazado' && p.estado !== 'Cancelado' && (
                        <button type="button" onClick={() => setPorCobrar(p.id)} disabled={procesando === p.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
                          💵 Marcar pagado
                        </button>
                      )}
                      {enSalida(p) ? (
                        <p className="text-[11px] text-sky-600 font-medium self-center">🚚 Ya está en una salida</p>
                      ) : ESTADOS_TERMINALES.includes(p.estado) ? null : (
                        <button type="button" onClick={() => setReclasificar(p.id)} disabled={procesando === p.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition self-start disabled:opacity-50">
                          🔁 Reclasificar a domicilio
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </PanelCard>

      <div className="flex items-center justify-end gap-2">
        <BotonPrimario onClick={() => navigate('/panel-logistica/despachos')}>Agrupar en una salida →</BotonPrimario>
      </div>

      <ConfirmDialog
        abierto={!!reclasificar}
        titulo="¿Reclasificar a domicilio?"
        mensaje="Este pedido dejará de ser reparto y volverá al flujo normal del empleado (Confirmado → Empacando → En camino → Entregado)."
        confirmarTexto="Reclasificar"
        onConfirmar={reclasificarPedido}
        onCancelar={() => setReclasificar(null)}
      />
      <ConfirmDialog
        abierto={!!porCobrar}
        titulo="¿Confirmar el pago del pedido?"
        mensaje="Confirmas el cobro manual (efectivo / transferencia / contra entrega). El pedido pasará a pagado y el cliente recibirá su notificación de pago."
        confirmarTexto="Confirmar pago"
        onConfirmar={cobrarPedido}
        onCancelar={() => setPorCobrar(null)}
      />

      {facturaId && <FacturaModal idPedido={facturaId} onClose={() => setFacturaId(null)} />}
    </div>
  )
}

export default PedidosReparto
