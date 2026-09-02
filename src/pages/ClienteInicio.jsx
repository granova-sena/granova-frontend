import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import registerBg from '../assets/register-bg.mp4'
import ImagenProducto from '../components/ImagenProducto'
import MapaFincas from '../components/MapaFincas'
import { SkeletonCard } from '../components/ui/Skeleton'
import FadeIn from '../components/ui/FadeIn'
import AuroraBackground from '../components/AuroraBackground'
import { calcularNivel } from '../utils/lealtad'

import { API_URL } from "../config";



function saludoSegunHora() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const VALORES = [
  {
    titulo: 'Origen verificado',
    descripcion: 'Cada lote viene directo de fincas colombianas registradas.',
    icono: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>),
  },
  {
    titulo: 'Tueste artesanal',
    descripcion: 'Lotes pequeños tostados esta semana, nunca de bodega.',
    icono: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    titulo: 'Envío a todo el país',
    descripcion: 'Empacado al vacío, en tu puerta en 24-72 horas.',
    icono: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7v-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="7" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" /></svg>),
  },
  {
    titulo: 'Precio justo al caficultor',
    descripcion: 'Comprando aquí, pagas directo al productor, sin intermediarios.',
    icono: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1.4-5 3 2.2 3 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>),
  },
]

const ACCESOS = [
  { to: '/cliente/pedidos', titulo: 'Mis pedidos' },
  { to: '/cliente/promociones', titulo: 'Promociones' },
  { to: '/cliente/cuenta', titulo: 'Mi cuenta' },
]

const glass = { background: '#0F1D13', border: '1px solid rgba(255,255,255,0.08)' }

