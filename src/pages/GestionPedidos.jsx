import { useState } from 'react'

function GestionPedidos() {
  const [tabActivo, setTabActivo] = useState('Todos')

  const stats = [
    { label: 'Pedidos pendientes', value: '18', change: 'requieren acción', valueClass: 'text-amber-500', changeClass: 'text-amber-500' },
    { label: 'Pedidos confirmados', value: '34', change: '↑ este mes', valueClass: 'text-gray-800', changeClass: 'text-gray-400' },
    { label: 'Pedidos cancelados', value: '3', change: 'este mes', valueClass: 'text-red-500', changeClass: 'text-red-500' },
    { label: 'Total en pedidos', value: '$24.8M', change: '↑ +22% vs mes anterior', valueClass: 'text-gray-800', changeClass: 'text-[#1D9E75]' },
  ]

  const tabs = [
    { key: 'Todos', label: 'Todos (55)' },
    { key: 'Pendientes', label: 'Pendientes (18)' },
    { key: 'Confirmados', label: 'Confirmados (34)' },
    { key: 'Cancelados', label: 'Cancelados (3)' },
  ]

  const estadoStyles = {
    Pendiente: 'bg-amber-100 text-amber-700',
    Confirmado: 'bg-green-100 text-green-700',
    Cancelado: 'bg-red-100 text-red-700',
  }

  const pedidos = [
    {
      pedido: '#P-00181',
      cliente: 'Restaurante Nómada',
      email: 'nomada@rest.com',
      producto: 'Café Huila Especial',
      cantidad: '10 kg',
      total: '$285.000',
      estado: 'Pendiente',
      pedidoColor: 'text-gray-600',
      color: 'bg-[#8B4A3C]',
    },
    {
      pedido: '#P-00180',
      cliente: 'María López',
      email: 'maria@gmail.com',
      producto: 'Espresso Blend',
      cantidad: '2 kg',
      total: '$44.000',
      estado: 'Confirmado',
      pedidoColor: 'text-gray-600',
      color: 'bg-[#2B1B12]',
    },
    {
      pedido: '#P-00179',
      cliente: 'Juan Herrera',
      email: 'juan@gmail.com',
      producto: 'Café Nariño Washed',
      cantidad: '5 kg',
      total: '$160.000',
      estado: 'Cancelado',
      pedidoColor: 'text-red-500',
      color: 'bg-[#5C7A4A]',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.valueClass}`}>{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.changeClass}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Gestión de pedidos</h2>
        <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-gray-300 bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
          ↓ Exportar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-4 sm:px-5 pt-4 border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActivo(tab.key)}
              className={`text-sm pb-3 border-b-2 transition ${
                tabActivo === tab.key ? 'border-[#1a2e1a] text-gray-800 font-medium' : 'border-transparent text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-5 font-medium">Pedido</th>
                <th className="py-3 px-5 font-medium">Cliente</th>
                <th className="py-3 px-5 font-medium">Producto</th>
                <th className="py-3 px-5 font-medium">Cantidad</th>
                <th className="py-3 px-5 font-medium">Total</th>
                <th className="py-3 px-5 font-medium">Estado</th>
                <th className="py-3 px-5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.pedido} className="border-b border-gray-100 last:border-0">
                  <td className={`py-3 px-5 font-medium ${p.pedidoColor}`}>{p.pedido}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {p.cliente.charAt(0)}
                      </div>
                      <div>
                        <p className="text-gray-800">{p.cliente}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${p.color} flex-shrink-0`}></div>
                      <span className="text-gray-600">{p.producto}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-gray-600">{p.cantidad}</td>
                  <td className="py-3 px-5 text-gray-800 font-medium">{p.total}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado]}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    {p.estado === 'Pendiente' ? (
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap">
                          ✓ Aceptar
                        </button>
                        <button className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition whitespace-nowrap">
                          ✕ Cancelar
                        </button>
                      </div>
                    ) : (
                      <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">
                        Ver detalle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default GestionPedidos