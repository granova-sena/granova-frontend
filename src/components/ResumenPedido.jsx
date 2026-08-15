import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'

function ResumenPedido() {
  const navigate = useNavigate()
  const { subtotal, descuentoMonto, ivaMonto, total, DESCUENTO, IVA, esJuridica, tienePremio, unidadesFaltantes } = useCarrito()

  return (
    <div className="w-full lg:w-80 flex flex-col gap-4">

      {/* Tarjeta resumen */}
      <div className="rounded-xl overflow-hidden bg-[#0F1D13] border border-white/[0.08]">
        <div className="px-6 py-4 border-b border-white/[0.07]" style={{ background: '#0D1D13' }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Resumen del pedido
          </h2>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="text-sm text-white/60">Subtotal</span>
            <span className="text-sm text-white">${subtotal.toLocaleString()}</span>
          </div>
          {(esJuridica || tienePremio) && (
            <div className="flex justify-between">
              <span className="text-sm text-white/60">
                {esJuridica ? '🏢 Descuento empresa' : '🎉 Descuento'} {(DESCUENTO * 100).toFixed(0)}%
              </span>
              <span className="text-sm text-[#9DC9B4]">- ${descuentoMonto.toLocaleString()}</span>
            </div>
          )}
          {!esJuridica && !tienePremio && unidadesFaltantes > 0 && (
            <div className="text-xs text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/20 rounded-lg px-3 py-2">
              🔥 Lleva {unidadesFaltantes} producto{unidadesFaltantes === 1 ? '' : 's'} más y gana 10% en tu próxima compra
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-white/60">IVA {(IVA * 100).toFixed(0)}%</span>
            <span className="text-sm text-white">${ivaMonto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-white/[0.07] pt-3">
            <span className="text-sm font-semibold text-white">TOTAL</span>
            <span className="text-sm font-semibold text-white">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Botones */}
      <button
        type="button"
        onClick={() => navigate('/cliente/cotizacion')}
        className="w-full bg-[#0F1D13] border border-white/[0.08] text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#14291B] transition-colors"
      >
        💾 Generar cotización
      </button>
      <button
        type="button"
        onClick={() => navigate('/cliente/configurar-pedido')}
        className="w-full bg-[#6FA98C] text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4F8A70] transition-colors"
      >
        ⚙️ Configurar pedido
      </button>

      {/* Compra segura */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0F1D13] py-3 px-6 flex items-center justify-center gap-3">
        <span className="text-white/40">🛡️</span>
        <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Compra 100% Segura</span>
        <span className="text-white/40">🛡️</span>
      </div>

    </div>
  )
}

export default ResumenPedido
