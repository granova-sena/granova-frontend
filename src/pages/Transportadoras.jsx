function Transportadoras() {
  const transportadoras = [
    {
      nombre: 'Coordinadora',
      entregas: '98% entregas a tiempo',
      pct: 98,
      envios: '142 envíos · Promedio 1.8 días',
      estado: 'Activa',
      badgeClass: 'bg-green-100 text-green-700',
      textColor: 'text-[#1D9E75]',
      barColor: '#1D9E75',
      color: 'bg-[#8B5E3C]',
    },
    {
      nombre: 'Servientrega',
      entregas: '94% entregas a tiempo',
      pct: 94,
      envios: '98 envíos · Promedio 2.1 días',
      estado: 'Activa',
      badgeClass: 'bg-green-100 text-green-700',
      textColor: 'text-[#1D9E75]',
      barColor: '#1D9E75',
      color: 'bg-[#C75B2E]',
    },
    {
      nombre: 'Deprisa',
      entregas: '87% entregas a tiempo',
      pct: 87,
      envios: '24 envíos · Promedio 3.2 días',
      estado: 'Novedad',
      badgeClass: 'bg-amber-100 text-amber-700',
      textColor: 'text-amber-500',
      barColor: '#D8932F',
      color: 'bg-[#5B6B7A]',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-admin-page-title">Transportadoras</h1>
          <p className="text-sm text-admin-page-subtitle">Gestión de empresas logísticas y rendimiento de entregas</p>
        </div>
        <button className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap">
          + Agregar aliada
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {transportadoras.map((t) => (
          <div key={t.nombre} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className={`h-32 ${t.color}`}></div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-gray-800">{t.nombre}</h3>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${t.badgeClass}`}>{t.estado}</span>
              </div>
              <p className={`text-sm mt-1 ${t.textColor}`}>{t.entregas}</p>
              <p className="text-xs text-gray-400 mt-1">{t.envios}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {transportadoras.map((t) => (
          <div key={t.nombre}>
            <p className="text-xs text-admin-page-subtitle mb-1.5">Rendimiento</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${t.pct}%`, backgroundColor: t.barColor }}></div>
              </div>
              <span className="text-xs text-admin-page-title">{t.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Transportadoras