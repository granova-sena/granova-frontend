import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { API_URL as BASE_API_URL } from "../config";
import FadeIn from "../components/ui/FadeIn";
import { SkeletonCard } from "../components/ui/Skeleton";
import toast from "react-hot-toast";
import {
  ProductoCard,
  DetalleProducto,
  ModalConfirmarCantidad,
  adaptarProducto,
  eliminarDuplicados,
  cargarFavoritos,
  guardarFavoritos,
  cruzaUmbral,
} from "./Catalogo";

const API_URL = `${BASE_API_URL}/productos`;

function IconoCorazon({ className = "", width = 20, height = 20, lleno = false }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill={lleno ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function FavoritosInterno() {
  const navigate = useNavigate();
  const { cliente, sincronizarCarrito, productos: productosContexto } = useCarrito();
  const esJuridica = cliente?.tipo_persona === 'juridica';

  const [productos, setProductos] = useState([]);
  const [descuentosVolumen, setDescuentosVolumen] = useState([]);
  const [favoritos, setFavoritos] = useState(() => cargarFavoritos());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [confirmPendiente, setConfirmPendiente] = useState(null);
  const [carrito, setCarrito] = useState(() => {
    // Semilla desde el contexto (persistido) con los mismos campos que usa el catálogo
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito]);

  // Cargar productos del catálogo
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

  // Sincronizar carrito local con el contexto al montar
  // (el sync real ocurre en el useEffect de [carrito] con skip-mount)

  // Quitar de favoritos — misma firma que el catálogo (id + elemento para la animación)
  const toggleFavorito = (id) => {
    setFavoritos(prev => {
      const nuevo = new Set(prev);
      nuevo.delete(id);
      guardarFavoritos(nuevo);
      return nuevo;
    });
    toast("Eliminado de favoritos", { icon: "🤍", id: `fav-${id}` });
  };

  // Agregar al carrito — MISMA lógica de umbrales y modales que el catálogo:
  // sin stock → aviso; se pasa del stock → ofrece el resto; cruza umbral (10/50/100…) → confirma.
  const agregar = (p) => {
    const existente = carrito.find(x => x.id === p.id);
    const cantActual = existente?.cant || 0;
    const cantPedida = p.cant || 1;
    const total = cantActual + cantPedida;

    if (cantActual >= p.stock) {
      setConfirmPendiente({ tipo: "sinStock", producto: p });
      return;
    }

    if (total > p.stock) {
      const disponibleRestante = p.stock - cantActual;
      setConfirmPendiente({ tipo: "limitado", producto: p, disponibleRestante });
      return;
    }

    if (cruzaUmbral(cantActual, total)) {
      setConfirmPendiente({ tipo: "masDeUno", producto: p, total });
      return;
    }

    aplicarAgregar(p, cantPedida);
  };

  // Inserta definitivamente en el carrito local (el useEffect lo sube al contexto)
  const aplicarAgregar = (p, cantPedida) => {
    setCarrito(prev => prev.find(x => x.id === p.id)
      ? prev.map(x => x.id === p.id ? { ...x, cant: (x.cant || 1) + cantPedida } : x)
      : [...prev, { ...p, cant: cantPedida }]
    );
  };

  const favoritosLista = productos.filter(p => favoritos.has(p.id));

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Encabezado */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#14291B] border border-[#6FA98C]/25 flex items-center justify-center">
              <IconoCorazon className="text-[#9DC9B4]" width={20} height={20} lleno />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>Tus favoritos</h1>
              <p className="text-sm text-white/40 mt-0.5">Los productos que guardaste para después</p>
            </div>
          </div>
        </FadeIn>

        {/* Contenido */}
        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl bg-[#0F1D13] border border-white/[0.08] py-16 text-center">
            <p className="text-white/60 text-sm">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 h-10 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">
              Reintentar
            </button>
          </div>
        ) : favoritosLista.length > 0 ? (
          <>
            <p className="text-sm text-white/40 mt-8 mb-4">{favoritosLista.length} {favoritosLista.length === 1 ? "producto guardado" : "productos guardados"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoritosLista.map(p => (
                <ProductoCard
                  key={p.id}
                  p={p}
                  onAgregar={(prod) => agregar(prod)}
                  onVerDetalle={setDetalle}
                  cantidadEnCarrito={carrito.find(c => c.id === p.id)?.cant || 0}
                  esFavorito={favoritos.has(p.id)}
                  onToggleFavorito={toggleFavorito}
                  esJuridica={esJuridica}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-2xl bg-[#0F1D13] border border-white/[0.08] py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#14291B] flex items-center justify-center mb-3">
              <IconoCorazon className="text-white/25" width={22} height={22} />
            </div>
            <p className="text-white/60 text-sm font-medium">Aún no tienes productos favoritos.</p>
            <p className="text-white/40 text-xs mt-1">Toca el corazón ♥ de un producto en el catálogo para guardarlo aquí.</p>
            <Link to="/cliente/catalogo" className="inline-block mt-5 h-10 px-6 leading-10 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">
              Explorar el catálogo
            </Link>
          </div>
        )}
      </div>

      {/* Modal: mismo comportamiento de umbrales que el catálogo */}
      <ModalConfirmarCantidad
        data={confirmPendiente}
        onCancelar={() => setConfirmPendiente(null)}
        onAceptar={() => {
          const { tipo, producto, disponibleRestante } = confirmPendiente;
          if (tipo === "limitado") aplicarAgregar(producto, disponibleRestante);
          else if (tipo === "masDeUno") aplicarAgregar(producto, producto.cant || 1);
          setConfirmPendiente(null);
        }}
      />

      {detalle && (
        <DetalleProducto
          p={detalle}
          onClose={() => setDetalle(null)}
          onAgregar={(prod) => agregar(prod)}
          esFavorito={favoritos.has(detalle.id)}
          onToggleFavorito={toggleFavorito}
          descuentosVolumen={descuentosVolumen}
          esJuridica={esJuridica}
        />
      )}
    </div>
  );
}

export default function Favoritos() {
  return <FavoritosInterno />;
}
