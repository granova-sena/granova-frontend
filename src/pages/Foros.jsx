import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL as BASE_API_URL } from "../config";
import FadeIn from "../components/ui/FadeIn";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ImagenProducto } from "./Catalogo";

const API_URL = `${BASE_API_URL}/api/resenas`;

// ── ESTRELLAS ──────────────────────────────────────────────
function Estrellas({ calificacion, width = 13 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${calificacion} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={width} height={width} viewBox="0 0 24 24" fill={n <= Math.round(calificacion) ? "#E8B931" : "none"} stroke={n <= Math.round(calificacion) ? "#E8B931" : "rgba(255,255,255,0.2)"} strokeWidth="1.6">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

function formatearFecha(f) {
  return new Date(f).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

const FILTROS = [
  { val: 0, label: "Todas" },
  { val: 5, label: "5 ★" },
  { val: 4, label: "4+ ★" },
  { val: 3, label: "3+ ★" },
];

// ── VISTA FOROS ────────────────────────────────────────────
// Hilos por producto: cada producto con reseñas es un hilo que muestra
// su promedio y sus reseñas verificadas (solo escriben compradores).
function ForosInterno() {
  const navigate = useNavigate();
  const [hilos, setHilos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [hiloAbierto, setHiloAbierto] = useState(null);
  const [filtro, setFiltro] = useState(0);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        setCargando(true);
        setError(null);
        const token = localStorage.getItem('token_cliente');
        const res = await fetch(`${API_URL}/foros`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.status === 401 || res.status === 403) throw new Error("Inicia sesión para ver los foros");
        const json = await res.json();
        if (!json.ok) throw new Error(json.mensaje || "Error del servidor");
        if (!cancelado) setHilos(json.data);
      } catch (err) {
        if (!cancelado) setError(err.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, []);

  // Filtra las reseñas dentro de cada hilo según calificación mínima.
  // Number() porque el backend devuelve valores numeric como string.
  // Al filtrar también se recalculan promedio y total del hilo para que
  // la cabecera siempre coincida con lo que se está viendo.
  const hilosFiltrados = useMemo(() => {
    if (filtro === 0) return hilos.map(h => ({ ...h, resenas: h.resenas || [] }));
    return hilos
      .map(h => {
        const filtradas = (h.resenas || []).filter(r => Number(r.calificacion) >= filtro);
        const total = filtradas.length;
        const promedio = total > 0 ? filtradas.reduce((s, r) => s + Number(r.calificacion), 0) / total : 0;
        return { ...h, resenas: filtradas, total_resenas: total, promedio };
      })
      .filter(h => h.resenas.length > 0);
  }, [hilos, filtro]);

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Encabezado */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#14291B] border border-[#6FA98C]/25 flex items-center justify-center text-xl">💬</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>Foros</h1>
              <p className="text-sm text-white/40 mt-0.5">Lo que la comunidad dice de cada producto — reseñas de compradores verificados</p>
            </div>
          </div>

          {/* Filtros por calificación */}
          <div className="flex items-center gap-2 mt-6">
            {FILTROS.map(f => (
              <button
                type="button"
                key={f.val}
                onClick={() => setFiltro(f.val)}
                className={`px-4 h-9 rounded-xl text-sm font-medium transition ${filtro === f.val ? "bg-[#6FA98C] text-white" : "bg-[#0F1D13] text-white/50 border border-white/[0.08] hover:text-white"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Contenido */}
        {cargando ? (
          <div className="mt-8 space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl bg-[#0F1D13] border border-white/[0.08] py-16 text-center">
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        ) : hilosFiltrados.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-[#0F1D13] border border-white/[0.08] py-16 text-center">
            {filtro !== 0 ? (
              <>
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-white/60 text-sm font-medium">Ninguna reseña coincide con este filtro.</p>
                <p className="text-white/40 text-xs mt-1">Prueba con otra calificación.</p>
                <button type="button" onClick={() => setFiltro(0)} className="mt-5 h-10 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">
                  Ver todas las reseñas
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-3">🌱</p>
                <p className="text-white/60 text-sm font-medium">Aún no hay reseñas aquí.</p>
                <p className="text-white/40 text-xs mt-1">Las reseñas nacen de compras entregadas — sé el primero en dejar una desde tus pedidos.</p>
                <button type="button" onClick={() => navigate('/cliente/pedidos')} className="mt-5 h-10 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">
                  Ir a mis pedidos
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {hilosFiltrados.map((h, idx) => {
              const abierto = hiloAbierto === h.id_producto;
              const resenasMostrar = abierto ? h.resenas.slice(0, 10) : h.resenas.slice(0, 2);
              return (
                <FadeIn key={h.id_producto} delay={idx * 0.04}>
                  <div className={`rounded-2xl overflow-hidden transition-colors ${abierto ? "bg-[#0F1D13] border border-[#6FA98C]/30" : "bg-[#0F1D13]/70 border border-white/[0.08] hover:border-white/[0.16]"}`}>
                    {/* Cabecera del hilo */}
                    <button
                      type="button"
                      onClick={() => setHiloAbierto(abierto ? null : h.id_producto)}
                      className="w-full flex items-center gap-4 p-4 text-left"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#14291B] shrink-0">
                        <ImagenProducto src={h.imagen_url} alt={h.nombre} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{h.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Estrellas calificacion={Number(h.promedio)} />
                          <span className="text-xs text-white/50 font-semibold">{Number(h.promedio).toFixed(1)}</span>
                          <span className="text-xs text-white/30">· {h.total_resenas} {h.total_resenas === 1 ? "reseña" : "reseñas"}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    </button>

                    {/* Reseñas del hilo */}
                    {abierto && (
                      <div className="border-t border-white/[0.07] divide-y divide-white/[0.05]">
                        {resenasMostrar.map(r => (
                          <div key={r.id_resena} className="px-4 py-3.5 flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#14291B] border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#9DC9B4]">
                              {(r.cliente_nombre || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-white/80">{r.cliente_nombre || "Cliente"}</span>
                                <Estrellas calificacion={r.calificacion} width={11} />
                                <span className="text-[10px] text-white/25 ml-auto">{formatearFecha(r.fecha_resena)}</span>
                              </div>
                              {r.comentario && <p className="text-sm text-white/60 mt-1 leading-relaxed break-words">"{r.comentario}"</p>}
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#9DC9B4]/80 mt-1.5">
                                ✓ Compra verificada
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="px-4 py-3 flex items-center justify-between bg-white/[0.02]">
                          <span className="text-[11px] text-white/25">Solo quienes compraron este producto pueden reseñarlo</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/cliente/catalogo`)}
                            className="text-xs font-semibold text-[#9DC9B4] hover:text-white transition shrink-0"
                          >
                            Ver producto →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Foros() {
  return <ForosInterno />;
}
