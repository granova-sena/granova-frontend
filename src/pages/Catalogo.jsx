import { useState, useEffect, useMemo, useRef, useCallback, Component } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useModalBehavior } from "../hooks/useModalBehavior";
import { useCarrito } from "../context/CarritoContext";
import { API_URL as BASE_API_URL } from "../config";
import RecomendadorModal from "../components/RecomendadorModal";
import CaruselGenerico from "../components/CaruselGenerico";
import ProductoCardMini from "../components/ProductoCardMini";
import { SkeletonCard } from "../components/ui/Skeleton";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import FadeIn from "../components/ui/FadeIn";
import SpotlightSearch from "../components/SpotlightSearch";
import MagneticChip from "../components/MagneticChip";


// ── CONFIG API ────────────────────────────────────────────
const API_URL = `${BASE_API_URL}/productos`;

// ── SISTEMA DE COLOR ───────────────────────────────────────
// fondo: #0a1a0a   superficie sólida: #0F1D13   borde: white/8
// verde (acento): #6FA98C · verde claro: #9DC9B4 · terracota: #D85A30
// Sin transparencias ni blur: paneles sólidos estilo app de compras.

const badgeColor = {
  "Popular":    "bg-[#6FA98C] text-white",
  "Nuevo":      "bg-[#6FA98C]/10 text-[#9DC9B4] ring-1 ring-inset ring-[#6FA98C]/25",
  "Oferta":     "bg-[#D85A30]/10 text-[#D85A30] ring-1 ring-inset ring-[#D85A30]/25",
  "Top ventas": "bg-[#6FA98C] text-white",
};

const stockColor = {
  "En stock":   "bg-[#6FA98C]",
  "Stock bajo": "bg-amber-500",
  "Agotado":    "bg-[#D85A30]",
};

const stockTexto = {
  "En stock":   "text-[#9DC9B4]",
  "Stock bajo": "text-amber-600",
  "Agotado":    "text-[#D85A30]",
};

// ── HELPERS: adaptar datos de Supabase al formato de la UI ─
function calcularStockLabel(stock) {
  if (stock <= 0) return "Agotado";
  if (stock < 10) return "Stock bajo";
  return "En stock";
}

function calcularBadge(producto) {
  if (!producto.fecha_creacion) return "";
  const dias = (Date.now() - new Date(producto.fecha_creacion).getTime()) / (1000 * 60 * 60 * 24);
  if (dias <= 14) return "Nuevo";
  return "";
}

// Umbrales en los que se pide confirmación al aumentar cantidad de un producto:
// primero 10, luego 50, luego 100, y de ahí en adelante cada 100 (200, 300, 400...) sin límite.
const UMBRALES_FIJOS = [10, 50, 100];

function cruzaUmbral(cantActual, total) {
  // Los 3 primeros umbrales son puntuales
  for (const u of UMBRALES_FIJOS) {
    if (cantActual < u && total >= u) return true;
  }
  // De ahí en adelante, cada centena (200, 300, 400...)
  if (cantActual >= 100) {
    const centenaAnterior = Math.floor(cantActual / 100);
    const centenaActual = Math.floor(total / 100);
    if (centenaActual > centenaAnterior) return true;
  }
  return false;
}

function adaptarProducto(p) {
  const stock = Number(p.stock) || 0;
  const esMaquina = (p.categoria_producto || (p.marca && p.modelo) || "") === "maquina";
  const formatos = (p.formatos || []).map(f => ({
    id_formato: f.id_formato,
    etiqueta: f.etiqueta,
    peso_kg: Number(f.peso_kg) || 0,
    precio: Number(f.precio) || 0,
    imagen_url: f.imagen_url || "",
  }));
  // "Desde $X" = el formato más barato disponible (gancho de catálogo)
  const precioDesde = formatos.length > 0
    ? Math.min(...formatos.map(f => f.precio))
    : Number(p.precio) || 0;
  // Promoción real (tabla promociones): llega desde el backend si está activa
  const promo = p.promo
    ? {
        descuento_pct: Number(p.promo.descuento_pct) || 0,
        nombre: p.promo.nombre || "",
        fecha_fin: p.promo.fecha_fin || null,
      }
    : null;
  return {
    id: p.id_producto,
    nombre: p.nombre,
    esMaquina,
    categoria: esMaquina ? "maquina" : "cafe",
    marca: p.marca || "",
    modelo: p.modelo || "",
    garantia: p.garantia_meses ? Number(p.garantia_meses) : null,
    origen: esMaquina
      ? [p.marca, p.modelo].filter(Boolean).join(" · ") || "Máquina de café"
      : [p.tipo_cafe, p.presentacion].filter(Boolean).join(" · ") || "Café Granova",
    precio: Number(p.precio) || 0,
    precioDesde,
    formatos,
    promo,
    promoPct: promo ? promo.descuento_pct : 0,
    promoNombre: promo ? promo.nombre : "",
    promoFin: promo ? promo.fecha_fin : null,
    iva_pct: p.iva_pct == null ? 5 : Number(p.iva_pct),
    stock,
    stockLabel: calcularStockLabel(stock),
    badge: calcularBadge(p),
    img: p.imagen_url || "",
    desc: p.descripcion || "",
    tipo: esMaquina ? (p.marca || "Otra marca") : (p.tipo_cafe || "Sin categoría"),
    unidad: esMaquina ? "unidad" : "kg",
    unidadCorta: esMaquina ? "und" : "kg",
    disponible: p.estado === "activo" && stock > 0,
  };
}

// Quita productos con id repetido o sin id. Un id duplicado en la lista
// hace que React confunda nodos del DOM al reconciliar (causa típica del
// error "Failed to execute 'removeChild' on 'Node'").
function eliminarDuplicados(productos) {
  const vistos = new Set();
  const limpios = [];
  for (const p of productos) {
    if (p.id === undefined || p.id === null) continue;
    if (vistos.has(p.id)) continue;
    vistos.add(p.id);
    limpios.push(p);
  }
  return limpios;
}

// ── FAVORITOS Y VISTOS RECIENTEMENTE (localStorage) ────────
const LS_FAVORITOS = "granova_favoritos";
const LS_VISTOS = "granova_vistos";

function cargarFavoritos() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_FAVORITOS)) || [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function guardarFavoritos(set) {
  try {
    localStorage.setItem(LS_FAVORITOS, JSON.stringify([...set]));
  } catch { /* localStorage no disponible, se ignora */ }
}

function cargarVistos() {
  try {
    return JSON.parse(localStorage.getItem(LS_VISTOS)) || [];
  } catch {
    return [];
  }
}

function guardarVistos(arr) {
  try {
    localStorage.setItem(LS_VISTOS, JSON.stringify(arr));
  } catch { /* localStorage no disponible, se ignora */ }
}

// ── PRODUCTO DEL DÍA ───────────────────────────────────────
// Semilla determinística según la fecha real: mismo producto todo
// el día, cambia automáticamente al día siguiente. Solo café.
function calcularProductoDelDia(productos) {
  if (!productos.length) return null;
  const hoy = new Date();
  const semilla = hoy.getFullYear() * 372 + (hoy.getMonth() + 1) * 31 + hoy.getDate();
  const idx = semilla % productos.length;
  return productos[idx];
}

const DESCUENTO_PRODUCTO_DIA = 0.2; // 20% OFF

// ── ANIMACIÓN: volar hacia el carrito ─────────────────────
// Versión más lenta y llamativa: trayectoria en arco, rotación,
// y una pequeña pulsación de tamaño mientras vuela.
function volarAlCarrito(elementoOrigen) {
  const cartEl = document.getElementById("icono-carrito-header");
  if (!elementoOrigen || !cartEl) return;

  const originRect = elementoOrigen.getBoundingClientRect();
  const cartRect = cartEl.getBoundingClientRect();

  const bola = document.createElement("div");
  bola.style.position = "fixed";
  bola.style.zIndex = "9999";
  bola.style.left = `${originRect.left + originRect.width / 2 - 10}px`;
  bola.style.top = `${originRect.top + originRect.height / 2 - 10}px`;
  bola.style.width = "20px";
  bola.style.height = "20px";
  bola.style.borderRadius = "50%";
  bola.style.background = "radial-gradient(circle at 35% 35%, #9DC9B4, #6FA98C 70%)";
  bola.style.boxShadow = "0 0 18px 5px rgba(111,169,140,0.75)";
  bola.style.pointerEvents = "none";
  bola.style.willChange = "transform, opacity";
  document.body.appendChild(bola);

  const dx = (cartRect.left + cartRect.width / 2) - (originRect.left + originRect.width / 2);
  const dy = (cartRect.top + cartRect.height / 2) - (originRect.top + originRect.height / 2);

  // Altura del arco: sube antes de caer hacia el carrito
  const arcoAltura = Math.min(140, Math.abs(dy) * 0.6 + 60);

  const duracion = 950; // ms — antes eran 600ms, ahora se nota mucho más el vuelo
  const inicio = performance.now();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function frame(ahora) {
    const t = Math.min(1, (ahora - inicio) / duracion);
    const e = easeInOutCubic(t);

    // Trayectoria: lineal en x/y, con un salto parabólico hacia arriba (arco)
    const x = dx * e;
    const y = dy * e - Math.sin(Math.PI * e) * arcoAltura;

    // Escala: crece al despegar, se achica al llegar
    const escala = Math.max(0.25, 1 + 0.6 * Math.sin(Math.PI * e) - 0.4 * e);
    const rotacion = 360 * e;

    bola.style.transform = `translate(${x}px, ${y}px) scale(${escala}) rotate(${rotacion}deg)`;
    bola.style.opacity = `${1 - 0.5 * e}`;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      bola.remove();
    }
  }

  requestAnimationFrame(frame);
}

// ── ÍCONOS ─────────────────────────────────────────────────
const IconoCarrito = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}><path d="M6 8h12l-1.2 10.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconoBasura = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}><path d="M5 7h14M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7m-8 0l.7 11.2A2 2 0 009.7 20h4.6a2 2 0 002-1.8L17 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconoBuscar = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconoCorazon = ({ lleno, ...props }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={lleno ? "currentColor" : "none"} {...props}>
    <path d="M12 21s-7.5-4.6-10-9.1C0.3 8.7 1.7 5 5.2 4.2c2-.4 4 .5 5 2.2 1-1.7 3-2.6 5-2.2 3.5.8 4.9 4.5 3.2 7.7C19.5 16.4 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
const IconoTaza = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}><path d="M4 9h13v6a4 4 0 01-4 4H8a4 4 0 01-4-4V9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M17 10h1.5a2.5 2.5 0 010 5H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M8 3.5c0 1-1 1.5-1 2.5M12 3.5c0 1-1 1.5-1 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconoMaquina = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}><rect x="4" y="4" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M4 11h16" stroke="currentColor" strokeWidth="1.6" /><path d="M9 19h6M12 15v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M17 8h2.5a1 1 0 011 1v3a1 1 0 01-1 1H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconoEscudo = (props) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...props}><path d="M12 3l7 2.5V12c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V5.5L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ── IMAGEN SEGURA ──────────────────────────────────────────
// Reemplaza <img src={...}>: si no hay URL, no renderiza <img> (evita el
// warning de src="" y la descarga completa de la página). Si la URL falla
// al cargar, oculta la imagen igual que antes.
function ImagenProducto({ src, alt, className }) {
  const [fallo, setFallo] = useState(false);
  if (!src || fallo) {
    return <div className={`${className} bg-[#14291B] flex items-center justify-center`}>
      <IconoCarrito className="text-white/20" width={20} height={20} />
    </div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setFallo(true)} />;
}

// ── ERROR BOUNDARY ─────────────────────────────────────────
// Si algo dentro del catálogo truena, esto evita la pantalla en blanco y
// muestra un mensaje con botón para reintentar, en vez de romper toda la app.
class CatalogoErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Error en Catálogo:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white" style={{ background: "#0a1a0a" }}>
          <p className="text-lg font-semibold">Algo salió mal cargando el catálogo</p>
          <p className="text-sm text-white/50 max-w-sm text-center">{this.state.error.message || "Error desconocido"}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="h-10 px-5 rounded-xl bg-[#6FA98C] text-white text-sm font-medium hover:bg-[#4F8A70] transition"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── CARRITO LATERAL (sólido, estilo app de compras) ────────
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
    { fuente: 'empresa', pct: esJuridica ? 10 : 0 },
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

  const irACotizacion = () => {
    sincronizarCarrito(carrito);
    onClose();
    navigate('/cliente/cotizacion');
  };

  const irAPagar = () => {
    sincronizarCarrito(carrito);
    onClose();
    navigate('/cliente/configurar-pedido');
  };

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
          {carrito.map(p => (
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
        </div>
        {/* totales */}
        {carrito.length > 0 && (
          <div className="px-4 pb-5 pt-4 border-t border-white/10" style={{ background: "#0D1D13" }}>
            <div className="flex justify-between text-sm text-white/50 mb-2"><span>Subtotal</span><span>${subtotalBase.toLocaleString("es-CO")}</span></div>
            {ganador.pct > 0 && (
              <div className="flex justify-between text-sm text-[#9DC9B4] mb-2">
                <span>
                  {ganador.fuente === 'volumen' ? '📦 Descuento por volumen' : ganador.fuente === 'empresa' ? '🏢 Descuento empresa' : '🎉 Descuento'} {ganador.pct}%
                </span>
                <span>−${descuento.toLocaleString("es-CO")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-white/50 mb-3"><span>Envío</span><span className="text-[#9DC9B4]">Gratis</span></div>
            <div className="flex justify-between text-base font-semibold text-white border-t border-white/10 pt-3 mb-4">
              <span>Total</span><span>${subtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={irACotizacion} className="flex-1 py-3 rounded-xl text-white/70 text-sm border border-white/15 hover:bg-white/[0.06] transition">Cotización</button>
              <button type="button" onClick={irAPagar} className="flex-[1.4] py-3 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">Ir a pagar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Icono visual por tipo de formato (🛍️ bolsita, ☕ paquete, 📦 bulto)
function iconoFormato(pesoKg) {
  if (pesoKg < 1) return "🛍️";
  if (pesoKg < 10) return "☕";
  return "📦";
}

// ── DETALLE PRODUCTO ──────────────────────────────────────
function DetalleProducto({ p, onClose, onAgregar, esFavorito, onToggleFavorito, descuentosVolumen = [], esJuridica = false }) {
  const [formatoSel, setFormatoSel] = useState(() => (p.formatos?.length > 0 ? p.formatos[0].id_formato : null));
  const [cant, setCant] = useState(1);
  useModalBehavior(onClose);

  const tieneFormatos = p.formatos && p.formatos.length > 0;
  const formato = tieneFormatos ? p.formatos.find(f => f.id_formato === formatoSel) : null;

  // Precio unitario: precio del formato elegido, o el precio del producto (máquinas/legacy)
  const precioUnit = tieneFormatos ? Number(formato?.precio || 0) : p.precio;

  // Escalón por volumen: solo café, usando los kg totales (peso del formato × cantidad)
  const kgPorUnidad = tieneFormatos ? Number(formato?.peso_kg || 0) : null;
  const kgTotales = kgPorUnidad !== null ? kgPorUnidad * cant : null;
  const tierActivo = kgTotales !== null
    ? descuentosVolumen.find(t => kgTotales >= Number(t.kg_min) && (t.kg_max === null || kgTotales <= Number(t.kg_max)))
    : null;

  // EL MAYOR GANA (igual que el backend): volumen vs empresa 10% vs promoción.
  // El precio mostrado es un estimado — el cobro real lo hace el servidor.
  const pctVolumen = tierActivo ? Number(tierActivo.descuento_pct) : 0;
  const pctEmpresa = esJuridica ? 10 : 0;
  const pctPromo = p.promoPct || 0;
  const pctMostrado = Math.max(pctVolumen, pctEmpresa, pctPromo);
  const promoGana = pctPromo > 0 && pctPromo >= pctMostrado;
  const precioFinal = pctMostrado > 0 ? Math.round(precioUnit * (1 - pctMostrado / 100)) : precioUnit;
  const etiquetaCant = tieneFormatos ? (formato?.etiqueta || "formato") : p.esMaquina ? "unidades" : "kg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 anim-overlay"
      role="button"
      tabIndex={0}
      aria-label="Cerrar detalle de producto"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") onClose(); }}
    >
      <div
        className="rounded-2xl w-full max-w-3xl flex flex-col sm:flex-row overflow-hidden max-h-[90vh] shadow-2xl anim-pop"
        style={{ background: "#0F1D13", border: "1px solid rgba(255,255,255,0.1)" }}
        role="presentation"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {/* imagen */}
        <div className="sm:w-1/2 h-56 sm:h-auto bg-[#14291B] relative">
          <ImagenProducto src={formato?.imagen_url || p.img} alt={p.nombre} className="w-full h-full object-cover" />
          <button type="button" onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white/80 shadow hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C]">✕</button>
          <button
            type="button"
            onClick={() => onToggleFavorito(p.id)}
            className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow transition ${esFavorito ? "bg-[#D85A30] text-white" : "bg-black/40 text-white/80 hover:text-white"}`}
            aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <IconoCorazon lleno={esFavorito} />
          </button>
        </div>
        {/* info */}
        <div className="sm:w-1/2 p-6 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-xs text-white/40 mb-1">{p.origen}</p>
            <h2 className="text-xl font-semibold text-white">{p.nombre}</h2>
            <p className="text-sm text-white/50 mt-2 leading-relaxed">{p.desc}</p>
            {p.esMaquina && p.garantia && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/20 rounded-full px-3 py-1.5">
                <IconoEscudo /> Garantía de {p.garantia} meses
              </p>
            )}
          </div>

          {/* Selector de formato (frente A): gramos, kilos, bulto */}
          {tieneFormatos && (
            <div>
              <p className="text-sm text-white/50 mb-2">Elige tu formato</p>
              <div className="flex flex-col gap-2">
                {p.formatos.map(f => {
                  const activo = f.id_formato === formatoSel;
                  const precioFormatoEmpresa = esJuridica ? Math.round(Number(f.precio) * 0.90) : null;
                  return (
                    <button
                      type="button"
                      key={f.id_formato}
                      onClick={() => setFormatoSel(f.id_formato)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${activo ? "border-[#6FA98C] bg-[#6FA98C]/[0.08]" : "border-white/10 hover:border-[#6FA98C]/50"}`}
                    >
                      <span className="text-white/80 flex items-center gap-2">
                        <span>{iconoFormato(Number(f.peso_kg))}</span> {f.etiqueta}
                      </span>
                      {esJuridica ? (
                        <span className="flex items-center gap-2">
                          <span className="text-white/40 line-through text-xs">${Number(f.precio).toLocaleString("es-CO")}</span>
                          <span className={`font-semibold ${activo ? "text-[#9DC9B4]" : "text-[#9DC9B4]"}`}>${precioFormatoEmpresa.toLocaleString("es-CO")}</span>
                        </span>
                      ) : (
                        <span className={`font-semibold ${activo ? "text-[#9DC9B4]" : "text-white"}`}>${Number(f.precio).toLocaleString("es-CO")}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            {promoGana && (
              <p className="text-xs text-[#D85A30] bg-[#D85A30]/10 border border-[#D85A30]/25 rounded-full px-3 py-1.5 inline-block mb-2">
                🏷️ {p.promoNombre || "Oferta"} · -{pctPromo}%{p.promoFin ? ` · hasta el ${new Date(p.promoFin).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}` : ""}
              </p>
            )}
            {esJuridica && !p.esMaquina && !promoGana && (
              <p className="text-xs text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/25 rounded-full px-3 py-1.5 inline-block mb-2">
                🏢 Tu precio de empresa incluye el 10% de descuento
              </p>
            )}
            <p className="text-2xl font-semibold text-white">
              {pctMostrado > 0 ? (
                <>
                  <span className="text-white/40 line-through text-base mr-2">${precioUnit.toLocaleString("es-CO")}</span>
                  ${precioFinal.toLocaleString("es-CO")}
                </>
              ) : (
                <>${precioFinal.toLocaleString("es-CO")}</>
              )}
            </p>
            <p className="text-xs text-white/40">
              {tieneFormatos
                ? `por ${etiquetaCant.toLowerCase()} · IVA incluido`
                : p.esMaquina ? "por unidad · IVA incluido" : "por kilogramo · IVA incluido"}
            </p>
          </div>

          {/* Tabla de precios por volumen (frente B) — escalones reales del servidor */}
          {!p.esMaquina && kgTotales !== null && descuentosVolumen.length > 0 && (
            <div>
              <p className="text-sm text-white/50 mb-2">Precios por volumen</p>
              <div className={`grid gap-2 ${descuentosVolumen.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {descuentosVolumen.map(t => {
                  const activo = tierActivo?.kg_min === t.kg_min && tierActivo?.kg_max === t.kg_max;
                  const label = t.kg_max === null ? `+${t.kg_min} kg` : `${t.kg_min}–${t.kg_max} kg`;
                  return (
                    <div key={`${t.kg_min}-${t.kg_max}`} className={`rounded-xl p-2 text-center border ${activo ? "border-[#6FA98C] bg-[#6FA98C]/[0.08]" : "border-white/10"}`}>
                      <p className="text-xs text-white/40">{label}</p>
                      <p className="text-sm font-semibold text-[#9DC9B4]">-{Number(t.descuento_pct)}%</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">
                {tierActivo
                  ? `✓ Llevas ${kgTotales} kg: aplica -${Number(tierActivo.descuento_pct)}%`
                  : `Llevas ${kgTotales} kg (sin escalón de descuento aún)`}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-white/50 mb-2">Cantidad</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCant(c => Math.max(1, c-1))} className="w-10 h-10 rounded-xl bg-[#14291B] border border-white/10 text-white/70 text-xl flex items-center justify-center hover:bg-[#1B3624]">−</button>
              <span className="text-lg font-semibold w-8 text-center text-white">{cant}</span>
              <button type="button" onClick={() => setCant(c => Math.min(p.stock, c+1))} disabled={cant >= p.stock} className="w-10 h-10 rounded-xl bg-[#14291B] border border-white/10 text-white/70 text-xl flex items-center justify-center hover:bg-[#1B3624] disabled:opacity-30 disabled:cursor-not-allowed">+</button>
              <span className="text-white/40 text-sm">{etiquetaCant}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              onAgregar({
                ...p,
                cant,
                id_formato: formato ? formato.id_formato : null,
                etiqueta_formato: formato ? formato.etiqueta : "",
                peso_kg: formato ? formato.peso_kg : null,
                precio: precioUnit,
              }, e.currentTarget);
              onClose();
            }}
            className="w-full h-12 rounded-xl bg-[#6FA98C] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#4F8A70] active:scale-95 transition duration-150">
            <IconoCarrito /> Agregar al carrito
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${stockColor[p.stockLabel]}`}></span>
            <span className="text-white/50">{p.stockLabel} · {p.stock} {p.esMaquina ? "unidades" : "kg"} disponibles</span>
          </div>
          {p.stockLabel === "Stock bajo" && p.disponible && (
            <p className="text-xs text-amber-500 font-medium animate-pulse">
              ¡Solo {p.stock} {p.esMaquina ? "unidades" : "kg"} disponibles, se está agotando!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODAL CONFIRMAR CANTIDAD ──────────────────────────────
function ModalConfirmarCantidad({ data, onCancelar, onAceptar }) {
  useModalBehavior(onCancelar);
  if (!data) return null;
  const { tipo, producto, disponibleRestante, total } = data;
  const unidad = producto.unidad || "kg";

  let titulo, mensaje, mostrarAceptar = true;
  if (tipo === "sinStock") {
    titulo = "Ya tienes todo el stock en tu carrito";
    mensaje = `No quedan más unidades disponibles de "${producto.nombre}" para agregar.`;
    mostrarAceptar = false;
  } else if (tipo === "limitado") {
    titulo = "Agregaste más de lo disponible";
    mensaje = `Solo quedan ${disponibleRestante} ${unidad} disponibles de "${producto.nombre}". ¿Deseas agregar los ${disponibleRestante} ${unidad} restantes a tu carrito?`;
  } else {
    titulo = "Vas a superar otra decena";
    mensaje = `Vas a tener ${total} ${unidad} de "${producto.nombre}" en tu carrito. ¿Deseas confirmar esta cantidad?`;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 anim-overlay"
      role="button"
      tabIndex={0}
      aria-label="Cancelar"
      onClick={onCancelar}
      onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") onCancelar(); }}
    >
      <div
        className="rounded-2xl w-full max-w-sm p-6 shadow-2xl anim-pop"
        style={{ background: "#0F1D13", border: "1px solid rgba(255,255,255,0.12)" }}
        role="presentation"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <p className="text-white font-semibold text-base mb-2">{titulo}</p>
        <p className="text-white/60 text-sm mb-6">{mensaje}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancelar} className="flex-1 py-2.5 rounded-xl text-sm text-white/60 bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition">Cancelar</button>
          {mostrarAceptar && (
            <button type="button" onClick={onAceptar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition">Aceptar</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BANNER: PRODUCTO DEL DÍA ──────────────────────────────
function ProductoDelDiaBanner({ producto, onAgregar, onVerDetalle }) {
  if (!producto || !producto.disponible) return null;
  const precioDesc = Math.round(producto.precio * (1 - DESCUENTO_PRODUCTO_DIA));

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col sm:flex-row" style={{ background: "#0F1D13", border: "1px solid rgba(111,169,140,0.35)" }}>
      <div
        className="sm:w-48 h-40 sm:h-auto bg-[#14291B] cursor-pointer shrink-0"
        role="button"
        tabIndex={0}
        aria-label={`Ver detalle de ${producto.nombre}`}
        onClick={() => onVerDetalle(producto)}
        onKeyDown={(e) => { if (e.key === "Enter") onVerDetalle(producto); }}
      >
        <ImagenProducto src={producto.img} alt={producto.nombre} className="w-full h-full object-cover" />
      </div>
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
        <div className="flex-1">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#6FA98C] text-white">☕ Producto del día · 20% OFF</span>
          <p
            className="text-white font-semibold mt-2 cursor-pointer hover:text-[#9DC9B4] transition"
            role="button"
            tabIndex={0}
            onClick={() => onVerDetalle(producto)}
            onKeyDown={(e) => { if (e.key === "Enter") onVerDetalle(producto); }}
          >{producto.nombre}</p>
          <p className="text-xs text-white/40">{producto.origen}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-lg font-semibold text-white">${precioDesc.toLocaleString("es-CO")}</p>
            <p className="text-sm text-white/40 line-through">${producto.precio.toLocaleString("es-CO")}</p>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Oferta válida solo hoy</p>
        </div>
        <button
          type="button"
          onClick={(e) => onAgregar({ ...producto, precio: precioDesc, cant: 1 }, e.currentTarget)}
          className="h-11 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] active:scale-95 transition duration-150 shrink-0 flex items-center justify-center gap-2"
        >
          <IconoCarrito width={14} height={14} /> Agregar con descuento
        </button>
      </div>
    </div>
  );
}

// ── CALCULADORA RÁPIDA (solo café) ────────────────────────
// Aislada en su propio componente para que su estado (kgCalc) no
// interfiera con el render de ProductoCard ni de la lista completa.
function CalculadoraRapida({ precio, stock }) {
  const [kgCalc, setKgCalc] = useState(1);

  return (
    <div className="flex items-center gap-2 text-xs bg-[#0B1810] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
      <span className="text-white/40">Calcular:</span>
      <input
        type="number"
        min={1}
        max={Math.min(stock || 1, 10000)}
        value={kgCalc}
        onClick={e => e.stopPropagation()}
        onChange={e => {
          e.stopPropagation();
          const val = Number(e.target.value);
          setKgCalc(Number.isFinite(val) && val > 0 ? Math.min(val, 10000) : 1);
        }}
        className="w-16 bg-transparent border border-white/15 rounded px-1 py-0.5 text-white text-center outline-none focus:border-[#6FA98C]"
      />
      <span className="text-white/40">kg =</span>
      <span className="text-white font-semibold ml-auto break-all">${(kgCalc * precio).toLocaleString("es-CO")}</span>
    </div>
  );
}

function ProductoCard({ p, onAgregar, onVerDetalle, cantidadEnCarrito = 0, esFavorito, onToggleFavorito, seleccionadoComparar, onToggleComparar, esJuridica = false }) {
  const [feedback, setFeedback] = useState(false);
  const cardRef = useRef(null);

  // Parallax 3D mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleAgregar = (e) => {
    if (!p.disponible) return;
    onAgregar({ ...p, cant: 1 }, e.currentTarget);
    setFeedback(true);
    setTimeout(() => setFeedback(false), 900);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(111,169,140,0.15)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-2xl overflow-hidden flex flex-col ${seleccionadoComparar ? "border border-[#6FA98C]/70 shadow-[0_0_20px_rgba(111,169,140,0.15)]" : "border border-white/[0.08]"} bg-[#0F1D13]`}
    >
      <div
        className="relative aspect-[4/3] bg-[#14291B] cursor-pointer overflow-hidden group/img"
        role="button"
        tabIndex={0}
        aria-label={`Ver detalle de ${p.nombre}`}
        onClick={() => onVerDetalle(p)}
        onKeyDown={(e) => { if (e.key === "Enter") onVerDetalle(p); }}
      >
        <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
        {p.promoPct > 0 ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#D85A30] text-white shadow-lg shadow-[#D85A30]/25"
          >
            Oferta -{p.promoPct}%
          </motion.span>
        ) : p.badge ? (
          <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeColor[p.badge] || "bg-white/15 text-white"}`}>
            {p.badge}
          </span>
        ) : null}
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorito(p.id); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.8 }}
          animate={esFavorito ? { scale: [1, 1.3, 1], backgroundColor: "#D85A30" } : { scale: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          title="Favorito"
        >
          <IconoCorazon lleno={esFavorito} />
        </motion.button>
        <AnimatePresence>
          {cantidadEnCarrito > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute bottom-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#6FA98C] text-white shadow-lg shadow-[#6FA98C]/30"
            >
              En el carrito · {cantidadEnCarrito}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-white/40">{p.origen}</p>
          <p
            className="text-sm font-medium text-white mt-0.5 leading-snug cursor-pointer hover:text-[#9DC9B4] transition-colors duration-200"
            role="button"
            tabIndex={0}
            onClick={() => onVerDetalle(p)}
            onKeyDown={(e) => { if (e.key === "Enter") onVerDetalle(p); }}
          >{p.nombre}</p>
        </div>
        <div className="flex items-end justify-between">
          <div>
            {(() => {
              const pctMostrar = Math.max(p.promoPct || 0, esJuridica ? 10 : 0);
              const promoGana = (p.promoPct || 0) >= (esJuridica ? 10 : 0) && p.promoPct > 0;
              const base = p.formatos.length > 0 ? p.precioDesde : p.precio;
              const precioCard = pctMostrar > 0 ? Math.round(base * (1 - pctMostrar / 100)) : base;
              const leyendaFormatos = p.formatos.map(f => f.etiqueta.replace(/^Paquete |^Bolsa /, "")).join(" · ");
              return (
                <>
                  {pctMostrar > 0 ? (
                    <>
                      <p className="text-base font-semibold text-white flex items-center gap-2">
                        <span className="text-white/35 line-through text-xs">${base.toLocaleString("es-CO")}</span>
                        <motion.span
                          className={promoGana ? "text-[#D85A30]" : "text-[#9DC9B4]"}
                          whileHover={{ textShadow: promoGana ? "0 0 8px rgba(216,90,48,0.5)" : "0 0 8px rgba(157,201,180,0.5)" }}
                        >
                          {p.formatos.length > 0 ? `Desde $${precioCard.toLocaleString("es-CO")}` : `$${precioCard.toLocaleString("es-CO")}`}
                        </motion.span>
                      </p>
                      <p className="text-[10px] text-white/40">
                        {promoGana
                          ? `🏷️ Oferta -${pctMostrar}% · ${p.formatos.length > 0 ? leyendaFormatos : `por ${p.unidad}`}`
                          : `🏢 Precio empresa · ${p.formatos.length > 0 ? leyendaFormatos : `por ${p.unidad}`}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-white">
                        {p.formatos.length > 0 ? `Desde $${p.precioDesde.toLocaleString("es-CO")}` : `$${p.precio.toLocaleString("es-CO")}`}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {p.formatos.length > 0 ? leyendaFormatos : `por ${p.unidad}`}
                      </p>
                    </>
                  )}
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stockColor[p.stockLabel]}`}></span>
            <span className={`text-[11px] ${stockTexto[p.stockLabel]}`}>{p.stockLabel}</span>
          </div>
        </div>

        {p.stockLabel === "Stock bajo" && p.disponible && (
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[11px] text-amber-500 font-medium"
          >
            ¡Solo {p.stock} {p.unidad === "kg" ? "kg" : "unidades"} disponibles!
          </motion.p>
        )}

        {p.esMaquina && p.garantia && (
          <p className="inline-flex items-center gap-1.5 self-start text-[11px] text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/20 rounded-full px-2.5 py-1">
            <IconoEscudo /> Garantía {p.garantia} meses
          </p>
        )}

        {!p.esMaquina && <CalculadoraRapida precio={p.precio} stock={p.stock} />}
        <label className="flex items-center gap-1.5 text-[11px] text-[#9DC9B4] cursor-pointer select-none">
          <input type="checkbox" checked={seleccionadoComparar} onChange={onToggleComparar} className="w-3.5 h-3.5 accent-[#6FA98C]" />
          <span>Comparar</span>
        </label>
        <motion.button
          type="button"
          onClick={handleAgregar}
          disabled={!p.disponible}
          whileTap={{ scale: 0.95 }}
          animate={feedback ? { backgroundColor: "#4F8A70" } : { backgroundColor: "#6FA98C" }}
          className={`mt-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1D13]`}
        >
          <AnimatePresence mode="wait">
            {feedback ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                ✓ Agregado
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-1.5"
              >
                <IconoCarrito width={14} height={14} /> Agregar
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── PÁGINA PRINCIPAL (envuelta en Error Boundary abajo) ────
const SECCIONES = [
  { id: "cafe", label: "Café", icono: IconoTaza },
  { id: "maquinas", label: "Máquinas", icono: IconoMaquina },
  { id: "favoritos", label: "Favoritos", icono: IconoCorazon },
];

function CatalogoInterno() {
  const navigate = useNavigate()
  const { cliente, sincronizarCarrito, productos: productosContexto } = useCarrito()
  const esJuridica = cliente?.tipo_persona === 'juridica'
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionParam = searchParams.get("seccion");
  // La URL es la única fuente de verdad de la pestaña activa:
  // ?seccion=maquinas / ?seccion=favoritos (por defecto, café).
  const seccion = ["cafe", "maquinas", "favoritos"].includes(seccionParam) ? seccionParam : "cafe";
  const cambiarSeccion = (id) => setSearchParams(id === "cafe" ? {} : { seccion: id }, { replace: true });

  useEffect(() => {
    setBusqueda("");
    setFiltros({ tipo: "", disp: "", marca: "" });
  }, [seccion]);

  const [productos, setProductos] = useState([]);
  const [descuentosVolumen, setDescuentosVolumen] = useState([]);
  const [seleccionadosComparar, setSeleccionadosComparar] = useState([])

  const alternarComparar = (id) => {
    setSeleccionadosComparar(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarRecomendador, setMostrarRecomendador] = useState(false);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({ tipo: "", disp: "", marca: "" });
  const [carritoOpen, setCarritoOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [carrito, setCarrito] = useState(() => {
    // Semilla desde el contexto (persistido en localStorage) para no borrar el carrito existente
    return (productosContexto || []).map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      cant: p.cantidad || 1,
      img: p.img || '',
      unidad: p.unidad || 'kg',
      origen: p.presentacion || '',
      id_formato: p.id_formato ?? null,
      peso_kg: p.peso_kg ?? null,
      etiqueta_formato: p.etiqueta_formato || '',
      promoPct: p.promo_pct ?? null,
      iva_pct: p.iva_pct == null ? 5 : Number(p.iva_pct),
    }));
  });
  // Sincronizar carrito local con el contexto (skip mount para no sobreescribir)
  const mountRef = useRef(true);
  useEffect(() => {
    if (mountRef.current) { mountRef.current = false; return; }
    sincronizarCarrito(carrito);
  }, [carrito]);
  const [tabDestacados, setTabDestacados] = useState("masVendidos");
  const [tabCarousel, setTabCarousel] = useState("ofertas");
  const [confirmPendiente, setConfirmPendiente] = useState(null);

  // ── Nuevas funcionalidades ──
  const [favoritos, setFavoritos] = useState(() => cargarFavoritos());
  const [vistos, setVistos] = useState(() => cargarVistos());

  const [spotlightOpen, setSpotlightOpen] = useState(false);

  useEffect(() => {
    function manejarSpotlight(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSpotlightOpen(prev => !prev);
      }
    }
    document.addEventListener("keydown", manejarSpotlight);
    return () => document.removeEventListener("keydown", manejarSpotlight);
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function cargarProductos() {
      try {
        setCargando(true);
        setError(null);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.mensaje || "Error del servidor");
        if (!cancelado) {
          setProductos(eliminarDuplicados(json.data.map(adaptarProducto)));
          setDescuentosVolumen(json.descuentosVolumen || []);
        }
      } catch (err) {
        if (!cancelado) setError(err.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarProductos();
    return () => { cancelado = true; };
  }, []);

  // Agrega un producto al carrito.
  // - Si te pasas del stock disponible: abre modal (Aceptar agrega el resto / Cancelar no hace nada).
  // - Si al agregar CRUZAS UN UMBRAL (10, 50 o 100 unidades): abre modal de confirmación
  //   (Aceptar confirma la cantidad, Cancelar simplemente cierra el modal sin tocar el carrito).
  // - En cualquier otro caso (no cruzas un umbral): se agrega directo, sin preguntar nada.
  const agregar = (p, elementoOrigen) => {
    const existente = carrito.find(x => x.id === p.id);
    const cantActual = existente?.cant || 0;
    const cantPedida = p.cant || 1;
    const total = cantActual + cantPedida;

    // Ya se agregó todo el stock disponible
    if (cantActual >= p.stock) {
      setConfirmPendiente({ tipo: "sinStock", producto: p });
      return;
    }

    // Se pidió más de lo que queda disponible
    if (total > p.stock) {
      const disponibleRestante = p.stock - cantActual;
      setConfirmPendiente({ tipo: "limitado", producto: p, disponibleRestante, cantActual });
      return;
    }

    // Solo se pregunta al cruzar 10, 50 o 100, no en cada clic
    if (cruzaUmbral(cantActual, total)) {
      setConfirmPendiente({ tipo: "masDeUno", producto: p, total, cantActual, elementoOrigen });
      return;
    }

    // No cruza umbral: se agrega directo
    if (elementoOrigen) volarAlCarrito(elementoOrigen);
    setCarrito(prev => {
      const existe = prev.find(x => x.id === p.id);
      if (existe) return prev.map(x => x.id === p.id ? { ...x, cant: (x.cant || 1) + cantPedida } : x);
      return [...prev, { ...p, cant: cantPedida }];
    });
  };

  // Sube en 1 la cantidad de un producto YA en el carrito (botón "+" del drawer).
  // Aplica la misma regla de umbrales (10, 50, 100) que agregar().
  const aumentarEnCarrito = (item) => {
    const cantActual = item.cant || 1;
    const nuevaCant = cantActual + 1;
    if (nuevaCant > item.stock) return;

    if (cruzaUmbral(cantActual, nuevaCant)) {
      setConfirmPendiente({ tipo: "masDeUno", producto: item, total: nuevaCant, cantActual });
      return;
    }

    setCarrito(prev => prev.map(x => x.id === item.id ? { ...x, cant: nuevaCant } : x));
  };

  // Cancelar NUNCA borra lo que ya había en el carrito: como el producto
  // todavía no se había agregado (se esperaba confirmación), solo cerramos el modal.
  const cancelarConfirm = () => {
    setConfirmPendiente(null);
  };

  const aceptarConfirm = () => {
    const { tipo, producto, disponibleRestante, cantActual, total, elementoOrigen } = confirmPendiente;
    const nuevoTotal = tipo === "limitado" ? cantActual + disponibleRestante : total;

    setCarrito(prev => {
      const existente = prev.find(x => x.id === producto.id);
      if (existente) return prev.map(x => x.id === producto.id ? { ...x, cant: nuevoTotal } : x);
      return [...prev, { ...producto, cant: nuevoTotal }];
    });

    if (elementoOrigen) volarAlCarrito(elementoOrigen);
    setConfirmPendiente(null);
  };

  // Favoritos
  const toggleFavorito = (id) => {
    setFavoritos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
      guardarFavoritos(nuevo);
      return nuevo;
    });
  };

  // Ver detalle + registrar en "vistos recientemente" (máximo 5, sin duplicados)
  const verDetalle = (p) => {
    setDetalle(p);
    setVistos(prev => {
      const nuevo = [p.id, ...prev.filter(id => id !== p.id)].slice(0, 5);
      guardarVistos(nuevo);
      return nuevo;
    });
  };

  // ── Secciones derivadas ──
  const cafeProductos = useMemo(() => productos.filter(p => p.categoria === "cafe"), [productos]);
  const maquinasProductos = useMemo(() => productos.filter(p => p.categoria === "maquina"), [productos]);

  const productosSeccion = seccion === "favoritos" ? productos : seccion === "maquinas" ? maquinasProductos : cafeProductos;

  const productoDelDia = useMemo(() => calcularProductoDelDia(cafeProductos), [cafeProductos]);

  const tiposDisponibles = [...new Set(cafeProductos.map(p => p.tipo))].filter(Boolean).sort();
  const marcasDisponibles = [...new Set(maquinasProductos.map(p => p.marca).filter(Boolean))].sort();

  const filtrados = productosSeccion.filter(p => {
    const matchBus  = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = !filtros.tipo || p.tipo === filtros.tipo;
    const matchMarca = !filtros.marca || p.marca === filtros.marca;
    const matchDisp = !filtros.disp || p.stockLabel === filtros.disp;
    const matchFav  = seccion !== "favoritos" || favoritos.has(p.id);
    return matchBus && matchTipo && matchMarca && matchDisp && matchFav;
  });

  const productosVistos = vistos.map(id => productos.find(p => p.id === id)).filter(Boolean);

  const masVendidos = [...cafeProductos].sort((a, b) => b.stock - a.stock).slice(0, 4);
  const promociones = cafeProductos.filter(p => p.badge === "Oferta");
  const totalCarrito = carrito.reduce((s, x) => s + (x.cant || 1), 0);

  // ── Carruseles ──
  const carouselPromos = cafeProductos.filter(p => p.promoPct > 0).slice(0, 10);
  const carouselPopulares = [...cafeProductos].sort((a, b) => b.stock - a.stock).slice(0, 8);
  const carouselNuevos = cafeProductos.filter(p => {
    if (!p.badge || p.badge !== "Nuevo") return false;
    return true;
  }).slice(0, 8);

  const numFavoritos = productos.filter(p => favoritos.has(p.id)).length;
  const favoritosDisponibles = productos.filter(p => favoritos.has(p.id) && p.disponible).length;

  // ── Textos del hero según sección ──
  const heroTexto = {
    cafe: {
      kicker: "Catálogo",
      titulo: "El mejor café, directo del productor",
      subtitulo: "Lotes de origen colombiano, tostados en pequeñas cantidades y enviados sin intermediarios.",
      stats: [[String(cafeProductos.length), "Productos"], [String(tiposDisponibles.length), "Variedades"], ["100%", "Colombiano"]],
    },
    maquinas: {
      kicker: "Catálogo · Equipos",
      titulo: "Cafeteras para tu café perfecto",
      subtitulo: "Máquinas de las mejores marcas, con garantía oficial y envío a todo el país.",
      stats: [[String(maquinasProductos.length), "Máquinas"], [String(marcasDisponibles.length), "Marcas"], ["12", "Meses de garantía"]],
    },
    favoritos: {
      kicker: "Tus favoritos",
      titulo: "Tu lista de favoritos",
      subtitulo: "Los productos que guardaste con ♥ para encontrarlos más rápido.",
      stats: [[String(numFavoritos), "Guardados"], [String(favoritosDisponibles), "Disponibles"], ["1 clic", "Para agregar"]],
    },
  }[seccion];

  const chips = seccion === "maquinas"
    ? [{ val: "", label: "Todas" }, ...marcasDisponibles.map(m => ({ val: m, label: m }))]
    : [{ val: "", label: "Todos" }, ...tiposDisponibles.map(t => ({ val: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))];

  const chipActivo = seccion === "maquinas" ? filtros.marca : filtros.tipo;
  const setChip = (val) => seccion === "maquinas" ? setFiltros(f => ({ ...f, marca: val })) : setFiltros(f => ({ ...f, tipo: val }));

  return (
    <div className="text-white min-h-screen" style={{ background: "#0a1a0a" }} translate="no">

      {/* HERO */}
      <div className="px-4 sm:px-6 pt-10 sm:pt-14 pb-10 border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
          <div>
            <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">{heroTexto.kicker}</span>
            <h1 className="text-2xl sm:text-4xl font-semibold text-white leading-tight mt-2 tracking-tight">
              {heroTexto.titulo}
            </h1>
            <p className="text-white/50 text-sm mt-3 max-w-md">{heroTexto.subtitulo}</p>
          </div>
          <div className="flex gap-6 sm:gap-8 shrink-0">
            {heroTexto.stats.map(([n, l]) => (
              <div key={l}>
                <p className="text-xl sm:text-2xl font-semibold text-white">{n}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS: pestañas + búsqueda + carrito (una sola fila) */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/[0.07] sticky top-16 z-30" style={{ background: "#0a1a0a" }}>
        <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">

          {/* Pestañas: Café / Máquinas / Favoritos.
              En móvil se deslizan horizontalmente (sin scrollbar visible) para
              que nunca desborden el borde de la pantalla. */}
          <div className="inline-flex p-1 rounded-xl gap-1 bg-[#0F1D13] border border-white/[0.08] shrink-0 w-full sm:w-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECCIONES.map(s => {
              const activo = seccion === s.id;
              const count = s.id === "favoritos" ? numFavoritos : s.id === "maquinas" ? maquinasProductos.length : cafeProductos.length;
              const Icono = s.icono;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => cambiarSeccion(s.id)}
                  className={`px-3.5 sm:px-4 h-10 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shrink-0 whitespace-nowrap ${activo ? "bg-[#6FA98C] text-white shadow" : "text-white/50 hover:text-white hover:bg-white/[0.06]"}`}
                >
                  {s.id === "favoritos" ? <IconoCorazon lleno={activo} width={14} height={14} /> : <Icono width={14} height={14} />}
                  {s.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activo ? "bg-white/25 text-white" : "bg-white/[0.07] text-white/40"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Búsqueda + acciones, agrupadas a la derecha */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[220px] justify-end">
            {/* Input de búsqueda local — en mobile abre Spotlight */}
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2 w-full max-w-none sm:max-w-xs bg-[#0F1D13] border border-white/[0.08]">
              <button type="button" onClick={() => setSpotlightOpen(true)} className="text-white/35 hover:text-white/60 transition shrink-0" aria-label="Abrir búsqueda avanzada">
                <IconoBuscar className="shrink-0" />
              </button>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder={seccion === "maquinas" ? "Buscar cafetera, marca..." : "Buscar por nombre, tipo de café..."}
                className="flex-1 min-w-0 text-sm outline-none bg-transparent text-white placeholder-white/35 sm:hidden" readOnly onClick={() => setSpotlightOpen(true)} />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                    document.getElementById("catalogo-resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                placeholder={seccion === "maquinas" ? "Buscar cafetera, marca..." : "Buscar por nombre, tipo de café..."}
                className="flex-1 min-w-0 text-sm outline-none bg-transparent text-white placeholder-white/35 hidden sm:block" />
            </div>
            {/* Chip Ctrl+K — solo desktop */}
            <button type="button" onClick={() => setSpotlightOpen(true)}
              className="h-10 px-3 rounded-xl bg-[#0F1D13] text-white/30 text-[11px] font-medium border border-white/[0.08] hover:border-white/20 hover:text-white/50 shrink-0 transition hidden md:flex items-center gap-1.5">
              <span>Ctrl</span><kbd className="text-[9px] bg-white/[0.06] px-1 py-0.5 rounded">K</kbd>
            </button>
            {seccion === "cafe" && (
              <button type="button" onClick={() => setMostrarRecomendador(true)}
                className="relative h-10 px-4 rounded-xl bg-[#0F1D13] text-[#9DC9B4] text-sm font-medium items-center gap-2 border border-[#6FA98C]/25 hover:bg-[#14291B] shrink-0 transition hidden md:flex">
                ✨ ¿No sabes qué elegir?
              </button>
            )}
            <motion.button
              type="button"
              id="icono-carrito-header"
              onClick={() => setCarritoOpen(true)}
              whileTap={{ scale: 0.9 }}
              className="relative h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition"
              aria-label="Carrito"
            >
              <IconoCarrito />
              <AnimatePresence>
                {totalCarrito > 0 && (
                  <motion.span
                    key={totalCarrito}
                    initial={{ scale: 0, y: 5 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#D85A30] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0a1a0a] shadow-lg shadow-[#D85A30]/30"
                  >
                    {totalCarrito}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* CHIPS DE FILTRO (según sección).
          En móvil: una sola fila deslizable horizontalmente (patrón de apps de
          compras); en escritorio: wrap normal en varias líneas si hace falta. */}
      {seccion !== "favoritos" && (
        <div className="px-4 sm:px-6 py-3 border-b border-white/[0.07]">
          <div className="max-w-6xl mx-auto flex items-center gap-2 flex-nowrap overflow-x-auto sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map(c => (
              <MagneticChip
                key={c.label}
                activo={chipActivo === c.val}
                onClick={() => setChip(c.val)}
              >
                {c.label}
              </MagneticChip>
            ))}
            <span className="w-px h-5 bg-white/10 mx-1 hidden sm:block shrink-0" />
            {["En stock", "Stock bajo"].map(d => (
              <MagneticChip
                key={d}
                activo={filtros.disp === d}
                onClick={() => setFiltros(f => ({ ...f, disp: f.disp === d ? "" : d }))}
              >
                {d}
              </MagneticChip>
            ))}
          </div>
        </div>
      )}

      {/* ESTADOS DE CARGA / ERROR */}
      {cargando && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-4 w-40 rounded skeleton mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {!cargando && error && (
        <div className="text-center py-20 text-[#D85A30]">
          <p className="text-sm">No se pudo conectar con el servidor: {error}</p>
          <p className="text-xs text-white/40 mt-1">Verifica que tu backend esté corriendo en {API_URL}</p>
        </div>
      )}

      {!cargando && !error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

          {/* ── CARRUSEL CON PESTAÑAS (solo café) ── */}
          <FadeIn>
          {seccion === "cafe" && (() => {
            const tabsCarousel = [
              { id: "ofertas",   label: "Ofertas",   emoji: "🏷️", items: carouselPromos },
              { id: "populares", label: "Populares", emoji: "🔥", items: carouselPopulares },
              { id: "nuevos",    label: "Nuevos",    emoji: "🆕", items: carouselNuevos },
            ].filter(t => t.items.length > 0);

            if (tabsCarousel.length === 0) return null;

            const tabActiva = tabsCarousel.find(t => t.id === tabCarousel) || tabsCarousel[0];

            return (
              <div>
                {/* Pestañas */}
                <div className="flex items-center gap-2 mb-4">
                  {tabsCarousel.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTabCarousel(t.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                        tabActiva.id === t.id
                          ? "bg-[#6FA98C] text-white"
                          : "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>

                {/* Carrusel */}
                <CaruselGenerico
                  titulo={tabActiva.label}
                  subtitulo={
                    tabActiva.id === "ofertas" ? "Los mejores descuentos de esta semana"
                    : tabActiva.id === "populares" ? "Los cafés que todos están pidiendo"
                    : "Los nuevos lotes que acabamos de recibir"
                  }
                  emoji={tabActiva.emoji}
                >
                  {tabActiva.items.map(p => (
                    <ProductoCardMini
                      key={`${tabActiva.id}-${p.id}`}
                      p={p}
                      onVerDetalle={verDetalle}
                      onAgregar={agregar}
                    />
                  ))}
                </CaruselGenerico>
              </div>
            );
          })()}
          </FadeIn>

          {/* ── SECCIÓN CAFÉ ── */}
          {seccion === "cafe" && (
            <>
              {/* PRODUCTO DEL DÍA */}
              {productoDelDia && <FadeIn><ProductoDelDiaBanner producto={productoDelDia} onAgregar={agregar} onVerDetalle={verDetalle} /></FadeIn>}

              {/* BANNER B2B (Frente C): captación de empresas */}
              <FadeIn>
              <div className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: '#0F1D13', border: '1px solid rgba(111,169,140,0.35)' }}>
                <span className="text-3xl">🏢</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">¿Compras para tu negocio?</p>
                  <p className="text-sm text-white/50 mt-1">10% en todos tus pedidos + precios por bulto y descuentos por volumen.</p>
                </div>
                {cliente?.tipo_persona === 'juridica' ? (
                  <span className="shrink-0 text-xs text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/30 rounded-full px-3.5 py-2">🏢 Ya tienes tu 10%</span>
                ) : (
                  <button type="button" onClick={() => navigate('/cliente/empresas')} className="shrink-0 h-10 px-5 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">Granova Empresas →</button>
                )}
              </div>
              </FadeIn>

              {/* RECOMENDADO PARA TI */}
              {recomendaciones.length > 0 && (
                <FadeIn>
                <div>
            <div id="catalogo-resultados" className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Personalizado</span>
                      <h2 className="text-xl font-semibold text-white mt-1">Recomendado para ti</h2>
                    </div>
                    <button type="button" onClick={() => {
                      setBusqueda("");
                      setFiltros({ tipo: "", disp: "", marca: "" });
                      document.getElementById("catalogo-resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }} className="text-sm text-[#9DC9B4] hover:text-white transition">Ver todos →</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recomendaciones.map(p => (
                      <ProductoCard
                        key={p.id_producto}
                        p={adaptarProducto(p)}
                        onAgregar={agregar}
                        onVerDetalle={verDetalle}
                        cantidadEnCarrito={carrito.find(c => c.id === p.id_producto)?.cant || 0}
                        esFavorito={favoritos.has(p.id_producto)}
                        onToggleFavorito={toggleFavorito}
                        seleccionadoComparar={seleccionadosComparar.includes(p.id_producto)}
                        onToggleComparar={() => alternarComparar(p.id_producto)}
                        esJuridica={esJuridica}
                      />
                    ))}
                  </div>
                </div>
                </FadeIn>
              )}
            </>
          )}

          {/* VISTOS RECIENTEMENTE */}
          <FadeIn>
          {productosVistos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Vistos recientemente</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {productosVistos.map(p => (
                  <div
                    key={p.id}
                    className="shrink-0 w-32 rounded-xl overflow-hidden cursor-pointer bg-[#0F1D13] border border-white/[0.08] hover:-translate-y-1 hover:border-white/20 transition"
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalle de ${p.nombre}`}
                    onClick={() => verDetalle(p)}
                    onKeyDown={(e) => { if (e.key === "Enter") verDetalle(p); }}
                  >
                    <div className="h-24 bg-[#14291B]">
                      <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] text-white truncate">{p.nombre}</p>
                      <p className="text-xs font-semibold text-white">${p.precio.toLocaleString("es-CO")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </FadeIn>

          {/* GRID DE LA SECCIÓN */}
          <FadeIn>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {seccion === "favoritos" ? "Tus favoritos" : seccion === "maquinas" ? "Máquinas de café" : "Todos los cafés"}
              </h2>
              <p className="text-sm text-white/40">{filtrados.length} {filtrados.length === 1 ? "producto" : "productos"}</p>
            </div>
            {filtrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtrados.map(p => (
                  <ProductoCard
                    key={p.id} p={p} onAgregar={agregar} onVerDetalle={verDetalle}
                    cantidadEnCarrito={carrito.find(c => c.id === p.id)?.cant || 0}
                    esFavorito={favoritos.has(p.id)} onToggleFavorito={toggleFavorito}
                    seleccionadoComparar={seleccionadosComparar.includes(p.id)}
                    onToggleComparar={() => alternarComparar(p.id)}
                    esJuridica={esJuridica}
                  />
                ))}
              </div>
            ) : seccion === "favoritos" ? (
              <div className="text-center py-16 bg-[#0F1D13] border border-white/[0.08] rounded-2xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#14291B] flex items-center justify-center mb-3">
                  <IconoCorazon className="text-white/25" width={22} height={22} />
                </div>
                <p className="text-white/60 text-sm font-medium">Aún no tienes productos favoritos.</p>
                <p className="text-white/40 text-xs mt-1">Toca el corazón ♥ de un producto para guardarlo aquí.</p>
                <button type="button" onClick={() => cambiarSeccion("cafe")} className="mt-5 h-10 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">
                  Explorar el catálogo
                </button>
              </div>
            ) : (
              <div className="text-center py-16 text-white/40 bg-[#0F1D13] border border-white/[0.08] rounded-2xl">
                <p className="text-sm">No se encontraron productos.</p>
              </div>
            )}
          </div>
          </FadeIn>

          {/* SECCIÓN DESTACADOS (solo café) */}
          {seccion === "cafe" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-white">Productos destacados</h2>
              </div>
              <div className="flex gap-6 border-b border-white/[0.07] mb-5 mt-4">
                {[["masVendidos","Más vendidos"], ["promociones","Promociones"]].map(([val, label]) => (
                  <button type="button" key={val} onClick={() => setTabDestacados(val)}
                    className={`text-sm pb-2.5 border-b-2 transition-colors ${tabDestacados === val ? "border-[#6FA98C] text-white font-medium" : "border-transparent text-white/40 hover:text-white/70"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {(() => {
                const lista = tabDestacados === "masVendidos" ? masVendidos : promociones;
                if (lista.length === 0) return <p className="text-white/40 text-sm">No hay productos en esta categoría.</p>;
                const [primero, ...resto] = lista;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      className="sm:row-span-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-[#0F1D13] border border-white/[0.08] hover:shadow-xl"
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver detalle de ${primero.nombre}`}
                      onClick={() => verDetalle(primero)}
                      onKeyDown={(e) => { if (e.key === "Enter") verDetalle(primero); }}
                    >
                      <div className="relative h-64 sm:h-80 bg-[#14291B]">
                        <ImagenProducto src={primero.img} alt={primero.nombre} className="w-full h-full object-cover" />
                        {primero.badge && <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeColor[primero.badge]}`}>{primero.badge}</span>}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-white/40">{primero.origen}</p>
                        <p className="text-base font-semibold text-white mt-1">{primero.nombre}</p>
                        <p className="text-xl font-semibold text-white mt-2">{primero.formatos.length > 0 ? `Desde $${primero.precioDesde.toLocaleString("es-CO")}` : `$${primero.precio.toLocaleString("es-CO")}`}</p>
                        <p className="text-[10px] text-white/40">{primero.formatos.length > 0 ? primero.formatos.map(f => f.etiqueta.replace(/^Paquete |^Bolsa /, "")).join(" · ") : "por kg"}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`w-2 h-2 rounded-full ${stockColor[primero.stockLabel]}`}></span>
                          <span className={`text-xs ${stockTexto[primero.stockLabel]}`}>{primero.stockLabel} · {primero.stock} kg</span>
                        </div>
                        <button type="button" onClick={e => { e.stopPropagation(); agregar({...primero, cant:1}, e.currentTarget); }} className="w-full mt-3 h-9 rounded-xl bg-[#6FA98C] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#4F8A70] active:scale-95 transition duration-150"><IconoCarrito width={14} height={14} /> Agregar al carrito</button>
                      </div>
                    </div>
                    {resto.slice(0,4).map(p => (
                      <div
                        key={p.id}
                        className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-[#0F1D13] border border-white/[0.08] hover:shadow-xl"
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver detalle de ${p.nombre}`}
                        onClick={() => verDetalle(p)}
                        onKeyDown={(e) => { if (e.key === "Enter") verDetalle(p); }}
                      >
                        <div className="relative h-36 bg-[#14291B]">
                          <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-white">{p.nombre}</p>
                          <p className="text-xs text-white mt-0.5 font-semibold">${p.precio.toLocaleString("es-CO")}</p>
                          <button type="button" onClick={e => { e.stopPropagation(); agregar({...p, cant:1}, e.currentTarget); }} className="w-full mt-2 h-8 rounded-lg bg-[#6FA98C] text-white text-xs font-semibold flex items-center justify-center hover:bg-[#4F8A70] active:scale-95 transition duration-150">Agregar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {seleccionadosComparar.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#6FA98C] text-[#0A1A0A] px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-4 shadow-lg z-50">
          <span>{seleccionadosComparar.length} seleccionados</span>
          <Link to={`/cliente/comparar?ids=${seleccionadosComparar.join(',')}`} className="hover:underline">Ver comparación →</Link>
        </div>
      )}

      {/* MODALES */}
      {carritoOpen  && <CarritoDrawer carrito={carrito} setCarrito={setCarrito} onClose={() => setCarritoOpen(false)} onAumentar={aumentarEnCarrito} descuentosVolumen={descuentosVolumen} />}
      {detalle      && <DetalleProducto p={detalle} onClose={() => setDetalle(null)} onAgregar={agregar} esFavorito={favoritos.has(detalle.id)} onToggleFavorito={toggleFavorito} descuentosVolumen={descuentosVolumen} esJuridica={esJuridica} />}
      {confirmPendiente && <ModalConfirmarCantidad data={confirmPendiente} onCancelar={cancelarConfirm} onAceptar={aceptarConfirm} />}
      {mostrarRecomendador && (
        <RecomendadorModal
          onClose={() => setMostrarRecomendador(false)}
          onRecomendaciones={(datos) => setRecomendaciones(datos)}
        />
      )}

      <SpotlightSearch
        abierto={spotlightOpen}
        onCerrar={() => setSpotlightOpen(false)}
        productos={productos}
        onVerDetalle={verDetalle}
        onAgregar={agregar}
      />
    </div>
  );
}

// ── EXPORT: envuelto en Error Boundary ────────────────────
function Catalogo() {
  return (
    <CatalogoErrorBoundary>
      <CatalogoInterno />
    </CatalogoErrorBoundary>
  );
}

export default Catalogo;
