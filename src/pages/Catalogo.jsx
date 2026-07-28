import { useState, useEffect, useMemo, Component } from "react";
import { useNavigate } from "react-router-dom";
import { useModalBehavior } from "../hooks/useModalBehavior";
import { useCarrito } from "../context/CarritoContext";
import { API_URL as BASE_API_URL } from "../config";

// ── CONFIG API ────────────────────────────────────────────
const API_URL = `${BASE_API_URL}/productos`;

// ── SISTEMA DE COLOR ───────────────────────────────────────
// fondo: #0a1a0a   tarjeta: #FFFFFF   borde: neutro (no verde)
// tinta: #17140F   verde (acento, Landing): #6FA98C
// El verde se reserva para estados activos y precios — nunca
// para rellenar botones repetidos, así no satura la vista.

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
  return {
    id: p.id_producto,
    nombre: p.nombre,
    origen: [p.tipo_cafe, p.presentacion].filter(Boolean).join(" · ") || "Café Granova",
    precio: Number(p.precio) || 0,
    stock,
    stockLabel: calcularStockLabel(stock),
    badge: calcularBadge(p),
    img: p.imagen_url || "",
    desc: p.descripcion || "",
    tipo: p.tipo_cafe || "Sin categoría",
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
// el día, cambia automáticamente al día siguiente.
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
      cartEl.classList.add("cart-bounce");
      setTimeout(() => cartEl.classList.remove("cart-bounce"), 500);
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
const IconoFiltro = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
const IconoBuscar = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconoCorazon = ({ lleno, ...props }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={lleno ? "currentColor" : "none"} {...props}>
    <path d="M12 21s-7.5-4.6-10-9.1C0.3 8.7 1.7 5 5.2 4.2c2-.4 4 .5 5 2.2 1-1.7 3-2.6 5-2.2 3.5.8 4.9 4.5 3.2 7.7C19.5 16.4 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// ── IMAGEN SEGURA ──────────────────────────────────────────
// Reemplaza <img src={...}>: si no hay URL, no renderiza <img> (evita el
// warning de src="" y la descarga completa de la página). Si la URL falla
// al cargar, oculta la imagen igual que antes.
function ImagenProducto({ src, alt, className }) {
  const [fallo, setFallo] = useState(false);
  if (!src || fallo) {
    return <div className={`${className} bg-white/10 flex items-center justify-center`}>
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

// ── MODAL FILTROS ─────────────────────────────────────────
function ModalFiltros({ onClose, filtros, setFiltros, tiposDisponibles }) {
  const [local, setLocal] = useState({ ...filtros });
  useModalBehavior(onClose);

  const toggle = (key, val) => {
    setLocal(prev => ({ ...prev, [key]: prev[key] === val ? "" : val }));
  };

  const dispFiltro = ["En stock", "Stock bajo"];

  const Chip = ({ label, activo, onClick }) => (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2 ${activo ? "bg-[#6FA98C] text-white border-white/20" : "bg-white/[0.08] backdrop-blur-xl text-white/70 border-white/15 hover:border-white/15"}`}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] anim-overlay" onClick={onClose}>
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 flex flex-col gap-6 bg-white/[0.08] backdrop-blur-xl shadow-2xl anim-sheet-up sm:anim-pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-white">Filtrar productos</p>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] rounded">✕</button>
        </div>
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Tipo de café</p>
          <div className="flex flex-wrap gap-2">
            {tiposDisponibles.length === 0 && <p className="text-xs text-white/40">Sin categorías aún</p>}
            {tiposDisponibles.map(t => <Chip key={t} label={t} activo={local.tipo === t} onClick={() => toggle("tipo", t)} />)}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Disponibilidad</p>
          <div className="flex flex-wrap gap-2">
            {dispFiltro.map(d => <Chip key={d} label={d} activo={local.disp === d} onClick={() => toggle("disp", d)} />)}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => { setLocal({ tipo: "", disp: "" }); }} className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 transition">Limpiar</button>
          <button onClick={() => { setFiltros(local); onClose(); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition">Aplicar filtros</button>
        </div>
      </div>
    </div>
  );
}

// ── CARRITO LATERAL ───────────────────────────────────────
function CarritoDrawer({ carrito, setCarrito, onClose, onAumentar }) {
  useModalBehavior(onClose);
  const navigate = useNavigate();
  const { sincronizarCarrito } = useCarrito();

  // Bajar cantidad es directo, sin confirmación.
  const disminuir = (id) => {
    setCarrito(prev => prev.map(x => x.id === id ? { ...x, cant: Math.max(1, (x.cant || 1) - 1) } : x));
  };
  const quitar = (id) => setCarrito(prev => prev.filter(x => x.id !== id));

  const subtotal = carrito.reduce((s, x) => s + x.precio * (x.cant || 1), 0);
  const descuento = Math.round(subtotal * 0.15);
  const total = subtotal - descuento;

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] anim-overlay" onClick={onClose}>
      <div className="w-full max-w-sm flex flex-col h-full bg-white/[0.08] backdrop-blur-xl shadow-2xl anim-sheet-right" onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/15">
          <p className="text-white text-base font-semibold">Mi carrito</p>
          <div className="flex items-center gap-4">
            <p className="text-white/40 text-xs">{carrito.length} {carrito.length === 1 ? "producto" : "productos"}</p>
            <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] rounded">✕</button>
          </div>
        </div>
        {/* items */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/10 px-5">
          {carrito.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/30 mb-2"><IconoCarrito className="mx-auto" width={28} height={28} /></p>
              <p className="text-white/40 text-sm">Tu carrito está vacío.</p>
            </div>
          )}
          {carrito.map(p => (
            <div key={p.id} className="py-4 flex gap-3 items-start group">
              <ImagenProducto src={p.img} alt={p.nombre} className="w-16 h-16 rounded-xl object-cover bg-white/10 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">{p.nombre}{p.esMezcla && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[#6FA98C]/20 text-[#9DC9B4] align-middle">Mezcla</span>}</p>
                  <button
                    onClick={() => quitar(p.id)}
                    className="text-white/30 hover:text-[#D85A30] shrink-0 transition"
                    aria-label={`Quitar ${p.nombre} del carrito`}
                    title="Quitar del carrito"
                  >
                    <IconoBasura />
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-0.5">${p.precio.toLocaleString("es-CO")} / kg</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 border border-white/15 rounded-lg">
                    <button onClick={() => disminuir(p.id)} className="w-7 h-7 text-white/60 hover:text-white text-base flex items-center justify-center">−</button>
                    <span className="text-xs font-medium w-4 text-center text-white">{p.cant || 1}</span>
                    <button onClick={() => onAumentar(p)} disabled={(p.cant || 1) >= p.stock} className="w-7 h-7 text-white/60 hover:text-white text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                  </div>
                  <p className="text-sm font-semibold text-white">${((p.cant||1)*p.precio).toLocaleString("es-CO")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* totales */}
        {carrito.length > 0 && (
          <div className="px-5 pb-6 pt-4 border-t border-white/15">
            <div className="flex justify-between text-sm text-white/50 mb-1.5"><span>Subtotal</span><span>${subtotal.toLocaleString("es-CO")}</span></div>
            <div className="flex justify-between text-sm text-[#9DC9B4] mb-1.5"><span>Descuento VIP 15%</span><span>−${descuento.toLocaleString("es-CO")}</span></div>
            <div className="flex justify-between text-sm text-white/50 mb-3"><span>Envío</span><span className="text-[#9DC9B4]">Gratis</span></div>
            <div className="flex justify-between text-base font-semibold text-white border-t border-white/15 pt-3 mb-4">
              <span>Total</span><span>${total.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={irACotizacion} className="flex-1 py-3 rounded-xl text-white/70 text-sm border border-white/15 hover:bg-white/10 transition">Cotización</button>
              <button onClick={irAPagar} className="flex-1 py-3 rounded-xl bg-[#6FA98C] text-white text-sm font-medium hover:bg-[#4F8A70] transition">Pagar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DETALLE PRODUCTO ──────────────────────────────────────
function DetalleProducto({ p, onClose, onAgregar, esFavorito, onToggleFavorito }) {
  const [cant, setCant] = useState(1);
  useModalBehavior(onClose);
  const precioVol = cant <= 5 ? p.precio : cant <= 20 ? Math.round(p.precio * 0.91) : Math.round(p.precio * 0.84);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 anim-overlay" onClick={onClose}>
      <div className="rounded-2xl w-full max-w-3xl flex flex-col sm:flex-row overflow-hidden max-h-[90vh] bg-white/[0.08] backdrop-blur-xl shadow-2xl anim-pop" onClick={e => e.stopPropagation()}>
        {/* imagen */}
        <div className="sm:w-1/2 h-56 sm:h-auto bg-white/10 relative">
          <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/[0.08] backdrop-blur-xl rounded-full flex items-center justify-center text-white/70 shadow hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C]">✕</button>
          <button
            onClick={() => onToggleFavorito(p.id)}
            className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow transition ${esFavorito ? "bg-[#D85A30] text-white" : "bg-white/[0.08] backdrop-blur-xl text-white/70 hover:text-white"}`}
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
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">${precioVol.toLocaleString("es-CO")}</p>
            <p className="text-xs text-white/40">por kilogramo · IVA incluido</p>
          </div>
          <div>
            <p className="text-sm text-white/50 mb-2">Precios por volumen</p>
            <div className="grid grid-cols-3 gap-2">
              {[["1–5 kg", p.precio], ["6–20 kg", Math.round(p.precio*0.91)], ["+20 kg", Math.round(p.precio*0.84)]].map(([label, pr]) => {
                const activo = (cant <= 5 && label === "1–5 kg") || (cant > 5 && cant <= 20 && label === "6–20 kg") || (cant > 20 && label === "+20 kg");
                return (
                  <div key={label} className={`rounded-xl p-2 text-center border ${activo ? "border-[#6FA98C] bg-[#6FA98C]/6" : "border-white/15"}`}>
                    <p className="text-xs text-white/40">{label}</p>
                    <p className="text-sm font-semibold text-white">${pr.toLocaleString("es-CO")}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-sm text-white/50 mb-2">Cantidad</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setCant(c => Math.max(1, c-1))} className="w-10 h-10 rounded-xl border border-white/15 text-white/70 text-xl flex items-center justify-center hover:bg-white/10">−</button>
              <span className="text-lg font-semibold w-8 text-center text-white">{cant}</span>
              <button onClick={() => setCant(c => Math.min(p.stock, c+1))} disabled={cant >= p.stock} className="w-10 h-10 rounded-xl border border-white/15 text-white/70 text-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
              <span className="text-white/40 text-sm">kg</span>
            </div>
          </div>
          <button
            onClick={(e) => { onAgregar({ ...p, cant }, e.currentTarget); onClose(); }}
            className="w-full h-12 rounded-xl bg-[#6FA98C] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#4F8A70] active:scale-95 transition duration-150">
            <IconoCarrito /> Agregar al carrito
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${stockColor[p.stockLabel]}`}></span>
            <span className="text-white/50">{p.stockLabel} · {p.stock} kg disponibles</span>
          </div>
          {p.stockLabel === "Stock bajo" && p.disponible && (
            <p className="text-xs text-amber-500 font-medium animate-pulse">
              ¡Solo {p.stock} kg disponibles, se está agotando!
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

  let titulo, mensaje, mostrarAceptar = true;
  if (tipo === "sinStock") {
    titulo = "Ya tienes todo el stock en tu carrito";
    mensaje = `No quedan más unidades disponibles de "${producto.nombre}" para agregar.`;
    mostrarAceptar = false;
  } else if (tipo === "limitado") {
    titulo = "Agregaste más de lo disponible";
    mensaje = `Solo quedan ${disponibleRestante} kg disponibles de "${producto.nombre}". ¿Deseas agregar los ${disponibleRestante} kg restantes a tu carrito?`;
  } else {
    titulo = "Vas a superar otra decena";
    mensaje = `Vas a tener ${total} kg de "${producto.nombre}" en tu carrito. ¿Deseas confirmar esta cantidad?`;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 anim-overlay" onClick={onCancelar}>
      <div className="rounded-2xl w-full max-w-sm p-6 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-2xl anim-pop" onClick={e => e.stopPropagation()}>
        <p className="text-white font-semibold text-base mb-2">{titulo}</p>
        <p className="text-white/60 text-sm mb-6">{mensaje}</p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 transition">Cancelar</button>
          {mostrarAceptar && (
            <button onClick={onAceptar} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition">Aceptar</button>
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
    <div className="rounded-2xl overflow-hidden flex flex-col sm:flex-row bg-gradient-to-r from-[#6FA98C]/15 to-transparent border border-[#6FA98C]/30">
      <div className="sm:w-48 h-40 sm:h-auto bg-white/10 cursor-pointer shrink-0" onClick={() => onVerDetalle(producto)}>
        <ImagenProducto src={producto.img} alt={producto.nombre} className="w-full h-full object-cover" />
      </div>
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
        <div className="flex-1">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#6FA98C] text-white">☕ Producto del día · 20% OFF</span>
          <p className="text-white font-semibold mt-2 cursor-pointer hover:text-[#9DC9B4] transition" onClick={() => onVerDetalle(producto)}>{producto.nombre}</p>
          <p className="text-xs text-white/40">{producto.origen}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-lg font-semibold text-white">${precioDesc.toLocaleString("es-CO")}</p>
            <p className="text-sm text-white/40 line-through">${producto.precio.toLocaleString("es-CO")}</p>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Oferta válida solo hoy</p>
        </div>
        <button
          onClick={(e) => onAgregar({ ...producto, precio: precioDesc, cant: 1 }, e.currentTarget)}
          className="h-11 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-medium hover:bg-[#4F8A70] active:scale-95 transition duration-150 shrink-0 flex items-center justify-center gap-2"
        >
          <IconoCarrito width={14} height={14} /> Agregar con descuento
        </button>
      </div>
    </div>
  );
}

// ── CALCULADORA RÁPIDA ─────────────────────────────────────
// Aislada en su propio componente para que su estado (kgCalc) no
// interfiera con el render de ProductoCard ni de la lista completa.
function CalculadoraRapida({ precio, stock }) {
  const [kgCalc, setKgCalc] = useState(1);

  return (
    <div className="flex items-center gap-2 text-xs bg-white/[0.05] rounded-lg px-2.5 py-1.5">
      <span className="text-white/40">Calcular:</span>
      <input
        type="number"
        min={1}
        max={stock || 1}
        value={kgCalc}
        onClick={e => e.stopPropagation()}
        onChange={e => {
          e.stopPropagation();
          const val = Number(e.target.value);
          setKgCalc(Number.isFinite(val) && val > 0 ? val : 1);
        }}
        className="w-12 bg-transparent border border-white/15 rounded px-1 py-0.5 text-white text-center outline-none focus:border-[#6FA98C]"
      />
      <span className="text-white/40">kg =</span>
      <span className="text-white font-semibold ml-auto">${(kgCalc * precio).toLocaleString("es-CO")}</span>
    </div>
  );
}

// ── PRODUCTO CARD ─────────────────────────────────────────
function ProductoCard({ p, onAgregar, onVerDetalle, cantidadEnCarrito = 0, esFavorito, onToggleFavorito }) {
  const [feedback, setFeedback] = useState(false);

  const handleAgregar = (e) => {
    if (!p.disponible) return;
    onAgregar({ ...p, cant: 1 }, e.currentTarget);
    setFeedback(true);
    setTimeout(() => setFeedback(false), 900);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm hover:shadow-lg flex flex-col">
      <div className="relative aspect-[4/3] bg-white/10 cursor-pointer overflow-hidden group/img" onClick={() => onVerDetalle(p)}>
        <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
        {p.badge && (
          <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeColor[p.badge] || "bg-white/15 text-white"}`}>
            {p.badge}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorito(p.id); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition ${esFavorito ? "bg-[#D85A30] text-white" : "bg-black/30 backdrop-blur text-white/70 hover:text-white"}`}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          title="Favorito"
        >
          <IconoCorazon lleno={esFavorito} />
        </button>
        {cantidadEnCarrito > 0 && (
          <span className="absolute bottom-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white">
            En el carrito · {cantidadEnCarrito}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-white/40">{p.origen}</p>
          <p className="text-sm font-medium text-white mt-0.5 leading-snug cursor-pointer hover:text-[#9DC9B4] transition" onClick={() => onVerDetalle(p)}>{p.nombre}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-white">${p.precio.toLocaleString("es-CO")}</p>
            <p className="text-[10px] text-white/40">por kg</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stockColor[p.stockLabel]}`}></span>
            <span className={`text-[11px] ${stockTexto[p.stockLabel]}`}>{p.stockLabel}</span>
          </div>
        </div>

        {p.stockLabel === "Stock bajo" && p.disponible && (
          <p className="text-[11px] text-amber-500 font-medium animate-pulse">
            ¡Solo {p.stock} kg disponibles, se está agotando!
          </p>
        )}

        <CalculadoraRapida precio={p.precio} stock={p.stock} />

        <button
          onClick={handleAgregar}
          disabled={!p.disponible}
          className={`mt-1 h-9 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2 ${feedback ? "bg-[#4F8A70] text-white" : "bg-[#6FA98C] text-white hover:bg-[#4F8A70]"}`}
        >
          {feedback ? "✓ Agregado" : <><IconoCarrito width={14} height={14} /> Agregar</>}
        </button>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL (envuelta en Error Boundary abajo) ────
function CatalogoInterno() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);

  const [busqueda, setBusqueda]     = useState("");
  const [filtros, setFiltros]       = useState({ tipo: "", disp: "" });
  const [modalFiltros, setModalFiltros] = useState(false);
  const [carritoOpen, setCarritoOpen]   = useState(false);
  const [detalle, setDetalle]           = useState(null);
  const [carrito, setCarrito]           = useState([]);
  const [tabDestacados, setTabDestacados] = useState("masVendidos");
  const [confirmPendiente, setConfirmPendiente] = useState(null);

  // ── Nuevas funcionalidades ──
  const [favoritos, setFavoritos] = useState(() => cargarFavoritos());
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [vistos, setVistos] = useState(() => cargarVistos());

  useEffect(() => {
    let cancelado = false;
    async function cargarProductos() {
      try {
        setCargando(true);
        setError(null);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelado) setProductos(eliminarDuplicados(data.map(adaptarProducto)));
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

  const productoDelDia = useMemo(() => calcularProductoDelDia(productos), [productos]);

  const tiposDisponibles = [...new Set(productos.map(p => p.tipo))].filter(Boolean);

  const filtrados = productos.filter(p => {
    const matchBus  = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = !filtros.tipo || p.tipo === filtros.tipo;
    const matchDisp = !filtros.disp || p.stockLabel === filtros.disp;
    const matchFav  = !soloFavoritos || favoritos.has(p.id);
    return matchBus && matchTipo && matchDisp && matchFav;
  });

  const productosVistos = vistos.map(id => productos.find(p => p.id === id)).filter(Boolean);

  const masVendidos = [...productos].sort((a, b) => b.stock - a.stock).slice(0, 4);
  const promociones = productos.filter(p => p.badge === "Oferta");
  const totalCarrito = carrito.reduce((s, x) => s + (x.cant || 1), 0);
  const filtrosActivos = (filtros.tipo ? 1 : 0) + (filtros.disp ? 1 : 0);

  return (
    <div className="text-white min-h-screen" style={{ background: "#0a1a0a" }} translate="no">

      {/* HERO */}
      <div className="px-4 sm:px-6 pt-10 sm:pt-14 pb-10 border-b border-white/15">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
          <div>
            <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Catálogo</span>
            <h1 className="text-2xl sm:text-4xl font-semibold text-white leading-tight mt-2 tracking-tight">
              El mejor café, directo del productor
            </h1>
            <p className="text-white/50 text-sm mt-3 max-w-md">Lotes de origen colombiano, tostados en pequeñas cantidades y enviados sin intermediarios.</p>
          </div>
          <div className="flex gap-6 sm:gap-8 shrink-0">
            {[[String(productos.length),"Productos"],[String(tiposDisponibles.length),"Variedades"],["100%","Colombiano"]].map(([n,l]) => (
              <div key={l}>
                <p className="text-xl sm:text-2xl font-semibold text-white">{n}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARRA BÚSQUEDA + CARRITO */}
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3 max-w-full border-b border-white/15 sticky top-16 z-30 backdrop-blur-md flex-wrap" style={{ background: "rgba(10,26,10,0.9)" }}>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2 flex-1 max-w-sm bg-white/[0.08] backdrop-blur-xl border border-white/15">
          <IconoBuscar className="text-white/35 shrink-0" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, tipo de café..."
            className="flex-1 text-sm outline-none bg-transparent text-white placeholder-white/35" />
        </div>
        <p className="text-sm text-white/40 flex-1 text-center hidden sm:block">{filtrados.length} productos encontrados</p>
        <button onClick={() => setSoloFavoritos(v => !v)}
          className={`relative h-10 px-4 rounded-xl text-sm font-medium flex items-center gap-2 border shrink-0 transition ${soloFavoritos ? "bg-[#D85A30] border-[#D85A30] text-white" : "bg-white/[0.08] backdrop-blur-xl border-white/15 text-white"}`}>
          <IconoCorazon lleno={soloFavoritos} /> Favoritos
          {favoritos.size > 0 && <span className="w-4 h-4 rounded-full bg-white/20 text-[9px] font-bold flex items-center justify-center">{favoritos.size}</span>}
        </button>
        <button onClick={() => setModalFiltros(true)}
          className="relative h-10 px-4 rounded-xl bg-white/[0.08] backdrop-blur-xl text-white text-sm font-medium flex items-center gap-2 border border-white/15 hover:border-white/15 shrink-0 transition">
          <IconoFiltro /> Filtros
          {filtrosActivos > 0 && <span className="w-4 h-4 rounded-full bg-[#6FA98C] text-white text-[9px] font-bold flex items-center justify-center">{filtrosActivos}</span>}
        </button>
        <button id="icono-carrito-header" onClick={() => setCarritoOpen(true)} className="relative h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition" aria-label="Carrito">
          <IconoCarrito />
          {totalCarrito > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#6FA98C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalCarrito}</span>
          )}
        </button>
      </div>

      {/* ESTADOS DE CARGA / ERROR */}
      {cargando && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-4 w-40 rounded skeleton mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15">
                <div className="aspect-[4/3] skeleton"></div>
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="h-2.5 w-16 rounded skeleton"></div>
                  <div className="h-3.5 w-3/4 rounded skeleton"></div>
                  <div className="h-4 w-20 rounded skeleton mt-1"></div>
                  <div className="h-9 w-full rounded-xl skeleton mt-1"></div>
                </div>
              </div>
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

          {/* PRODUCTO DEL DÍA */}
          {productoDelDia && (
            <ProductoDelDiaBanner producto={productoDelDia} onAgregar={agregar} onVerDetalle={verDetalle} />
          )}

          {/* VISTOS RECIENTEMENTE */}
          {productosVistos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Vistos recientemente</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {productosVistos.map(p => (
                  <div key={p.id} className="shrink-0 w-32 rounded-xl overflow-hidden cursor-pointer bg-white/[0.08] backdrop-blur-xl border border-white/15 hover:-translate-y-1 transition" onClick={() => verDetalle(p)}>
                    <div className="h-24 bg-white/10">
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

          {/* SECCIÓN DESTACADOS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold text-white">Productos destacados</h2>
            </div>
            <div className="flex gap-6 border-b border-white/15 mb-5 mt-4">
              {[["masVendidos","Más vendidos"],["promociones","Promociones"]].map(([val, label]) => (
                <button key={val} onClick={() => setTabDestacados(val)}
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
                  <div className="sm:row-span-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm hover:shadow-lg" onClick={() => verDetalle(primero)}>
                    <div className="relative h-64 sm:h-80 bg-white/10">
                      <ImagenProducto src={primero.img} alt={primero.nombre} className="w-full h-full object-cover" />
                      {primero.badge && <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeColor[primero.badge]}`}>{primero.badge}</span>}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-white/40">{primero.origen}</p>
                      <p className="text-base font-semibold text-white mt-1">{primero.nombre}</p>
                      <p className="text-xl font-semibold text-white mt-2">${primero.precio.toLocaleString("es-CO")}</p>
                      <p className="text-[10px] text-white/40">por kg · desde 10kg</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`w-2 h-2 rounded-full ${stockColor[primero.stockLabel]}`}></span>
                        <span className={`text-xs ${stockTexto[primero.stockLabel]}`}>{primero.stockLabel} · {primero.stock} kg</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); agregar({...primero, cant:1}, e.currentTarget); }} className="w-full mt-3 h-9 rounded-xl bg-[#6FA98C] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#4F8A70] active:scale-95 transition duration-150"><IconoCarrito width={14} height={14} /> Agregar al carrito</button>
                    </div>
                  </div>
                  {resto.slice(0,4).map(p => (
                    <div key={p.id} className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm hover:shadow-lg" onClick={() => verDetalle(p)}>
                      <div className="relative h-36 bg-white/10">
                        <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-white">{p.nombre}</p>
                        <p className="text-xs text-white mt-0.5 font-semibold">${p.precio.toLocaleString("es-CO")}</p>
                        <button onClick={e => { e.stopPropagation(); agregar({...p, cant:1}, e.currentTarget); }} className="w-full mt-2 h-8 rounded-lg bg-[#6FA98C] text-white text-xs font-semibold flex items-center justify-center hover:bg-[#4F8A70] active:scale-95 transition duration-150">Agregar</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* GRID TODOS LOS PRODUCTOS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{soloFavoritos ? "Tus favoritos" : "Todos los productos"}</h2>
              <p className="text-sm text-white/40">{filtrados.length} productos</p>
            </div>
            {filtrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtrados.map(p => (
                  <ProductoCard
                    key={p.id}
                    p={p}
                    onAgregar={agregar}
                    onVerDetalle={verDetalle}
                    cantidadEnCarrito={carrito.find(c => c.id === p.id)?.cant || 0}
                    esFavorito={favoritos.has(p.id)}
                    onToggleFavorito={toggleFavorito}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-white/40">
                <p className="text-sm">{soloFavoritos ? "Aún no tienes productos favoritos." : "No se encontraron productos."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALES */}
      {modalFiltros && <ModalFiltros filtros={filtros} setFiltros={setFiltros} onClose={() => setModalFiltros(false)} tiposDisponibles={tiposDisponibles} />}
      {carritoOpen  && <CarritoDrawer carrito={carrito} setCarrito={setCarrito} onClose={() => setCarritoOpen(false)} onAumentar={aumentarEnCarrito} />}
      {detalle      && <DetalleProducto p={detalle} onClose={() => setDetalle(null)} onAgregar={agregar} esFavorito={favoritos.has(detalle.id)} onToggleFavorito={toggleFavorito} />}
      {confirmPendiente && <ModalConfirmarCantidad data={confirmPendiente} onCancelar={cancelarConfirm} onAceptar={aceptarConfirm} />}
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