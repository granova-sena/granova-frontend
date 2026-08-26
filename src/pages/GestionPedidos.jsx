import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { formatMoney, formatFecha } from '../utils/format'
import FacturaModal from '../components/FacturaModal'

const estadoStyles = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Confirmado: 'bg-green-100 text-green-700',
  Rechazado: 'bg-red-100 text-red-700',
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

const LIMITE = 10
const MAX_MOTIVO = 500

function FilaPedido({ p, esAdminUsuario, procesando, aceptarPedido, abrirModalRechazo, setFacturaId }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className={`py-3 px-5 font-medium ${p.estado === 'Rechazado' ? 'text-red-500' : 'text-gray-600'}`}>{p.pedido}</td>
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
        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado]}`}>
          {p.estado}
        </span>
      </td>
      <td className="py-3 px-5">
        {esAdminUsuario ? (
          <span className="text-xs text-gray-400">Solo lectura</span>
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
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFacturaId(p.id)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
          >
            Ver detalle
          </button>
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

function GestionPedidos() {
  const [tabActivo, setTabActivo] = useState('Todos')
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

  const cargarResumen = () => {
    api.get('/admin/pedidos/resumen')
      .then(res => setResumen(res.data))
      .catch(err => setError(err.response?.data?.error || err.message))
  }

  const cargarPedidos = () => {
    setLoading(true)
    api.get('/admin/pedidos/listado', { params: { tab: tabActivo, page: pagina, limit: LIMITE } })
      .then(res => {
        setPedidos(res.data.pedidos)
        setTotalPaginas(res.data.totalPaginas)
        setTotalFiltrados(res.data.totalFiltrados)
      })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarResumen() }, [])
  useEffect(() => { cargarPedidos() }, [tabActivo, pagina])

  const recargarTodo = () => {
    cargarResumen()
    cargarPedidos()
  }

  const cambiarTab = (key) => {
    setTabActivo(key)
    setPagina(1)
  }

  const aceptarPedido = async (id) => {
    setProcesando(id)
    try {
      await api.patch(`/admin/pedidos/${id}/aceptar`)
      recargarTodo()
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo aceptar el pedido.')
    } finally {
      setProcesando(null)
    }
  }

  const abrirModalRechazo = (id) => {
    setPedidoARechazar(id)
    setMotivo('')
  }

  const confirmarRechazo = async () => {
    if (!pedidoARechazar) return
    setProcesando(pedidoARechazar)
    try {
      await api.patch(`/admin/pedidos/${pedidoARechazar}/rechazar`, { motivo })
      setPedidoARechazar(null)
      recargarTodo()
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo rechazar el pedido.')
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
      alert('No se pudo generar el Excel: ' + err.message)
    } finally {
      setExportando(false)
    }
  }

  if (error) return <p className="text-red-500">Error al cargar pedidos: {error}</p>

  const stats = resumen ? [
    { label: 'Pedidos pendientes', value: String(resumen.pendientes), change: 'requieren acción', valueClass: 'text-amber-500', changeClass: 'text-amber-500' },
    { label: 'Pedidos confirmados', value: String(resumen.confirmados), change: 'total acumulado', valueClass: 'text-gray-800', changeClass: 'text-gray-400' },
    { label: 'Pedidos rechazados', value: String(resumen.rechazados), change: 'total acumulado', valueClass: 'text-red-500', changeClass: 'text-red-500' },
    { label: 'Total en pedidos', value: formatMoney(resumen.totalEnPedidos), change: `${resumen.cambioTotal >= 0 ? '↑ +' : ''}${resumen.cambioTotal}% vs mes anterior`, valueClass: 'text-gray-800', changeClass: 'text-[#1D9E75]' },
  ] : []

  const tabs = [
    { key: 'Todos', label: `Todos (${resumen ? resumen.total : 0})` },
    { key: 'Pendientes', label: `Pendientes (${resumen ? resumen.pendientes : 0})` },
    { key: 'Confirmados', label: `Confirmados (${resumen ? resumen.confirmados : 0})` },
    { key: 'Rechazados', label: `Rechazados (${resumen ? resumen.rechazados : 0})` },
  ]

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
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${stat.valueClass}`}>{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.changeClass}`}>{stat.change}</p>
            </div>
          ))}
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
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-4 sm:px-5 pt-4 border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => cambiarTab(tab.key)}
              className={`text-sm pb-3 border-b-2 transition ${
                tabActivo === tab.key ? 'border-[#1a2e1a] text-gray-800 font-medium' : 'border-transparent text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
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
              ) : pedidos.length === 0 ? (
                <tr><td colSpan={8} className="py-6 px-5 text-center text-gray-400">No hay pedidos en esta categoría.</td></tr>
              ) : agruparPorFinca ? (
                Object.entries(
                  pedidos.reduce((grupos, p) => {
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
                    esAdminUsuario={esAdmin()}
                    procesando={procesando}
                    aceptarPedido={aceptarPedido}
                    abrirModalRechazo={abrirModalRechazo}
                    setFacturaId={setFacturaId}
                  />
                ))
              ) : (
                pedidos.map((p) => (
                  <FilaPedido
                    key={p.id}
                    p={p}
                    esAdminUsuario={esAdmin()}
                    procesando={procesando}
                    aceptarPedido={aceptarPedido}
                    abrirModalRechazo={abrirModalRechazo}
                    setFacturaId={setFacturaId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">Mostrando {pedidos.length} de {totalFiltrados} pedidos</p>
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
