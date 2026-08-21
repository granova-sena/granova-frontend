import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { formatMoney, formatFecha } from '../utils/format'
import VentaModal from '../components/VentaModal'

function estadoStyle(estado) {
  const e = (estado || '').toLowerCase()
  if (e.startsWith('pag') || e.startsWith('confirm')) return 'bg-green-100 text-green-700'
  if (e.startsWith('pend')) return 'bg-amber-100 text-amber-700'
  if (e.startsWith('cancel') || e.startsWith('rechaz')) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

function esAdmin() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.rol === 'admin'
  } catch {
    return false
  }
}

const LIMITE = 10

function RegistroVentas() {
  const [resumen, setResumen] = useState(null)
  const [ventas, setVentas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalFiltrados, setTotalFiltrados] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(null)
  const [confirmando, setConfirmando] = useState(null)

  const cargarResumen = () => {
    api.get('/ventas/resumen')
      .then(res => setResumen(res.data))
      .catch(err => setError(err.message))
  }

  const cargarVentas = () => {
    setLoading(true)
    api.get('/ventas/listado', { params: { search: busqueda, page: pagina, limit: LIMITE } })
      .then(res => {
        setVentas(res.data.ventas)
        setTotalPaginas(res.data.totalPaginas)
        setTotalFiltrados(res.data.totalFiltrados)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarResumen()
  }, [])

  useEffect(() => {
    const timer = setTimeout(cargarVentas, 300)
    return () => clearTimeout(timer)
  }, [busqueda, pagina])

  const onVentaCreada = () => {
    cargarResumen()
    cargarVentas()
  }

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor)
    setPagina(1)
  }

  const confirmarVenta = async (id) => {
    setConfirmando(id)
    try {
      await api.patch(`/admin/pedidos/${id}/aceptar`)
      setMenuAbierto(null)
      cargarResumen()
      cargarVentas()
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo confirmar la venta.')
    } finally {
      setConfirmando(null)
    }
  }

  const exportarExcel = () => {
    setExportando(true)
    try {
      const datos = ventas.map(v => ({
        Factura: v.factura,
        Cliente: v.cliente,
        Email: v.email,
        Producto: v.producto,
        Cantidad: v.esMaquina ? `${v.cantidad} unidades` : `${v.cantidad} kg`,
        Total: v.total,
        Estado: v.estado,
        Fecha: formatFecha(v.fecha),
      }))
      datos.push({ Factura: `— Página ${pagina} de ${totalPaginas} (${totalFiltrados} ventas en total) —` })
      const hoja = XLSX.utils.json_to_sheet(datos)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Ventas')
      XLSX.writeFile(libro, `registro-ventas-pagina-${pagina}.xlsx`)
    } catch (err) {
      alert('No se pudo generar el Excel: ' + err.message)
    } finally {
      setExportando(false)
    }
  }

  if (error) return <p className="text-red-500">Error al cargar ventas: {error}</p>

  const stats = resumen ? [
    { label: 'Ventas del mes', value: formatMoney(resumen.ventasDelMes), change: `${resumen.cambioVentas >= 0 ? '↑ +' : ''}${resumen.cambioVentas}% vs mes anterior`, changeClass: 'text-[#1D9E75]' },
    { label: 'Clientes activos', value: String(resumen.clientesActivos), change: `↑ +${resumen.clientesNuevos} nuevos este mes`, changeClass: 'text-[#1D9E75]' },
    { label: 'Kg vendidos', value: resumen.kgVendidos.toLocaleString('es-CO'), change: '↑ este mes', changeClass: 'text-[#1D9E75]' },
    { label: 'Facturas emitidas', value: String(resumen.facturasEmitidas), change: 'este mes', changeClass: 'text-gray-400' },
  ] : []

  return (
    <div className="space-y-4">
      {!resumen ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.changeClass}`}>{stat.change}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-admin-heading">Registro de ventas</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportarExcel}
            disabled={exportando}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
          >
            ↓ {exportando ? 'Generando...' : `Exportar página ${pagina}`}
          </button>
          {!esAdmin() && (
            <button
              type="button"
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition"
            >
              + Nueva venta
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 lg:mr-20">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-medium mb-1.5 text-admin-heading">Buscar</p>
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              placeholder="Buscar cliente, producto o factura..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition placeholder:text-[#5c7a6b] text-admin-heading"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-5 font-medium">Factura</th>
                <th className="py-3 px-5 font-medium">Cliente</th>
                <th className="py-3 px-5 font-medium">Producto</th>
                <th className="py-3 px-5 font-medium">Finca / Lote</th>
                <th className="py-3 px-5 font-medium">Cantidad</th>
                <th className="py-3 px-5 font-medium">Total</th>
                <th className="py-3 px-5 font-medium">Estado</th>
                <th className="py-3 px-5 pr-8 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 px-5 text-center text-gray-400">Cargando ventas...</td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-5 text-center text-gray-400">No se encontraron ventas.</td>
                </tr>
              ) : (
                ventas.map((v) => {
                  const esPendiente = (v.estado || '').toLowerCase().startsWith('pend')
                  return (
                    <tr key={v.factura} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-5 text-gray-600">{v.factura}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {v.cliente.charAt(0)}
                          </div>
                          <div>
                            <p className="text-gray-800">{v.cliente}</p>
                            <p className="text-xs text-gray-400">{v.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-gray-600">{v.producto}</td>
                      <td className="py-3 px-5 text-xs text-gray-500">
                        {v.finca ? <>{v.finca}{v.lote && <><br />Lote {v.lote}</>}</> : '—'}
                      </td>
                      <td className="py-3 px-5 text-gray-600">{v.cantidad} {v.esMaquina ? 'unidades' : 'kg'}</td>
                      <td className="py-3 px-5 text-gray-800 font-medium">{formatMoney(v.total)}</td>
                      <td className="py-3 px-5 relative">
                        {esPendiente ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => setMenuAbierto(menuAbierto === v.id ? null : v.id)}
                              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${estadoStyle(v.estado)}`}
                            >
                              {v.estado} ▾
                            </button>
                            {menuAbierto === v.id && (
                              <div className="absolute left-5 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-36 z-10">
                                <button
                                  type="button"
                                  onClick={() => confirmarVenta(v.id)}
                                  disabled={confirmando === v.id}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                  {confirmando === v.id ? 'Confirmando...' : 'Confirmado'}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyle(v.estado)}`}>
                            {v.estado}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 pr-8 text-gray-500">{formatFecha(v.fecha)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {ventas.length} de {totalFiltrados} ventas
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

      {mostrarModal && (
        <VentaModal
          onClose={() => setMostrarModal(false)}
          onCreado={onVentaCreada}
        />
      )}
    </div>
  )
}

export default RegistroVentas
