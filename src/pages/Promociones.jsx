import { useNavigate } from 'react-router-dom'

const IconoEnvio = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}><path d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7v-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="7" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" /></svg>
)
const IconoDescuento = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}><path d="M5 12l7-7h7v7l-7 7-7-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="14.5" cy="9.5" r="1.2" fill="currentColor" /></svg>
)
const IconoTrofeo = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}><path d="M8 4h8v5a4 4 0 01-8 0V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 5H5v2a3 3 0 003 3M16 5h3v2a3 3 0 01-3 3M10 15v3M14 15v3M8 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
)
const IconoRegalo = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}><rect x="4" y="9" width="16" height="11" rx="1" stroke="currentColor" strokeWidth="1.6" /><path d="M4 9h16M12 9v11M12 9C10 4 6 5 6 7s3 2 6 2zm0 0c2-5 6-4 6-2s-3 2-6 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
)

const BENEFICIOS = [
  { icono: IconoEnvio, titulo: 'Envío gratis', descripcion: 'Todos los pedidos dentro de Colombia llegan sin costo de envío, sin monto mínimo de compra.', estado: 'Activo' },
  { icono: IconoDescuento, titulo: 'Descuento VIP', descripcion: 'Como cliente registrado, tu carrito aplica automáticamente un 15% de descuento sobre el subtotal en cada compra.', estado: 'Activo' },
  { icono: IconoTrofeo, titulo: 'Programa de fidelidad', descripcion: 'Acumula beneficios por tus compras frecuentes y desbloquea precios preferenciales como cliente recurrente.', estado: 'Próximamente' },
  { icono: IconoRegalo, titulo: 'Códigos de descuento', descripcion: 'Cupones para ocasiones especiales y campañas puntuales, canjeables directamente en el catálogo.', estado: 'Próximamente' },
]

function Promociones() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Beneficios Granova</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2 mb-2 tracking-tight">Promociones</h1>
        <p className="text-white/50 text-sm mb-8 sm:mb-10 max-w-xl">
          Estas son las ventajas que ya tienes como cliente Granova, y lo que se viene próximamente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFICIOS.map((b) => {
            const Icono = b.icono
            const activo = b.estado === 'Activo'
            return (
              <div
                key={b.titulo}
                className={`p-6 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm transition ${activo ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activo ? 'bg-[#6FA98C]/10 text-[#9DC9B4]' : 'bg-white/10 text-white/40'}`}>
                    <Icono />
                  </div>
                  <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${activo ? 'text-[#9DC9B4] bg-[#6FA98C]/10' : 'text-white/45 bg-white/10'}`}>
                    {b.estado}
                  </span>
                </div>
                <p className="text-white font-semibold text-sm mb-1.5">{b.titulo}</p>
                <p className="text-white/50 text-xs leading-relaxed">{b.descripcion}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-6 sm:p-8 rounded-2xl text-center bg-[#6FA98C]">
          <p className="text-white font-medium mb-1">¿Listo para aprovechar tu 15% de descuento VIP?</p>
          <p className="text-white/50 text-sm mb-5">Se aplica automáticamente al agregar productos al carrito.</p>
          <button
            type="button"
            onClick={() => navigate('/cliente/catalogo')}
            className="px-6 py-3 bg-white/[0.08] backdrop-blur-xl text-white rounded-xl text-sm font-medium hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0a]"
          >
            Ir al catálogo
          </button>
        </div>
      </div>
    </div>
  )
}

export default Promociones