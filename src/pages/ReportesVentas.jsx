import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { API_URL } from '../config'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'

// Mapea la etiqueta que ve el usuario al valor que entiende el backend.
const PERIODOS = [
  { label: 'Este mes', valor: 'mes' },
  { label: 'Últimos 3 meses', valor: '3meses' },
  { label: 'Este año', valor: 'anio' },
]

function ReportesVentas() {
  const [periodoActivo, setPeriodoActivo] = useState('mes')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [reportesEmpleados, setReportesEmpleados] = useState([])
  const [totalEmpleados, setTotalEmpleados] = useState(0)
  const [cargandoEmpleados, setCargandoEmpleados] = useState(true)
  const contenidoRef = useRef(null)

  // Reportes que el admin ha registrado a cada empleado (vista general).
  useEffect(() => {
    setCargandoEmpleados(true)
    const token = localStorage.getItem('token_empleado')
    fetch(`${API_URL}/api/reportes/empleados?page=1&limit=50`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(json => {
        if (json.ok) {
          setReportesEmpleados(json.reportes || [])
          setTotalEmpleados(json.paginacion?.total || 0)
        }
      })
      .catch(() => {})
      .finally(() => setCargandoEmpleados(false))
  }, [])

  useEffect(() => {
    setCargando(true)
    const token = localStorage.getItem('token_empleado')
    fetch(`${API_URL}/api/reportes/ventas?periodo=${periodoActivo}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (res.status === 401) throw new Error('Sesión expirada')
        return res.json()
      })
      .then(json => {
        if (json.ok) setDatos(json.data)
        else throw new Error(json.mensaje || 'No se pudieron cargar los reportes')
      })
      .catch(err => toast.error(err.message || 'No se pudieron cargar los reportes'))
      .finally(() => setCargando(false))
  }, [periodoActivo])

  const tendencia = datos?.tendencia || []
  const totalKg = datos?.top_productos.reduce((sum, p) => sum + Number(p.kg_vendidos), 0) || 1

  const topProductos = datos?.top_productos.map((p, i) => ({
    nombre: p.nombre,
    detalle: p.categoria || 'Café Granova',
    categoria: p.categoria || 'Sin categoría',
    kg: `${p.kg_vendidos} kg`,
    total: `$${Number(p.total_ventas).toLocaleString('es-CO')}`,
    pct: Math.round((Number(p.kg_vendidos) / totalKg) * 100),
    color: ['bg-[#E8C786]', 'bg-[#6FA98C]', 'bg-[#2B1B12]', 'bg-[#D85A30]', 'bg-[#9DC9B4]'][i] || 'bg-[#6FA98C]'
  })) || []

  const colores = ['#E8C786', '#6FA98C', '#2B1B12', '#D85A30', '#9DC9B4']

  const pieData = datos?.top_productos.map((p, i) => ({
    name: p.nombre,
    value: Number(p.kg_vendidos),
    color: colores[i] || '#6FA98C'
  })) || []

  const kgTotalVendidos = datos?.resumen.productos_vendidos || 0

  const tituloPeriodo = PERIODOS.find(p => p.valor === periodoActivo)?.label || 'Este mes'

  // Genera un PDF a partir de una "foto" real de lo que se ve en pantalla
  // (usa html2canvas para capturar el DOM tal cual está renderizado, y jsPDF
  // solo lo empaqueta como imagen dentro del PDF).
  const descargarPDF = async () => {
    if (!contenidoRef.current) return
    setGenerandoPdf(true)
    try {
      const canvas = await html2canvas(contenidoRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const imagen = canvas.toDataURL('image/png')

      const doc = new jsPDF('p', 'pt', 'a4')
      const anchoPagina = doc.internal.pageSize.getWidth()
      const altoImagen = (canvas.height * anchoPagina) / canvas.width

      let alturaRestante = altoImagen
      let posicionY = 0

      doc.addImage(imagen, 'PNG', 0, posicionY, anchoPagina, altoImagen)
      alturaRestante -= doc.internal.pageSize.getHeight()

      // Si el contenido es más alto que una hoja A4, sigue en páginas siguientes
      while (alturaRestante > 0) {
        posicionY = alturaRestante - altoImagen
        doc.addPage()
        doc.addImage(imagen, 'PNG', 0, posicionY, anchoPagina, altoImagen)
        alturaRestante -= doc.internal.pageSize.getHeight()
      }

      doc.save(`reporte-ventas-${periodoActivo}.pdf`)
    } catch (err) {
      toast.error('No se pudo generar el PDF: ' + err.message)
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Reportes de ventas"
        subtitulo={`Detalle de ventas por producto — ${tituloPeriodo}`}
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Reportes' }]}
        volverA="/dashboard"
        acciones={(
          <BotonPrimario onClick={descargarPDF} disabled={generandoPdf || cargando}>
            ↓ {generandoPdf ? 'Generando...' : 'Descargar PDF'}
          </BotonPrimario>
        )}
      />

      <PanelCard animado={false} className="p-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium mr-2 text-admin-heading">Periodo:</span>
        {PERIODOS.map((p) => (
          <button
            type="button"
            key={p.valor}
            onClick={() => setPeriodoActivo(p.valor)}
            className={`text-sm px-4 py-2 rounded-lg transition ${
              periodoActivo === p.valor ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </PanelCard>

      {(cargando && !datos) ? (
        <PanelSkeleton filas={3} columnas={3} />
      ) : (
        /* Todo lo de acá adentro es lo que se captura en el PDF */
        <div ref={contenidoRef} className="space-y-4 panel-come">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <PanelCard className="xl:col-span-2 p-4 sm:p-5">
              <h2 className="text-base font-semibold mb-4 text-admin-heading">Tendencia de ventas — {tituloPeriodo}</h2>
              {cargando ? (
                <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">Cargando...</div>
              ) : tendencia.length === 0 ? (
                <EmptyState icono="📈" titulo="Sin ventas" descripcion="No hay ventas registradas en este período." />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={tendencia}>
                    <XAxis dataKey="semana" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ventas']} />
                    <Line type="monotone" dataKey="ventas" stroke="#1D9E75" strokeWidth={2} dot={{ fill: '#1D9E75', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </PanelCard>

            <PanelCard className="p-4 sm:p-5">
              <h2 className="text-base font-semibold mb-4 text-admin-heading">Productos más vendidos</h2>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} kg`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                {pieData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-14px' }}>
                    <span className="text-lg font-semibold text-admin-heading">{kgTotalVendidos}</span>
                    <span className="text-[10px] text-gray-400">kg totales</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }}></span>
                    <span className="text-gray-600">{item.name}</span>
                    <span className="ml-auto font-medium text-admin-heading">{item.value} kg</span>
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>

          <PanelCard className="overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-admin-heading">Top productos — {tituloPeriodo}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-gray-500 bg-gray-50">
                    <th className="py-3 px-5 font-medium">Producto</th>
                    <th className="py-3 px-5 font-medium">Categoría</th>
                    <th className="py-3 px-5 font-medium">Kg vendidos</th>
                    <th className="py-3 px-5 font-medium">Total ventas</th>
                    <th className="py-3 px-5 font-medium">% del total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center">
                        <EmptyState icono="📊" titulo="Sin ventas" descripcion="No hay ventas en este período." />
                      </td>
                    </tr>
                  ) : topProductos.map((p) => (
                    <tr key={p.nombre} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${p.color} flex-shrink-0`}></div>
                          <div>
                            <p className="text-admin-heading font-medium">{p.nombre}</p>
                            <p className="text-xs text-gray-400">{p.detalle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-gray-600">{p.categoria}</td>
                      <td className="py-3 px-5 text-gray-600">{p.kg}</td>
                      <td className="py-3 px-5 text-admin-heading font-medium">{p.total}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                            <div className="h-full bg-[#7CB342] rounded-full" style={{ width: `${p.pct}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500">{p.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelCard>
        </div>
      )}

      {/* Reportes a empleados (vista general del admin) */}
      <PanelCard animado={false} className="overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-admin-heading">Reportes a empleados</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalEmpleados > 0 ? `${totalEmpleados} reporte${totalEmpleados === 1 ? '' : 's'} en total` : 'Todos los reportes registrados por el admin'}
            </p>
          </div>
        </div>
        {cargandoEmpleados ? (
          <div className="p-5">
            <PanelSkeleton filas={2} columnas={3} />
          </div>
        ) : reportesEmpleados.length === 0 ? (
          <div className="p-5">
            <EmptyState icono="📝" titulo="Sin reportes" descripcion="Aún no hay reportes registrados para empleados." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50">
                  <th className="py-3 px-5 font-medium">Empleado</th>
                  <th className="py-3 px-5 font-medium">Motivo</th>
                  <th className="py-3 px-5 font-medium">Registrado por</th>
                  <th className="py-3 px-5 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {reportesEmpleados.map((r) => (
                  <tr key={r.id_reporte} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-5 text-admin-heading font-medium">
                      {r.empleado_nombre} {r.empleado_apellido}
                    </td>
                    <td className="py-3 px-5 text-gray-600 max-w-[260px] truncate" title={r.motivo}>{r.motivo}</td>
                    <td className="py-3 px-5 text-gray-500">{r.creado_por_nombre || '—'}</td>
                    <td className="py-3 px-5 text-gray-500">
                      {new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </div>
  )
}

export default ReportesVentas
