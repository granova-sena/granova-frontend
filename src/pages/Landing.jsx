import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useInView, animate } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import registerBg from '../assets/register-bg.mp4'
import LogoGranova from '../components/ui/LogoGranova'
import { API_URL } from "../config";
import { setClienteToken } from '../services/session'
import AsistenteWidgetCliente from '../components/AsistenteWidgetCliente'
import FadeIn, { StaggerContainer, StaggerItem } from '../components/ui/FadeIn'
import ImagenProducto from '../components/ImagenProducto'
import BannerEmpresas from '../components/BannerEmpresas'
import { useCarrito } from '../context/CarritoContext'

const EASE = [0.22, 1, 0.36, 1]

/* ── Contador que anima su número cuando entra en pantalla ── */
function ContadorAnimado({ valor, label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [mostrado, setMostrado] = useState(0)
  const m = String(valor).match(/^([\d.,]+)(.*)$/)
  const objetivo = m ? Number(m[1].replace(/\./g, '').replace(',', '.')) : 0
  const sufijo = m ? m[2] : ''

  useEffect(() => {
    if (!inView) return
    const controles = animate(0, objetivo, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => setMostrado(v),
    })
    return () => controles.stop()
  }, [inView, objetivo])

  const texto = `${Math.round(mostrado).toLocaleString('es-CO')}${sufijo}`

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-granova-400 tabular-nums">{texto}</span>
      <span className="text-xs sm:text-sm text-white/60">{label}</span>
    </div>
  )
}

/* ── Tarjeta "Por qué Granova" con spotlight que sigue el mouse ── */
function TarjetaValor({ icono, titulo, descripcion, i }) {
  const ref = useRef(null)
  const alMover = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    ref.current.style.setProperty('--sx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--sy', `${e.clientY - r.top}px`)
  }
  return (
    <div
      ref={ref}
      onMouseMove={alMover}
      className="relative overflow-hidden p-5 sm:p-6 rounded-2xl group transition-all duration-300 hover:-translate-y-1"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(320px circle at var(--sx,50%) var(--sy,50%), rgba(111,169,140,0.18), transparent 65%)' }}
      ></div>
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: (i % 3) * 0.6 }}
        className="text-3xl sm:text-4xl mb-4 block"
      >
        {icono}
      </motion.span>
      <h3 className="text-white font-medium mb-2 text-sm sm:text-base group-hover:text-granova-200 transition">{titulo}</h3>
      <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{descripcion}</p>
    </div>
  )
}

/* ── Paso del proceso interactivo (clic para expandir en móvil) ── */
function TarjetaPaso({ numero, icono, titulo, descripcion, i, activo, onClick }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="h-full cursor-pointer" onClick={onClick}>
      <div className={`flex flex-col items-center text-center relative h-full rounded-2xl p-3 sm:p-4 transition-all duration-300 ${activo ? 'bg-granova-400/[0.08] border border-granova-400/40' : ''}`}>
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-granova-ink border-2 flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 z-10"
          style={{ borderColor: activo ? '#6FA98C' : 'rgba(111,169,140,0.4)' }}
        >
          {icono}
        </motion.div>
        <span className="text-xs text-granova-400 font-mono mb-1 sm:mb-2">{numero}</span>
        <h3 className="text-white font-medium mb-1 sm:mb-2 text-sm">{titulo}</h3>
        <p className={`text-xs text-white/50 leading-relaxed ${activo ? 'block' : 'hidden'} sm:block`}>{descripcion}</p>
      </div>
    </motion.div>
  )
}

