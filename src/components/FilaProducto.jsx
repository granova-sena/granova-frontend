import { useCarrito } from '../context/CarritoContext'

function FilaProducto({ id, imagen, nombre, presentacion, precio }) {
  const { aumentarCantidad, disminuirCantidad, eliminarProducto, productos } = useCarrito()

  const producto = productos.find(p => p.id === id)
  const cantidad = producto?.cantidad ?? 0

  return (
    <div className="grid grid-cols-3 px-6 py-5 border-b border-white/10 items-center">

      {/* Producto */}
      <div className="flex items-center gap-4">
        <img src={imagen} alt={nombre} className="w-14 h-14 rounded-lg object-cover bg-white/10" />
        <div>
          <p className="text-sm font-medium text-white">{nombre}</p>
          <p className="text-xs text-white/40">{presentacion}</p>
        </div>
      </div>

      {/* Precio */}
      <span className="text-sm text-white">{precio.toLocaleString()}$</span>

      {/* Cantidad */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => disminuirCantidad(id)}
          className="text-white/40 hover:text-white text-lg leading-none transition"
        >
          −
        </button>
        <span className="text-sm text-white w-4 text-center">{cantidad}</span>
        <button
          onClick={() => aumentarCantidad(id)}
          className="text-white/40 hover:text-white text-lg leading-none transition"
        >
          +
        </button>
        <button
          onClick={() => eliminarProducto(id)}
          className="ml-2 text-white/40 hover:text-[#D85A30] text-xs transition-colors"
        >
          ✕
        </button>
      </div>

    </div>
  )
}

export default FilaProducto
