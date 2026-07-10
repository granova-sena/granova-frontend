import { useCarrito } from '../context/CarritoContext'
import FilaProducto from '../components/FilaProducto'
import ResumenPedido from '../components/ResumenPedido'

function CarritoPage() {
  const { productos } = useCarrito()

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 flex gap-8">

      {/* Columna izquierda */}
      <div className="flex-1">
        <h1 className="text-[#2D5A27] text-3xl font-bold mb-1">
          Tu carrito de compras
        </h1>
        <p className="text-[#888888] text-xs uppercase tracking-widest mb-6">
          ¡Revisa los productos que seleccionaste aquí! 🛒
        </p>

        <div className="bg-white rounded-xl border border-[#E7E7E7] overflow-hidden">

          {/* Encabezado */}
          <div className="grid grid-cols-3 px-6 py-4 border-b border-[#E7E7E7]">
            <span className="text-xs font-semibold text-[#888888] uppercase">Producto</span>
            <span className="text-xs font-semibold text-[#888888] uppercase">Precio</span>
            <span className="text-xs font-semibold text-[#888888] uppercase">Cantidad</span>
          </div>

          {/* Productos desde el Context */}
          {productos.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#888888]">
              No hay productos en el carrito.
            </div>
          ) : (
            productos.map(p => (
              <FilaProducto
                key={p.id}
                id={p.id}
                imagen="https://placehold.co/60x60/3B2A0E/FFFFFF?text=C"
                nombre={p.nombre}
                presentacion={p.presentacion}
                precio={p.precio}
              />
            ))
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E7E7E7] flex justify-between items-center">
            <button className="text-[#2D5A27] text-sm hover:underline">
              + Agregar más productos
            </button>
            <span className="text-[#888888] text-xl">🛒</span>
          </div>

        </div>
      </div>

      {/* Columna derecha */}
      <div className="w-80 flex-shrink-0 mt-24">
        <ResumenPedido />
      </div>

    </div>
  )
}

export default CarritoPage