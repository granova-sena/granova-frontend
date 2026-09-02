import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ProductoModal from '../components/ProductoModal'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario, Paginado } from '../components/ui/panel/PanelKit'

function esAdmin() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.rol === 'admin'
  } catch {
    return false
  }
}

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

  const exportarExcel = () => {
    setExportando(true)
    try {
      const datos = productos.map(p => ({
        Nombre: p.nombre,
        Categoría: p.categoria,
        Origen: p.origen,
        'Stock (kg)': p.stock,
        'Capacidad lote (kg)': p.capacidad || '',
        '% disponible': p.pct,
        'Precio/kg': p.precio,
        Estado: p.estado,
      }))
      datos.push({ Nombre: `— Página ${pagina} de ${totalPaginas} (${totalFiltrados} productos en total) —` })
      const hoja = XLSX.utils.json_to_sheet(datos)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Inventario')
      XLSX.writeFile(libro, `inventario-granova-pagina-${pagina}.xlsx`)
    } catch (err) {
      toast.error('No se pudo generar el Excel: ' + err.message)
    } finally {
      setExportando(false)
    }
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
        Error al cargar inventario: {error}
      </div>
    )
  }

  const stats = resumen ? [
    { label: 'Productos', value: String(resumen.totalProductos), sub: `↑ ${resumen.nuevosMes} este mes`, tono: 'verde', icono: '🫘' },
    { label: 'Stock bajo', value: String(resumen.stockBajo), sub: 'requieren acción', tono: 'ambar', icono: '⚠️' },
    { label: 'Ventas hoy', value: formatMoney(resumen.ventasHoy), sub: `${resumen.cambioVentasHoy >= 0 ? '↑ +' : ''}${resumen.cambioVentasHoy}% vs ayer`, tono: 'cielo', icono: '💰' },
    { label: 'Agotados', value: String(resumen.agotados), sub: resumen.agotados > 0 ? 'requieren reabastecer' : 'todo en orden', tono: 'rojo', icono: '✕' },
  ] : []

  const tabs = [
    { key: 'Todos', label: `Todos (${conteos.Todos})` },
    { key: 'Disponibles', label: `Disponibles (${conteos.Disponibles})` },
    { key: 'StockBajo', label: `Stock bajo (${conteos.StockBajo})` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Control de stock"
        subtitulo="Supervisa la disponibilidad y los niveles de inventario de tus productos."
        acciones={
          <>
            <button
              type="button"
              onClick={exportarExcel}
              disabled={exportando}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
            >
              ↓ {exportando ? 'Generando...' : 'Exportar'}
            </button>
            {!esAdmin() && (
              <BotonPrimario onClick={() => abrirModal(null)}>
                + Nuevo producto
              </BotonPrimario>
            )}
          </>
        }
      />

      {!resumen ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`bg-white rounded-2xl border border-gray-200 p-5 h-24 animate-pulse ${i ? 'hidden sm:block' : ''}`}></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              icono={stat.icono}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              tono={stat.tono}
              delay={`panel-come-d${i + 1}`}
            />
          ))}
        </div>
      )}

      <PanelCard>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-4 sm:px-5 pt-4 border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => cambiarTab(tab.key)}
              className={`text-sm pb-3 border-b-2 transition ${
                tabActivo === tab.key ? 'border-[#1D9E75] text-gray-800 font-medium' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:px-5 border-b border-gray-100">
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
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <div className="p-5"><PanelSkeleton filas={4} columnas={6} /></div>
          ) : productos.length === 0 ? (
            <EmptyState
              icono="📦"
              titulo="No se encontraron productos"
              descripcion="Ajusta tu búsqueda o cambia de categoría para ver más productos."
            />
          ) : (
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
                {productos.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
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
                      {!esAdmin() && (
                        <button
                          type="button"
                          onClick={() => abrirModal(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                          title="Editar producto"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Cargando productos...</p>
          ) : productos.length === 0 ? (
            <p className="md:hidden py-8 text-center text-sm text-gray-400">
              No se encontraron productos. Ajusta tu búsqueda o cambia de categoría.
            </p>
          ) : (
            productos.map((p) => (
              <div key={p.id} className="p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: colorParaProducto(p.id) }}></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 font-medium truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{p.origen || 'Sin origen registrado'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado]}`}>
                    {p.estado}
                  </span>
                </div>
                <p className="text-gray-600">{p.categoria || '—'}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
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
                <p className="text-gray-800 font-medium">{formatMoney(p.precio)}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {!esAdmin() && (
                    <button
                      type="button"
                      onClick={() => abrirModal(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                      title="Editar producto"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {productos.length} de {totalFiltrados} productos
          </p>
          <div className="flex items-center gap-1">
            <Paginado pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </PanelCard>

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