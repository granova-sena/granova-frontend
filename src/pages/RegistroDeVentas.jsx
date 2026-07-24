function RegistroVentas() {
  const stats = [
    { label: 'Ventas del mes', value: '$38.4M', change: '↑ +18% vs mes anterior', changeClass: 'text-[#1D9E75]' },
    { label: 'Clientes activos', value: '142', change: '↑ +9 nuevos este mes', changeClass: 'text-[#1D9E75]' },
    { label: 'Kg vendidos', value: '1.340', change: '↑ este mes', changeClass: 'text-[#1D9E75]' },
    { label: 'Facturas emitidas', value: '98', change: 'este mes', changeClass: 'text-gray-400' },
  ]

  const estadoStyles = {
    Pagada: 'bg-green-100 text-green-700',
    Pendiente: 'bg-amber-100 text-amber-700',
  }

  const ventas = [
    {
      factura: '#F-00098',
      cliente: 'Restaurante Nómada',
      email: 'nomada@rest.com',
      producto: 'Café Huila Especial',
      cantidad: '10 kg',
      total: '$285.000',
      estado: 'Pagada',
      fecha: 'Hoy',
    },
    {
      factura: '#F-00097',
      cliente: 'María López',
      email: 'maria@gmail.com',
      producto: 'Espresso Blend',
      cantidad: '2 kg',
      total: '$44.000',
      estado: 'Pagada',
      fecha: 'Ayer',
    },
    {
      factura: '#F-00096',
      cliente: 'Café Origen Cali',
      email: 'origen@cafe.com',
      producto: 'Café Nariño Washed',
      cantidad: '5 kg',
      total: '$160.000',
      estado: 'Pendiente',
      fecha: 'Ayer',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.changeClass}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Registro de ventas</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
            ↓ PDF
          </button>
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
            ↓ Excel
          </button>
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
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
            {ventas.map((v) => (
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
                <td className="py-3 px-5 text-gray-600">{v.cantidad}</td>
                <td className="py-3 px-5 text-gray-800 font-medium">{v.total}</td>
                <td className="py-3 px-5">
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[v.estado]}`}>
                    {v.estado}
                  </span>
                </td>
                <td className="py-3 px-5 text-gray-500">{v.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RegistroVentas