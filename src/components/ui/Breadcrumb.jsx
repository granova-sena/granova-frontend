import { Link } from 'react-router-dom'

export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null

  const ultimo = items[items.length - 1]
  const anteriores = items.slice(0, -1)

  return (
    <nav className="mb-6">
      <div className="hidden sm:flex items-center gap-2 text-sm">
        <Link to="/cliente" className="text-[#9DC9B4] hover:underline">
          Inicio
        </Link>
        {anteriores.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-[#9DC9B4]/50">›</span>
            {item.ruta ? (
              <Link to={item.ruta} className="text-[#9DC9B4] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#9DC9B4]/70">{item.label}</span>
            )}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="text-[#9DC9B4]/50">›</span>
          <span className="text-white/90 font-medium">{ultimo.label}</span>
        </span>
      </div>

      <Link
        to={anteriores.length ? (anteriores[anteriores.length - 1].ruta || '/cliente') : '/cliente'}
        className="sm:hidden flex items-center gap-2 text-[#9DC9B4] text-sm hover:underline"
      >
        ← Volver a {anteriores.length ? anteriores[anteriores.length - 1].label : 'Inicio'}
      </Link>
    </nav>
  )
}
