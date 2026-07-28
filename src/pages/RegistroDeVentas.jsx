import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { formatMoney, formatFecha } from '../utils/format'
import VentaModal from '../components/VentaModal'

function estadoStyle(estado) {
  const e = (estado || '').toLowerCase()
  if (e.startsWith('pag')) return 'bg-green-100 text-green-700'
  if (e.startsWith('pend')) return 'bg-amber-100 text-amber-700'
  if (e.startsWith('cancel') || e.startsWith('rechaz')) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const LIMITE = 10

function RegistroVentas() {
  const [resumen, setResumen] = useState(null)
  const [ventas, setVentas] = useState([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalFiltrados, setTotalFiltrados] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [exportando, setExportando] = useState(null)

  const cargarResumen = () => {
    api.get('/ventas/resumen')
      .then(res => setResumen(res.data))
      .catch(err => setError(err.message))
  }

  const cargarVentas = () => {
    setLoading(true)
    api.get('/ventas/listado', { params: { page: pagina, limit: LIMITE } })
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
    cargarVentas()
  }, [pagina])

  const onVentaCreada = () => {
    cargarResumen()
    cargarVentas()
  }

  const obtenerTodasLasVentas = async () => {
    const res = await api.get('/ventas/listado', { params: { page: 1, limit: 10000 } })
    return res.data.ventas
  }

  const exportarExcel = async () => {
    setExportando('excel')
    try {
      const todas = await obtenerTodasLasVentas()
      const datos = todas.map(v => ({
        Factura: v.factura,
        Cliente: v.cliente,
        Email: v.email,
        Producto: v.producto,
        'Cantidad (kg)': v.cantidad,
        Total: v.total,
        Estado: v.estado,
        Fecha: formatFecha(v.fecha),
      }))
      const hoja = XLSX.utils.json_to_sheet(datos)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Ventas')
      XLSX.writeFile(libro, 'registro-ventas.xlsx')
    } catch (err) {
      alert('No se pudo generar el Excel: ' + err.message)
    } finally {
      setExportando(null)
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
        <h2 className="text-base font-semibold text-white">Registro de ventas</h2>
        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            disabled={exportando !== null}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
          >
            ↓ {exportando === 'excel' ? 'Generando...' : 'Exportar Excel'}
          </button>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition"
          >
            + Nueva venta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50">
              <th className="py-3 px-5 font-medium">Factura</th>
              <th className="py-3 px-5 font-medium">Cliente</th>
              <th className="py-3 px-5 font-medium">Producto</th>
              <th className="py-3 px-5 font-medium">Cantidad</th>
              <th className="py-3 px-5 font-medium">Total</th>
              <th className="py-3 px-5 font-medium">Estado</th>
              <th className="py-3 px-5 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 px-5 text-center text-gray-400">Cargando ventas...</td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 px-5 text-center text-gray-400">Aún no hay ventas registradas.</td>
              </tr>
            ) : (
              ventas.map((v) => (
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
                  <td className="py-3 px-5 text-gray-600">{v.cantidad} kg</td>
                  <td className="py-3 px-5 text-gray-800 font-medium">{formatMoney(v.total)}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyle(v.estado)}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-gray-500">{formatFecha(v.fecha)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {ventas.length} de {totalFiltrados} ventas
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
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