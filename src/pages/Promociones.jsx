import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from "../config";
import { leerParametro } from '../services/parametros';
import FadeIn from '../components/ui/FadeIn';

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

// Promociones REALES: todo lo que el backend de verdad aplica.
// Nada de descuentos fantasma — si aparece aquí, se cobra así. 🚫👻
const BENEFICIOS = [
  { icono: IconoDescuento, titulo: 'Descuento para empresas', descripcion: 'Registra tu NIT y obtén un descuento automático en todos tus pedidos, sin letra pequeña.', estado: 'Activo' },
  { icono: IconoTrofeo, titulo: 'Premio por compra al por mayor', descripcion: 'Compra 5 o más productos en un pedido y gana 10% de descuento para tu próxima compra.', estado: 'Activo' },
  { icono: IconoDescuento, titulo: 'Precios por volumen', descripcion: 'Entre más café lleves, más ahorras por kilo: 6–20 kg con 9% de descuento y más de 20 kg con 16%.', estado: 'Activo' },
  { icono: IconoRegalo, titulo: 'Cupones de lealtad', descripcion: 'Gana 1 punto por cada $1.000 en tus compras. Canjea puntos por cupones según tu nivel (Bronce, Plata, Oro).', estado: 'Activo' },
  { icono: IconoTrofeo, titulo: 'Programa de fidelidad', descripcion: 'Sube de nivel con tus compras: 🥉 Bronce → 🥈 Plata → 🥇 Oro. Tus puntos se acumulan siempre.', estado: 'Activo' },
  { icono: IconoDescuento, titulo: 'Producto del día', descripcion: 'Cada día un café destacado con 20% de descuento. Válido solo durante ese día.', estado: 'Activo' },
  { icono: IconoEnvio, titulo: 'Envío a todo el país', descripcion: 'Coordinamos la entrega de tu café directo desde la finca hasta tu puerta.', estado: 'Activo' },
]

function Promociones() {
  const navigate = useNavigate()
  const [promos, setPromos] = useState([])

  const esJuridica = (() => {
    try {
      return JSON.parse(localStorage.getItem('cliente'))?.tipo_persona === 'juridica'
    } catch {
      return false
    }
  })()

  // Las personas jurídicas tienen 10% fijo: no participan de lealtad ni cupones
  const beneficiosVisibles = esJuridica
    ? BENEFICIOS.filter(b => b.titulo !== 'Cupones de lealtad' && b.titulo !== 'Programa de fidelidad' && b.titulo !== 'Premio por compra al por mayor')
    : BENEFICIOS

  // Campañas activas: vienen de la BD (tabla promociones). Lo que se anuncia
  // aquí, de verdad está activo — cero promociones fantasma. 🚫👻
  useEffect(() => {
    fetch(`${API_URL}/api/promociones`)
      .then(res => res.json())
      .then(json => {
        if (json.ok) setPromos(json.data || [])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Beneficios Granova</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2 mb-2 tracking-tight">Promociones</h1>
        <p className="text-white/50 text-sm mb-8 sm:mb-10 max-w-xl">
          Estas son las ventajas reales que tienes como cliente Granova. Todo descuento que ves aquí, el sistema lo aplica.
        </p>

        {/* CAMPAÑAS ACTIVAS (tabla promociones) */}
        {promos.length > 0 && (
          <FadeIn>
            <div className="mb-10">
              <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Campañas activas</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {promos.map(promo => {
                  const fin = new Date(promo.fecha_fin)
                  return (
                    <div key={promo.id_promocion} className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-[#D85A30]/30 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-white font-semibold text-sm">🏷️ {promo.nombre}</p>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#D85A30] text-white shrink-0">-{Number(promo.descuento_pct)}%</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Válida hasta el {fin.toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
                      </p>
                      {Array.isArray(promo.productos) && promo.productos.length > 0 && (
                        <p className="text-xs text-[#9DC9B4] mt-2 leading-relaxed">
                          Aplica en: {promo.productos.join(", ")}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </FadeIn>
        )}

        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Beneficios permanentes</span>

        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {beneficiosVisibles.map((b) => {
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
        </FadeIn>

        <FadeIn>
          <div className="mt-6 p-6 sm:p-8 rounded-2xl text-center bg-[#6FA98C]">
            <p className="text-white font-medium mb-1">¿Listo para aprovechar tus descuentos?</p>
            <p className="text-white/50 text-sm mb-5">{esJuridica ? `Tu ${leerParametro('descuento_empresa_pct', 15)}% de empresa ya está activo — el mejor descuento se aplica solo.` : 'Elige tu formato, compra al por mayor o canjea tus puntos — el mejor descuento se aplica solo.'}</p>
            <button
              type="button"
              onClick={() => navigate('/cliente/catalogo')}
              className="px-6 py-3 bg-white/[0.08] backdrop-blur-xl text-white rounded-xl text-sm font-medium hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0a]"
            >
              Ir al catálogo
            </button>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}

export default Promociones
