import { useCarrito } from '../context/CarritoContext'

function FilaProducto({ id, imagen, nombre, presentacion, precio }) {
  const { aumentarCantidad, disminuirCantidad, eliminarProducto, productos } = useCarrito()
  
  const producto = productos.find(p => p.id === id)
  const cantidad = producto?.cantidad ?? 0

  return (
    <div className="grid grid-cols-3 px-6 py-5 border-b border-[#E7E7E7] items-center">

      {/* Producto */}
      <div className="flex items-center gap-4">
        <img src={imagen} alt={nombre} className="w-14 h-14 rounded-lg object-cover" />
        <div>
          <p className="text-sm font-medium text-[#010101]">{nombre}</p>
          <p className="text-xs text-[#888888]">{presentacion}</p>
        </div>
      </div>

      {/* Precio */}
      <span className="text-sm text-[#010101]">{precio.toLocaleString()}$</span>

      {/* Cantidad */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => disminuirCantidad(id)}
          className="text-[#888888] hover:text-[#010101] text-lg leading-none"
        >
          −
        </button>
        <span className="text-sm text-[#010101] w-4 text-center">{cantidad}</span>
        <button
          onClick={() => aumentarCantidad(id)}
          className="text-[#888888] hover:text-[#010101] text-lg leading-none"
        >
          +
        </button>
        <button
          onClick={() => eliminarProducto(id)}
          className="ml-2 text-[#888888] hover:text-red-500 text-xs transition-colors"
        >
          ✕
        </button>
      </div>

    </div>
  )
}

export default FilaProducto