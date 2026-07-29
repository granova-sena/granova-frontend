import { useNavigate } from 'react-router-dom'

const PASOS = [
  { titulo: 'Pedido confirmado', desc: 'Recibimos tu compra' },
  { titulo: 'En preparación', desc: 'Tostamos y empacamos' },
  { titulo: 'En camino', desc: 'Sale hacia tu ciudad' },
  { titulo: 'Entregado', desc: 'Café en tu puerta' },
]

function MisPedidos() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Historial</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2 mb-8 sm:mb-10 tracking-tight">Mis pedidos</h1>

        <div className="rounded-2xl p-10 sm:p-16 text-center bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-white/50 flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M4 7l8-4 8 4-8 4-8-4zm0 0v10l8 4m0-14v14m8-14v10l-8 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-white font-semibold mb-2">Aún no tienes pedidos</p>
          <p className="text-white/50 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            Cuando compres en el catálogo, cada pedido y su estado de envío aparecerán aquí.
          </p>
          <button
            onClick={() => navigate('/cliente/catalogo')}
            className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2"
          >
            Explorar catálogo
          </button>
        </div>

        {/* QUÉ ESPERAR: preview del proceso de pedido */}
        <div className="mt-6 rounded-2xl p-6 sm:p-8 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          <p className="text-sm font-semibold text-white mb-6">Así se ve un pedido en camino</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {PASOS.map((paso, i) => (
              <div key={paso.titulo} className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-white/10 text-white/40 text-[11px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                  {i < PASOS.length - 1 && <span className="hidden sm:block flex-1 h-px bg-white/10"></span>}
                </div>
                <p className="text-xs font-medium text-white/70">{paso.titulo}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MisPedidos