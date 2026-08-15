import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import registerBg from '../assets/register-bg.mp4'
import { API_URL } from "../config";
import AsistenteWidgetCliente from '../components/AsistenteWidgetCliente'

function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const oneTapInicializado = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const inicializarOneTap = () => {
      if (!window.google) return
      if (oneTapInicializado.current) return
      oneTapInicializado.current = true

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
                  const respuesta = await fetch(`${API_URL}/auth/google-onetap`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            })

            const datos = await respuesta.json()

            if (respuesta.ok) {
              localStorage.setItem('token', datos.token)
              localStorage.setItem('cliente', JSON.stringify(datos.cliente))
              navigate('/cliente')
            } else {
              toast.error(datos.error || 'No se pudo iniciar sesión con Google')
            }
          } catch (error) {
            console.error('Error en One Tap:', error)
          }
        },
      })

      window.google.accounts.id.prompt((notification) => {
        console.log('One Tap notification:', notification.getMomentType())
      })
    }

    if (window.google) {
      inicializarOneTap()
    } else {
      window.addEventListener('load', inicializarOneTap)
      return () => window.removeEventListener('load', inicializarOneTap)
    }
  }, [navigate])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a1a0a] text-white">

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a1a0a]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-[#E1F5EE] text-lg sm:text-xl font-medium tracking-tight">Granova</span>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#nosotros" className="text-sm text-white/70 hover:text-[#5DCAA5] transition">Productos</a>
            <a href="#nosotros" className="text-sm text-white/70 hover:text-[#5DCAA5] transition">Nosotros</a>
            <a href="#proceso" className="text-sm text-white/70 hover:text-[#5DCAA5] transition">Proceso</a>
          </div>

          {/* Botones desktop */}
          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={() => navigate('/login')} className="text-sm text-white/70 hover:text-white transition px-4 py-2">
              Iniciar sesión
            </button>
            <button type="button" onClick={() => navigate('/register')} className="text-sm bg-[#1D9E75] text-white px-4 py-2 rounded-lg hover:bg-[#0F6E56] transition">
              Comenzar gratis
            </button>
          </div>

          {/* Menú hamburguesa móvil */}
          <button
            type="button"
            className="md:hidden text-white/70 hover:text-white transition"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {menuAbierto && (
          <div className="md:hidden bg-[#0a1a0a]/95 backdrop-blur-md border-t border-white/10 px-4 py-4 flex flex-col gap-4">
            <a href="#nosotros" onClick={() => setMenuAbierto(false)} className="text-sm text-white/70 hover:text-[#5DCAA5] transition py-2">Productos</a>
            <a href="#nosotros" onClick={() => setMenuAbierto(false)} className="text-sm text-white/70 hover:text-[#5DCAA5] transition py-2">Nosotros</a>
            <a href="#proceso" onClick={() => setMenuAbierto(false)} className="text-sm text-white/70 hover:text-[#5DCAA5] transition py-2">Proceso</a>
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <button type="button" onClick={() => navigate('/login')} className="text-sm text-white/70 hover:text-white transition py-2 text-left">
                Iniciar sesión
              </button>
              <button type="button" onClick={() => navigate('/register')} className="text-sm bg-[#1D9E75] text-white px-4 py-2.5 rounded-lg hover:bg-[#0F6E56] transition text-center">
                Comenzar gratis
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={registerBg} />
        <div className="absolute inset-0 bg-[#0a1a0a]/70"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-6">
            <div className="w-2 h-2 bg-[#1D9E75] rounded-full animate-pulse"></div>
            <span className="text-xs text-white/80">Café colombiano de origen</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            <span>El mejor café</span>
            <span className="block text-[#1D9E75]">directo a ti</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            Conectamos fincas cafeteras colombianas con empresas y hogares que valoran la calidad real. Sin intermediarios, sin compromisos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <button type="button" onClick={() => navigate('/register')} className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#1D9E75] text-white rounded-xl font-medium text-sm hover:bg-[#0F6E56] transition-all duration-300 hover:scale-105">
              Comenzar gratis →
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('nosotros').scrollIntoView({ behavior: 'smooth' })}
              className="px-6 sm:px-8 py-3.5 sm:py-4 text-white rounded-xl font-medium text-sm transition-all duration-300 hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Ver productos
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* CONTADORES */}
      <section className="bg-[#1a2e1a] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center fade-up">
          {[
            { numero: "500+", label: "Lotes procesados" },
            { numero: "12", label: "Regiones cafeteras" },
            { numero: "98%", label: "Clientes satisfechos" },
            { numero: "24h", label: "Tiempo de entrega" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1D9E75]">{item.numero}</span>
              <span className="text-xs sm:text-sm text-white/60">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* POR QUÉ GRANOVA */}
      <section id="nosotros" className="py-16 sm:py-24 bg-[#0a1a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16 fade-up">
            <span className="text-xs text-[#1D9E75] uppercase tracking-widest">Por qué elegirnos</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">Café con propósito</h2>
            <p className="text-white/60 mt-4 max-w-xl mx-auto text-sm sm:text-base">Cada taza cuenta una historia. La nuestra empieza en las montañas colombianas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 fade-up">
            {[
              { icono: "☕", titulo: "Directo de la finca", descripcion: "Trazabilidad completa de cada lote. Sabes exactamente de qué finca, región y cosecha viene tu café." },
              { icono: "🌿", titulo: "100% colombiano", descripcion: "Trabajamos exclusivamente con fincas colombianas certificadas. Sin mezclas, sin rellenos, sin compromisos." },
              { icono: "🚀", titulo: "Entrega en 24 horas", descripcion: "Procesamos tu pedido el mismo día. El café fresco llega a tu puerta antes de que lo necesites." },
              { icono: "🔒", titulo: "Compra segura", descripcion: "Tu información está protegida. Pagos cifrados y datos guardados con los más altos estándares de seguridad." },
              { icono: "♻️", titulo: "Sostenible", descripcion: "Empaque biodegradable y procesos respetuosos con el medio ambiente en cada etapa de la cadena." },
              { icono: "🤝", titulo: "Comercio justo", descripcion: "Los caficultores reciben un precio justo por su trabajo. Comprar en Granova es apoyar al campo colombiano." },
            ].map((item, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl transition-all duration-300 hover:bg-white/5 group cursor-default" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-3xl sm:text-4xl mb-4 block">{item.icono}</span>
                <h3 className="text-white font-medium mb-2 text-sm sm:text-base group-hover:text-[#5DCAA5] transition">{item.titulo}</h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section id="proceso" className="py-16 sm:py-24 bg-[#1a2e1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16 fade-up">
            <span className="text-xs text-[#1D9E75] uppercase tracking-widest">Cómo funciona</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">Simple como una taza de café</h2>
            <p className="text-white/60 mt-4 max-w-xl mx-auto text-sm sm:text-base">En 4 pasos tienes el mejor café colombiano en tu puerta.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative fade-up">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-[#1D9E75]/30"></div>
            {[
              { numero: "01", icono: "🔍", titulo: "Elige tu café", descripcion: "Explora nuestro catálogo y selecciona el lote que más te guste" },
              { numero: "02", icono: "🛒", titulo: "Haz tu pedido", descripcion: "Agrega al carrito, personaliza la cantidad y confirma tu compra" },
              { numero: "03", icono: "✅", titulo: "Confirmamos", descripcion: "Revisamos tu pedido y lo preparamos con el mayor cuidado" },
              { numero: "04", icono: "📦", titulo: "Lo recibes", descripcion: "Tu café llega fresco a tu puerta en menos de 24 horas" },
            ].map((paso, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0a1a0a] border-2 border-[#1D9E75] flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 z-10">
                  {paso.icono}
                </div>
                <span className="text-xs text-[#1D9E75] font-mono mb-1 sm:mb-2">{paso.numero}</span>
                <h3 className="text-white font-medium mb-1 sm:mb-2 text-sm">{paso.titulo}</h3>
                <p className="text-xs text-white/50 leading-relaxed hidden sm:block">{paso.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 sm:py-24 bg-[#0a1a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1D9E75]/10 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center fade-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            <span>¿Listo para probar el</span>
            <span className="text-[#1D9E75]"> mejor café</span>?
          </h2>
          <p className="text-white/60 mb-8 sm:mb-10 text-base sm:text-lg max-w-2xl mx-auto">
            Únete a cientos de empresas y hogares que ya disfrutan del café colombiano más puro, directo desde la finca.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <button type="button" onClick={() => navigate('/register')} className="px-8 sm:px-10 py-3.5 sm:py-4 bg-[#1D9E75] text-white rounded-xl font-medium hover:bg-[#0F6E56] transition-all duration-300 hover:scale-105">
              Crear cuenta gratis →
            </button>
            <button type="button" onClick={() => navigate('/login')} className="px-8 sm:px-10 py-3.5 sm:py-4 text-white rounded-xl font-medium transition-all duration-300 hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a2e1a] py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 fade-up">
            <div className="col-span-2 md:col-span-1">
              <span className="text-[#E1F5EE] text-xl font-medium mb-4 block">Granova</span>
              <p className="text-sm text-white/50 leading-relaxed">Café colombiano de origen, directo de la finca a tu mesa.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Productos</h4>
              <ul className="space-y-2">
                {["Café en grano", "Café molido", "Máquinas de café", "Kits de degustación"].map((item, i) => (
                  <li key={i} className="text-xs sm:text-sm text-white/50 hover:text-[#5DCAA5] cursor-pointer transition">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Empresa</h4>
              <ul className="space-y-2">
                {["Sobre nosotros", "Fincas asociadas", "Sostenibilidad", "Contacto"].map((item, i) => (
                  <li key={i} className="text-xs sm:text-sm text-white/50 hover:text-[#5DCAA5] cursor-pointer transition">{item}</li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-white text-sm font-medium mb-4">Newsletter</h4>
              <p className="text-xs sm:text-sm text-white/50 mb-3">Recibe novedades y promociones exclusivas.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="tucorreo@ejemplo.com" className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
                <button type="button" className="px-3 py-2 bg-[#1D9E75] text-white rounded-lg text-sm hover:bg-[#0F6E56] transition">→</button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">© 2026 Granova. Todos los derechos reservados.</p>
            <div className="flex gap-4 sm:gap-6">
              {["Privacidad", "Términos", "Cookies"].map((item, i) => (
                <span key={i} className="text-xs text-white/40 hover:text-white/70 cursor-pointer transition">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Asistente de IA */}
      <AsistenteWidgetCliente />

    </div>
  )
}

export default Landing