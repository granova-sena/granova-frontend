import { useState } from 'react'
import ImagenProducto from './ImagenProducto'

const badgeColor = {
  "Popular":    "bg-[#6FA98C] text-white",
  "Nuevo":      "bg-[#6FA98C]/10 text-[#9DC9B4] ring-1 ring-inset ring-[#6FA98C]/25",
  "Oferta":     "bg-[#D85A30]/10 text-[#D85A30] ring-1 ring-inset ring-[#D85A30]/25",
  "Top ventas": "bg-[#6FA98C] text-white",
}

export default function ProductoCardMini({ p, onVerDetalle, onAgregar }) {
  const [feedback, setFeedback] = useState(false)

  const handleClick = () => {
    onVerDetalle(p)
  }

  return (
    <div
      className="shrink-0 w-[180px] sm:w-[200px] rounded-2xl overflow-hidden cursor-pointer bg-[#0F1D13] border border-white/[0.08] hover:-translate-y-1 hover:border-white/20 transition-all duration-200 group"
      role="button"
      tabIndex={0}
      aria-label={`Ver detalle de ${p.nombre}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter") handleClick(); }}
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] bg-[#14291B] overflow-hidden">
        <ImagenProducto
          src={p.img}
          alt={p.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badge */}
        {p.badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor[p.badge] || ''}`}>
            {p.badge}
          </span>
        )}

        {/* Badge promo */}
        {p.promoPct > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D85A30] text-white">
            -{p.promoPct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-white/40 truncate">{p.origen}</p>
        <p className="text-sm font-medium text-white mt-0.5 leading-snug line-clamp-2 min-h-[2.5rem]">
          {p.nombre}
        </p>

        {/* Precio */}
        <div className="mt-2">
          {p.promoPct > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30 line-through">
                ${p.precio.toLocaleString("es-CO")}
              </span>
              <span className="text-sm font-semibold text-[#D85A30]">
                ${Math.round(p.precio * (1 - p.promoPct / 100)).toLocaleString("es-CO")}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-white">
              ${p.precio.toLocaleString("es-CO")}
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1 mt-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            p.stockLabel === "En stock" ? "bg-[#6FA98C]"
            : p.stockLabel === "Stock bajo" ? "bg-amber-500"
            : "bg-[#D85A30]"
          }`} />
          <span className={`text-[10px] ${
            p.stockLabel === "En stock" ? "text-[#9DC9B4]"
            : p.stockLabel === "Stock bajo" ? "text-amber-600"
            : "text-[#D85A30]"
          }`}>{p.stockLabel}</span>
        </div>

        {onAgregar && p.disponible !== false && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAgregar({ ...p, cant: 1 }); }}
            className="mt-2 w-full py-1.5 rounded-lg bg-[#6FA98C] text-white text-xs font-semibold hover:bg-[#4F8A70] transition"
          >
            Agregar 🛒
          </button>
        )}
      </div>
    </div>
  )
}
