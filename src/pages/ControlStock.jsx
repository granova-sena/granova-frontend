import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ProductoModal from '../components/ProductoModal'

const estadoStyles = {
  Disponible: 'bg-green-100 text-green-700',
  'Stock bajo': 'bg-amber-100 text-amber-700',
  Agotado: 'bg-red-100 text-red-700',
}

const coloresProducto = ['#E8C786', '#2B1B12', '#8B4A3C', '#5C7A4A', '#A65A3C', '#6B4226']

function colorParaProducto(id) {
  return coloresProducto[id % coloresProducto.length]
}

function barColorPorEstado(estado) {
  if (estado === 'Agotado') return '#E11D48'
  if (estado === 'Stock bajo') return '#D8932F'
  return '#1D9E75'
}

function textColorPorEstado(estado) {
  if (estado === 'Agotado') return 'text-red-500'
  if (estado === 'Stock bajo') return 'text-amber-500'
  return 'text-gray-500'
}

const LIMITE = 10

function ControlStock() {
  const [tabActivo, setTabActivo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const [resumen, setResumen] = useState(null)
  const [productos, setProductos] = useState([])
  const [conteos, setConteos] = useState({ Todos: 0, Disponibles: 0, StockBajo: 0 })
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalFiltrados, setTotalFiltrados] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)
  const [exportando, setExportando] = useState(false)

  const cargarResumen = () => {
    api.get('/inventario/resumen')
      .then(res => setResumen(res.data))
      .catch(err => setError(err.message))
  }

  const cargarProductos = () => {
    setLoading(true)
    api.get('/inventario/productos', {
      params: { tab: tabActivo, search: busqueda, page: pagina, limit: LIMITE }
    })
      .then(res => {
        setProductos(res.data.productos)
        setConteos(res.data.conteos)
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
    const timer = setTimeout(cargarProductos, 300)
    return () => clearTimeout(timer)
  }, [tabActivo, busqueda, pagina])

  const onProductoGuardado = () => {
    cargarResumen()
    cargarProductos()
  }

  const abrirModal = (producto = null) => {
    setProductoEditar(producto)
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setProductoEditar(null)
    setMostrarModal(false)
  }

  const cambiarTab = (key) => {
    setTabActivo(key)
    setPagina(1)
  }

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor)
    setPagina(1)
  }

  const exportarExcel = async () => {
    setExportando(true)
    try {
      const res = await api.get('/inventario/productos', { params: { tab: 'Todos', search: '', page: 1, limit: 10000 } })
      const datos = res.data.productos.map(p => ({
        Nombre: p.nombre,
        Categoría: p.categoria,
        Origen: p.origen,
        'Stock (kg)': p.stock,
        'Capacidad lote (kg)': p.capacidad || '',
        '% disponible': p.pct,
        'Precio/kg': p.precio,
        Estado: p.estado,
      }))
      const hoja = XLSX.utils.json_to_sheet(datos)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Inventario')
      XLSX.writeFile(libro, 'inventario-granova.xlsx')
    } catch (err) {
      alert('No se pudo generar el Excel: ' + err.message)
    } finally {
      setExportando(false)
    }
  }

  if (error) return <p className="text-red-500">Error al cargar inventario: {error}</p>

  const stats = resumen ? [
    { label: 'Productos', value: String(resumen.totalProductos), change: `↑ ${resumen.nuevosMes} este mes`, valueClass: 'text-gray-800', changeClass: 'text-gray-400' },
    { label: 'Stock bajo', value: String(resumen.stockBajo), change: 'requieren acción', valueClass: 'text-amber-500', changeClass: 'text-amber-500' },
    { label: 'Ventas hoy', value: formatMoney(resumen.ventasHoy), change: `${resumen.cambioVentasHoy >= 0 ? '↑ +' : ''}${resumen.cambioVentasHoy}% vs ayer`, valueClass: 'text-gray-800', changeClass: 'text-[#1D9E75]' },
    { label: 'Agotados', value: String(resumen.agotados), change: resumen.agotados > 0 ? 'requieren reabastecer' : 'todo en orden', valueClass: 'text-red-500', changeClass: 'text-red-500' },
  ] : []

  const tabs = [
    { key: 'Todos', label: `Todos (${conteos.Todos})` },
    { key: 'Disponibles', label: `Disponibles (${conteos.Disponibles})` },
    { key: 'StockBajo', label: `Stock bajo (${conteos.StockBajo})` },
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
        <h2 className="text-base font-semibold text-white">Productos en inventario</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportarExcel}
            disabled={exportando}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-gray-300 bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
          >
            ↓ {exportando ? 'Generando...' : 'Exportar'}
          </button>
          <button
            onClick={() => abrirModal(null)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-4 sm:px-5 pt-4 border-b border-gray-100">
          {tabs.map((tab) => (
            <button
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

        <div className="p-4">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              placeholder="Buscar producto, origen, variedad..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-white focus:border focus:border-[#1D9E75] transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-5 font-medium">Producto</th>
                <th className="py-3 px-5 font-medium">Categoría</th>
                <th className="py-3 px-5 font-medium">Disponibilidad</th>
                <th className="py-3 px-5 font-medium">Precio/kg</th>
                <th className="py-3 px-5 font-medium">Estado</th>
                <th className="py-3 px-5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 px-5 text-center text-gray-400">Cargando productos...</td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 px-5 text-center text-gray-400">No se encontraron productos.</td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {p.imagen ? (
                          <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: colorParaProducto(p.id) }}></div>
                        )}
                        <div>
                          <p className="text-gray-800 font-medium">{p.nombre}</p>
                          <p className="text-xs text-gray-400">{p.origen || 'Sin origen registrado'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-600">{p.categoria || '—'}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-[120px]">
                          <p className={`text-xs mb-1 ${textColorPorEstado(p.estado)}`}>
                            {p.pct}%{p.capacidad > 0 ? ` · max ${p.capacidad} kg` : ''}
                          </p>
                          <div className="h-1.5 w-full max-w-[140px] bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${p.pct}%`, backgroundColor: barColorPorEstado(p.estado) }}
                            ></div>
                          </div>
                        </div>
                        <span className={`text-xs whitespace-nowrap ${textColorPorEstado(p.estado)}`}>{p.stock} kg</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-800 font-medium">{formatMoney(p.precio)}</td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado]}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                          <button
                        onClick={() => abrirModal(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                        title="Editar producto"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {productos.length} de {totalFiltrados} productos
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
            <button
              onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <ProductoModal
          producto={productoEditar}
          onClose={cerrarModal}
          onGuardado={onProductoGuardado}
        />
      )}
    </div>
  )
}

export default ControlStock