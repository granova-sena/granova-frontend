import { Link } from 'react-router-dom'
import { leerParametro } from '../services/parametros'

function BannerEmpresas() {
  return (
    <section className="bg-[#0a1a0a] py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-green-800/40 bg-gradient-to-br from-green-950 to-black px-8 sm:px-12 py-10 sm:py-12 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] items-center gap-10">

            {/* Icono arriba en mobile */}
            <div className="flex md:hidden justify-center">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-black flex items-center justify-center">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v8" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v11" />
                  <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
                </svg>
              </div>
            </div>

            {/* Texto */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-700/50 bg-green-900/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9DC9B4]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v8" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v11" />
                  <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
                </svg>
                Granova Empresas
              </span>

              <h2 className="mt-5 text-4xl sm:text-5xl font-bold text-white leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                ¿Te registras como empresa?
              </h2>

              <p className="mt-4 max-w-lg text-white/60 leading-relaxed">
                Compra café para tu negocio con{' '}
                <span className="font-bold text-[#8fb996]">
                  {leerParametro('descuento_empresa_pct', 20)}% de descuento
                </span>{' '}
                en todas tus compras, facturación a nombre de tu empresa y atención preferencial. Crea tu cuenta empresarial con tu NIT en menos de un minuto.
              </p>

              <Link
                to="/registro-empresa"
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#8fb996] px-8 text-sm font-bold text-white shadow-lg transition hover:bg-[#7aa383] active:scale-[0.98]"
              >
                Registrar mi empresa →
              </Link>
            </div>

            {/* Icono desktop */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-48 h-48 rounded-2xl bg-white border-4 border-black flex items-center justify-center shadow-xl">
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v8" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v11" />
                  <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default BannerEmpresas