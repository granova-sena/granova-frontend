import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'

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
    const auth = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    Promise.allSettled([
      api.get('/dashboard', auth),
      api.get('/pedidos/resumen', auth),
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

  const glass = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(20,40,32,0.14)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    boxShadow: '0 8px 28px rgba(20,40,32,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
  }

  const s = resumen?.ok ? resumen.stats : null

  const tarjetas = [
    {
      label: 'Clientes registrados',
      valor: cargando ? '—' : s ? String(s.clientesActivos) : '—',
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Pedidos pendientes',
      valor: cargando ? '—' : pedidosResumen ? String(pedidosResumen.pendientes) : '—',
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 8l-9-5-9 5 9 5 9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M3 8v8l9 5 9-5V8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M12 13v8" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
    {
      label: 'Productos activos',
      valor: cargando ? '—' : inventarioResumen ? String(inventarioResumen.totalProductos) : '—',
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 9h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M17 9h2a3 3 0 0 1 0 6h-2" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 2v3M10 2v3M14 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Lotes disponibles',
      valor: cargando ? '—' : totalLotes !== null ? String(totalLotes) : '—',
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 3c0 9-6 13-11 13H7v5H4v-8c0-6 5-10 11-10h6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  const r = resumen?.ok ? resumen.rentabilidad : null
  const ventasMensuales = resumen?.ok ? resumen.ventasMensuales : []
  const maxVenta = Math.max(...ventasMensuales.map(v => v.total), 1)

  return (
    <div className="min-h-full">

      {/* Alerta: empleados con 3+ reportes acumulados */}
      {alertasEmpleados.length > 0 && (
        <div className="rounded-2xl p-4 mb-4 bg-red-50 border border-red-200 flex flex-col gap-2">
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

      {/* Header de bienvenida */}
      <div
        className="rounded-3xl p-8 mb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(29,158,117,0.10) 0%, rgba(255,255,255,0.65) 100%)',
          border: '1px solid rgba(29,158,117,0.15)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          boxShadow: '0 8px 28px rgba(20,40,32,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <div
          className="absolute -right-10 -top-10 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -right-4 -bottom-10 w-36 h-36 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <p className="text-[#1D9E75] text-sm mb-1 capitalize font-medium">
            {hora.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-semibold text-[#1F2A24] mb-1">
            {saludo()}, {usuario?.nombre || 'Administrador'} 👋
          </h1>
          <p className="text-[#1F2A24]/50 text-sm">
            Bienvenido al panel de control de Granova
          </p>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tarjetas.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-0.5"
            style={glass}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(29,158,117,0.10)', color: '#1D9E75' }}
            >
              {item.icono}
            </div>
            <div>
              <p className="text-2xl font-semibold text-[#1F2A24]">{item.valor}</p>
              <p className="text-xs text-[#1F2A24]/50 mt-0.5">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sección inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Rentabilidad del mes (antes "Clientes recientes") */}
        <div className="rounded-2xl p-6" style={glass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#1F2A24] font-medium">Rentabilidad del mes</h2>
            {!cargando && r && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                r.rentable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {r.rentable ? 'Rentable' : 'No rentable'}
              </span>
            )}
          </div>

          {cargando ? (
            <p className="text-sm text-[#1F2A24]/40">Cargando...</p>
          ) : !r || r.ingresos === 0 ? (
            <p className="text-sm text-[#1F2A24]/40">Aún no hay ventas este mes para calcular rentabilidad.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#1F2A24]/50">Ingresos</span>
                <span className="text-[#1F2A24] font-medium">{formatMoney(r.ingresos)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#1F2A24]/50">Costo de lo vendido</span>
                <span className="text-[#1F2A24] font-medium">- {formatMoney(r.costoVendido)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#1F2A24]/50">Producto perdido ({r.kgPerdidos} kg)</span>
                <span className="text-[#1F2A24] font-medium">- {formatMoney(r.valorPerdido)}</span>
              </div>
              <div className="h-px bg-[#1F2A24]/10 my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-[#1F2A24] font-medium">Ganancia neta</span>
                <span className={`font-semibold ${r.gananciaNeta >= 0 ? 'text-[#1D9E75]' : 'text-red-500'}`}>
                  {formatMoney(r.gananciaNeta)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#1F2A24]/40">Margen sobre ingresos</span>
                <span className="text-[#1F2A24]/60">{r.margenPct}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Ventas mensuales (antes "Estado del sistema") */}
        <div className="rounded-2xl p-6" style={glass}>
          <h2 className="text-[#1F2A24] font-medium mb-4">Ventas mensuales</h2>
          {cargando ? (
            <p className="text-sm text-[#1F2A24]/40">Cargando...</p>
          ) : ventasMensuales.length === 0 ? (
            <p className="text-sm text-[#1F2A24]/40">Aún no hay ventas registradas.</p>
          ) : (
            <div className="flex items-end justify-between gap-2" style={{ height: '140px' }}>
              {ventasMensuales.map((v, i) => (
                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[10px] text-[#1F2A24]/40 mb-1">{formatMoney(v.total)}</span>
                  <div className="w-full flex items-end" style={{ height: '90px' }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-300"
                      style={{
                        height: `${Math.max((v.total / maxVenta) * 100, 4)}%`,
                        background: v.total === maxVenta ? '#1D9E75' : 'rgba(29,158,117,0.35)',
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-[#1F2A24]/50 mt-2">{v.mes}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default DashboardHome
