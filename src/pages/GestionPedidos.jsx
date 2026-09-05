import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { formatMoney, formatFecha } from '../utils/format'
import FacturaModal from '../components/FacturaModal'
import EstadoPagoBadge from '../components/ui/EstadoPagoBadge'
import OperacionBadge from '../components/ui/OperacionBadge'

// Métodos cuyo pago lo confirma manualmente el empleado (no pasarela).
const METODOS_MANUALES = ['transferencia', 'efectivo', 'contra_entrega']
const esMetodoManual = (metodo) => METODOS_MANUALES.includes(String(metodo || '').toLowerCase())

// Etiquetas legibles por método de pago.
const ETIQUETA_METODO = {
  tarjeta: 'Tarjeta',
  pse: 'PSE',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  contra_entrega: 'Contra entrega',
}

const estadoStyles = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Confirmado: 'bg-green-100 text-green-700',
  Empacando: 'bg-sky-100 text-sky-700',
  'En camino': 'bg-violet-100 text-violet-700',
  Entregado: 'bg-emerald-100 text-emerald-800',
  Rechazado: 'bg-red-100 text-red-700',
}

// Secuencia de estados que el EMPLEADO avanza (coincide con el backend)
const SIGUIENTE_ESTADO = {
  Confirmado: { estado: 'empacando', label: 'Empacando' },
  Empacando: { estado: 'en_camino', label: 'En camino' },
  'En camino': { estado: 'entregado', label: 'Entregado' },
}

const coloresProducto = ['#8B4A3C', '#2B1B12', '#5C7A4A', '#E8C786', '#A65A3C', '#6B4226']
function colorParaPedido(id) {
  return coloresProducto[id % coloresProducto.length]
}

function esAdmin() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.rol === 'admin'
  } catch {
    return false
  }
}

const LIMITE = 5
const MAX_MOTIVO = 500

// Pedidos creados en las últimas 24 h se resaltan como nuevos (ya van primero: backend ordena por fecha DESC).
const esNuevo = (p) => {
  const hace24h = Date.now() - 24 * 60 * 60 * 1000
  const fecha = p.fecha ? new Date(p.fecha).getTime() : 0
  return !isNaN(fecha) && fecha >= hace24h
}

const BadgeNuevo = () => (
  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1D9E75]/10 text-[#0F6E56] border border-[#1D9E75]/30 font-medium ml-2 align-middle">Nuevo</span>
)

