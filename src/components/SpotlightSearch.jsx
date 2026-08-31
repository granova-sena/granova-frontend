import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import ImagenProducto from "./ImagenProducto";

const badgeColor = {
  "Popular":    "bg-[#6FA98C] text-white",
  "Nuevo":      "bg-[#6FA98C]/10 text-[#9DC9B4] ring-1 ring-inset ring-[#6FA98C]/25",
  "Oferta":     "bg-[#D85A30]/10 text-[#D85A30] ring-1 ring-inset ring-[#D85A30]/25",
  "Top ventas": "bg-[#6FA98C] text-white",
};

export default function SpotlightSearch({ abierto, onCerrar, productos, onVerDetalle, onAgregar }) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState(0);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    if (!abierto) return;

    setBusqueda("");
    setSeleccion(0);
    setTimeout(() => inputRef.current?.focus(), 50);

    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function manejarEscape(e) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener("keydown", manejarEscape);
      document.body.style.overflow = overflowOriginal;
    };
  }, [abierto, onCerrar]);

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = norm(busqueda);
    return productos
      .filter(p => {
        return (
          norm(p.nombre).includes(q) ||
          norm(p.tipo).includes(q) ||
          norm(p.marca).includes(q) ||
          norm(p.modelo).includes(q) ||
          norm(p.origen).includes(q)
        );
      })
      .slice(0, 8);
  }, [busqueda, productos]);

  useEffect(() => {
    setSeleccion(0);
  }, [busqueda]);

  useEffect(() => {
    if (!listaRef.current) return;
    const item = listaRef.current.children[seleccion];
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [seleccion]);

  function navegar(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSeleccion(i => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSeleccion(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[seleccion]) {
      e.preventDefault();
      onVerDetalle(resultados[seleccion]);
      onCerrar();
    }
  }

  if (!abierto) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-full max-w-lg bg-[#0F1D13] border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/30 shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={navegar}
            placeholder="Buscar café, máquinas, marcas..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          />
          <kbd className="text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded border border-white/[0.08]">ESC</kbd>
        </div>

        {/* Resultados */}
        {busqueda.trim() ? (
          <div ref={listaRef} className="max-h-[320px] overflow-y-auto">
            {resultados.length > 0 ? (
              <ul className="py-2">
                {resultados.map((p, i) => (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${
                      i === seleccion ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                    onMouseEnter={() => setSeleccion(i)}
                    onClick={() => { onVerDetalle(p); onCerrar(); }}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#14291B] shrink-0">
                      <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium truncate">{p.nombre}</p>
                        {p.badge && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor[p.badge] || ""}`}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-white/35">{p.origen}</span>
                        {p.promoPct > 0 && (
                          <span className="text-[10px] font-bold text-[#D85A30]">-{p.promoPct}%</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {p.promoPct > 0 ? (
                        <span className="text-sm font-semibold text-[#D85A30]">
                          ${Math.round(p.precio * (1 - p.promoPct / 100)).toLocaleString("es-CO")}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-white/70">
                          ${p.precio.toLocaleString("es-CO")}
                        </span>
                      )}
                    </div>

                    {p.disponible && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAgregar({ ...p, cant: 1 }, null);
                          onCerrar();
                        }}
                        className="shrink-0 h-7 px-2.5 rounded-lg bg-[#6FA98C] text-white text-[11px] font-semibold hover:bg-[#4F8A70] transition"
                      >
                        + 🛒
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 text-center">
                <p className="text-white/30 text-sm">No se encontraron resultados</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-white/25 text-sm">Escribe para buscar en el catálogo</p>
          </div>
        )}

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-white/[0.06] text-[10px] text-white/20">
          <span>↑↓ navegar</span>
          <span>↵ ver detalle</span>
          <span>esc cerrar</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
