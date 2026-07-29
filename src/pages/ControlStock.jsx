import { useState } from 'react'

function ControlStock() {
  const [tabActivo, setTabActivo] = useState('Todos')

  const stats = [
    { label: 'Productos', value: '48', change: '↑ 3 este mes', valueClass: 'text-gray-800', changeClass: 'text-gray-400' },
    { label: 'Stock bajo', value: '5', change: 'requieren acción', valueClass: 'text-amber-500', changeClass: 'text-amber-500' },
    { label: 'Ventas hoy', value: '$1.24M', change: '↑ +12% vs ayer', valueClass: 'text-gray-800', changeClass: 'text-[#1D9E75]' },
    { label: 'Agotados', value: '2', change: 'descuento activo', valueClass: 'text-red-500', changeClass: 'text-red-500' },
  ]

  const tabs = [
    { key: 'Todos', label: 'Todos (48)' },
    { key: 'Disponibles', label: 'Disponibles (41)' },
    { key: 'StockBajo', label: 'Stock bajo (5)' },
  ]

  const estadoStyles = {
    Disponible: 'bg-green-100 text-green-700',
    'Stock bajo': 'bg-amber-100 text-amber-700',
    Agotado: 'bg-red-100 text-red-700',
  }

  const productos = [
    {
      nombre: 'Café Huila Especial',
      origen: 'Pitalito · Arábica',
      categoria: 'Especiales',
      disponibilidad: '80% · max 400 kg',
      pct: 80,
      kg: '320 kg',
      precio: '$28.500',
      estado: 'Disponible',
      barColor: '#1D9E75',
      textColor: 'text-gray-500',
      color: 'bg-[#E8C786]',
    },
    {
      nombre: 'Café Nariño Washed',
      origen: 'La Unión · Arábica',
      categoria: 'Especiales',
      disponibilidad: '18% · alerta activa',
      pct: 18,
      kg: '45 kg',
      precio: '$32.000',
      estado: 'Stock bajo',
      barColor: '#D8932F',
      textColor: 'text-amber-500',
      color: 'bg-[#8B4A3C]',
    },
    {
      nombre: 'Tostado Espresso Blend',
      origen: 'Mezcla interna · Tueste medio-oscuro',
      categoria: 'Tostados',
      disponibilidad: '60% · max 400 kg',
      pct: 60,
      kg: '180 kg',
      precio: '$22.000',
      estado: 'Disponible',
      barColor: '#1D9E75',
      textColor: 'text-gray-500',
      color: 'bg-[#2B1B12]',
    },
    {
      nombre: 'Café Sierra Nevada',
      origen: 'Santa Marta · Orgánico certificado',
      categoria: 'Orgánicos',
      disponibilidad: 'Agotado · sin stock',
      pct: 0,
      kg: '0 kg',
      precio: '$35.000',
      estado: 'Agotado',
      barColor: '#E11D48',
      textColor: 'text-red-500',
      color: 'bg-[#5C7A4A]',
    },
    {
      nombre: 'Café Cauca Natural',
      origen: 'Popayán · Proceso natural',
      categoria: 'Especiales',
      disponibilidad: '11% · crítico',
      pct: 11,
      kg: '28 kg',
      precio: '$30.500',
      estado: 'Stock bajo',
      barColor: '#E11D48',
      textColor: 'text-red-500',
      color: 'bg-[#A65A3C]',
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
        <h2 className="text-base font-semibold text-white">Productos en inventario</h2>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-gray-300 bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
            ↓ Exportar
          </button>
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
            + Nuevo producto
          </button>
        </div>
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

        <div className="p-4">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
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
              {productos.map((p) => (
                <tr key={p.nombre} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${p.color} flex-shrink-0`}></div>
                      <div>
                        <p className="text-gray-800 font-medium">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.origen}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-gray-600">{p.categoria}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-[120px]">
                        <p className={`text-xs mb-1 ${p.textColor}`}>{p.disponibilidad}</p>
                        <div className="h-1.5 w-full max-w-[140px] bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${p.pct}%`, backgroundColor: p.barColor }}
                          ></div>
                        </div>
                      </div>
                      <span className={`text-xs whitespace-nowrap ${p.textColor}`}>{p.kg}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-gray-800 font-medium">{p.precio}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${estadoStyles[p.estado]}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    {p.estado === 'Agotado' ? (
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ) : (
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">Mostrando 5 de 48 productos</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`w-8 h-8 rounded-lg text-sm transition ${
                  n === 1 ? 'bg-[#1D9E75]/10 text-[#1D9E75] font-medium' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlStock