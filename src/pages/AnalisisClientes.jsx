function AnalisisClientes() {
  const stats = [
    { label: 'Clientes activos', value: '142', change: '+9 nuevos este mes', tone: 'green' },
    { label: 'Frecuencia promedio', value: '2.4 compras/mes' },
    { label: 'Clientes potenciales', value: '38', change: 'sin primera compra', tone: 'orange' },
  ]

  const clientes = [
    {
      nombre: 'María López',
      email: 'maria@gmail.com',
      badge: 'VIP',
      badgeColor: 'bg-[#1a2e1a] text-white',
      compras: '8 compras · $2.4M total',
      ultimoPedido: 'Último pedido: hace 3 días',
      fidelidad: 90,
      barColor: '#1D9E75',
    },
    {
      nombre: 'Restaurante Nómada',
      email: 'nomada@rest.com',
      badge: 'Frecuente',
      badgeColor: 'bg-green-100 text-green-700',
      compras: '5 compras · $1.8M total',
      ultimoPedido: 'Último pedido: hace 1 semana',
      fidelidad: 70,
      barColor: '#7CB342',
    },
    {
      nombre: 'Juan Herrera',
      email: 'juan@gmail.com',
      badge: 'Potencial',
      badgeColor: 'bg-amber-100 text-amber-700',
      compras: '2 compras · $320K total',
      ultimoPedido: 'Último pedido: hace 3 semanas',
      fidelidad: 30,
      barColor: '#D8932F',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Análisis de clientes</h1>
        <p className="text-sm text-gray-300">Frecuencia de compra y clientes potenciales</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.tone === 'orange' ? 'text-[#D8932F]' : 'text-gray-800'}`}>
              {stat.value}
            </p>
            {stat.change && (
              <p className={`text-xs mt-1 ${stat.tone === 'orange' ? 'text-[#D8932F]' : 'text-[#1D9E75]'}`}>
                {stat.tone === 'green' && '↑ '}{stat.change}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clientes.map((c) => (
          <div key={c.email} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="h-36 bg-gray-200 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-gray-800">{c.nombre}</h3>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${c.badgeColor}`}>{c.badge}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
              <p className="text-sm text-gray-600 mt-3">{c.compras}</p>
              <p className="text-xs text-gray-400">{c.ultimoPedido}</p>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.fidelidad}%`, backgroundColor: c.barColor }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Fidelidad {c.fidelidad}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnalisisClientes