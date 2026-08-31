import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { API_URL as BASE_API_URL } from "../config";
import FadeIn from "../components/ui/FadeIn";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ImagenProducto, adaptarProducto, eliminarDuplicados } from "./Catalogo";
import toast from "react-hot-toast";

const API_URL = `${BASE_API_URL}/productos`;

// Animación "volar": una miniatura del producto viaja desde el botón
// tocado hasta el panel de simulación, como feedback visual al agregar.
function volarProducto(producto, elementoOrigen) {
  try {
    const origen = elementoOrigen?.getBoundingClientRect?.();
    const destino = document.getElementById("panel-simulacion")?.getBoundingClientRect()
      || { left: window.innerWidth - 80, top: 100 };
    if (!origen) return;

    const volador = document.createElement("img");
    volador.src = producto.img || "/logoGranova.jpeg";
    volador.style.cssText = [
      "position: fixed",
      "z-index: 9999",
      "width: 44px",
      "height: 44px",
      "border-radius: 12px",
      "object-fit: cover",
      "border: 2px solid #6FA98C",
      "box-shadow: 0 8px 24px rgba(0,0,0,0.45)",
      "pointer-events: none",
      "transition: transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.55s ease",
      `left: ${origen.left + origen.width / 2 - 22}px`,
      `top: ${origen.top + origen.height / 2 - 22}px`,
      "transform: scale(0.85)",
      "opacity: 1",
    ].join(";");
    document.body.appendChild(volador);

    requestAnimationFrame(() => {
      const dx = destino.left + destino.width / 2 - (origen.left + origen.width / 2);
      const dy = destino.top + destino.height / 2 - (origen.top + origen.height / 2);
      volador.style.transform = `translate(${dx}px, ${dy}px) scale(0.35)`;
      volador.style.opacity = "0.15";
    });

    setTimeout(() => {
      volador.remove();
      const panel = document.getElementById("panel-simulacion");
      if (panel) {
        panel.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.025)" }, { transform: "scale(1)" }],
          { duration: 260, easing: "ease-out" }
        );
      }
    }, 580);
  } catch { /* silencioso */ }
}

// ── SIMULADOR DE COMPRA ────────────────────────────────────
// El cliente arma su pedido aquí SIN tocar el carrito real y ve al instante
// cuánto pagaría en total: aplica promociones por producto y el descuento
// que le convenga ("mayor gana": volumen vs empresa vs premio), igual que
// el carrito. Cuando le gusta el resultado, lo lleva al carrito con un clic.
function SimuladorInterno() {
  const navigate = useNavigate();
  const { agregarAlCarrito, esJuridica, tienePremio } = useCarrito();

  const [productos, setProductos] = useState([]);
  const [descuentosVolumen, setDescuentosVolumen] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Líneas del simulador: [{ key, p (producto adaptado), formatoSel, cant }]
  const [lineas, setLineas] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
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
    cargar();
    return () => { cancelado = true; };
  }, []);

  const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const resultadosBusqueda = useMemo(() => {
    const q = norm(busqueda.trim());
    const base = q ? productos.filter(p => norm(p.nombre).includes(q) || norm(p.tipo).includes(q) || norm(p.marca).includes(q)) : productos;
    return base.filter(p => p.disponible).slice(0, 30);
  }, [busqueda, productos]);

  // Precio unitario según formato elegido (el más barato por defecto)
  const formatoDe = (l) => (l.p.formatos.length > 0 ? l.p.formatos.find(f => f.id_formato === l.formatoSel) || l.p.formatos[0] : null);
  const precioUnitario = (l) => {
    const f = formatoDe(l);
    return f ? Number(f.precio) : l.p.precio;
  };

  // Formato por defecto: el más barato (gancho). La key usa ese mismo formato
  // para que "agregar de nuevo" sume a la línea correcta.
  const formatoDefault = (p) => (p.formatos.length > 0 ? [...p.formatos].sort((a, b) => a.precio - b.precio)[0] : null);

  function agregarProducto(p, elementoOrigen) {
    const fd = formatoDefault(p);
    const key = `${p.id}-${fd?.id_formato ?? "u"}`;
    setLineas(prev => {
      const existente = prev.find(l => l.key === key);
      if (existente) return prev.map(l => l.key === key ? { ...l, cant: Math.min(l.cant + 1, p.stock) } : l);
      return [...prev, {
        key,
        p,
        formatoSel: fd ? fd.id_formato : null,
        cant: 1,
      }];
    });
    volarProducto(p, elementoOrigen);
    toast.success(`${p.nombre} agregado a la simulación`, { id: `sim-${key}`, duration: 1600 });
  }

  function cambiarCant(key, delta) {
    setLineas(prev => prev.map(l => {
      if (l.key !== key) return l;
      const max = l.p.stock || 999;
      return { ...l, cant: Math.min(max, Math.max(1, l.cant + delta)) };
    }));
  }

  function cambiarFormato(key, idFormato) {
    setLineas(prev => prev.map(l => l.key === key ? { ...l, formatoSel: Number(idFormato) } : l));
  }

  function quitarLinea(key) {
    setLineas(prev => prev.filter(l => l.key !== key));
  }

  // ── TOTALES: misma lógica "mayor gana" que el carrito ──
  const kgTotales = lineas.reduce((s, l) => {
    const f = formatoDe(l);
    return s + (!l.p.esMaquina && f ? Number(f.peso_kg || 0) * l.cant : 0);
  }, 0);
  const tier = descuentosVolumen.find(t =>
    kgTotales >= Number(t.kg_min) && (t.kg_max === null || kgTotales <= Number(t.kg_max))
  );
  const volumenPct = tier ? Number(tier.descuento_pct) : 0;
  const fuentes = [
    { fuente: "volumen", pct: volumenPct },
    { fuente: "empresa", pct: esJuridica ? 10 : 0 },
    { fuente: "premio", pct: tienePremio && !esJuridica ? 10 : 0 },
  ].filter(f => f.pct > 0).sort((a, b) => b.pct - a.pct);
  const ganador = fuentes[0] || { fuente: null, pct: 0 };

  const subtotalBase = lineas.reduce((s, l) => s + precioUnitario(l) * l.cant, 0);
  const subtotalFinal = lineas.reduce((s, l) => {
    const pct = Math.max(Number(l.p.promoPct) || 0, ganador.pct);
    return s + Math.round(precioUnitario(l) * (1 - pct / 100)) * l.cant;
  }, 0);
  const ahorro = subtotalBase - subtotalFinal;

  function llevarAlCarrito() {
    lineas.forEach(l => {
      const f = formatoDe(l);
      const pct = Math.max(Number(l.p.promoPct) || 0, ganador.pct);
      agregarAlCarrito({
        id: l.p.id,
        nombre: l.p.nombre,
        presentacion: l.p.origen,
        precio: f ? Number(f.precio) : l.p.precio,
        cantidad: l.cant,
        img: l.p.img,
        unidad: l.p.unidad,
        id_formato: f ? f.id_formato : null,
        etiqueta_formato: f ? f.etiqueta : "",
        peso_kg: f ? f.peso_kg : null,
        promo_pct: pct > 0 ? pct : null,
        iva_pct: l.p.iva_pct,
      });
    });
    navigate("/cliente/carrito");
  }

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Encabezado */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#14291B] border border-[#6FA98C]/25 flex items-center justify-center text-xl">🧮</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>Simulador de compra</h1>
              <p className="text-sm text-white/40 mt-0.5">Arma tu pedido y mira cuánto pagarías antes de comprometerte</p>
            </div>
          </div>
        </FadeIn>

        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl bg-[#0F1D13] border border-white/[0.08] py-16 text-center">
            <p className="text-white/60 text-sm">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 h-10 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">Reintentar</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-8 items-start">

            {/* ── SELECTOR DE PRODUCTOS ── */}
            <div className="rounded-2xl bg-[#0F1D13] border border-white/[0.08] overflow-hidden">
              <div className="p-4 border-b border-white/[0.07]">
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar café o máquina..."
                  className="w-full h-10 px-4 rounded-xl bg-[#14291B] border border-white/10 text-sm outline-none placeholder-white/30 focus:border-[#6FA98C]/50 transition"
                />
              </div>
              <div className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.06]">
                {resultadosBusqueda.map(p => {
                  const base = p.formatos.length > 0 ? p.precioDesde : p.precio;
                  const promoPct = Number(p.promoPct) || 0;
                  const promoPrecio = promoPct > 0 ? Math.round(base * (1 - promoPct / 100)) : null;
                  const yaEsta = lineas.some(l => l.p.id === p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={(e) => agregarProducto(p, e.currentTarget)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${yaEsta ? "bg-[#6FA98C]/[0.07]" : "hover:bg-white/[0.04]"}`}
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#14291B] shrink-0">
                        <ImagenProducto src={p.img} alt={p.nombre} className="w-full h-full object-cover" />
                        {promoPct > 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-[#D85A30] text-white text-[7px] font-bold text-center py-[1px]">-{promoPct}%</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{p.nombre}</p>
                        {promoPrecio ? (
                          <p className="text-xs mt-0.5">
                            <span className="line-through text-white/25">${base.toLocaleString("es-CO")}</span>{" "}
                            <span className="text-[#9DC9B4] font-semibold">${promoPrecio.toLocaleString("es-CO")}</span>{" "}
                            <span className="text-[#D85A30] font-semibold">-{promoPct}%</span>
                          </p>
                        ) : (
                          <p className="text-xs text-white/35 mt-0.5">${base.toLocaleString("es-CO")} · {p.stockLabel}</p>
                        )}
                      </div>
                      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition ${yaEsta ? "bg-[#6FA98C] text-white" : "bg-white/[0.07] text-white/50 hover:bg-[#6FA98C] hover:text-white"}`}>+</span>
                    </button>
                  );
                })}
                {resultadosBusqueda.length === 0 && (
                  <p className="py-10 text-center text-sm text-white/30">Sin resultados para "{busqueda}"</p>
                )}
              </div>
            </div>

            {/* ── PANEL DE SIMULACIÓN ── */}
            <div id="panel-simulacion" className="flex flex-col gap-4">

              {/* Líneas */}
              <div className="rounded-2xl bg-[#0F1D13] border border-white/[0.08] overflow-hidden">
                {lineas.length === 0 ? (
                  <div className="py-14 text-center">
                    <p className="text-3xl mb-3">🛒</p>
                    <p className="text-white/50 text-sm font-medium">Tu simulación está vacía</p>
                    <p className="text-white/30 text-xs mt-1">Toca los productos de la lista para ir armando tu pedido</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {lineas.map(l => {
                      const pu = precioUnitario(l);
                      const pctItem = Math.max(Number(l.p.promoPct) || 0, ganador.pct);
                      const puFinal = Math.round(pu * (1 - pctItem / 100));
                      return (
                        <li key={l.key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#14291B] shrink-0">
                            <ImagenProducto src={l.p.img} alt={l.p.nombre} className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{l.p.nombre}</p>
                            {l.p.formatos.length > 0 ? (
                              <select
                                value={l.formatoSel}
                                onChange={e => cambiarFormato(l.key, e.target.value)}
                                className="mt-1 h-7 px-2 rounded-lg bg-[#14291B] border border-white/10 text-xs text-white/70 outline-none focus:border-[#6FA98C]/50 cursor-pointer"
                              >
                                {l.p.formatos.map(fm => (
                                  <option key={fm.id_formato} value={fm.id_formato}>{fm.etiqueta} · ${Number(fm.precio).toLocaleString("es-CO")}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-white/35 mt-1">{l.p.origen}</p>
                            )}
                          </div>

                          {/* Cantidad */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => cambiarCant(l.key, -1)} disabled={l.cant <= 1} className="w-8 h-8 rounded-lg bg-[#14291B] border border-white/10 text-white/70 hover:bg-[#1B3624] disabled:opacity-30 transition">−</button>
                            <span className="w-9 text-center text-sm font-semibold">{l.cant}</span>
                            <button type="button" onClick={() => cambiarCant(l.key, +1)} disabled={l.cant >= (l.p.stock || 999)} className="w-8 h-8 rounded-lg bg-[#14291B] border border-white/10 text-white/70 hover:bg-[#1B3624] disabled:opacity-30 transition">+</button>
                          </div>

                          {/* Precio línea */}
                          <div className="text-right shrink-0 sm:w-28">
                            {puFinal !== pu ? (
                              <>
                                <span className="block text-xs text-white/30 line-through">${(pu * l.cant).toLocaleString("es-CO")}</span>
                                <span className="text-sm font-semibold text-[#9DC9B4]">${(puFinal * l.cant).toLocaleString("es-CO")}</span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-white">${(pu * l.cant).toLocaleString("es-CO")}</span>
                            )}
                          </div>

                          <button type="button" onClick={() => quitarLinea(l.key)} aria-label="Quitar" className="shrink-0 w-8 h-8 rounded-lg text-white/40 hover:text-[#D85A30] hover:bg-[#D85A30]/10 transition flex items-center justify-center">✕</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Totales */}
              {lineas.length > 0 && (
                <FadeIn>
                <div className="rounded-2xl bg-gradient-to-br from-[#14291B] to-[#0F1D13] border border-[#6FA98C]/25 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-white/50">
                        <span>Total lista:</span>
                        <span className="line-through">${subtotalBase.toLocaleString("es-CO")}</span>
                      </div>
                      {ahorro > 0 && (
                        <div className="flex items-center gap-2 text-[#9DC9B4]">
                          <span>🎉 Ahorras:</span>
                          <span className="font-semibold">-${ahorro.toLocaleString("es-CO")}</span>
                        </div>
                      )}
                      {ganador.fuente && (
                        <p className="text-xs text-white/40 max-w-xs">
                          Descuento aplicado: <span className="text-[#9DC9B4]">-{ganador.pct}%</span> por{" "}
                          {ganador.fuente === "volumen" ? `compra por volumen (${kgTotales.toFixed(1)} kg)` :
                           ganador.fuente === "empresa" ? "tu cuenta empresarial" : "tu premio acumulado"}
                          {" "}(promociones individuales se aplican cuando superan este %)
                        </p>
                      )}
                      {!ganador.fuente && kgTotales > 0 && (
                        <p className="text-xs text-white/40 max-w-xs">Llevas {kgTotales.toFixed(1)} kg — los descuentos por volumen empiezan en {descuentosVolumen[0]?.kg_min || 0} kg</p>
                      )}
                      <p className="text-[11px] text-white/30">Todos los precios incluyen IVA</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-wide text-white/40 mb-1">Pagarías en total</p>
                      <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                        ${subtotalFinal.toLocaleString("es-CO")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button type="button" onClick={() => setLineas([])} className="flex-1 py-3 rounded-xl text-sm text-white/60 bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] transition">
                      Vaciar simulación
                    </button>
                    <button type="button" onClick={llevarAlCarrito} className="flex-[2] py-3 rounded-xl text-sm font-semibold bg-[#6FA98C] text-white hover:bg-[#4F8A70] active:scale-[0.98] transition">
                      🛒 Llevar al carrito ({lineas.reduce((s, l) => s + l.cant, 0)} artículos)
                    </button>
                  </div>
                </div>
                </FadeIn>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SimuladorCompra() {
  return <SimuladorInterno />;
}
