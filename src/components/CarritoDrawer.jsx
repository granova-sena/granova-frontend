import { useNavigate } from 'react-router-dom'
import { useModalBehavior } from '../hooks/useModalBehavior'
import { useCarrito } from '../context/CarritoContext'
import { leerParametro } from '../services/parametros'
import { ImagenProducto } from '../pages/Catalogo'

// ── ÍCONOS ─────────────────────────────────────────────────
const IconoCarrito = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}><path d="M6 8h12l-1.2 10.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconoBasura = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}><path d="M5 7h14M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7m-8 0l.7 11.2A2 2 0 009.7 20h4.6a2 2 0 002-1.8L17 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconoEscudo = (props) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...props}><path d="M12 3l7 2.5V12c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V5.5L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ── CARRITO LATERAL (sólido, estilo app de compras) ────────
// Drawer global del carrito: lo usa el catálogo (con su propio estado local
// y reglas de umbrales) y el layout del cliente (con el contexto como única
// fuente de verdad), de modo que el asistente de IA pueda abrirlo desde
// CUALQUIER página disparando el evento 'carrito-toggle'.
function CarritoDrawer({ carrito, setCarrito, onClose, onAumentar, descuentosVolumen = [] }) {
  useModalBehavior(onClose);
  const navigate = useNavigate();
  const { sincronizarCarrito, esJuridica, tienePremio } = useCarrito();

  // Bajar cantidad es directo, sin confirmación.
  const disminuir = (id) => {
    setCarrito(prev => prev.map(x => x.id === id ? { ...x, cant: Math.max(1, (x.cant || 1) - 1) } : x));
  };
  const quitar = (id) => setCarrito(prev => prev.filter(x => x.id !== id));

  // Descuento REAL: volumen vs empresa vs premio → ganador global
  const kgTotales = carrito.reduce((s, x) => s + (x.peso_kg ? x.peso_kg * (x.cant || 1) : 0), 0);
  const tier = descuentosVolumen.find(t =>
    kgTotales >= Number(t.kg_min) && (t.kg_max === null || kgTotales <= Number(t.kg_max))
  );
  const volumenPct = tier ? Number(tier.descuento_pct) : 0;
  const fuentes = [
    { fuente: 'volumen', pct: volumenPct },
    { fuente: 'empresa', pct: esJuridica ? leerParametro('descuento_empresa_pct', 20) : 0 },
    { fuente: 'premio', pct: tienePremio && !esJuridica ? 10 : 0 },
  ].filter(f => f.pct > 0).sort((a, b) => b.pct - a.pct);
  const ganador = fuentes[0] || { fuente: null, pct: 0 };

  // Subtotal base (sin descuentos) y per-item "mayor gana" entre promo y volumen/empresa
  const subtotalBase = carrito.reduce((s, x) => s + x.precio * (x.cant || 1), 0);
  const subtotal = carrito.reduce((s, x) => {
    const pct = Math.max(Number(x.promoPct) || 0, ganador.pct);
    return s + Math.round(x.precio * (1 - pct / 100)) * (x.cant || 1);
  }, 0);
  const totalUnidades = carrito.reduce((s, x) => s + (x.cant || 1), 0);
  const descuento = subtotalBase - subtotal;

  const precioItem = (p) => Math.round(p.precio * (1 - Math.max(Number(p.promoPct) || 0, ganador.pct) / 100));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 anim-overlay"
      role="button"
      tabIndex={0}
      aria-label="Cerrar carrito"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") onClose(); }}
    >
      <div
        className="w-full max-w-sm flex flex-col h-full shadow-2xl anim-sheet-right"
        style={{ background: "#0B1810" }}
        role="presentation"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/10" style={{ background: "#0D1D13" }}>
          <div>
            <p className="text-white text-base font-semibold">Mi carrito</p>
            <p className="text-white/40 text-[11px] mt-0.5">{totalUnidades} {totalUnidades === 1 ? "artículo" : "artículos"}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.06] text-white/50 hover:text-white text-lg leading-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C]">✕</button>
        </div>
        {/* envío gratis */}
        {carrito.length > 0 && (
          <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-[#6FA98C]/10 border border-[#6FA98C]/20 text-[11px] text-[#9DC9B4] flex items-center gap-2">
            <IconoEscudo width={14} height={14} /> Tienes envío gratis en tu pedido
          </div>
        )}
        {/* items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {carrito.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#14291B] flex items-center justify-center mb-3">
                <IconoCarrito className="text-white/25" width={24} height={24} />
              </div>
              <p className="text-white/50 text-sm">Tu carrito está vacío.</p>
              <button type="button" onClick={onClose} className="mt-4 text-sm text-[#9DC9B4] hover:text-white transition">
                Explorar el catálogo →
              </button>
            </div>
          )}
          {carrito.slice(0, 6).map(p => (
            <div key={p.id} className="rounded-xl p-3 flex gap-3 items-start bg-[#0F1D13] border border-white/[0.08]">
              <ImagenProducto src={p.img} alt={p.nombre} className="w-16 h-16 rounded-lg object-cover bg-[#14291B] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white leading-snug line-clamp-2">{p.nombre}</p>
                  <button
                    type="button"
                    onClick={() => quitar(p.id)}
                    className="text-white/30 hover:text-[#D85A30] shrink-0 transition p-1"
                    aria-label={`Quitar ${p.nombre} del carrito`}
                    title="Quitar del carrito"
                  >
                    <IconoBasura />
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-1">${precioItem(p).toLocaleString("es-CO")} <span className="text-white/25">/ {p.etiqueta_formato || p.unidad}</span></p>
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center bg-[#0B1810] border border-white/10 rounded-lg">
                    <button type="button" onClick={() => disminuir(p.id)} className="w-8 h-8 text-white/60 hover:text-white text-base flex items-center justify-center rounded-l-lg hover:bg-white/[0.06]">−</button>
                    <span className="text-xs font-semibold w-6 text-center text-white">{p.cant || 1}</span>
                    <button type="button" onClick={() => onAumentar(p)} disabled={(p.cant || 1) >= p.stock} className="w-8 h-8 text-white/60 hover:text-white text-base flex items-center justify-center rounded-r-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                  </div>
                  <p className="text-sm font-semibold text-white">${(precioItem(p) * (p.cant||1)).toLocaleString("es-CO")}</p>
                </div>
              </div>
            </div>
          ))}
          {carrito.length > 6 && (
            <button
              type="button"
              onClick={() => { sincronizarCarrito(carrito); onClose(); navigate('/cliente/carrito'); }}
              className="rounded-xl py-3 px-4 border border-dashed border-[#6FA98C]/40 bg-[#6FA98C]/[0.06] text-[#9DC9B4] text-xs font-semibold hover:bg-[#6FA98C]/[0.12] transition"
            >
              + {carrito.length - 6} producto{carrito.length - 6 === 1 ? "" : "s"} más en el carrito — ver todo →
            </button>
          )}
        </div>
        {/* totales */}
        {carrito.length > 0 && (
          <div className="px-4 pb-5 pt-4 border-t border-white/10" style={{ background: "#0D1D13" }}>
            <div className="flex justify-between text-sm text-white/50 mb-2"><span>Subtotal</span><span>${subtotalBase.toLocaleString("es-CO")}</span></div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-[#9DC9B4] mb-2">
                <span>Descuento aplicado</span>
                <span>−${descuento.toLocaleString("es-CO")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-white/50 mb-3"><span>Envío</span><span className="text-[#9DC9B4]">Gratis</span></div>
            <div className="flex justify-between text-base font-semibold text-white border-t border-white/10 pt-3 mb-4">
              <span>Total</span><span>${subtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { sincronizarCarrito(carrito); onClose(); navigate('/cliente/carrito'); }} className="flex-1 py-3 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">Ver todo el carrito</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CarritoDrawer