import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'

function ResumenPedido() {
  const navigate = useNavigate()
  const { subtotal, descuentoMonto, ivaMonto, total, DESCUENTO, IVA, esMayorista, unidadesFaltantes } = useCarrito()

  return (
    <div className="w-80 flex flex-col gap-4">

      {/* Tarjeta resumen */}
      <div className="rounded-xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Resumen del pedido
          </h2>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="text-sm text-white/60">Subtotal</span>
            <span className="text-sm text-white">${subtotal.toLocaleString()}</span>
          </div>
          {DESCUENTO > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-white/60">{esMayorista ? 'Descuento mayorista' : 'Descuento'} {(DESCUENTO * 100).toFixed(0)}%</span>
              <span className="text-sm text-[#9DC9B4]">- ${descuentoMonto.toLocaleString()}</span>
            </div>
          )}
          {unidadesFaltantes > 0 && (
            <div className="text-xs text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/20 rounded-lg px-3 py-2">
              🔥 Lleva {unidadesFaltantes} producto{unidadesFaltantes === 1 ? '' : 's'} más y obtén 6% de descuento
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-white/60">IVA {(IVA * 100).toFixed(0)}%</span>
            <span className="text-sm text-white">${ivaMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-sm font-semibold text-white">TOTAL</span>
            <span className="text-sm font-semibold text-white">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Botones */}
      <button
        type="button"
        onClick={() => navigate('/cliente/cotizacion')}
        className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/15 text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors"
      >
        💾 Generar cotización
      </button>
      <button
        type="button"
        onClick={() => navigate('/cliente/configurar-pedido')}
        className="w-full bg-[#6FA98C] text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4F8A70] transition-colors"
      >
        ⚙️ Configurar pedido
      </button>

      {/* Compra segura */}
      <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl py-3 px-6 flex items-center justify-center gap-3">
        <span className="text-white/40">🛡️</span>
        <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Compra 100% Segura</span>
        <span className="text-white/40">🛡️</span>
      </div>

    </div>
  )
}

export default ResumenPedido
