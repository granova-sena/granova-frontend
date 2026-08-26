import { useCarrito } from '../context/CarritoContext'
import ImagenProducto from './ImagenProducto'

function FilaProducto({ id, imagen, nombre, presentacion, precio, unidad }) {
  const { aumentarCantidad, disminuirCantidad, eliminarProducto, productos } = useCarrito()

  const producto = productos.find(p => p.id === id)
  const cantidad = producto?.cantidad ?? 0

  return (
    <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-3 items-center gap-3 px-4 sm:px-6 py-5 border-b border-white/[0.07] last:border-b-0">

      {/* Producto */}
      <div className="flex items-center gap-4 min-w-0">
        <ImagenProducto src={imagen} alt={nombre} className="w-14 h-14 rounded-lg object-cover bg-[#14291B] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{nombre}</p>
          <p className="text-xs text-white/40 truncate">{presentacion}</p>
        </div>
      </div>

      {/* Precio */}
      <span className="text-sm text-white justify-self-end sm:justify-self-start">
        ${precio.toLocaleString('es-CO')} <span className="text-white/40 text-xs">/ {unidad || 'kg'}</span>
      </span>

      {/* Cantidad */}
      <div className="flex items-center justify-self-end gap-2">
        <div className="flex items-center bg-[#0B1810] border border-white/10 rounded-lg">
          <button
            type="button"
            onClick={() => disminuirCantidad(id)}
            className="w-8 h-8 text-white/60 hover:text-white text-base leading-none flex items-center justify-center rounded-l-lg hover:bg-white/[0.06] transition"
          >
            −
          </button>
          <span className="text-sm font-semibold text-white w-6 text-center">{cantidad}</span>
          <button
            type="button"
            onClick={() => aumentarCantidad(id)}
            className="w-8 h-8 text-white/60 hover:text-white text-base leading-none flex items-center justify-center rounded-r-lg hover:bg-white/[0.06] transition"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => eliminarProducto(id)}
          className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 text-white/40 hover:text-[#D85A30] hover:border-[#D85A30]/40 text-xs transition-colors flex items-center justify-center"
          aria-label={`Eliminar ${nombre} del carrito`}
        >
          ✕
        </button>
      </div>

    </div>
  )
}

export default FilaProducto
