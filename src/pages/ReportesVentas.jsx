import { useState } from 'react'

function ReportesVentas() {
  const periodos = ['Este mes', 'Últimos 3 meses', 'Este año', 'Personalizado']
  const [periodoActivo, setPeriodoActivo] = useState('Este mes')

  const tendencia = [
    { semana: 'Sem 1', valor: '$6.2M', alturaPct: 15 },
    { semana: 'Sem 2', valor: '$11.4M', alturaPct: 50 },
    { semana: 'Sem 3', valor: '$11.4M', alturaPct: 70 },
    { semana: 'Sem 4', valor: '$11.4M', alturaPct: 100 },
  ]

  const xPositions = tendencia.map((_, i) => 5 + (i * 90) / (tendencia.length - 1))

  const segmentos = []
  for (let i = 0; i < tendencia.length - 1; i++) {
    segmentos.push({
      tipo: 'horizontal',
      left: xPositions[i],
      width: xPositions[i + 1] - xPositions[i],
      bottom: tendencia[i].alturaPct,
    })
    segmentos.push({
      tipo: 'vertical',
      left: xPositions[i + 1],
      bottom: Math.min(tendencia[i].alturaPct, tendencia[i + 1].alturaPct),
      height: Math.abs(tendencia[i + 1].alturaPct - tendencia[i].alturaPct),
    })
  }

  const resumen = [
    { label: 'Total ventas', value: '$38.4M' },
    { label: 'Productos vendidos', value: '1.340 kg' },
    { label: 'Clientes únicos', value: '98' },
    { label: 'Ticket promedio', value: '$391.800' },
  ]

  const topProductos = [
    {
      nombre: 'Café Huila Especial',
      detalle: 'Pitalito · Arábica',
      categoria: 'Especiales',
      kg: '320 kg',
      total: '$9.1M',
      pct: 90,
      color: 'bg-[#E8C786]',
    },
    {
      nombre: 'Espresso Blend',
      detalle: 'Mezcla intensa · Tueste medio',
      categoria: 'Tostados',
      kg: '180 kg',
      total: '$3.9M',
      pct: 50,
      color: 'bg-[#2B1B12]',
    },
  ]

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
          <h2 className="text-base font-semibold text-gray-800 mb-8">Tendencia de ventas — Mayo 2026</h2>
          <div className="overflow-x-auto">
            <div className="relative h-40 mb-6 min-w-[420px]">
            {segmentos.map((seg, i) => (
              <div
                key={i}
                className="absolute bg-[#7CB342]"
                style={
                  seg.tipo === 'horizontal'
                    ? { left: `${seg.left}%`, width: `${seg.width}%`, bottom: `${seg.bottom}%`, height: '2px' }
                    : { left: `${seg.left}%`, bottom: `${seg.bottom}%`, height: `${seg.height}%`, width: '2px' }
                }
              ></div>
            ))}
            {tendencia.map((item, i) => (
              <div
                key={item.semana}
                className="absolute flex flex-col items-center"
                style={{ left: `${xPositions[i]}%`, bottom: `${item.alturaPct}%`, transform: 'translate(-50%, 50%)' }}
              >
                <span className="text-xs text-gray-600 mb-1 whitespace-nowrap -translate-y-4">{item.valor}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#1a2e1a]"></span>
              </div>
            ))}
            </div>
          </div>
          <div className="relative h-4 min-w-[420px]">
            {tendencia.map((item, i) => (
              <span
                key={item.semana}
                className="absolute text-xs text-gray-400"
                style={{ left: `${xPositions[i]}%`, transform: 'translateX(-50%)' }}
              >
                {item.semana}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Resumen del mes</h2>
          <div className="space-y-4">
            {resumen.map((item) => (
              <div key={item.label}>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-xl font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
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