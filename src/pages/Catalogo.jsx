import { useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import Navbar from '../components/Navbar'

// ── CONFIG API ────────────────────────────────────────────
const API_URL = "http://localhost:3000/api/productos";

const badgeColor = {
  "Popular":   "bg-red-500 text-white",
  "Nuevo":     "bg-green-600 text-white",
  "Oferta":    "bg-amber-500 text-white",
  "Top ventas":"bg-amber-600 text-white",
};


const stockColor = {
  "En stock":  "bg-green-500",
  "Stock bajo":"bg-amber-400",
  "Agotado":   "bg-red-400",
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

function adaptarProducto(p) {
  const stock = Number(p.stock) || 0;
  console.log(p.nombre, '| estado:', JSON.stringify(p.estado), '| stock:', stock);
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

// ── MODAL FILTROS ─────────────────────────────────────────
function ModalFiltros({ onClose, filtros, setFiltros, tiposDisponibles }) {
  const [local, setLocal] = useState({ ...filtros });

  const toggle = (key, val) => {
    setLocal(prev => ({
      ...prev,
      [key]: prev[key] === val ? "" : val,
    }));
  };

  const dispFiltro = ["En stock", "Stock bajo"];

  const Chip = ({ label, activo, onClick }) => (
    <button onClick={onClick}
      className={`px-5 py-2 rounded-full border text-sm transition-colors ${activo ? "bg-green-900 text-white border-green-900" : "bg-stone-100 text-stone-600 border-stone-200 hover:border-green-700"}`}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 flex flex-col gap-6">
        <div>
          <p className="text-[11px] font-semibold text-green-700 tracking-widest mb-3">TIPO DE CAFÉ</p>
          <div className="flex flex-wrap gap-2">
            {tiposDisponibles.length === 0 && <p className="text-xs text-stone-400">Sin categorías aún</p>}
            {tiposDisponibles.map(t => <Chip key={t} label={t} activo={local.tipo === t} onClick={() => toggle("tipo", t)} />)}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-green-700 tracking-widest mb-3">DISPONIBILIDAD</p>
          <div className="flex flex-wrap gap-2">
            {dispFiltro.map(d => <Chip key={d} label={d} activo={local.disp === d} onClick={() => toggle("disp", d)} />)}
          </div>
        </div>
        <div className="flex justify-between pt-2 border-t border-stone-100">
          <button onClick={onClose} className="text-2xl text-stone-400 hover:text-stone-600 px-6">✕</button>
          <button onClick={() => { setFiltros(local); onClose(); }} className="text-2xl text-green-800 hover:text-green-600 px-6">✓</button>
        </div>
      </div>
    </div>
  );
}

// ── CARRITO LATERAL ───────────────────────────────────────
function CarritoDrawer({ carrito, setCarrito, onClose }) {
  const navigate = useNavigate()
  const { sincronizarCarrito } = useCarrito()
  
  const irACarrito = () => {
    sincronizarCarrito(carrito)
    onClose()
    navigate('/carrito')
  }

  const irACotizacion = () => {
    sincronizarCarrito(carrito)
    onClose()
    navigate('/cotizacion')
  }
  
  const cambiarCant = (id, delta) => {
    setCarrito(prev => prev.map(x => x.id === id ? { ...x, cant: Math.max(1, (x.cant || 1) + delta) } : x));
  };
  const subtotal = carrito.reduce((s, x) => s + x.precio * (x.cant || 1), 0);
  const descuento = Math.round(subtotal * 0.15);
  const total = subtotal - descuento;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="bg-white w-full max-w-sm flex flex-col h-full">
        {/* header */}
        <div className="bg-green-900 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white text-lg font-semibold">Mi carrito</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-green-300 text-sm">{carrito.length} productos</p>
            <button onClick={onClose} className="text-white text-xl">✕</button>
          </div>
        </div>
        {/* items */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 px-5">
          {carrito.length === 0 && (
            <p className="text-center text-stone-400 text-sm py-10">Tu carrito está vacío.</p>
          )}
          {carrito.map(p => (
            <div key={p.id} className="py-4 flex gap-3 items-center">
                <img src={p.img} alt={p.nombre} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none" }} />              <div className="flex-1">
                <p className="text-sm font-semibold text-green-950">{p.nombre}</p>
                <p className="text-xs text-stone-400">{p.cant || 1} kg · ${p.precio.toLocaleString("es-CO")}/kg</p>
                <p className="text-sm font-bold text-green-700">${((p.cant||1)*p.precio).toLocaleString("es-CO")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => cambiarCant(p.id, -1)} className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 text-lg flex items-center justify-center hover:bg-stone-200">−</button>
                <span className="text-sm font-semibold w-5 text-center">{p.cant || 1}</span>
                <button onClick={() => cambiarCant(p.id, +1)} className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 text-lg flex items-center justify-center hover:bg-stone-200">+</button>
              </div>
            </div>
          ))}
        </div>
        {/* totales */}
        <div className="px-5 pb-6 pt-3 border-t border-stone-100">
          <div className="flex justify-between text-sm text-stone-400 mb-1"><span>Subtotal</span><span>${subtotal.toLocaleString("es-CO")}</span></div>
          <div className="flex justify-between text-sm text-green-600 mb-1"><span>Descuento VIP 15%</span><span>−${descuento.toLocaleString("es-CO")}</span></div>
          <div className="flex justify-between text-sm text-stone-400 mb-3"><span>Envío</span><span className="text-green-600">Gratis</span></div>
          <div className="flex justify-between text-lg font-bold text-green-950 border-t border-stone-100 pt-3 mb-4">
            <span>Total</span><span>${total.toLocaleString("es-CO")}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={irACotizacion}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm flex items-center justify-center gap-2 hover:bg-stone-50 cursor-pointer"
            >
              🧾 Cotización
            </button>
            <button
              onClick={irACarrito}
              className="flex-1 py-3 rounded-xl bg-green-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-800 cursor-pointer"
            >
              💳 Pagar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DETALLE PRODUCTO ──────────────────────────────────────
function DetalleProducto({ p, onClose, onAgregar }) {
  const [cant, setCant] = useState(1);
  const precioVol = cant <= 5 ? p.precio : cant <= 20 ? Math.round(p.precio * 0.91) : Math.round(p.precio * 0.84);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col sm:flex-row overflow-hidden max-h-[90vh]">
        {/* imagen */}
        <div className="sm:w-1/2 h-56 sm:h-auto bg-stone-100 relative">
          <img src={p.img} alt={p.nombre} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none" }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-500 shadow hover:bg-stone-100">✕</button>        </div>
        {/* info */}
        <div className="sm:w-1/2 p-6 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-xs text-stone-400 mb-1">📍 {p.origen}</p>
            <h2 className="text-2xl font-semibold text-green-950">{p.nombre}</h2>
            <p className="text-sm text-stone-500 mt-2">{p.desc}</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-900">${precioVol.toLocaleString("es-CO")}</p>
            <p className="text-xs text-stone-400">por kilogramo · IVA incluido</p>
          </div>
          {/* precios por volumen */}
          <div>
            <p className="text-sm text-stone-500 mb-2">Precios por volumen</p>
            <div className="grid grid-cols-3 gap-2">
              {[["1–5 kg", p.precio], ["6–20 kg", Math.round(p.precio*0.91)], ["+20 kg", Math.round(p.precio*0.84)]].map(([label, pr]) => (
                <div key={label} className={`rounded-xl border p-2 text-center ${cant <= 5 && label === "1–5 kg" ? "border-green-700 bg-green-50" : cant <= 20 && label === "6–20 kg" ? "border-green-700 bg-green-50" : label === "+20 kg" && cant > 20 ? "border-green-700 bg-green-50" : "border-stone-200"}`}>
                  <p className="text-xs text-stone-400">{label}</p>
                  <p className="text-sm font-semibold text-green-900">${pr.toLocaleString("es-CO")}</p>
                </div>
              ))}
            </div>
          </div>
          {/* cantidad */}
          <div>
            <p className="text-sm text-stone-500 mb-2">Cantidad</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setCant(c => Math.max(1, c-1))} className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 text-xl flex items-center justify-center hover:bg-stone-200">−</button>
              <span className="text-lg font-semibold w-8 text-center">{cant}</span>
              <button onClick={() => setCant(c => c+1)} className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 text-xl flex items-center justify-center hover:bg-stone-200">+</button>
              <span className="text-stone-400 text-sm">kg</span>
            </div>
          </div>
          {/* botones */}
          <div className="flex gap-3">
            <button className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200">🛒−</button>
            <button onClick={() => { onAgregar({ ...p, cant }); onClose(); }}
              className="flex-1 h-12 rounded-xl bg-green-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-green-800">
              🛒+ Agregar al carrito
            </button>
          </div>
          {/* stock */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${stockColor[p.stockLabel]}`}></span>
              <span className="text-stone-500">{p.stockLabel} · {p.stock} kg disponibles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PRODUCTO CARD ─────────────────────────────────────────
function ProductoCard({ p, onAgregar, onVerDetalle }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* imagen */}
      <div className="relative h-44 bg-stone-100 cursor-pointer" onClick={() => onVerDetalle(p)}>
          <img src={p.img} alt={p.nombre} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none" }} />        {p.badge && (
          <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full ${badgeColor[p.badge] || "bg-stone-500 text-white"}`}>
            ★ {p.badge}
          </span>
        )}
      </div>
      {/* body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-stone-400 flex items-center gap-1">📍 {p.origen}</p>
          <p className="text-sm font-semibold text-green-950 mt-0.5 leading-tight cursor-pointer hover:text-green-700" onClick={() => onVerDetalle(p)}>{p.nombre}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-green-900">${p.precio.toLocaleString("es-CO")}</p>
          <p className="text-[10px] text-stone-400">por kg · desde 10kg</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${stockColor[p.stockLabel]}`}></span>
          <span className={`text-xs ${p.stockLabel === "Agotado" ? "text-red-400" : p.stockLabel === "Stock bajo" ? "text-amber-500" : "text-green-600"}`}>
            {p.stockLabel} {p.stock > 0 ? `· ${p.stock} kg` : ""}
          </span>
        </div>
        {/* botones */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => !p.disponible || onAgregar({ ...p, cant: 1 })}
            disabled={!p.disponible}
            className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 disabled:opacity-40 text-sm"
          >🛒−</button>
          <button
            onClick={() => !p.disponible || onAgregar({ ...p, cant: 1 })}
            disabled={!p.disponible}
            className="flex-1 h-9 rounded-xl bg-green-900 text-white text-xs font-semibold flex items-center justify-center gap-1 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >🛒+</button>
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────
function Catalogo() {
  const navigate = useNavigate()

  const [mensajeExito, setMensajeExito] = useState("");
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
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Traer productos desde el backend Express/Supabase ──
  useEffect(() => {
    let cancelado = false;

async function cargarProductos() {
  try {
    setCargando(true);
    setError(null);
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    const json = await res.json();

    // Los productos vienen en json.data
    if (!json.ok) throw new Error(json.mensaje);
    if (!cancelado) {
      setProductos(json.data.map(adaptarProducto));
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

  const agregar = (p) => {
    setCarrito(prev => {
      const existe = prev.find(x => x.id === p.id);
      if (existe) return prev.map(x => x.id === p.id ? { ...x, cant: (x.cant||1) + (p.cant||1) } : x);
      return [...prev, { ...p, cant: p.cant || 1 }];
    });
    setMensajeExito(`✓ ${p.nombre} agregado al carrito`);
    setTimeout(() => setMensajeExito(""), 2500);
  };

  const tiposDisponibles = [...new Set(productos.map(p => p.tipo))].filter(Boolean);

  const filtrados = productos.filter(p => {
    const matchBus  = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = !filtros.tipo || p.tipo === filtros.tipo;
    const matchDisp = !filtros.disp || p.stockLabel === filtros.disp;
    return matchBus && matchTipo && matchDisp;
  });

  const masVendidos = [...productos].sort((a, b) => b.stock - a.stock).slice(0, 4);
  const promociones = productos.filter(p => p.badge === "Oferta");

  const totalCarrito = carrito.length;

  return (
    <div className="min-h-screen bg-[#f5f0e8] font-sans">

      <Navbar />
      
      

      {/* HERO */}
      <div className="bg-[#1e3a10] px-6 pt-8 pb-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif text-stone-100 leading-tight">El mejor café directo<br/>al productor</h1>
            <p className="text-stone-400 text-sm mt-2">Variedades especiales · Envío a todo Colombia · Precios B2B</p>
          </div>
          <div className="flex gap-4 shrink-0">
            {[[String(productos.length),"Productos"],[String(tiposDisponibles.length),"Variedades"],["100%","Colombiano"]].map(([n,l]) => (
              <div key={l} className="text-center px-5 py-3 border border-white/20 rounded-xl">
                <p className="text-2xl font-semibold text-green-400">{n}</p>
                <p className="text-xs text-white/40 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARRA BÚSQUEDA */}
      <div className="bg-white border-b border-stone-200 px-6 py-3 flex items-center gap-4 max-w-full">
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 flex-1 max-w-sm">
          <span className="text-stone-400">🔍</span>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, tipo de café..."
            className="flex-1 text-sm outline-none bg-transparent text-stone-700 placeholder-stone-400" />
        </div>
        <p className="text-sm text-stone-400 flex-1 text-center hidden sm:block">{filtrados.length} productos encontrados</p>
        <button onClick={() => setModalFiltros(true)}
          className="w-10 h-10 rounded-xl bg-green-900 text-white flex items-center cursor-pointer justify-center hover:bg-green-800 shrink-0">
          ⚙
        </button>
      </div>

      {/* ESTADOS DE CARGA / ERROR */}
      {cargando && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-3xl mb-2">☕</p>
          <p className="text-sm">Cargando productos...</p>
        </div>
      )}

      {!cargando && error && (
        <div className="text-center py-20 text-red-400">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-sm">No se pudo conectar con el servidor: {error}</p>
          <p className="text-xs text-stone-400 mt-1">Verifica que tu backend esté corriendo en {API_URL}</p>
        </div>
      )}

      {!cargando && !error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">

          {/* SECCIÓN DESTACADOS */}
          <div>
            <h2 className="text-2xl font-serif text-green-950 mb-1">Productos destacados</h2>
            <p className="text-sm text-stone-400 mb-4">Promociones · Novedades · Más vendidos</p>
            {/* tabs */}
            <div className="flex gap-6 border-b border-stone-200 mb-5">
              {[["masVendidos","Más vendidos"],["promociones","Promociones"]].map(([val, label]) => (
                <button key={val} onClick={() => setTabDestacados(val)}
                  className={`text-sm pb-2 border-b-2 transition-colors ${tabDestacados === val ? "border-green-800 text-green-900 font-medium" : "border-transparent text-stone-400 hover:text-stone-600"}`}>
                  {label}
                </button>
              ))}
            </div>
            {/* grid destacados - 1 grande + 2x2 pequeñas */}
            {(() => {
              const lista = tabDestacados === "masVendidos" ? masVendidos : promociones;
              if (lista.length === 0) return <p className="text-stone-400 text-sm">No hay productos en esta categoría.</p>;
              const [primero, ...resto] = lista;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* card grande */}
                  <div className="sm:row-span-2 bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetalle(primero)}>
                    <div className="relative h-64 sm:h-80 bg-stone-100">
                        <img src={primero.img} alt={primero.nombre} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none" }} />
                        {primero.badge && <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full ${badgeColor[primero.badge]}`}>★ {primero.badge}</span>}                    </div>
                    <div className="p-4">
                      <p className="text-xs text-stone-400">📍 {primero.origen}</p>
                      <p className="text-base font-semibold text-green-950 mt-1">{primero.nombre}</p>
                      <p className="text-xl font-bold text-green-900 mt-2">${primero.precio.toLocaleString("es-CO")}</p>
                      <p className="text-[10px] text-stone-400">por kg · desde 10kg</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`w-2 h-2 rounded-full ${stockColor[primero.stockLabel]}`}></span>
                        <span className="text-xs text-green-600">{primero.stockLabel} · {primero.stock} kg</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center text-sm">🛒−</button>
                        <button onClick={e => { e.stopPropagation(); agregar({...primero, cant:1}); }} className="flex-1 h-9 rounded-xl bg-green-900 text-white text-xs font-semibold flex items-center justify-center gap-1 hover:bg-green-800">🛒+</button>
                      </div>
                    </div>
                  </div>
                  {/* cards pequeñas */}
                  {resto.slice(0,4).map(p => (
                    <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetalle(p)}>
                      <div className="relative h-36 bg-stone-100">
                        <img src={p.img} alt={p.nombre} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none" }} />                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-green-950">{p.nombre}</p>
                        <p className="text-xs text-green-600 mt-0.5">${p.precio.toLocaleString("es-CO")} · {p.stockLabel}</p>
                        <div className="flex gap-2 mt-2">
                          <button className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center text-xs">🛒−</button>
                          <button onClick={e => { e.stopPropagation(); agregar({...p, cant:1}); }} className="flex-1 h-8 rounded-lg bg-green-900 text-white text-xs font-semibold flex items-center justify-center hover:bg-green-800">🛒+</button>
                        </div>
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
              <h2 className="text-xl font-serif text-green-950">Todos los productos</h2>
              <p className="text-sm text-stone-400">{filtrados.length} productos</p>
            </div>
            {filtrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtrados.map(p => (
                  <ProductoCard key={p.id} p={p} onAgregar={agregar} onVerDetalle={setDetalle} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-stone-400">
                <p className="text-3xl mb-2">☕</p>
                <p className="text-sm">No se encontraron productos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALES */}
      {modalFiltros && <ModalFiltros filtros={filtros} setFiltros={setFiltros} onClose={() => setModalFiltros(false)} tiposDisponibles={tiposDisponibles} />}
      {carritoOpen  && <CarritoDrawer carrito={carrito} setCarrito={setCarrito} onClose={() => setCarritoOpen(false)} />}
      {detalle      && <DetalleProducto p={detalle} onClose={() => setDetalle(null)} onAgregar={agregar} />}
    </div>
  );
}

export default Catalogo;