function ClienteInicio() {
  const navigate = useNavigate()
  const [destacados, setDestacados] = useState([])
  const [cargando, setCargando] = useState(true)

  const cliente = (() => {
    try {
      return JSON.parse(localStorage.getItem('cliente')) || {}
    } catch {
      return {}
    }
  })()

  const puntos = Number(cliente.puntos) || 0
  const nivel = calcularNivel(puntos)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        const res = await fetch(`${API_URL}/productos`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        const cafes = (data.data || []).filter(p => (p.categoria_producto || 'cafe') === 'cafe').slice(0, 2)
        const maquinas = (data.data || []).filter(p => p.categoria_producto === 'maquina').slice(0, 2)
        // Intercala café → máquina → café → máquina para mostrar ambos mundos
        const alternados = []
        for (let i = 0; i < Math.max(cafes.length, maquinas.length); i++) {
          if (cafes[i]) alternados.push(cafes[i])
          if (maquinas[i]) alternados.push(maquinas[i])
        }
        if (!cancelado) setDestacados(alternados)
      } catch {
        if (!cancelado) setDestacados([])
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  return (
    <div className="text-white" style={{ background: '#0a1a0a' }}>
      {/* HERO DE BIENVENIDA */}
      <section className="relative overflow-hidden min-h-[520px] flex items-end">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={registerBg} />
        <AuroraBackground />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0a] via-[#0a1a0a]/60 to-[#0a1a0a]/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1a0a]/50 via-transparent to-transparent"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12 sm:pb-16 w-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6FA98C]"></span>
            <span className="text-xs text-white/60 uppercase tracking-wide">{saludoSegunHora()}</span>
            {cliente.nombre && puntos > 0 && cliente.tipo_persona !== 'juridica' && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/60">
                <span>{nivel.icono}</span>
                <span>{puntos.toLocaleString('es-CO')} pts</span>
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-medium leading-tight tracking-tight text-white max-w-xl">
            {cliente.nombre ? <>Hola, {cliente.nombre} ☕</> : 'Bienvenido a Granova'}
          </h1>
          <p className="text-white/60 mt-4 max-w-md text-sm sm:text-base">
            Café colombiano de origen, tostado en lotes pequeños y enviado directo de la finca a tu mesa.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => navigate('/cliente/catalogo')}
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-[#6FA98C] text-white rounded-xl font-medium text-sm hover:bg-[#4F8A70] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0a]"
            >
              Ir al catálogo →
            </button>
            <button
              type="button"
              onClick={() => navigate('/cliente/promociones')}
              className="px-6 py-3 sm:py-3.5 rounded-xl font-medium text-sm text-white/80 hover:text-white transition"
              style={{ border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)' }}
            >
              Ver promociones
            </button>
          </div>
        </div>
      </section>

      {/* FRANJA DE VALORES */}
      <section className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4">
          {VALORES.map((v, i) => (
            <FadeIn key={v.titulo} delay={i * 0.1}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[#9DC9B4]" style={{ background: 'rgba(111,169,140,0.15)' }}>
                  {v.icono}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{v.titulo}</p>
                  <p className="text-white/45 text-xs mt-0.5 leading-relaxed">{v.descripcion}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* DESTACADOS DEL CATÁLOGO */}
      <FadeIn>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Del catálogo</span>
              <h2 className="text-xl sm:text-2xl font-medium text-white mt-1">Café y máquinas para ti</h2>
            </div>
            <button type="button" onClick={() => navigate('/cliente/catalogo')} className="text-sm text-white/60 hover:text-white shrink-0">
              Ver todo →
            </button>
          </div>

        {cargando && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} imageAspect="h-48" hasButton={false} />
            ))}
          </div>
        )}

        {!cargando && destacados.length === 0 && (
          <div className="p-8 rounded-2xl text-center" style={glass}>
            <p className="text-white/50 text-sm">No se pudo cargar el catálogo por ahora.</p>
          </div>
        )}

        {!cargando && destacados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {destacados.map((p, i) => {
              const esMaquina = p.categoria_producto === 'maquina'
              return (
                <div
                  key={p.id_producto}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver ${p.nombre} en el catálogo`}
                  onClick={() => navigate(esMaquina ? '/cliente/catalogo?seccion=maquinas' : '/cliente/catalogo')}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(esMaquina ? '/cliente/catalogo?seccion=maquinas' : '/cliente/catalogo') }}
                  style={{ ...glass, animationDelay: `${i * 70}ms` }}
                  className="anim-pop group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  <div className="h-48 bg-white/5 overflow-hidden">
                    <ImagenProducto src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-medium text-[#9DC9B4] uppercase tracking-wide">{esMaquina ? 'Máquina' : 'Café'}</p>
                    <p className="text-sm font-medium text-white mt-0.5 line-clamp-2">{p.nombre}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-white text-sm font-semibold">
                        ${Number(p.precio || 0).toLocaleString('es-CO')} <span className="text-white/40 font-normal text-xs">/{esMaquina ? 'und' : 'kg'}</span>
                      </p>
                      <span className="text-xs font-medium text-[#9DC9B4] group-hover:underline">Ver →</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
      </FadeIn>

      {/* FINCAS CERCANAS */}
      <FadeIn>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
          <div className="mb-6">
            <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Origen</span>
            <h2 className="text-xl sm:text-2xl font-medium text-white mt-1">Fincas cafeteras cerca de ti</h2>
            <p className="text-white/45 text-sm mt-1">Conoce de dónde viene tu café antes de comprarlo.</p>
          </div>
          <div className="anim-pop rounded-2xl overflow-hidden" style={glass}>
            <MapaFincas />
          </div>
        </section>
      </FadeIn>

      {/* ACCESOS SECUNDARIOS */}
      <FadeIn>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="anim-pop rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-3" style={{ ...glass, borderColor: 'rgba(255,255,255,0.1)' }}>
            {ACCESOS.map((a) => (
              <button
                type="button"
                key={a.to}
                onClick={() => navigate(a.to)}
                className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-white/[0.06] transition group"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <span className="text-sm font-medium text-white">{a.titulo}</span>
                <span className="text-white/30 group-hover:text-[#9DC9B4] group-hover:translate-x-0.5 transition-all">→</span>
              </button>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  )
}

export default ClienteInicio