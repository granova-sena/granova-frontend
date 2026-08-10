import { useState, useEffect } from 'react'
import api from '../services/api'

function formatMoney(valor) {
  if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`
  if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}K`
  return `$${valor}`
}

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[#5f7268]">Cargando dashboard...</p>
  if (error) return <p className="text-red-500">Error al cargar el dashboard: {error}</p>
  if (!data || !data.ok) return <p className="text-red-500">No se pudieron cargar los datos.</p>

  const { stats: s, ventasMensuales, productosMasVendidos, clientesRecientes } = data

  const stats = [
    { label: 'Ingresos totales', value: formatMoney(s.ingresosTotales), change: `${s.cambioIngresos >= 0 ? '+' : ''}${s.cambioIngresos}% vs anterior`, up: s.cambioIngresos >= 0 },
    { label: 'Ventas mensuales', value: `${s.ventasUnidades} unidades`, change: `${s.cambioVentasUnidades >= 0 ? '+' : ''}${s.cambioVentasUnidades}% vs anterior`, up: s.cambioVentasUnidades >= 0 },
    { label: 'Clientes activos', value: String(s.clientesActivos), change: `+${s.clientesNuevos} nuevos este mes`, up: true },
    { label: 'Facturas emitidas', value: String(s.facturasEmitidas), change: 'este mes', up: false },
  ]

  const maxVenta = Math.max(...ventasMensuales.map(v => v.total), 1)
  const ventasGrafica = ventasMensuales.map(v => ({
    mes: v.mes,
    valor: formatMoney(v.total),
    alturaPct: Math.max((v.total / maxVenta) * 100, 4),
    destacado: v.total === maxVenta,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="panel-card rounded-xl p-5">
            <p className="text-sm text-[#5f7268]">{stat.label}</p>
            <p className="text-2xl font-semibold text-[#11261d] mt-1">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.up ? 'text-black' : 'text-gray-400'}`}>
              {stat.up && '↑ '}{stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel-card rounded-xl p-4 sm:p-5">
            <h2 className="text-base font-black">Ventas mensuales</h2>
            <p className="text-sm text-[#5f7268] mb-6">Comparativa de ventas por mes</p>
            {ventasGrafica.length === 0 ? (
              <p className="text-sm text-[#8a9b8f] py-8 text-center">Aún no hay ventas registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end justify-between gap-3 min-w-[360px]">
                  {ventasGrafica.map((item) => (
                    <div key={item.mes} className="flex flex-col items-center flex-1">
                      <span className="text-xs text-[#5f7268] mb-2">{item.valor}</span>
                      <div className="w-full flex items-end" style={{ height: '160px' }}>
                        <div
                          className="w-full rounded-t-md transition-all duration-300"
                          style={{
                            height: `${item.alturaPct}%`,
                            backgroundColor: item.destacado ? '#0c3d2a' : '#2fe37e',
                          }}
                        ></div>
                      </div>
                      <span className={`text-xs mt-2 ${item.destacado ? 'font-semibold text-[#11261d]' : 'text-[#5f7268]'}`}>
                        {item.mes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel-card rounded-xl p-4 sm:p-5">
            <h2 className="text-base font-semibold text-admin-heading">Clientes recientes</h2>
            <p className="text-sm text-[#5f7268] mb-4">Últimas compras registradas</p>
            {clientesRecientes.length === 0 ? (
              <p className="text-sm text-[#8a9b8f] py-4">Aún no hay pedidos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-[#5f7268] border-b border-[#dcebe2]">
                      <th className="py-2 font-medium">Cliente</th>
                      <th className="py-2 font-medium">Producto</th>
                      <th className="py-2 font-medium">Total</th>
                      <th className="py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesRecientes.map((c) => (
                      <tr key={c.email} className="border-b border-[#eef4ef] last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2fe37e] to-[#0d6e46] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {c.nombre.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[#11261d]">{c.nombre}</p>
                              <p className="text-xs text-[#8a9b8f]">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-[#46564f]">{c.producto}</td>
                        <td className="py-3 text-[#11261d] font-medium">{formatMoney(c.total)}</td>
                        <td className="py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              c.estado === 'Pagado'
                                ? 'bg-white text-black border-[#c8f4d5]'
                                : 'bg-white text-black border-[#f7e8b0]'
                            }`}
                          >
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="panel-card rounded-xl p-4 sm:p-5 h-fit">
          <h2 className="text-base font-semibold text-admin-heading">Productos más vendidos</h2>
          <p className="text-sm text-[#5f7268] mb-4">Este mes</p>
          {productosMasVendidos.length === 0 ? (
            <p className="text-sm text-[#8a9b8f]">Aún no hay ventas este mes.</p>
          ) : (
            <div className="space-y-4">
              {productosMasVendidos.map((p) => (
                <div key={p.nombre} className="flex items-center gap-3">
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#2fe37e] flex-shrink-0"></div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#11261d]">{p.nombre}</p>
                    <p className="text-xs text-[#8a9b8f]">{p.detalle}</p>
                    <p className="text-xs text-[#8a9b8f]">{p.vendidos} vendidos</p>
                  </div>
                  <p className="text-sm font-semibold text-[#11261d]">{formatMoney(p.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard