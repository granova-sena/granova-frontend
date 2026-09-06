import { useState, useEffect, useMemo, useCallback } from 'react'
import { useModalBehavior } from '../hooks/useModalBehavior'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { toastErrorUnico } from '../utils/toastError'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EstadoPagoBadge from '../components/ui/EstadoPagoBadge'
import FacturaModal from '../components/FacturaModal'
import {
  PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario, Paginado,
} from '../components/ui/panel/PanelKit'
import { formatMoney, formatFecha } from '../utils/format'

function esLogistica() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.rol === 'logistica'
  } catch {
    return false
  }
}

const ETIQUETA_METODO = {
  tarjeta: 'Tarjeta', pse: 'PSE', nequi: 'Nequi', daviplata: 'Daviplata',
  transferencia: 'Transferencia', efectivo: 'Efectivo', contra_entrega: 'Contra entrega',
}

const METODOS_MANUALES = ['transferencia', 'efectivo', 'contra_entrega']

function esMetodoManual(p) {
  return METODOS_MANUALES.includes(p?.metodo_pago)
}

const ESTADO_DESPACHO = {
  Preparando: { label: 'Preparando', color: '#D8A92E', bg: 'rgba(216,169,46,0.14)', border: 'rgba(216,169,46,0.4)' },
  'En ruta': { label: 'En ruta', color: '#0ea5e9', bg: 'rgba(14,165,233,0.14)', border: 'rgba(14,165,233,0.4)' },
  Entregado: { label: 'Entregado', color: '#1D9E75', bg: 'rgba(29,158,117,0.14)', border: 'rgba(29,158,117,0.4)' },
  Novedad: { label: 'Novedad', color: '#D85A30', bg: 'rgba(216,90,48,0.14)', border: 'rgba(216,90,48,0.4)' },
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

/* ============================================================
   Selector de pedidos disponibles (reparto) con checkboxes.
   Usado en el modal de "Nueva salida" y en "Agregar pedidos".
   ============================================================ */
function SelectorPedidos({ seleccionados, onCambio }) {
  const [pedidos, setPedidos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback((search = '') => {
    setCargando(true)
    api.get('/despachos/pedidos-disponibles', { params: search ? { search } : {} })
      .then((res) => setPedidos(res.data.pedidos || []))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const alternar = (id) => {
    onCambio(seleccionados.includes(id)
      ? seleccionados.filter((x) => x !== id)
      : [...seleccionados, id])
  }

  const total = pedidos.filter((p) => seleccionados.includes(p.id)).reduce((s, p) => s + (p.total || 0), 0)
  const unidades = pedidos.filter((p) => seleccionados.includes(p.id)).reduce((s, p) => s + (p.cantidad || 0), 0)

  return (
    <div>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); cargar(e.target.value) }}
          placeholder="Buscar por pedido, cliente o producto..."
          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] transition text-gray-800"
        />
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
        {cargando ? (
          <p className="text-sm text-gray-400 py-6 text-center">Cargando pedidos de reparto...</p>
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No hay pedidos de reparto disponibles.</p>
        ) : (
          pedidos.map((p) => {
            const activo = seleccionados.includes(p.id)
            return (
              <label
                key={p.id}
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                  activo ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={() => alternar(p.id)}
                  className="mt-0.5 w-4 h-4 accent-[#1D9E75] flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-admin-heading truncate">{p.pedido}</p>
                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{formatMoney(p.total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{p.cliente} · {p.producto}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{p.cantidad} kg</span>
                    <span className="text-xs" style={{ color: '#D8A92E' }}>{p.sector_envio || 'Sin sector'}</span>
                    <EstadoPagoBadge estadoPago={p.estado_pago} compacto />
                  </div>
                </div>
              </label>
            )
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
        <span>{seleccionados.length} pedido(s) seleccionados</span>
        <span className="font-medium text-admin-heading">{unidades} kg · {formatMoney(total)}</span>
      </div>
    </div>
  )
}

/* ============================================================
   Modal: Nueva salida / Agregar pedidos (crear despacho)
   ============================================================ */
function ModalNuevaSalida({ abierto, onCerrar, onCreado, seleccionInicial = [] }) {
  const [transportadoras, setTransportadoras] = useState([])
  const [sectores, setSectores] = useState([])
  const [form, setForm] = useState({ id: '', sector: '', fecha: '' })
  const [seleccionados, setSeleccionados] = useState(seleccionInicial)
  const [guardando, setGuardando] = useState(false)

  useModalBehavior(() => { if (abierto && !guardando) onCerrar() }, abierto)

  const reset = () => {
    setForm({ id: '', sector: '', fecha: '' })
    setSeleccionados(seleccionInicial)
  }

  const cargarOpciones = useCallback(() => {
    api.get('/logistica/transportadoras')
      .then((res) => setTransportadoras(res.data.transportadoras || []))
      .catch(() => setTransportadoras([]))
    api.get('/despachos/sectores')
      .then((res) => setSectores(res.data.sectores || []))
      .catch(() => setSectores([]))
  }, [])

  useEffect(() => {
    if (abierto) { reset(); cargarOpciones() }
  }, [abierto, cargarOpciones])

  if (!abierto) return null

  const crear = async () => {
    if (!form.sector) { toast.error('Selecciona el sector de destino (*)'); return }
    if (!form.fecha) { toast.error('Selecciona la fecha programada (*)'); return }
    if (seleccionados.length === 0) { toast.error('Selecciona al menos un pedido de reparto'); return }
    setGuardando(true)
    try {
      const body = {
        sector_destino: form.sector,
        fecha_programada: form.fecha,
        pedidos: seleccionados,
      }
      if (form.id) body.id_transportadora = Number(form.id)
      await api.post('/despachos', body)
      toast.success('Salida creada correctamente')
      onCerrar()
      onCreado()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl panel-come">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold text-admin-heading">Nueva salida</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Transportadora / vehículo</label>
            <select
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] transition text-gray-800"
            >
              <option value="">Sin asignar (se define después)</option>
              {transportadoras.map((t) => (
                <option key={t.id_transportadora} value={t.id_transportadora}>
                  {t.nombre}{t.tipo_vehiculo ? ` · ${t.tipo_vehiculo}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sector de destino *</label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] transition text-gray-800"
              >
                <option value="">Seleccionar...</option>
                {sectores.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha programada *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] transition text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Pedidos de reparto a incluir (marca varios)</label>
            {transportadoras.length === 0 && sectores.length === 0 && (
              <p className="text-xs text-gray-400 mb-2">💡 Si no aparecen sectores, el backend aún no responde (404). Podés crear la salida igual.</p>
            )}
            <SelectorPedidos seleccionados={seleccionados} onCambio={setSeleccionados} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCerrar} disabled={guardando}
              className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={crear} disabled={guardando}
              className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
              {guardando ? 'Creando...' : 'Crear salida'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Modal: Detalle del despacho + acciones por estado
   ============================================================ */
function ModalDetalle({ despacho, pedidos, onCerrar, onCambio, esEscritor }) {
  const [agregarAbierto, setAgregarAbierto] = useState(false)
  const [porQuitar, setPorQuitar] = useState(null)
  const [porCobrar, setPorCobrar] = useState(null)
  const [confirmarEntregado, setConfirmarEntregado] = useState(false)
  const [facturaId, setFacturaId] = useState(null)
  const [procesando, setProcesando] = useState(null)

  useModalBehavior(() => { if (!agregarAbierto) onCerrar() }, true)

  const cobrarPedido = async () => {
    setProcesando('cobrar')
    try {
      await api.patch(`/admin/pedidos/${porCobrar.id}/pago`, { estado_pago: 'pagado' })
      toast.success(`Pago confirmado por ${formatMoney(porCobrar.total)}`)
      setPorCobrar(null)
      onCambio()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setProcesando(null)
    }
  }

  const cambiarEstado = async (estado) => {
    setProcesando(estado)
    try {
      await api.patch(`/despachos/${despacho.id}/estado`, { estado })
      toast.success(`Despacho marcado: ${estado}`)
      onCambio()
      onCerrar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setProcesando(null)
    }
  }

  const quitarPedido = async () => {
    setProcesando('quitar')
    try {
      await api.patch(`/despachos/${despacho.id}/pedidos`, { quitar: [porQuitar] })
      toast.success('Pedido quitado de la salida')
      setPorQuitar(null)
      onCambio()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setProcesando(null)
    }
  }

  const agregarPedidos = async (ids) => {
    setProcesando('agregar')
    try {
      await api.patch(`/despachos/${despacho.id}/pedidos`, { agregar: ids })
      toast.success('Pedidos agregados a la salida')
      setAgregarAbierto(false)
      onCambio()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setProcesando(null)
    }
  }

  const estado = despacho.estado
  const soloLectura = estado === 'Entregado'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl panel-come">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-admin-heading">Salida {despacho.guia}</h3>
            <BadgeEstado estado={estado} />
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Info del despacho */}
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Vehículo / transportadora</p>
            <p className="text-sm font-medium text-admin-heading">{despacho.transportadora || '—'} {despacho.tipo_vehiculo ? `(${despacho.tipo_vehiculo})` : ''}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Sector</p>
            <p className="text-sm font-medium text-[#B8860B]">{despacho.sector_destino || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha programada</p>
            <p className="text-sm font-medium text-admin-heading">{formatFecha(despacho.fecha_programada)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Unidades / pedidos</p>
            <p className="text-sm font-medium text-admin-heading">{despacho.total_unidades} kg · {despacho.num_pedidos} pedido(s)</p>
          </div>
        </div>

        {/* Timeline de fechas */}
        <div className="px-6 py-3 flex flex-wrap gap-4 text-xs text-gray-500 border-b border-gray-100">
          <span>Creado por <b className="text-admin-heading">{despacho.creado_por_nombre || '—'}</b> · {formatFecha(despacho.fecha_creacion)}</span>
          {despacho.fecha_salida && <span>Salida: {formatFecha(despacho.fecha_salida)}</span>}
          {despacho.fecha_entrega && <span>Entrega: {formatFecha(despacho.fecha_entrega)}</span>}
          {despacho.confirmado_por_nombre && <span>Confirmado por <b className="text-admin-heading">{despacho.confirmado_por_nombre}</b></span>}
        </div>

        {/* Acciones por estado */}
        {esEscritor && !soloLectura && (
          <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-gray-100">
            {estado === 'Preparando' && (
              <BotonPrimario onClick={() => setAgregarAbierto(true)} disabled={procesando}>+ Agregar pedidos</BotonPrimario>
            )}
            {(estado === 'Preparando' || estado === 'Novedad') && (
              <button type="button"
                onClick={() => cambiarEstado('En ruta')} disabled={procesando}
                className="px-4 py-2 text-sm rounded-lg bg-[#0ea5e9] text-white hover:bg-[#0284c7] transition disabled:opacity-50">
                🚚 Marcar En ruta
              </button>
            )}
            {(estado === 'En ruta' || estado === 'Novedad') && (
              <button type="button"
                onClick={() => setConfirmarEntregado(true)}
                className="px-4 py-2 text-sm rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
                ✅ Marcar Entregado
              </button>
            )}
            {(estado === 'Preparando' || estado === 'En ruta') && (
              <button type="button"
                onClick={() => cambiarEstado('Novedad')} disabled={procesando}
                className="px-4 py-2 text-sm rounded-lg bg-[#D85A30] text-white hover:bg-[#b8492a] transition disabled:opacity-50">
                ⚠️ Marcar Novedad
              </button>
            )}
          </div>
        )}

        {/* Pedidos del despacho */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-admin-heading">Pedidos del despacho ({pedidos.length})</h4>
            {esEscritor && !soloLectura && estado === 'Preparando' && !agregarAbierto && (
              <button type="button" onClick={() => setAgregarAbierto(true)}
                className="text-xs text-[#0F6E56] underline">Agregar pedidos</button>
            )}
          </div>

          {agregarAbierto && (
            <div className="rounded-xl border border-[#1D9E75]/30 bg-[#1D9E75]/5 p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-admin-heading">Agregar pedidos a la salida</p>
                <button type="button" onClick={() => setAgregarAbierto(false)} className="text-gray-400 text-sm">Cancelar</button>
              </div>
              <AgregarExistentes onAgregar={agregarPedidos} procesando={procesando === 'agregar'} />
            </div>
          )}

          {pedidos.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Este despacho aún no tiene pedidos.</p>
          ) : (
            <div className="space-y-2">
              {pedidos.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-admin-heading">{p.pedido}</p>
                      <span className="text-xs text-gray-400">{formatFecha(p.fecha)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{p.cliente} · {p.producto}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{p.cantidad} kg</span>
                      <span className="text-xs font-medium">{formatMoney(p.total)}</span>
                      <EstadoPagoBadge estadoPago={p.estado_pago} compacto />
                      <span className="text-xs text-gray-400">
                        {ETIQUETA_METODO[p.metodo_pago] || p.metodo_pago}
                      </span>
                    </div>
                  </div>
                  {esEscritor && !soloLectura && (
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {estado === 'Preparando' && (
                        <button type="button" onClick={() => setPorQuitar(p.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition">
                          Quitar
                        </button>
                      )}
                    </div>
                  )}
                  {esEscritor && esMetodoManual(p) && p.estado_pago !== 'pagado' && (
                    <button type="button" onClick={() => setPorCobrar(p)} disabled={procesando === 'cobrar'}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50 whitespace-nowrap self-start">
                      💵 Marcar pagado
                    </button>
                  )}
                  <button type="button" onClick={() => setFacturaId(p.id)}
                    title="Ver/descargar factura"
                    className="shrink-0 w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition flex items-center justify-center self-start">
                    📄
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        abierto={confirmarEntregado}
        titulo="¿Marcar entregado?"
        mensaje="Todos los pedidos de esta salida pasarán a 'Entregado' y se notificará a los clientes."
        confirmarTexto="Marcar entregado"
        onConfirmar={() => { setConfirmarEntregado(false); cambiarEstado('Entregado') }}
        onCancelar={() => setConfirmarEntregado(false)}
      />
      <ConfirmDialog
        abierto={!!porCobrar}
        titulo="¿Confirmar el pago?"
        mensaje={porCobrar ? `Confirmas el cobro ${ETIQUETA_METODO[porCobrar.metodo_pago] || porCobrar.metodo_pago} de ${formatMoney(porCobrar.total)} (${porCobrar.pedido}). El cliente recibirá su notificación de pago.` : ''}
        confirmarTexto="Confirmar pago"
        onConfirmar={cobrarPedido}
        onCancelar={() => setPorCobrar(null)}
      />
      <ConfirmDialog
        abierto={!!porQuitar}
        titulo="¿Quitar pedido?"
        mensaje="Este pedido volverá a estar disponible para otras salidas."
        confirmarTexto="Quitar"
        colorConfirmar="#D85A30"
        onConfirmar={quitarPedido}
        onCancelar={() => setPorQuitar(null)}
      />

      {facturaId && <FacturaModal idPedido={facturaId} onClose={() => setFacturaId(null)} />}
    </div>
  )
}

/* Selector que lista pedidos disponibles y los agrega de una vez. */
function AgregarExistentes({ onAgregar, procesando }) {
  const [seleccion, setSeleccion] = useState([])
  return (
    <div>
      <MiniSelectorPedidos seleccion={seleccion} onCambio={setSeleccion} />
      <button type="button" disabled={procesando || seleccion.length === 0}
        onClick={() => onAgregar(seleccion)}
        className="mt-3 w-full text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
        {procesando ? 'Agregando...' : `Agregar ${seleccion.length} pedido(s)`}
      </button>
    </div>
  )
}

/* Mini selector reutilizado para "Agregar pedidos" del detalle. */
function MiniSelectorPedidos({ seleccion, onCambio, search }) {
  const [pedidos, setPedidos] = useState([])
  const [busqueda, setBusqueda] = useState(search || '')
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    let v = true
    api.get('/despachos/pedidos-disponibles', { params: busqueda ? { search: busqueda } : {} })
      .then((res) => v && setPedidos(res.data.pedidos || []))
      .catch(() => v && setPedidos([]))
      .finally(() => v && setCargando(false))
    return () => { v = false }
  }, [busqueda])

  const alternar = (id) => onCambio(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id])

  return (
    <div>
      <input
        type="text" value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar reparto disponible..."
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] transition text-gray-800"
      />
      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
        {cargando ? (
          <p className="text-sm text-gray-400 py-4 text-center">Cargando...</p>
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No hay repartos disponibles.</p>
        ) : (
          pedidos.map((p) => {
            const activo = seleccion.includes(p.id)
            return (
              <label key={p.id} className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition ${activo ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-200'}`}>
                <input type="checkbox" checked={activo} onChange={() => alternar(p.id)} className="accent-[#1D9E75] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-admin-heading truncate">{p.pedido} · {p.cliente}</p>
                  <p className="text-xs text-gray-500 truncate">{p.producto} · {p.cantidad} kg · {p.sector_envio || 'Sin sector'}</p>
                </div>
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{formatMoney(p.total)}</span>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

function Despachos() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [despachos, setDespachos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [pagina, setPagina] = useState(1)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [detalle, setDetalle] = useState(null)

  const esEscritor = esLogistica()

  const seleccionInicial = useMemo(() => {
    const raw = searchParams.get('nuevos')
    if (!raw) return []
    return raw.split(',').map(Number).filter(Boolean)
  }, [searchParams])

  const cargar = useCallback(() => {
    setLoading(true)
    api.get('/despachos')
      .then((res) => setDespachos(res.data.despachos || []))
      .catch((err) => toastErrorUnico(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const stats = useMemo(() => {
    const s = { Preparando: 0, 'En ruta': 0, Entregado: 0, Novedad: 0 }
    despachos.forEach((d) => { if (s[d.estado] != null) s[d.estado] += 1 })
    return s
  }, [despachos])

  // El despacho prioriza las salidas nuevas (Preparando) y luego el resto, del
  // más reciente al más antiguo: primero lo que acaba de llegar, después todo.
  const ordenados = useMemo(() => {
    const prioridad = { Preparando: 0, 'En ruta': 1, Novedad: 2, Entregado: 3 }
    return [...despachos].sort((a, b) => {
      const pA = prioridad[a.estado] ?? 9
      const pB = prioridad[b.estado] ?? 9
      if (pA !== pB) return pA - pB
      return new Date(b.fecha_creacion || b.fecha_programada || 0) - new Date(a.fecha_creacion || a.fecha_programada || 0)
    })
  }, [despachos])

  const unidadesTotal = despachos.reduce((sum, d) => sum + (d.total_unidades || 0), 0)
  const pedidosTotal = despachos.reduce((sum, d) => sum + (d.num_pedidos || 0), 0)

  const visibles = filtroEstado === 'Todos' ? ordenados : ordenados.filter((d) => d.estado === filtroEstado)
  const totalPaginas = Math.max(Math.ceil(visibles.length / 5), 1)
  const paginados = visibles.slice((pagina - 1) * 5, (pagina - 1) * 5 + 5)

  const cerrarModal = () => {
    setModalNuevo(false)
    if (searchParams.get('nuevos')) {
      setSearchParams({}, { replace: true })
    }
  }

  const abrirDetalle = async (id) => {
    try {
      const res = await api.get(`/despachos/${id}`)
      setDetalle(res.data.despacho)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    }
  }

  const statCards = [
    { label: 'Preparando', valor: stats.Preparando, tono: 'ambar', icono: '📦' },
    { label: 'En ruta', valor: stats['En ruta'], tono: 'cielo', icono: '🚚' },
    { label: 'Entregados', valor: stats.Entregado, tono: 'verde', icono: '✅' },
    { label: 'Novedades', valor: stats.Novedad, tono: 'rojo', icono: '⚠️' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Despacho"
        subtitulo="Agrupa pedidos de reparto por sector y coordina las salidas con tu flota"
        acciones={esEscritor && (
          <BotonPrimario onClick={() => setModalNuevo(true)}>+ Nueva salida</BotonPrimario>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <StatCard
            key={s.label} label={s.label} value={s.valor} icono={s.icono} tono={s.tono}
            delay={i ? `panel-come-d${i + 1}` : ''}
          />
        ))}
      </div>

      <PanelCard animado={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 sm:justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {['Todos', 'Preparando', 'En ruta', 'Entregado', 'Novedad'].map((est) => (
              <button key={est} type="button" onClick={() => { setFiltroEstado(est); setPagina(1) }}
                className={`px-4 py-1.5 text-sm rounded-lg transition ${filtroEstado === est ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {est}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{pedidosTotal} pedido(s) · {unidadesTotal} kg</span>
          </div>
        </div>

        {loading ? (
          <PanelSkeleton filas={4} columnas={6} />
        ) : visibles.length === 0 ? (
          <EmptyState icono="🚚" titulo="Sin salidas" descripcion={filtroEstado === 'Todos' ? 'Aún no hay despachos. Crea la primera salida para agrupar pedidos de reparto.' : `No hay salidas en estado "${filtroEstado}".`} />
        ) : (
          <>
            {/* Escritorio */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Guía</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Vehículo</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Sector</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Fecha</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Pedidos</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Unidades</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((d) => (
                    <tr key={d.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-admin-heading">{d.guia}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800">{d.transportadora || '—'}</p>
                        {d.tipo_vehiculo && <p className="text-xs text-gray-400">{d.tipo_vehiculo}</p>}
                      </td>
                      <td className="px-6 py-4 text-[#B8860B] font-medium">{d.sector_destino || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{formatFecha(d.fecha_programada)}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{d.num_pedidos}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{d.total_unidades} kg</td>
                      <td className="px-6 py-4"><BadgeEstado estado={d.estado} /></td>
                      <td className="px-6 py-4 text-center">
                        <button type="button" onClick={() => abrirDetalle(d.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">Ver detalle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil */}
            <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
              {paginados.map((d) => (
                <div key={d.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-admin-heading">{d.guia}</p>
                    <BadgeEstado estado={d.estado} />
                  </div>
                  <p className="text-sm text-gray-600">{d.transportadora || 'Sin vehículo'} {d.tipo_vehiculo ? `· ${d.tipo_vehiculo}` : ''}</p>
                  <div className="grid grid-cols-2 gap-1.5 text-sm">
                    <div><p className="text-xs text-gray-400">Sector</p><p className="text-[#B8860B] font-medium">{d.sector_destino || '—'}</p></div>
                    <div><p className="text-xs text-gray-400">Fecha</p><p className="text-gray-700">{formatFecha(d.fecha_programada)}</p></div>
                    <div><p className="text-xs text-gray-400">Pedidos</p><p className="text-gray-700">{d.num_pedidos}</p></div>
                    <div><p className="text-xs text-gray-400">Unidades</p><p className="text-gray-700">{d.total_unidades} kg</p></div>
                  </div>
                  <button type="button" onClick={() => abrirDetalle(d.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition self-start mt-1">Ver detalle</button>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="px-4 sm:px-6 py-3 border-t border-gray-100">
                <Paginado pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
              </div>
            )}
          </>
        )}
      </PanelCard>

      <ModalNuevaSalida abierto={modalNuevo} onCerrar={cerrarModal} onCreado={cargar} seleccionInicial={seleccionInicial} />

      {detalle && (
        <ModalDetalle
          despacho={detalle}
          pedidos={detalle.pedidos || []}
          onCerrar={() => setDetalle(null)}
          onCambio={() => { cargar(); if (detalle) abrirDetalle(detalle.id) }}
          esEscritor={esEscritor}
        />
      )}

      <div className="text-right">
        <button type="button" onClick={() => navigate('/panel-logistica/reparto')}
          className="text-xs text-[#0F6E56] underline">
          Ver pedidos de reparto pendientes →
        </button>
      </div>
    </div>
  )
}

export default Despachos
