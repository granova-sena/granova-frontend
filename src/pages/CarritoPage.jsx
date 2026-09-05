import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import FilaProducto from '../components/FilaProducto'
import ResumenPedido from '../components/ResumenPedido'

const MAX_PREVIEW = 8

// ── CARRITO ────────────────────────────────────────────────
// Vista ligera estilo "compra rápida": primero una franja carrusel con
// los productos (sin botones de pago ni cotización), y un botón
// "Ver todo el carrito" que expande la lista completa con el resumen.
// Así el carrito no se rompe aunque tenga cientos de artículos.
function CarritoPage() {
  const navigate = useNavigate()
  const { productos, subtotal } = useCarrito()
  const [verTodo, setVerTodo] = useState(false)

  const resto = Math.max(0, productos.length - MAX_PREVIEW)
  const unidades = productos.reduce((s, p) => s + Number(p.cantidad || 1), 0)

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-12">

        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-[#9DC9B4] text-sm mb-6 hover:bg-white/[0.06] active:scale-[0.97] transition">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
          </svg>
          Volver
        </button>

        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Carrito</span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-2 mb-1 tracking-tight">
          Tu carrito de compras
        </h1>
        <p className="text-white/40 text-sm mb-8">
          Revisa los productos que seleccionaste aquí 🛒
        </p>

        {productos.length === 0 ? (
          <div className="rounded-2xl bg-[#0F1D13] border border-white/[0.08] py-20 text-center">
            <p className="text-4xl mb-4">🛒</p>
            <p className="text-white/60 text-sm font-medium">No hay productos en el carrito.</p>
            <button
              type="button"
              onClick={() => navigate('/cliente/catalogo')}
              className="mt-6 h-10 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition"
            >
              Explorar el catálogo
            </button>
          </div>
        ) : (
          <>
            {/* ── Franja carrusel (vista rápida) ── */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(111,169,140,0.5) transparent' }}>
              {productos.slice(0, MAX_PREVIEW).map(p => (
                <div
                  key={p.id}
                  className="snap-start shrink-0 w-44 rounded-2xl bg-[#0F1D13] border border-white/[0.08] p-3 flex flex-col gap-2"
                >
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-[#14291B] flex items-center justify-center">
                    {p.img ? (
                      <img src={p.img} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">☕</span>
                    )}
                  </div>
                  <div className="flex-1 min-h-0">
                    <p className="text-xs font-medium text-white leading-snug line-clamp-2">{p.nombre}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 line-clamp-1">{p.presentacion || p.etiqueta_formato || p.unidad}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-[#14291B] border border-white/10 text-white/70 rounded-md px-1.5 py-0.5">x{p.cantidad || 1}</span>
                    <span className="text-xs font-semibold text-white">${((p.precio || 0) * (p.cantidad || 1)).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              ))}
              {resto > 0 && (
                <button
                  type="button"
                  onClick={() => setVerTodo(true)}
                  className="snap-start shrink-0 w-44 rounded-2xl border border-dashed border-[#6FA98C]/40 bg-[#6FA98C]/[0.06] flex flex-col items-center justify-center gap-2 text-center p-3 hover:bg-[#6FA98C]/[0.12] transition"
                >
                  <span className="text-2xl font-bold text-[#9DC9B4]">+{resto}</span>
                  <span className="text-xs text-white/50">más en el carrito</span>
                  <span className="text-[10px] text-[#9DC9B4]">Ver todo →</span>
                </button>
              )}
            </div>

            {/* ── Barra resumen + botón expandir ── */}
            <div className="rounded-2xl bg-[#0F1D13] border border-white/[0.08] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-white/50">{unidades} {unidades === 1 ? 'artículo' : 'artículos'} en tu carrito</p>
                <p className="text-xl font-bold text-white mt-0.5">${subtotal.toLocaleString('es-CO')}</p>
                <p className="text-[11px] text-white/35">Todos los precios incluyen IVA</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/cliente/cotizacion')}
                  title="Generar cotización del carrito actual"
                  className="h-11 px-5 rounded-xl bg-[#0F1D13] border border-[#6FA98C]/40 text-[#9DC9B4] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#14291B] hover:text-white active:scale-[0.98] transition"
                >
                  💾 Cotización
                </button>
                <button
                  type="button"
                  onClick={() => setVerTodo(v => !v)}
                  className="h-11 px-6 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#4F8A70] active:scale-[0.98] transition"
                >
                  {verTodo ? 'Ocultar detalle' : 'Ver todo el carrito'} ({productos.length})
                </button>
              </div>
            </div>

            {/* ── Vista completa (se expande) ── */}
            {verTodo && (
              <div className="flex flex-col lg:flex-row gap-8 mt-8">
                <div className="flex-1">
                  <div className="rounded-xl overflow-hidden bg-[#0F1D13] border border-white/[0.08]">
                    <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-3 gap-3 px-4 sm:px-6 py-4 border-b border-white/[0.07]" style={{ background: '#0D1D13' }}>
                      <span className="text-xs font-semibold text-white/40 uppercase">Producto</span>
                      <span className="text-xs font-semibold text-white/40 uppercase">Precio</span>
                      <span className="text-xs font-semibold text-white/40 uppercase justify-self-end">Cantidad</span>
                    </div>
                    {productos.map(p => (
                      <FilaProducto
                        key={p.id}
                        id={p.id}
                        imagen={p.img}
                        nombre={p.nombre}
                        presentacion={p.presentacion}
                        precio={p.precio}
                        unidad={p.unidad}
                      />
                    ))}
                    <div className="px-4 sm:px-6 py-4 border-t border-white/[0.07] flex justify-between items-center" style={{ background: '#0D1D13' }}>
                      <button type="button" onClick={() => navigate('/cliente/catalogo')} className="text-[#9DC9B4] text-sm hover:underline">
                        + Agregar más productos
                      </button>
                      <span className="text-white/40 text-xl">🛒</span>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-80 shrink-0">
                  <ResumenPedido />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CarritoPage
