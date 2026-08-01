import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { API_URL } from '../config'

function ReportesVentas() {
  const periodos = ['Este mes', 'Últimos 3 meses', 'Este año', 'Personalizado']
  const [periodoActivo, setPeriodoActivo] = useState('Este mes')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)


  useEffect(() => {
  fetch(`${API_URL}/api/reportes/ventas`)
    .then(res => res.json())
    .then(json => {
      if (json.ok) setDatos(json.data)
    })
    .catch(err => console.error(err))
    .finally(() => setCargando(false))
}, [])
  

  


  const tendencia = datos?.tendencia || []
  

  const resumen = [
  { 
    label: 'Total ventas', 
    value: datos ? `$${Number(datos.resumen.total_ventas).toLocaleString('es-CO')}` : '$0' 
  },
  { 
    label: 'Productos vendidos', 
    value: datos ? `${datos.resumen.productos_vendidos} kg` : '0 kg' 
  },
  { 
    label: 'Clientes únicos', 
    value: datos ? String(datos.resumen.clientes_unicos) : '0' 
  },
  { 
    label: 'Ticket promedio', 
    value: datos ? `$${Math.round(datos.resumen.ticket_promedio).toLocaleString('es-CO')}` : '$0' 
  },
]

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Reportes de ventas</h1>
          <p className="text-sm text-gray-300">Detalle mensual de ventas por producto y región</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#0f5f3f] text-white border border-[#0d5337] hover:bg-[#114f3b] transition">
            ↓ Descargar Excel
          </button>
          <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#9d351c] text-white border border-[#832b18] hover:bg-[#8a2f17] transition">
            ↓ Descargar PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 mr-2">Periodo:</span>
        {periodos.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodoActivo(p)}
            className={`text-sm px-4 py-1.5 rounded-lg transition ${
              periodoActivo === p ? 'bg-[#1a2e1a] text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Tendencia de ventas — Mayo 2026</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={tendencia}>
              <XAxis dataKey="semana" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ventas']} />
              <Line type="monotone" dataKey="ventas" stroke="#6FA98C" strokeWidth={2} dot={{ fill: '#6FA98C', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Productos más vendidos</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} kg`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }}></span>
                <span className="text-gray-600">{item.name}</span>
                <span className="ml-auto font-medium text-gray-800">{item.value} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Resumen del mes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {resumen.map((item) => (
            <div key={item.label}>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-xl font-semibold text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Top productos del mes</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 font-medium">Producto</th>
                <th className="py-2 font-medium">Categoría</th>
                <th className="py-2 font-medium">Kg vendidos</th>
                <th className="py-2 font-medium">Total ventas</th>
                <th className="py-2 font-medium">% del total</th>
              </tr>
            </thead>
            <tbody>
              {topProductos.map((p) => (
                <tr key={p.nombre} className="border-b border-gray-100 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${p.color} flex-shrink-0`}></div>
                      <div>
                        <p className="text-gray-800 font-medium">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.detalle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{p.categoria}</td>
                  <td className="py-3 text-gray-600">{p.kg}</td>
                  <td className="py-3 text-gray-800 font-medium">{p.total}</td>
                  <td className="py-3">
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
      </div>
    </div>
  )
}

export default ReportesVentas 