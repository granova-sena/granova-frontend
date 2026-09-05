import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { PageHeader, StatCard, PanelCard } from '../components/ui/panel/PanelKit'

function DashboardHome() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [hora, setHora] = useState(new Date())

  const [resumen, setResumen] = useState(null)
  const [pedidosResumen, setPedidosResumen] = useState(null)
  const [inventarioResumen, setInventarioResumen] = useState(null)
  const [totalLotes, setTotalLotes] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [alertasEmpleados, setAlertasEmpleados] = useState([])

  useEffect(() => {
    const data = localStorage.getItem('usuario')
    if (data) setUsuario(JSON.parse(data))

    const intervalo = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    const auth = { headers: { Authorization: `Bearer ${localStorage.getItem('token_empleado')}` } }
    Promise.allSettled([
      api.get('/dashboard', auth),
      api.get('/admin/pedidos/resumen', auth),
      api.get('/inventario/resumen', auth),
      api.get('/inventario/lotes', auth),
      api.get('/empleados/alertas', auth),
    ]).then(([dashboardRes, pedidosRes, inventarioRes, lotesRes, alertasRes]) => {
      if (dashboardRes.status === 'fulfilled') setResumen(dashboardRes.value.data)
      if (pedidosRes.status === 'fulfilled') setPedidosResumen(pedidosRes.value.data)
      if (inventarioRes.status === 'fulfilled') setInventarioResumen(inventarioRes.value.data)
      if (lotesRes.status === 'fulfilled') setTotalLotes(lotesRes.value.data.lotes?.length ?? 0)
      if (alertasRes.status === 'fulfilled') setAlertasEmpleados(alertasRes.value.data.alertas || [])
      setCargando(false)
    })
  }, [])

  const saludo = () => {
    const h = hora.getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const s = resumen?.ok ? resumen.stats : null

  const tarjetas = [
    {
      label: 'Clientes registrados',
      valor: cargando ? '—' : s ? String(s.clientesActivos) : '—',
      tono: 'cielo',
      icono: '👥',
      sub: 'cuentas activas',
    },
    {
      label: 'Pedidos pendientes',
      valor: cargando ? '—' : pedidosResumen ? String(pedidosResumen.pendientes) : '—',
      tono: 'ambar',
      icono: '📦',
      sub: 'requieren tu acción',
    },
    {
      label: 'Productos activos',
      valor: cargando ? '—' : inventarioResumen ? String(inventarioResumen.totalProductos) : '—',
      tono: 'verde',
      icono: '🫘',
      sub: 'en catálogo',
    },
    {
      label: 'Lotes disponibles',
      valor: cargando ? '—' : totalLotes !== null ? String(totalLotes) : '—',
      tono: 'violeta',
      icono: '🗺️',
      sub: 'en fincas',
    },
  ]

  const accesos = [
    { label: 'Gestión de pedidos', icono: '📋', path: '/dashboard/pedidos', desc: 'Aceptar, empacar y entregar' },
    { label: 'Empleados', icono: '👥', path: '/dashboard/empleados', desc: 'Nómina y reportes' },
    { label: 'Stock de productos', icono: '📦', path: '/dashboard/inventario', desc: 'Inventario y lotes' },
    { label: 'Registro de ventas', icono: '💳', path: '/dashboard/ventas', desc: 'Ventas de mostrador' },
    { label: 'Reportes', icono: '📊', path: '/dashboard/reportes', desc: 'Métricas del negocio' },
    { label: 'Salidas', icono: '🚚', path: '/dashboard/envios', desc: 'Despachos de reparto en tiempo real' },
  ]

  const r = resumen?.ok ? resumen.rentabilidad : null
  const ventasMensuales = resumen?.ok ? resumen.ventasMensuales : []
  const maxVenta = Math.max(...ventasMensuales.map(v => v.total), 1)

  return (
    <div key={cargando ? 'cargando' : 'listo'} className="space-y-6">
      {/* Encabezado de bienvenida */}
      <PageHeader
        titulo={`${saludo()}, ${usuario?.nombre || 'Administrador'} 👋`}
        subtitulo={`${hora.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, ${hora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · Bienvenido al panel de Granova`}
      />

      {/* Alerta: empleados con 3+ reportes acumulados */}
      {alertasEmpleados.length > 0 && (
        <div className="panel-come rounded-2xl p-4 bg-red-50 border border-red-200 flex flex-col gap-2">
          {alertasEmpleados.map((a) => (
            <button
              key={a.id_usuario}
              onClick={() => navigate('/dashboard/empleados')}
              className="flex items-start gap-3 text-left"
            >
              <span className="text-red-500 mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-medium text-red-700">
                  {a.nombre} {a.apellido} llegó a {a.reportes} reportes
                </p>
                {a.ultimo_motivo && (
                  <p className="text-xs text-red-500/80 mt-0.5">Último motivo: "{a.ultimo_motivo}"</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`bg-white rounded-2xl border border-gray-200 p-5 h-24 animate-pulse ${i ? 'hidden sm:block' : ''}`}></div>
            ))
          : tarjetas.map((item, i) => (
              <StatCard
                key={item.label}
                icono={item.icono}
                label={item.label}
                value={item.valor}
                sub={item.sub}
                tono={item.tono}
                animacion="panel-subir"
                delay={`panel-subir-d${i + 1}`}
              />
            ))}
      </div>

      {/* Accesos rápidos — para no perderte */}
      <PanelCard animado={false} className="p-5 panel-subir panel-subir-d2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-admin-heading">Accesos rápidos</h2>
          <span className="text-xs text-gray-400">Navegación directa a cada módulo</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {accesos.map((a, i) => (
            <button
              type="button"
              key={a.path}
              onClick={() => navigate(a.path)}
              className={`panel-card panel-subir group rounded-2xl border border-gray-200 bg-white p-4 text-left flex sm:flex-col sm:items-start items-center gap-3 hover:border-[#1D9E75]/40 ${a.path === '/dashboard/pedidos' ? 'ring-1 ring-[#1D9E75]/20' : ''} ${i ? `panel-subir-d${i + 1}` : ''}`}
            >
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: 'rgba(29,158,117,0.12)' }}>
                {a.icono}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-admin-heading">{a.label}</span>
                <span className="block text-[11px] text-gray-500 mt-0.5 truncate">{a.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </PanelCard>

      {/* Sección inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Rentabilidad del mes */}
        <PanelCard className="p-6 panel-subir panel-subir-d3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-admin-heading">Rentabilidad del mes</h2>
            {!cargando && r && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                r.rentable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {r.rentable ? 'Rentable' : 'No rentable'}
              </span>
            )}
          </div>

          {cargando ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          ) : !r || r.ingresos === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay ventas este mes para calcular rentabilidad.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Ingresos</span>
                <span className="text-admin-heading font-medium">{formatMoney(r.ingresos)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Costo de lo vendido</span>
                <span className="text-gray-600 font-medium">- {formatMoney(r.costoVendido)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Producto perdido ({r.kgPerdidos} kg)</span>
                <span className="text-gray-600 font-medium">- {formatMoney(r.valorPerdido)}</span>
              </div>
              <div className="h-px bg-gray-100 my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-admin-heading font-medium">Ganancia neta</span>
                <span className={`font-semibold ${r.gananciaNeta >= 0 ? 'text-[#1D9E75]' : 'text-red-500'}`}>
                  {formatMoney(r.gananciaNeta)}
                </span>
              </div>

              {/* Barra de margen animada */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Margen sobre ingresos</span>
                  <span className="text-gray-600 font-medium">{r.margenPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="panel-barra h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(Math.min(r.margenPct, 100), 2)}%`,
                      background: 'linear-gradient(90deg, #1D9E75, #2dd4a7)',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </PanelCard>

        {/* Ventas mensuales */}
        <PanelCard className="p-6 panel-subir panel-subir-d4">
          <h2 className="font-semibold text-admin-heading mb-4">Ventas mensuales</h2>
          {cargando ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          ) : ventasMensuales.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay ventas registradas.</p>
          ) : (
            <div className="flex items-end justify-between gap-2" style={{ height: '180px' }}>
              {ventasMensuales.map((v, i) => (
                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[10px] text-gray-400 mb-1 hidden sm:inline">{formatMoney(v.total)}</span>
                  <div className="w-full flex items-end" style={{ height: '140px' }}>
                    <div
                      className="panel-barra w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max((v.total / maxVenta) * 100, 4)}%`,
                        animationDelay: `${i * 0.08}s`,
                        background: v.total === maxVenta ? '#1D9E75' : 'rgba(29,158,117,0.35)',
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{v.mes}</span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

      </div>
    </div>
  )
}

export default DashboardHome