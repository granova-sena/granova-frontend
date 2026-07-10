import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'

function ResumenPedido() {
  const navigate = useNavigate()
  const { subtotal, descuentoMonto, ivaMonto, total, DESCUENTO, IVA } = useCarrito()

  return (
    <div className="w-80 flex flex-col gap-4">

      {/* Tarjeta resumen */}
      <div className="bg-white rounded-xl border border-[#E7E7E7] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E7E7]">
          <h2 className="text-sm font-semibold text-[#010101] uppercase tracking-wide">
            Resumen del pedido
          </h2>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="text-sm text-[#010101]">Subtotal</span>
            <span className="text-sm text-[#010101]">${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#010101]">Descuento {(DESCUENTO * 100).toFixed(0)}%</span>
            <span className="text-sm text-[#2D5A27]">- ${descuentoMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#010101]">IVA {(IVA * 100).toFixed(0)}%</span>
            <span className="text-sm text-[#010101]">${ivaMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-[#E7E7E7] pt-3">
            <span className="text-sm font-semibold text-[#010101]">TOTAL</span>
            <span className="text-sm font-semibold text-[#010101]">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Botones */}
      <button
        onClick={() => navigate('/cotizacion')}
        className="w-full bg-[#2D5A27] text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#215511] transition-colors"
      >
        💾 Generar cotización
      </button>
      <button
        onClick={() => navigate('/configurar-pedido')}
        className="w-full bg-[#3B2A0E] text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        ⚙️ Configurar Pedido
      </button>

      {/* Compra segura */}
      <div className="bg-white rounded-xl border border-[#E7E7E7] py-3 px-6 flex items-center justify-center gap-3">
        <span className="text-[#888888]">🛡️</span>
        <span className="text-xs font-semibold text-[#010101] uppercase tracking-widest">Compra 100% Segura</span>
        <span className="text-[#888888]">🛡️</span>
      </div>

    </div>
  )
}

export default ResumenPedido