/* ── Carrusel de opiniones reales (Embla con autoplay) ── */
function Testimonios({ items }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true })
  const [activo, setActivo] = useState(0)
  const trackRef = useRef(null)

  useEffect(() => {
    if (!emblaApi) return
    const onSel = () => setActivo(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSel)
    onSel()
    return () => { emblaApi.off('select', onSel) }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const timer = setInterval(() => {
      if (trackRef.current && !trackRef.current.matches(':hover')) emblaApi.scrollNext()
    }, 4000)
    return () => clearInterval(timer)
  }, [emblaApi])

  return (
    <section className="py-16 sm:py-24 bg-granova-card overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex items-end justify-between mb-8 sm:mb-12"
        >
          <div>
            <span className="text-xs text-granova-400 uppercase tracking-widest">Reseñas reales</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Anterior"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 border border-white/15 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Siguiente"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 border border-white/15 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </motion.div>

        <div className="overflow-hidden -mx-2" ref={emblaRef}>
          <div className="flex" ref={trackRef}>
            {items.map((t, i) => (
              <div key={i} className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%] px-2 sm:px-3">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: EASE }}
                  className="h-full rounded-2xl bg-granova-card2 border border-white/10 p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map(s => (
                        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(t.calificacion) ? 'text-[#E8B931]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-white/35 truncate">{t.producto}</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">"{t.texto}"</p>
                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-granova-400/20 text-granova-200 flex items-center justify-center text-xs font-bold shrink-0">
                      {(t.nombre || 'C').slice(0, 1).toUpperCase()}
                    </div>
                    <span className="text-xs text-white/60 truncate">{t.nombre}</span>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Ir a opinión ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${activo === i ? 'w-6 bg-granova-400' : 'w-2 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

const HERO_VARIANTES = {
  hidden: { opacity: 0, y: 26 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.11, duration: 0.7, ease: EASE } }),
}

const CONTENEDOR_VARIANTES = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const TARJETA_VARIANTES = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

function Landing() {
  const navigate = useNavigate()
  const { sincronizarSesion, agregarAlCarrito } = useCarrito()
  const [scrolled, setScrolled] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const oneTapInicializado = useRef(false)

  const { scrollY, scrollYProgress } = useScroll()
  const barraProgreso = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const videoY = useTransform(scrollY, [0, 700], [0, 140])
  const videoScale = useTransform(scrollY, [0, 700], [1, 1.18])
  const contenidoOpacity = useTransform(scrollY, [0, 520], [1, 0.15])
  const contenidoY = useTransform(scrollY, [0, 520], [0, -60])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const inicializarOneTap = () => {
      try {
        if (!window.google?.accounts?.id) return
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
                setClienteToken(datos.token)
                localStorage.setItem('cliente', JSON.stringify(datos.cliente))
                await sincronizarSesion()
                navigate('/cliente')
              } else {
                toast.error(datos.error || 'No se pudo iniciar sesión con Google')
              }
            } catch (error) {
              console.error('Error en One Tap:', error)
            }
          },
        })

        try {
          window.google.accounts.id.prompt(() => {})
        } catch { /* One Tap no disponible en este navegador */ }
      } catch (error) {
        console.error('Error inicializando One Tap:', error)
      }
    }

    if (window.google?.accounts?.id) {
      inicializarOneTap()
    } else {
      window.addEventListener('load', inicializarOneTap)
      return () => window.removeEventListener('load', inicializarOneTap)
    }
  }, [navigate])

  const [productos, setProductos] = useState([])
  const [resenasMap, setResenasMap] = useState({})
  const [testimonios, setTestimonios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro] = useState('LO MÁS PEDIDO')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantModal, setCantModal] = useState(1)
  const [emailNews, setEmailNews] = useState('')
  const [newsOk, setNewsOk] = useState(false)
  const [pasoActivo, setPasoActivo] = useState(0)

  useEffect(() => {
    setCantModal(1)
  }, [productoSeleccionado])

  useEffect(() => {
    let cancelado = false
    async function cargarDatos() {
      try {
        // /productos es público y trae el catálogo.
        const res = await fetch(`${API_URL}/productos`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelado) return

        const lista = data.data || []
        setProductos(lista)

        // Valoración y reseñas reales por producto: /api/resenas/producto/:id
        // es público y devuelve promedio + comentarios (nada inventado).
        const visibles = lista.slice(0, 6)
        const resenas = {}
        const opinion = []
        await Promise.all(visibles.map(async (p) => {
          if (!p.id_producto) return
          try {
            const r = await fetch(`${API_URL}/api/resenas/producto/${p.id_producto}`)
            if (!r.ok) return
            const j = await r.json()
            resenas[String(p.id_producto)] = {
              promedio: Number(j.data?.promedio || 0),
              total: Number(j.data?.total_resenas || 0),
            }
            ;(j.data?.resenas || []).forEach((r2) => {
              if (r2.comentario && r2.comentario.trim()) {
                opinion.push({
                  texto: r2.comentario,
                  nombre: r2.cliente_nombre || 'Cliente Granova',
                  calificacion: Number(r2.calificacion) || 0,
                  fecha: r2.fecha_resena || '',
                  producto: p.nombre || '',
                })
              }
            })
          } catch { /* sin reseñas: se muestra el estado neutro */ }
        }))
        opinion.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        if (!cancelado) {
          setResenasMap(resenas)
          setTestimonios(opinion.slice(0, 9))
        }
      } catch (err) {
        console.error('Error cargando productos:', err)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargarDatos()
    return () => { cancelado = true }
  }, [])

  const productosFiltrados = productos.filter(p => {
    if (filtro === 'LO MÁS PEDIDO') return true
    if (filtro === 'CAFÉS ESPECIALES') return (p.categoria_producto || 'cafe') === 'cafe'
    if (filtro === 'EQUIPOS Y MÁQUINAS') return p.categoria_producto === 'maquina'
    return true
  }).slice(0, 4)

  const getResenas = (p) => resenasMap[String(p.id_producto)] || { promedio: 0, total: 0 }

  const renderEstrellas = (promedio) => {
    const redondeado = Math.round(promedio)
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} className={`w-4 h-4 ${i <= redondeado ? 'text-[#E8B931]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
          </svg>
        ))}
      </div>
    )
  }

  const itemParaCarrito = (p, cant) => {
    const esMaquina = p.categoria_producto === 'maquina'
    return {
      id: p.id_producto,
      nombre: p.nombre,
      presentacion: esMaquina ? 'Máquina de café' : (p.tipo_cafe || 'Café Granova'),
      precio: Number(p.precio) || 0,
      cant,
      img: p.imagen_url || '',
      categoria_producto: p.categoria_producto || 'cafe',
      categoria: esMaquina ? 'maquina' : 'cafe',
      esMaquina,
      unidad: esMaquina ? 'unidad' : 'kg',
      unidadCorta: esMaquina ? 'und' : 'kg',
      iva_pct: p.iva_pct == null ? 5 : Number(p.iva_pct),
    }
  }

  const agregarDesdeModal = () => {
    const p = productoSeleccionado
    if (!p) return
    agregarAlCarrito(itemParaCarrito(p, cantModal))
    toast.success(`${p.nombre} · ${cantModal} ${p.categoria_producto === 'maquina' ? 'unidad(es)' : 'kg'} agregado al carrito`)
    setProductoSeleccionado(null)
  }

  const irAlCarrito = () => {
    if (productoSeleccionado) {
      agregarAlCarrito(itemParaCarrito(productoSeleccionado, cantModal))
      setProductoSeleccionado(null)
    }
navigate('/cliente/carrito')
  }

  const suscribirNewsletter = (e) => {
    e.preventDefault()
    const email = emailNews.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un correo válido')
      return
    }
    localStorage.setItem('granova_newsletter', email)
    setNewsOk(true)
    setEmailNews('')
    toast.success('¡Suscripción confirmada! Te avisaremos de novedades y promociones.')
  }

  const enlaceMenu = [
    { texto: 'Catálogo', href: '#catalogo-destacado' },
    { texto: 'Nosotros', href: '#nosotros' },
    { texto: 'Proceso', href: '#proceso' },
    { texto: 'Empresas', href: '/registro-empresa' },
  ]

  const irAEnlace = (l) => {
    if (l.href.startsWith('/')) {
      navigate(l.href)
      setMenuAbierto(false)
    } else {
      setMenuAbierto(false)
    }
  }

  return (
    <div className="min-h-screen bg-granova-ink text-white">

      {/* Barra de progreso de scroll */}
      <motion.div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-granova-400 origin-left" style={{ scaleX: barraProgreso }} />

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-granova-ink/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>

        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <LogoGranova />

          {/* Links desktop */}
          <div className="hidden lg:flex items-center gap-7">
            {enlaceMenu.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => { if (l.href.startsWith('/')) e.preventDefault(); irAEnlace(l) }} className="text-sm text-white/70 hover:text-granova-200 transition">{l.texto}</a>
            ))}
          </div>

          {/* Acciones desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button type="button" onClick={() => navigate('/login')} className="text-sm text-white/70 hover:text-white transition px-3 py-2">
              Iniciar sesión
            </button>
            <button type="button" onClick={() => navigate('/register')} className="text-sm bg-granova-400 text-white px-4 py-2 rounded-lg hover:bg-granova-500 transition">
              Comenzar gratis
            </button>
          </div>

          {/* Menú hamburguesa móvil */}
          <button
            type="button"
            className="md:hidden text-white/70 hover:text-white transition p-1"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Abrir menú"
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
        </nav>

        {/* Menú móvil */}
        <AnimatePresence>
          {menuAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="md:hidden overflow-hidden bg-granova-ink/95 backdrop-blur-md border-t border-white/10 px-4 pb-4 flex flex-col gap-4"
            >
              {enlaceMenu.map((l) => (
                <a key={l.href} href={l.href} onClick={(e) => { if (l.href.startsWith('/')) e.preventDefault(); irAEnlace(l) }} className="text-sm text-white/70 hover:text-granova-200 transition py-1.5">{l.texto}</a>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => { setMenuAbierto(false); navigate('/login') }} className="text-sm text-white/70 hover:text-white transition py-2 text-left">
                  Iniciar sesión
                </button>
                <button type="button" onClick={() => { setMenuAbierto(false); navigate('/register') }} className="text-sm bg-granova-400 text-white px-4 py-2.5 rounded-lg hover:bg-granova-500 transition text-center">
                  Comenzar gratis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={registerBg}
          style={{ y: videoY, scale: videoScale }}
        />
        <div className="absolute inset-0 bg-granova-ink/70"></div>
        <motion.div className="absolute inset-0 flex items-center justify-center text-center max-w-4xl mx-auto px-4 sm:px-6" style={{ opacity: contenidoOpacity, y: contenidoY }}>
          <div>
            <motion.div custom={0} variants={HERO_VARIANTES} initial="hidden" animate="visible" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-6">
              <div className="w-2 h-2 bg-granova-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white/80">Café colombiano de origen</span>
            </motion.div>
            <motion.h1 custom={1} variants={HERO_VARIANTES} initial="hidden" animate="visible" className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              <span className="font-display">El mejor café</span>
              <span className="block text-granova-400 font-display">directo a ti</span>
            </motion.h1>
            <motion.p custom={2} variants={HERO_VARIANTES} initial="hidden" animate="visible" className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Conectamos fincas cafeteras colombianas con empresas y hogares que valoran la calidad real. Sin intermediarios, sin compromisos.
            </motion.p>
            <motion.div custom={3} variants={HERO_VARIANTES} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button type="button" onClick={() => navigate('/register')} className="px-6 sm:px-8 py-3.5 sm:py-4 bg-granova-400 text-white rounded-xl font-medium text-sm hover:bg-granova-500 transition-all duration-300 hover:scale-105">
                Crear cuenta gratis →
              </button>
              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                className="px-6 sm:px-8 py-3.5 sm:py-4 text-white rounded-xl font-medium text-sm transition-all duration-300 hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Ver el catálogo completo
              </button>
            </motion.div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, ease: EASE }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </section>

      {/* CATÁLOGO DESTACADO */}
      <section id="catalogo-destacado" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="flex flex-col items-center mb-10">
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, ease: EASE }} className="text-xs font-bold text-granova-400 uppercase tracking-[0.2em] mb-3 font-mono">Catálogo</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.08, ease: EASE }} className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center font-display">
            Los más pedidos
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.14, ease: EASE }} className="text-sm sm:text-base text-white/50 text-center max-w-xl mx-auto">
            Una selección ligera de lo que más le gusta a nuestros clientes. El catálogo completo vive en su propio apartado.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filtro}
            variants={CONTENEDOR_VARIANTES}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -14, transition: { duration: 0.2 } }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full"
          >
            {cargando ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton rounded-3xl aspect-[3/4]" style={{ animationDelay: `${i * 150}ms` }}></div>
              ))
            ) : (
              productosFiltrados.map((p) => {
                return (
                  <motion.div key={p.id_producto} variants={TARJETA_VARIANTES} className="group h-full flex flex-col bg-granova-card rounded-3xl border border-white/5 hover:border-granova-400/30 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                    <div className="aspect-square w-full shrink-0 bg-granova-card2 overflow-hidden relative">
                      <ImagenProducto
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <button
                        type="button"
                        onClick={() => setProductoSeleccionado(p)}
                        className="absolute inset-x-3 bottom-3 py-2.5 bg-granova-400/90 hover:bg-granova-300 text-white font-semibold rounded-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-xs shadow-lg backdrop-blur-sm"
                      >
                        Vista rápida
                      </button>
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-[13px] sm:text-sm font-semibold text-white leading-tight mb-2 line-clamp-2 min-h-[2.4rem]">{p.nombre}</h3>

                      <div className="mt-auto flex items-end justify-between gap-1">
                        <p className="text-white font-bold text-lg sm:text-xl tracking-tight">
                          ${Number(p.precio || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                        </p>
                        <span className="text-[10px] text-white/40 font-medium pb-1">{p.categoria_producto === 'maquina' ? 'c/u' : '/kg'}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA al catálogo completo (apartado separado) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="mt-12 text-center"
        >
          <button
            type="button"
            onClick={() => navigate('/catalogo')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-granova-400 hover:bg-granova-500 text-white font-medium text-sm rounded-full transition-all duration-300 hover:scale-105"
          >
            Explorar el catálogo completo
            <span aria-hidden>→</span>
          </button>
        </motion.div>

        {/* MODAL VISTA RÁPIDA */}
        <AnimatePresence>
          {productoSeleccionado && (() => {
            const resenas = getResenas(productoSeleccionado)
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
                onClick={() => setProductoSeleccionado(null)}
              >
                <motion.div
                  initial={{ scale: 0.96, y: 14, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.96, y: 14, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="bg-granova-card border border-white/[0.08] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto anim-overlay"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="aspect-square bg-granova-card2 overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none relative">
                      <ImagenProducto
                        src={productoSeleccionado.imagen_url}
                        alt={productoSeleccionado.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-granova-400 uppercase tracking-widest mb-2 font-mono">
                          {productoSeleccionado.categoria_producto === 'maquina' ? 'Equipo especializado' : 'Café de origen'}
                        </p>
                        <h2 className="text-xl font-bold text-white leading-snug">{productoSeleccionado.nombre}</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderEstrellas(resenas.promedio)}
                        {resenas.total > 0 && (
                          <span className="text-xs text-white/50">
                            {resenas.promedio.toFixed(1)} · {resenas.total} {resenas.total === 1 ? 'reseña' : 'reseñas'}
                          </span>
                        )}
                        {resenas.total === 0 && (
                          <span className="text-xs text-white/30">Sin reseñas aún</span>
                        )}
                      </div>

                      {productoSeleccionado.descripcion && (
                        <p className="text-sm text-white/60 leading-relaxed">
                          {productoSeleccionado.descripcion}
                        </p>
                      )}

                      <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] flex items-center justify-between">
                        <p className="text-2xl font-bold text-white">
                          ${(Number(productoSeleccionado.precio || 0) * cantModal).toLocaleString('es-CO')}
                          <span className="text-sm font-normal text-white/40 ml-1">
                            {productoSeleccionado.categoria_producto === 'maquina' ? '/unidad' : '/kg'}
                          </span>
                        </p>

                        {/* Selector de cantidad */}
                        <div className="flex items-center gap-2 bg-white/[0.05] rounded-xl border border-white/10 p-1">
                          <button
                            type="button"
                            onClick={() => setCantModal(c => Math.max(1, c - 1))}
                            className="w-8 h-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition text-lg leading-none"
                            aria-label="Restar cantidad"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{cantModal}</span>
                          <button
                            type="button"
                            onClick={() => setCantModal(c => Math.min(50, c + 1))}
                            className="w-8 h-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition text-lg leading-none"
                            aria-label="Sumar cantidad"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={agregarDesdeModal}
                          className="w-full py-3 rounded-xl bg-granova-400 text-white font-semibold hover:bg-granova-500 transition text-sm"
                        >
                          Agregar al carrito
                        </button>
                        <button
                          type="button"
                          onClick={irAlCarrito}
                          className="w-full py-3 rounded-xl border border-granova-400/50 text-granova-200 hover:bg-granova-400/10 transition text-sm"
                        >
                          Ver carrito →
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductoSeleccionado(null)}
                          className="w-full py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/[0.04] transition text-sm"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </section>

      {/* BANNER EMPRESAS — justo después del catálogo destacado */}
      <section id="empresas">
        <BannerEmpresas />
      </section>

      {/* CONTADORES */}
      <section className="bg-granova-card py-12 sm:py-16">
        <FadeIn>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <ContadorAnimado valor="500+" label="Lotes procesados" />
            <ContadorAnimado valor="12" label="Regiones cafeteras" />
            <ContadorAnimado valor="98%" label="Clientes satisfechos" />
            <ContadorAnimado valor="24h" label="Tiempo de entrega" />
          </div>
        </FadeIn>
      </section>

      {/* POR QUÉ GRANOVA */}
      <section id="nosotros" className="py-16 sm:py-24 bg-granova-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-xs text-granova-400 uppercase tracking-widest font-mono">Por qué elegirnos</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 font-display">Café con propósito</h2>
              <p className="text-white/60 mt-4 max-w-xl mx-auto text-sm sm:text-base">Cada taza cuenta una historia. La nuestra empieza en las montañas colombianas.</p>
            </div>
          </FadeIn>
          <StaggerContainer>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
              {[
                { icono: "☕", titulo: "Directo de la finca", descripcion: "Trazabilidad completa de cada lote. Sabes exactamente de qué finca, región y cosecha viene tu café." },
                { icono: "🌿", titulo: "100% colombiano", descripcion: "Trabajamos exclusivamente con fincas colombianas certificadas. Sin mezclas, sin rellenos, sin compromisos." },
                { icono: "🚀", titulo: "Entrega en 24 horas", descripcion: "Procesamos tu pedido el mismo día. El café fresco llega a tu puerta antes de que lo necesites." },
                { icono: "🔒", titulo: "Compra segura", descripcion: "Tu información está protegida. Pagos cifrados y datos guardados con los más altos estándares de seguridad." },
                { icono: "♻️", titulo: "Sostenible", descripcion: "Empaque biodegradable y procesos respetuosos con el medio ambiente en cada etapa de la cadena." },
                { icono: "🤝", titulo: "Comercio justo", descripcion: "Los caficultores reciben un precio justo por su trabajo. Comprar en Granova es apoyar al campo colombiano." },
              ].map((item, i) => (
                <StaggerItem key={i} className="h-full">
                  <TarjetaValor icono={item.icono} titulo={item.titulo} descripcion={item.descripcion} i={i} />
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* PROCESO */}
      <section id="proceso" className="py-16 sm:py-24 bg-granova-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-xs text-granova-400 uppercase tracking-widest font-mono">Cómo funciona</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 font-display">Simple como una taza de café</h2>
              <p className="text-white/60 mt-4 max-w-xl mx-auto text-sm sm:text-base">En 4 pasos tienes el mejor café colombiano en tu puerta.</p>
            </div>
          </FadeIn>
          <StaggerContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative">
              <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-granova-400/30"></div>
              {[
                { numero: "01", icono: "🔍", titulo: "Elige tu café", descripcion: "Explora nuestro catálogo y selecciona el lote que más te guste" },
                { numero: "02", icono: "🛒", titulo: "Haz tu pedido", descripcion: "Agrega al carrito, personaliza la cantidad y confirma tu compra" },
                { numero: "03", icono: "✅", titulo: "Confirmamos", descripcion: "Revisamos tu pedido y lo preparamos con el mayor cuidado" },
                { numero: "04", icono: "📦", titulo: "Lo recibes", descripcion: "Tu café llega fresco a tu puerta en menos de 24 horas" },
              ].map((paso, i) => (
                <StaggerItem key={i} className="h-full">
                  <TarjetaPaso
                    numero={paso.numero}
                    icono={paso.icono}
                    titulo={paso.titulo}
                    descripcion={paso.descripcion}
                    i={i}
                    activo={pasoActivo === i}
                    onClick={() => setPasoActivo(pasoActivo === i ? -1 : i)}
                  />
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* TESTIMONIOS REALES */}
      {testimonios.length > 0 && <Testimonios items={testimonios} />}

      {/* CTA FINAL */}
      <section className="py-16 sm:py-24 bg-granova-ink relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-granova-400/10 to-transparent"></div>
        <FadeIn>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 font-display">
              <span>¿Listo para probar el</span>
              <span className="text-granova-400"> mejor café</span>?
            </h2>
            <p className="text-white/60 mb-8 sm:mb-10 text-base sm:text-lg max-w-2xl mx-auto">
              Únete a cientos de empresas y hogares que ya disfrutan del café colombiano más puro, directo desde la finca.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button type="button" onClick={() => navigate('/register')} className="px-8 sm:px-10 py-3.5 sm:py-4 bg-granova-400 text-white rounded-xl font-medium hover:bg-granova-500 transition-all duration-300 hover:scale-105">
                Crear cuenta gratis →
              </button>
              <button type="button" onClick={() => navigate('/login')} className="px-8 sm:px-10 py-3.5 sm:py-4 text-white rounded-xl font-medium transition-all duration-300 hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                Iniciar sesión
              </button>
              <button type="button" onClick={() => navigate('/registro-empresa')} className="px-8 sm:px-10 py-3.5 sm:py-4 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105" style={{ border: '1px solid rgba(111,169,140,0.6)', background: 'rgba(111,169,140,0.12)' }}>
                🏢 Soy empresa
              </button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="bg-granova-card py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <span className="text-granova-100 text-xl font-medium mb-4 block">Granova</span>
                <p className="text-sm text-white/50 leading-relaxed mb-4">Café colombiano de origen, directo de la finca a tu mesa.</p>
                <div className="flex gap-2">
                  {[
                    { label: 'Instagram', icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" /></svg> },
                    { label: 'Facebook', icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z" /></svg> },
                    { label: 'WhatsApp', icono: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" stroke="currentColor" strokeWidth="1.8" /><path d="M9 8.5c0 4 2.5 6.5 6.5 6.5l.8-.9-2-1-1.1.5a5.5 5.5 0 0 1-1.8-1.8l.5-1.1-1-2-.9.8z" fill="currentColor" /></svg> },
                  ].map((red) => (
                    <button
                      key={red.label}
                      type="button"
                      onClick={() => toast.info(`${red.label}: próximamente`)}
                      aria-label={red.label}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-granova-200 hover:bg-white/10 border border-white/10 transition"
                    >
                      {red.icono}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white text-sm font-medium mb-4">Productos</h4>
                <ul className="space-y-2">
                  {['Café en grano', 'Café molido', 'Máquinas de café', 'Kits de degustación'].map((item, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => navigate('/catalogo')}
                        className="text-xs sm:text-sm text-white/50 hover:text-granova-200 transition text-left"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white text-sm font-medium mb-4">Empresa</h4>
                <ul className="space-y-2">
                  <li><a href="#nosotros" className="text-xs sm:text-sm text-white/50 hover:text-granova-200 transition">Sobre nosotros</a></li>
                  <li><a href="#proceso" className="text-xs sm:text-sm text-white/50 hover:text-granova-200 transition">Cómo funciona</a></li>
                  <li><button type="button" onClick={() => navigate('/registro-empresa')} className="text-xs sm:text-sm text-white/50 hover:text-granova-200 transition text-left">Cuenta empresarial</button></li>
                  <li><button type="button" onClick={() => navigate('/catalogo')} className="text-xs sm:text-sm text-white/50 hover:text-granova-200 transition text-left">Ver catálogo</button></li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h4 className="text-white text-sm font-medium mb-4">Newsletter</h4>
                <p className="text-xs sm:text-sm text-white/50 mb-3">Recibe novedades y promociones exclusivas.</p>
                {newsOk ? (
                  <div className="rounded-xl border border-granova-400/40 bg-granova-400/10 px-4 py-3 text-sm text-granova-200">
                    ✓ Estás suscrito(a). ¡Bienvenido a Granova!
                  </div>
                ) : (
                  <form onSubmit={suscribirNewsletter} className="flex gap-2">
                    <input
                      type="email"
                      value={emailNews}
                      onChange={(e) => setEmailNews(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-granova-400/60 transition"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                      aria-label="Correo para newsletter"
                    />
                    <button type="submit" className="px-3 py-2 bg-granova-400 text-white rounded-lg text-sm hover:bg-granova-500 transition" aria-label="Suscribirme">
                      →
                    </button>
                  </form>
                )}
                <div className="flex flex-wrap gap-1.5 mt-5">
                  {['PSE', 'Tarjeta', 'Nequi', 'Transferencia'].map((pago) => (
                    <span key={pago} className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-md border border-white/10 text-white/40">{pago}</span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
          <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">© 2026 Granova. Todos los derechos reservados.</p>
            <div className="flex gap-4 sm:gap-6">
              {['Privacidad', 'Términos', 'Cookies'].map((item, i) => (
                <button key={i} type="button" onClick={() => toast.info(`${item}: documento disponible próximamente`)} className="text-xs text-white/40 hover:text-white/70 transition">
                  {item}
                </button>
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