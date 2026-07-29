function Dashboard() {
  const stats = [
    { label: 'Ingresos totales', value: '$38.4M', change: '+18% vs anterior', up: true },
    { label: 'Ventas mensuales', value: '1.340 kg', change: '+9% vs anterior', up: true },
    { label: 'Clientes activos', value: '142', change: '+9 nuevos este mes', up: true },
    { label: 'Facturas emitidas', value: '98', change: 'este mes', up: false },
  ]

  const ventasMensuales = [
    { mes: 'Ene', valor: '$6.2M', alturaPct: 45 },
    { mes: 'Feb', valor: '$8.1M', alturaPct: 56 },
    { mes: 'Mar', valor: '$9.8M', alturaPct: 67 },
    { mes: 'Abr', valor: '$11.2M', alturaPct: 78 },
    { mes: 'May', valor: '$38.4M', alturaPct: 100, destacado: true },
    { mes: 'Jun', valor: '$7.4M', alturaPct: 50, claro: true },
  ]

  const productosMasVendidos = [
    { nombre: 'Café Huila Especial', detalle: 'Pitalito · Arábica', vendidos: '320 kg vendidos', total: '$9.1M', color: 'bg-[#E8C786]' },
    { nombre: 'Espresso Blend', detalle: 'Mezcla intensa · Tueste medio', vendidos: '180 kg vendidos', total: '$3.9M', color: 'bg-[#2B1B12]' },
    { nombre: 'Café Nariño Washed', detalle: 'La Unión · Proceso lavado', vendidos: '45 kg vendidos', total: '$1.4M', color: 'bg-[#8B4A3C]' },
  ]

  const clientesRecientes = [
    { nombre: 'María López', email: 'maria@gmail.com', producto: 'Café Huila Especial', total: '$285.000', estado: 'Pagado' },
    { nombre: 'Restaurante Nómada', email: 'nomada@rest.com', producto: 'Espresso Blend', total: '$440.000', estado: 'Pagado' },
    { nombre: 'Juan Herrera', email: 'juan@gmail.com', producto: 'Café Cauca Natural', total: '$91.500', estado: 'Pendiente' },
  ]

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
            <h2 className="text-base font-black">Ventas mensuales 2026</h2>
            <p className="text-sm text-[#5f7268] mb-6">Comparativa de ventas por mes en kg</p>
            <div className="overflow-x-auto">
              <div className="flex items-end justify-between gap-3 min-w-[360px]">
                {ventasMensuales.map((item) => (
                  <div key={item.mes} className="flex flex-col items-center flex-1">
                    <span className="text-xs text-[#5f7268] mb-2">{item.valor}</span>
                    <div className="w-full flex items-end" style={{ height: '160px' }}>
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${item.alturaPct}%`,
                          backgroundColor: item.destacado ? '#0c3d2a' : item.claro ? '#A8D08D' : '#2fe37e',
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
          </div>

          <div className="panel-card rounded-xl p-4 sm:p-5">
            <h2 className="text-base font-semibold text-white">Clientes recientes</h2>
            <p className="text-sm text-[#5f7268] mb-4">Últimas compras registradas</p>
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
                      <td className="py-3 text-[#11261d] font-medium">{c.total}</td>
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
          </div>
        </div>

        <div className="panel-card rounded-xl p-4 sm:p-5 h-fit">
          <h2 className="text-base font-semibold text-white">Productos más vendidos</h2>
          <p className="text-sm text-[#5f7268] mb-4">Este mes</p>
          <div className="space-y-4">
            {productosMasVendidos.map((p) => (
              <div key={p.nombre} className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-lg ${p.color} flex-shrink-0`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#11261d]">{p.nombre}</p>
                  <p className="text-xs text-[#8a9b8f]">{p.detalle}</p>
                  <p className="text-xs text-[#8a9b8f]">{p.vendidos}</p>
                </div>
                <p className="text-sm font-semibold text-[#11261d]">{p.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard