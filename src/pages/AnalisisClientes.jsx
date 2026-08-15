import { useState, useEffect } from 'react'
import { API_URL } from '../config'



function AnalisisClientes() {

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/reportes/clientes`)
      .then(res => res.json())
      .then(json => {
        if (json.ok) setDatos(json.data)
      })
      .catch(err => console.error(err))
      .finally(() => setCargando(false))
  }, [])




  const stats = [
  { 
    label: 'Clientes activos', 
    value: datos ? String(datos.stats.clientes_activos) : '0', 
    change: datos ? `+${datos.stats.clientes_nuevos} nuevos este mes` : '', 
    tone: 'green' 
  },
  { 
    label: 'Frecuencia promedio', 
    value: datos ? `${datos.stats.frecuencia_promedio} compras/mes` : '0 compras/mes' 
  },
  { 
    label: 'Clientes potenciales', 
    value: datos ? String(datos.stats.clientes_nuevos) : '0', 
    change: 'registrados este mes', 
    tone: 'orange' 
  },
]

 const coloresBadge = ['bg-[#1a2e1a] text-white', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700']
 const badges = ['VIP', 'Frecuente', 'Potencial', 'Nuevo', 'Regular']

      const clientes = datos?.top_clientes.map((c, i) => ({
        nombre: `${c.nombre} ${c.apellido}`,
        email: c.email,
        badge: badges[i] || 'Cliente',
        badgeColor: coloresBadge[i] || 'bg-gray-100 text-gray-700',
        compras: `${c.total_compras} compras · $${Number(c.total_gastado).toLocaleString('es-CO')} total`,
        ultimoPedido: 'Últimos 30 días',
        fidelidad: Math.min(100, Math.round((Number(c.total_gastado) / 700000) * 100)),
        barColor: ['#1D9E75', '#7CB342', '#D8932F', '#3B82F6', '#8B5CF6'][i] || '#6FA98C',
      })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Análisis de clientes</h1>
        <p className="text-sm text-gray-300">Frecuencia de compra y clientes potenciales</p>
      </div>

      {cargando && (
        <p className="text-sm text-gray-300">Cargando...</p>
      )}

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