function AlertasStock() {
  const stats = [
    { label: 'Alertas activas', value: '5', change: 'requieren atención', valueClass: 'text-amber-500', changeClass: 'text-amber-500' },
    { label: 'Agotados', value: '2', change: 'acción requerida', valueClass: 'text-red-500', changeClass: 'text-red-500' },
    { label: 'Resueltas hoy', value: '3', change: 'reabastecidos', valueClass: 'text-gray-800', changeClass: 'text-[#1D9E75]' },
    { label: 'Umbral global', value: '20%', change: 'stock mínimo', valueClass: 'text-gray-800', changeClass: 'text-gray-400' },
  ]

  const alertas = [
    {
      nombre: 'Café Sierra Nevada',
      origen: 'Santa Marta · Orgánico certificado',
      detalle: '0 kg disponibles · Agotado desde hace 2 horas',
      estado: 'Agotado',
      borderColor: '#E11D48',
      textColor: 'text-red-500',
      badgeClass: 'bg-red-100 text-red-700',
      color: 'bg-[#5C7A4A]',
      accion: 'Reabastecer',
      accionTipo: 'primaria',
    },
    {
      nombre: 'Café Nariño Washed',
      origen: 'La Unión · Proceso lavado',
      detalle: '45 kg disponibles · 18% del stock máximo',
      estado: 'Stock bajo',
      borderColor: '#D8932F',
      textColor: 'text-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700',
      color: 'bg-[#8B4A3C]',
      accion: 'Notificar proveedor',
      accionTipo: 'secundaria',
    },
    {
      nombre: 'Café Cauca Natural',
      origen: 'Popayán · Proceso natural',
      detalle: '28 kg disponibles · 11% del stock máximo',
      estado: 'Stock bajo',
      borderColor: '#D8932F',
      textColor: 'text-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700',
      color: 'bg-[#A65A3C]',
      accion: 'Notificar proveedor',
      accionTipo: 'secundaria',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.valueClass}`}>{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.changeClass}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Alertas de stock</h2>
        <button className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-gray-300 bg-[#1D9E75] text-white hover:bg-[#178a64] transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Configurar umbrales
        </button>
      </div>

      <div className="space-y-3">
        {alertas.map((a) => (
          <div
            key={a.nombre}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-l-4"
            style={{ borderLeftColor: a.borderColor }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-14 h-14 rounded-lg ${a.color} flex-shrink-0`}></div>

              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium truncate">{a.nombre}</p>
                <p className="text-xs text-gray-400 truncate">{a.origen}</p>
                <p className={`text-xs mt-1 ${a.textColor}`}>{a.detalle}</p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:ml-auto sm:flex-shrink-0">
              <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${a.badgeClass}`}>
                {a.estado}
              </span>

              {a.accionTipo === 'primaria' ? (
                <button className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap">
                  {a.accion}
                </button>
              ) : (
                <button className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">
                  {a.accion}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlertasStock