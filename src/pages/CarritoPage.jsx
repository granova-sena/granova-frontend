import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import FilaProducto from '../components/FilaProducto'
import ResumenPedido from '../components/ResumenPedido'

function CarritoPage() {
  const navigate = useNavigate()
  const { productos } = useCarrito()

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-12">

        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#9DC9B4] text-sm mb-6 hover:underline">
          ← Volver
        </button>

        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Carrito</span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-2 mb-1 tracking-tight">
          Tu carrito de compras
        </h1>
        <p className="text-white/40 text-sm mb-8">
          Revisa los productos que seleccionaste aquí 🛒
        </p>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Columna izquierda */}
          <div className="flex-1">
            <div className="rounded-xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15">

              {/* Encabezado */}
              <div className="grid grid-cols-3 px-6 py-4 border-b border-white/10">
                <span className="text-xs font-semibold text-white/40 uppercase">Producto</span>
                <span className="text-xs font-semibold text-white/40 uppercase">Precio</span>
                <span className="text-xs font-semibold text-white/40 uppercase">Cantidad</span>
              </div>

              {/* Productos desde el Context */}
              {productos.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-white/40">
                  No hay productos en el carrito.
                </div>
              ) : (
                productos.map(p => (
                  <FilaProducto
                    key={p.id}
                    id={p.id}
                    imagen="https://placehold.co/60x60/1a2e1a/FFFFFF?text=C"
                    nombre={p.nombre}
                    presentacion={p.presentacion}
                    precio={p.precio}
                  />
                ))
              )}

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
                <button type="button" onClick={() => navigate('/cliente/catalogo')} className="text-[#9DC9B4] text-sm hover:underline">
                  + Agregar más productos
                </button>
                <span className="text-white/40 text-xl">🛒</span>
              </div>

            </div>
          </div>

          {/* Columna derecha */}
          <div className="w-full lg:w-80 shrink-0">
            <ResumenPedido />
          </div>

        </div>
      </div>
    </div>
  )
}

export default CarritoPage
