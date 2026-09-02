import { Fragment } from 'react'

/* ============================================================
   PanelKit — componentes reutilizables del panel Admin/Empleado
   Tema claro/oscuro automático (vía panel-tema.css).
   ============================================================ */

const TONOS = {
  verde:   { bg: 'rgba(29,158,117,0.14)',  color: '#2dd4a7' },
  ambar:   { bg: 'rgba(245,158,11,0.14)',  color: '#fbbf24' },
  rojo:    { bg: 'rgba(239,68,68,0.14)',   color: '#f87171' },
  cielo:   { bg: 'rgba(14,165,233,0.14)',  color: '#38bdf8' },
  violeta: { bg: 'rgba(139,92,246,0.16)',  color: '#a78bfa' },
  neutral: { bg: 'rgba(255,255,255,0.08)', color: '#8fa89b' },
}

/* Cabecera de página: título + subtítulo + acciones a la derecha */
export function PageHeader({ titulo, subtitulo, acciones, className = '' }) {
  return (
    <div className={`panel-come mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-admin-heading sm:text-2xl">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-sm text-gray-400">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  )
}

/* Tarjeta de estadística con ícono, valor grande y sub-línea */
export function StatCard({ icono, label, value, sub, tono = 'verde', delay = '' }) {
  const t = TONOS[tono] || TONOS.verde
  return (
    <div className={`panel-card panel-come bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 ${delay}`}>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
        style={{ background: t.bg, color: t.color }}
      >
        <span className="leading-none">{icono}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-admin-heading truncate">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[11px] mt-0.5 truncate" style={{ color: t.color }}>{sub}</p>}
      </div>
    </div>
  )
}

/* Tarjeta contenedora base */
export function PanelCard({ children, className = '', animado = true }) {
  return (
    <div className={`panel-card bg-white rounded-2xl border border-gray-200 ${animado ? 'panel-come' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* Esqueleto de carga */
export function PanelSkeleton({ filas = 3, columnas = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className={`bg-white rounded-2xl border border-gray-200 p-5 animate-pulse ${i % 2 ? 'hidden sm:block' : ''}`}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
            {Array.from({ length: columnas }).map((__, j) => (
              <div key={j} className="h-4 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* Estado vacío con ícono */
export function EmptyState({ icono = '📭', titulo = 'Sin resultados', descripcion }) {
  return (
    <div className="panel-pop flex flex-col items-center justify-center py-14 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {icono}
      </div>
      <p className="font-medium text-admin-heading">{titulo}</p>
      {descripcion && <p className="text-sm text-gray-500 mt-1 max-w-sm">{descripcion}</p>}
    </div>
  )
}

/* Paginación compacta */
export function Paginado({ pagina, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-lg text-sm transition ${
            n === pagina ? 'bg-[#1D9E75]/10 text-[#1D9E75] font-medium' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

/* Fragmento de agrupación de tablas (fila resumen col-span completo) */
export function FilaGrupo({ datos, span, filas, nombre }) {
  return (
    <Fragment>
      <tr className="bg-gray-50/70">
        <td colSpan={span} className="py-2 px-5 text-xs font-medium text-gray-600">
          {datos}
        </td>
      </tr>
      {filas}
    </Fragment>
  )
}

/* Botón de acción principal */
export function BotonPrimario({ children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] active:scale-[0.98] transition disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}