function FilaPedido({ p, procesando, aceptarPedido, abrirModalRechazo, setFacturaId, avanzarEstado, marcarPago }) {
  const siguiente = SIGUIENTE_ESTADO[p.estado]
  const pagoFallido = p.estado_pago === 'fallido'
  const esReparto = p.operacion === 'reparto'
  const puedeMarcarPago = p.estado_pago !== 'pagado' && p.estado_pago !== 'fallido' && esMetodoManual(p.metodo_pago)
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className={`py-3 px-5 font-medium ${p.estado === 'Rechazado' ? 'text-red-500' : 'text-gray-600'}`}>
        {p.pedido}{esNuevo(p) && <BadgeNuevo />}
      </td>
      <td className="py-3 px-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {p.cliente.charAt(0)}
          </div>
          <div>
            <p className="text-gray-800">{p.cliente}</p>
            <p className="text-xs text-gray-400">{p.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: colorParaPedido(p.id) }}></div>
          <span className="text-gray-600">{p.producto}</span>
        </div>
      </td>
      <td className="py-3 px-5 text-xs text-gray-500">
        {p.finca ? <>{p.finca}{p.lote && <><br />Lote {p.lote}</>}</> : '—'}
      </td>
      <td className="py-3 px-5 text-gray-600">{p.cantidad} kg</td>
      <td className="py-3 px-5 text-gray-800 font-medium">{formatMoney(p.total)}</td>
      <td className="py-3 px-5">
        <div className="flex flex-col items-start gap-1.5">
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado]}`}>
            {p.estado}
          </span>
          <OperacionBadge operacion={p.operacion} sector={p.sector_envio} compacto />
          {p.estado_pago && (
            <>
              <EstadoPagoBadge estadoPago={p.estado_pago} compacto />
              {p.metodo_pago && (
                <span className="text-[10px] text-gray-400">
                  {ETIQUETA_METODO[p.metodo_pago] || p.metodo_pago}
                </span>
              )}
            </>
          )}
        </div>
      </td>
      <td className="py-3 px-5">
        {esAdmin() ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFacturaId(p.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Ver detalle
            </button>
            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">🔒 Solo lectura</span>
          </div>
        ) : esReparto ? (
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={() => setFacturaId(p.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Ver detalle
            </button>
            <span className="text-[11px] font-medium px-2 py-1 rounded-lg text-amber-700 bg-amber-50 border border-amber-200 whitespace-nowrap">
              🚚 Reparto — lo coordina el módulo de Despacho
            </span>
          </div>
        ) : p.estado === 'Pendiente' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => aceptarPedido(p.id)}
              disabled={procesando === p.id}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap disabled:opacity-50"
            >
              ✓ Aceptar
            </button>
            <button
              type="button"
              onClick={() => abrirModalRechazo(p.id)}
              disabled={procesando === p.id}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition whitespace-nowrap disabled:opacity-50"
            >
              ✕ Rechazar
            </button>
            {puedeMarcarPago && (
              <button
                type="button"
                onClick={() => marcarPago(p.id)}
                disabled={procesando === p.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#D8A92E] text-white hover:bg-[#b98f1f] transition whitespace-nowrap disabled:opacity-50"
                title="Confirma el cobro manual (transferencia/efectivo/contra entrega)"
              >
                💰 Marcar pago recibido
              </button>
            )}
          </div>
        ) : p.estado === 'Rechazado' ? (
          <span className="text-xs text-gray-400">—</span>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {pagoFallido && (
                <span className="text-[11px] text-red-500 font-medium px-2 py-1 rounded-lg bg-red-50 border border-red-200 whitespace-nowrap">
                  ⚠️ Sin pago: no avanza
                </span>
              )}
              {puedeMarcarPago && (
                <button
                  type="button"
                  onClick={() => marcarPago(p.id)}
                  disabled={procesando === p.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#D8A92E] text-white hover:bg-[#b98f1f] transition whitespace-nowrap disabled:opacity-50"
                  title="Confirma el cobro manual (transferencia/efectivo/contra entrega)"
                >
                  💰 Marcar pago recibido
                </button>
              )}
              <button
                type="button"
                onClick={() => setFacturaId(p.id)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
              >
                Ver detalle
              </button>
            </div>
            {siguiente && !pagoFallido && (
              <button
                type="button"
                onClick={() => avanzarEstado(p.id, siguiente.estado)}
                disabled={procesando === p.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap disabled:opacity-50"
              >
                {siguiente.label === 'Empacando' ? '📦 ' : siguiente.label === 'En camino' ? '🚚 ' : '✅ '}
                {siguiente.label} →
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

function FragmentoGrupo({ finca, filas, ...propsFila }) {
  const totalGrupo = filas.reduce((s, f) => s + f.total, 0)
  return (
    <>
      <tr className="bg-gray-50/70">
        <td colSpan={8} className="py-2 px-5 text-xs font-medium text-gray-600">
          {finca} — {filas.length} pedido{filas.length === 1 ? '' : 's'} · {formatMoney(totalGrupo)}
        </td>
      </tr>
      {filas.map((p) => <FilaPedido key={p.id} p={p} {...propsFila} />)}
    </>
  )
}

function TarjetaPedido({ p, procesando, aceptarPedido, abrirModalRechazo, setFacturaId, avanzarEstado, marcarPago }) {
  const siguiente = SIGUIENTE_ESTADO[p.estado]
  const pagoFallido = p.estado_pago === 'fallido'
  const esReparto = p.operacion === 'reparto'
  const puedeMarcarPago = p.estado_pago !== 'pagado' && p.estado_pago !== 'fallido' && esMetodoManual(p.metodo_pago)
  return (
    <div className="p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-gray-800">
          {p.pedido}{esNuevo(p) && <BadgeNuevo />}
        </p>
        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado]}`}>
          {p.estado}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
          {p.cliente.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-gray-800 truncate">{p.cliente}</p>
          <p className="text-xs text-gray-400 truncate">{p.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: colorParaPedido(p.id) }}></div>
        <span className="text-gray-600">{p.producto}</span>
      </div>
      <p className="text-xs text-gray-500">
        {p.finca ? <>{p.finca}{p.lote && <> · Lote {p.lote}</>}</> : '—'}
      </p>
      <p className="text-gray-600">{p.cantidad} kg</p>
      <p className="text-gray-800 font-medium">{formatMoney(p.total)}</p>
      {p.estado_pago && (
        <div className="flex flex-col items-start gap-1.5">
          <EstadoPagoBadge estadoPago={p.estado_pago} compacto />
          {p.metodo_pago && (
            <span className="text-[10px] text-gray-400">
              {ETIQUETA_METODO[p.metodo_pago] || p.metodo_pago}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-1">
        {esAdmin() ? (
          <>
            <button
              type="button"
              onClick={() => setFacturaId(p.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Ver detalle
            </button>
            <span className="text-[11px] text-gray-400 font-medium">🔒 Solo lectura</span>
          </>
        ) : esReparto ? (
          <>
            <button
              type="button"
              onClick={() => setFacturaId(p.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Ver detalle
            </button>
            <span className="text-[11px] font-medium px-2 py-1 rounded-lg text-amber-700 bg-amber-50 border border-amber-200">
              🚚 Reparto — lo coordina el módulo de Despacho
            </span>
          </>
        ) : p.estado === 'Pendiente' ? (
          <>
            <button
              type="button"
              onClick={() => aceptarPedido(p.id)}
              disabled={procesando === p.id}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap disabled:opacity-50"
            >
              ✓ Aceptar
            </button>
            <button
              type="button"
              onClick={() => abrirModalRechazo(p.id)}
              disabled={procesando === p.id}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition whitespace-nowrap disabled:opacity-50"
            >
              ✕ Rechazar
            </button>
            {puedeMarcarPago && (
              <button
                type="button"
                onClick={() => marcarPago(p.id)}
                disabled={procesando === p.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#D8A92E] text-white hover:bg-[#b98f1f] transition whitespace-nowrap disabled:opacity-50"
                title="Confirma el cobro manual (transferencia/efectivo/contra entrega)"
              >
                💰 Marcar pago recibido
              </button>
            )}
          </>
        ) : p.estado === 'Rechazado' ? (
          <span className="text-xs text-gray-400">—</span>
        ) : (
          <>
            {pagoFallido && (
              <span className="text-[11px] text-red-500 font-medium px-2 py-1 rounded-lg bg-red-50 border border-red-200 whitespace-nowrap">
                ⚠️ Sin pago: no avanza
              </span>
            )}
            {puedeMarcarPago && (
              <button
                type="button"
                onClick={() => marcarPago(p.id)}
                disabled={procesando === p.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#D8A92E] text-white hover:bg-[#b98f1f] transition whitespace-nowrap disabled:opacity-50"
                title="Confirma el cobro manual (transferencia/efectivo/contra entrega)"
              >
                💰 Marcar pago recibido
              </button>
            )}
            <button
              type="button"
              onClick={() => setFacturaId(p.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Ver detalle
            </button>
            {siguiente && !pagoFallido && (
              <button
                type="button"
                onClick={() => avanzarEstado(p.id, siguiente.estado)}
                disabled={procesando === p.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap disabled:opacity-50"
              >
                {siguiente.label === 'Empacando' ? '📦 ' : siguiente.label === 'En camino' ? '🚚 ' : '✅ '}
                {siguiente.label} →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function GestionPedidos() {
  const [pagina, setPagina] = useState(1)

  const [resumen, setResumen] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [agruparPorFinca, setAgruparPorFinca] = useState(true)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalFiltrados, setTotalFiltrados] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [procesando, setProcesando] = useState(null)
  const [facturaId, setFacturaId] = useState(null)

  const [pedidoARechazar, setPedidoARechazar] = useState(null) // id del pedido en el modal de motivo
  const [motivo, setMotivo] = useState('')
  const [filtroPago, setFiltroPago] = useState(null) // null (sin filtro) | pendiente_verificacion | pagado
  const [filtroMetodo, setFiltroMetodo] = useState(null) // null (sin filtro) | contra_entrega | transferencia | efectivo | tarjeta | pse | nequi | daviplata
  const [filtroOperacion, setFiltroOperacion] = useState(null) // null (sin filtro) | domicilio | reparto
  const [filtroNuevo, setFiltroNuevo] = useState(false)
  const [filtroPendiente, setFiltroPendiente] = useState(false)
  const [filtroManual, setFiltroManual] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarGuia, setMostrarGuia] = useState(() => localStorage.getItem('guia_pedidos_cerrada') !== '1')

  const normalizar = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Los filtros de operación/estado/método/manual/búsqueda los resuelve el
  // servidor (para paginar sobre todo el listado); en cliente solo aplican
  // los toggles de "Nuevos (24h)" y "Pendientes" sobre la página ya filtrada.
  const pedidosVisibles = useMemo(() => {
    let base = pedidos
    if (filtroNuevo) base = base.filter(esNuevo)
    if (filtroPendiente) base = base.filter(p => p.estado === 'Pendiente')
    return base
  }, [pedidos, filtroNuevo, filtroPendiente])

  const hayFiltros = !!(filtroPago || filtroMetodo || filtroOperacion || filtroNuevo || filtroPendiente || filtroManual || busqueda.trim())

  const limpiarFiltros = () => {
    setFiltroPago(null)
    setFiltroMetodo(null)
    setFiltroOperacion(null)
    setFiltroNuevo(false)
    setFiltroPendiente(false)
    setFiltroManual(false)
    setBusqueda('')
    setPagina(1)
  }

  const cargarResumen = () => {
    api.get('/admin/pedidos/resumen')
      .then(res => setResumen(res.data))
      .catch(err => setError(err.response?.data?.error || err.message))
  }

  const cargarPedidos = () => {
    setLoading(true)
    // Los filtros se resuelven en el servidor para que la paginación cuente
    // sobre todos los pedidos que coinciden, no solo los de la página actual.
    const params = { page: pagina, limit: LIMITE }
    if (filtroOperacion) params.operacion = filtroOperacion
    if (filtroPago) params.estado_pago = filtroPago
    if (filtroMetodo) params.metodo_pago = filtroMetodo
    if (filtroManual) params.manual = 'true'
    if (busqueda.trim()) params.search = busqueda.trim()
    api.get('/admin/pedidos/listado', { params })
      .then(res => {
        setPedidos(res.data.pedidos)
        setTotalPaginas(res.data.totalPaginas)
        setTotalFiltrados(res.data.totalFiltrados)
      })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarResumen() }, [])
  useEffect(() => { cargarPedidos() }, [pagina, filtroOperacion, filtroPago, filtroMetodo, filtroManual, busqueda])

  const recargarTodo = () => {
    cargarResumen()
    cargarPedidos()
  }

  const aceptarPedido = async (id) => {
    setProcesando(id)
    try {
      await api.patch(`/admin/pedidos/${id}/aceptar`)
      recargarTodo()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo aceptar el pedido.')
    } finally {
      setProcesando(null)
    }
  }

  // Avanza el pedido al siguiente estado (empacando → en camino → entregado).
  // El backend notifica al cliente automáticamente por cada cambio.
  const avanzarEstado = async (id, estado) => {
    setProcesando(id)
    try {
      await api.patch(`/admin/pedidos/${id}/estado`, { estado })
      recargarTodo()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo avanzar el estado del pedido.')
    } finally {
      setProcesando(null)
    }
  }

  const abrirModalRechazo = (id) => {
    setPedidoARechazar(id)
    setMotivo('')
  }

  // Empleado confirma el cobro manual (transferencia/efectivo/contra entrega).
  const marcarPago = async (id) => {
    setProcesando(id)
    try {
      await api.patch(`/admin/pedidos/${id}/pago`, { estado_pago: 'pagado' })
      recargarTodo()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo marcar el pago como recibido.')
    } finally {
      setProcesando(null)
    }
  }

  const confirmarRechazo = async () => {
    if (!pedidoARechazar) return
    setProcesando(pedidoARechazar)
    try {
      await api.patch(`/admin/pedidos/${pedidoARechazar}/rechazar`, { motivo })
      setPedidoARechazar(null)
      recargarTodo()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo rechazar el pedido.')
    } finally {
      setProcesando(null)
    }
  }

  const exportarExcel = async () => {
    setExportando(true)
    try {
      const res = await api.get('/admin/pedidos/listado', { params: { tab: 'Todos', page: 1, limit: 10000 } })
      const datos = res.data.pedidos.map(p => ({
        Pedido: p.pedido,
        Cliente: p.cliente,
        Email: p.email,
        Producto: p.producto,
        'Cantidad (kg)': p.cantidad,
        Total: p.total,
        Estado: p.estado,
        Fecha: formatFecha(p.fecha),
      }))
      const hoja = XLSX.utils.json_to_sheet(datos)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Reservas')
      XLSX.writeFile(libro, 'gestion-pedidos.xlsx')
    } catch (err) {
      toast.error('No se pudo generar el Excel: ' + err.message)
    } finally {
      setExportando(false)
    }
  }

  if (error) return <p className="text-red-500">Error al cargar pedidos: {error}</p>

  const stats = resumen ? [
    { label: 'Pedidos confirmados', value: String(resumen.confirmados), change: 'en proceso', valueClass: 'text-[#178a64]', changeClass: 'text-gray-400', icono: '✅', fondo: 'rgba(29,158,117,0.12)' },
    { label: 'Pedidos rechazados', value: String(resumen.rechazados), change: 'con motivo registrado', valueClass: 'text-red-500', changeClass: 'text-gray-400', icono: '✕', fondo: 'rgba(239,68,68,0.12)' },
    { label: 'Pendientes de pago', value: String(resumen.pendientesPago ?? 0), change: 'por método manual', valueClass: 'text-amber-600', changeClass: 'text-amber-600', icono: '💳', fondo: 'rgba(245,158,11,0.12)' },
    { label: 'Total en pedidos', value: formatMoney(resumen.totalEnPedidos), change: `${resumen.cambioTotal >= 0 ? '↑ +' : ''}${resumen.cambioTotal}% vs mes anterior`, valueClass: 'text-[#178a64]', changeClass: 'text-[#178a64]', icono: '💰', fondo: 'rgba(29,158,117,0.12)' },
  ] : []

  return (
    <div className="space-y-4">
      {!resumen ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: stat.fondo }}
              >
                <span>{stat.icono}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-xl sm:text-2xl font-semibold truncate ${stat.valueClass}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{stat.label}</p>
                <p className={`text-[11px] mt-0.5 ${stat.changeClass}`}>{stat.change}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarGuia && (
        <div className="relative rounded-2xl border border-[#1D9E75]/20 p-4 pr-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(29,158,117,0.08) 0%, rgba(255,255,255,0.4) 100%)' }}>
          <button
            type="button"
            aria-label="Ocultar guía"
            onClick={() => { setMostrarGuia(false); localStorage.setItem('guia_pedidos_cerrada', '1') }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/5 text-gray-400 hover:bg-black/10 hover:text-gray-600 flex items-center justify-center text-xs transition"
          >
            ✕
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0F6E56] mb-2">Flujo de un pedido · orden sugerida para tu testing</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-gray-600">
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Confirmado</span>
            <span>→</span>
            <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">📦 Empacando</span>
            <span>→</span>
            <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">🚚 En camino</span>
            <span>→</span>
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">✅ Entregado</span>
            <span className="mx-1 text-gray-300">|</span>
            <span>💰 marca el pago en métodos manuales (transferencia / efectivo / contra entrega).</span>
            <span className="text-gray-900 font-medium">Tarjeta · PSE · Nequi · Daviplata se confirman solos.</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-semibold text-admin-heading">Gestión de pedidos</h2>
        <button
          type="button"
          onClick={exportarExcel}
          disabled={exportando}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-gray-300 bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
        >
          ↓ {exportando ? 'Generando...' : `Exportar página ${pagina}`}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 mr-1">Filtros:</span>
            <button
              type="button"
              onClick={() => { setFiltroNuevo(v => !v); setPagina(1) }}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                filtroNuevo
                  ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#0F6E56] font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              🆕 Nuevos (24 h)
            </button>
            <button
              type="button"
              onClick={() => { setFiltroPendiente(v => !v); setPagina(1) }}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                filtroPendiente
                  ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#0F6E56] font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              ⏳ Pendientes
            </button>
            {[
              { key: 'domicilio', label: '🛵 Domicilio' },
              { key: 'reparto', label: '🚚 Reparto' },
            ].map((opc) => (
              <button
                type="button"
                key={opc.key}
                onClick={() => { setFiltroOperacion(prev => prev === opc.key ? null : opc.key); setPagina(1) }}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  filtroOperacion === opc.key
                    ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#0F6E56] font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opc.label}
              </button>
            ))}
            <span className="w-px h-4 bg-gray-200" />
            {[
              { key: 'pendiente_verificacion', label: '🔄 En verificación' },
              { key: 'pagado', label: '✅ Pagado' },
            ].map((opc) => (
              <button
                type="button"
                key={opc.key}
                onClick={() => { setFiltroPago(prev => prev === opc.key ? null : opc.key); setPagina(1) }}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  filtroPago === opc.key
                    ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#0F6E56] font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opc.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setFiltroManual(v => !v); setPagina(1) }}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                filtroManual
                  ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#0F6E56] font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              💵 Pago manual
            </button>
            <select
              value={filtroMetodo || ''}
              onChange={(e) => { setFiltroMetodo(e.target.value || null); setPagina(1) }}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:border-gray-300 focus:outline-none focus:border-[#1D9E75] transition"
            >
              <option value="">Método: todos</option>
              {Object.entries(ETIQUETA_METODO).map(([clave, label]) => (
                <option key={clave} value={clave}>{label}</option>
              ))}
            </select>
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs px-3 py-1.5 rounded-full text-red-500 hover:bg-red-50 transition font-medium"
              >
                ✕ Limpiar
              </button>
            )}
            <span className="text-[10px] text-gray-300 ml-auto hidden sm:inline">toca la pill de nuevo para quitar el filtro</span>
          </div>
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar pedido, cliente, producto o correo..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition placeholder:text-[#5c7a6b] text-gray-800"
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <div className="flex justify-end px-1 pb-2">
            <button
              type="button"
              onClick={() => setAgruparPorFinca((v) => !v)}
              className="text-xs text-[#0F6E56] underline"
            >
              {agruparPorFinca ? 'Ver lista plana' : 'Agrupar por finca'}
            </button>
          </div>
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-5 font-medium">Pedido</th>
                <th className="py-3 px-5 font-medium">Cliente</th>
                <th className="py-3 px-5 font-medium">Producto</th>
                <th className="py-3 px-5 font-medium">Finca / Lote</th>
                <th className="py-3 px-5 font-medium">Cantidad</th>
                <th className="py-3 px-5 font-medium">Total</th>
                <th className="py-3 px-5 font-medium">Estado</th>
                <th className="py-3 px-5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-6 px-5 text-center text-gray-400">Cargando pedidos...</td></tr>
              ) : pedidosVisibles.length === 0 ? (
                <tr><td colSpan={8} className="py-6 px-5 text-center text-gray-400">
                  {busqueda.trim() ? 'No hay pedidos que coincidan con tu búsqueda.' : 'No hay pedidos en esta categoría.'}
                </td></tr>
              ) : agruparPorFinca ? (
                Object.entries(
                  pedidosVisibles.reduce((grupos, p) => {
                    const clave = p.finca || 'Sin finca'
                    grupos[clave] = grupos[clave] || []
                    grupos[clave].push(p)
                    return grupos
                  }, {})
                ).map(([finca, filas]) => (
                  <FragmentoGrupo
                    key={finca}
                    finca={finca}
                    filas={filas}
                    procesando={procesando}
                    aceptarPedido={aceptarPedido}
                    abrirModalRechazo={abrirModalRechazo}
                    setFacturaId={setFacturaId}
                    avanzarEstado={avanzarEstado}
                    marcarPago={marcarPago}
                  />
                ))
              ) : (
                pedidosVisibles.map((p) => (
                  <FilaPedido
                    key={p.id}
                    p={p}
                    procesando={procesando}
                    aceptarPedido={aceptarPedido}
                    abrirModalRechazo={abrirModalRechazo}
                    setFacturaId={setFacturaId}
                    avanzarEstado={avanzarEstado}
                    marcarPago={marcarPago}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Cargando pedidos...</p>
          ) : pedidosVisibles.length === 0 ? (
            <p className="md:hidden py-8 text-center text-sm text-gray-400">
              {busqueda.trim() ? 'No hay pedidos que coincidan con tu búsqueda.' : 'No hay pedidos en esta categoría.'}
            </p>
          ) : agruparPorFinca ? (
            Object.entries(
              pedidosVisibles.reduce((grupos, p) => {
                const clave = p.finca || 'Sin finca'
                grupos[clave] = grupos[clave] || []
                grupos[clave].push(p)
                return grupos
              }, {})
            ).map(([finca, filas]) => {
              const totalGrupo = filas.reduce((s, f) => s + f.total, 0)
              return (
                <div key={finca}>
                  <p className="px-4 pt-3 pb-1 text-xs font-medium text-gray-500">
                    {finca} — {filas.length} pedido{filas.length === 1 ? '' : 's'} · {formatMoney(totalGrupo)}
                  </p>
                  {filas.map((p) => (
                    <TarjetaPedido
                      key={p.id}
                      p={p}
                      procesando={procesando}
                      aceptarPedido={aceptarPedido}
                      abrirModalRechazo={abrirModalRechazo}
                      setFacturaId={setFacturaId}
                      avanzarEstado={avanzarEstado}
                      marcarPago={marcarPago}
                    />
                  ))}
                </div>
              )
            })
          ) : (
            pedidosVisibles.map((p) => (
              <TarjetaPedido
                key={p.id}
                p={p}
                procesando={procesando}
                aceptarPedido={aceptarPedido}
                abrirModalRechazo={abrirModalRechazo}
                setFacturaId={setFacturaId}
                avanzarEstado={avanzarEstado}
                marcarPago={marcarPago}
              />
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {pedidosVisibles.length} de {totalFiltrados} pedidos
            {busqueda.trim() ? ' · búsqueda activa' : ''}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setPagina(n)}
                className={`w-8 h-8 rounded-lg text-sm transition ${
                  n === pagina ? 'bg-[#1D9E75]/10 text-[#1D9E75] font-medium' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {pedidoARechazar && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
          onClick={() => setPedidoARechazar(null)}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setPedidoARechazar(null) }}
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-full max-w-md p-6"
          >
            <h3 className="text-base font-semibold text-gray-800 mb-1">Rechazar pedido</h3>
            <p className="text-xs text-gray-400 mb-4">
              Cuéntale al cliente por qué se rechazó (opcional). El stock reservado se devuelve al inventario.
            </p>

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, MAX_MOTIVO))}
              rows={4}
              placeholder="Ej: El producto no tenía suficiente stock para completar el pedido."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{motivo.length}/{MAX_MOTIVO}</p>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setPedidoARechazar(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazo}
                disabled={procesando === pedidoARechazar}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                {procesando === pedidoARechazar ? 'Rechazando...' : 'Rechazar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {facturaId && (
        <FacturaModal idPedido={facturaId} onClose={() => setFacturaId(null)} />
      )}
    </div>
  )
}

export default GestionPedidos
