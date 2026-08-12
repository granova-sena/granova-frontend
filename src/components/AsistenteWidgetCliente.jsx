import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { API_URL } from "../config";

const NEON = '#39ff8a'
const NEON_DIM = 'rgba(57,255,138,0.35)'

// El webhook de n8n devuelve rutas "intuitivas" en lenguaje natural (ej.
// /mi-perfil, /mis-pedidos) que no siempre coinciden con las rutas reales
// de App.jsx (ej. /cliente/cuenta). En vez de mantener un mapa de alias
// exactos (frágil, se rompe con cualquier variante nueva), buscamos por
// palabras clave dentro de la ruta que n8n mandó y la traducimos al
// destino real más probable. Cada destino real tiene una lista de palabras
// que, si aparecen en el texto de la ruta, apuntan a esa página.
const DESTINOS_CLIENTE = [
  { ruta: '/cliente/configurar-pedido', palabras: ['configurar', 'personalizar', 'armar'] },
  { ruta: '/cliente/pedidos', palabras: ['pedido', 'orden', 'compra', 'envio', 'seguimiento'] },
  { ruta: '/cliente/carrito', palabras: ['carrito', 'cart', 'bolsa'] },
  { ruta: '/cliente/cuenta', palabras: ['cuenta', 'perfil', 'profile', 'datos', 'ajuste', 'configuracion'] },
  { ruta: '/cliente/promociones', palabras: ['promocion', 'oferta', 'descuento', 'cupon'] },
  { ruta: '/cliente/cotizacion', palabras: ['cotizacion', 'cotizar', 'presupuesto'] },
  { ruta: '/cliente/comparar', palabras: ['comparar', 'comparacion', 'versus'] },
  { ruta: '/cliente/catalogo', palabras: ['catalogo', 'tienda', 'producto', 'cafe', 'shop', 'comprar'] },
  { ruta: '/cliente', palabras: ['inicio', 'home', 'principal', 'landing'] },
]

function quitarAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizarRuta(ruta) {
  if (!ruta) return null
  const limpia = ruta.trim().replace(/\/+$/, '') || '/cliente'

  // Si ya es exactamente una ruta real del cliente, no hace falta tocarla.
  const yaEsValida = limpia === '/cliente' || DESTINOS_CLIENTE.some(d => d.ruta === limpia)
  if (yaEsValida) return limpia

  // Buscamos por palabras clave dentro del texto de la ruta que mandó n8n.
  const texto = quitarAcentos(limpia.toLowerCase())
  const match = DESTINOS_CLIENTE.find(d => d.palabras.some(p => texto.includes(p)))
  if (match) return match.ruta

  // Si no reconocemos nada, dejamos pasar la ruta tal cual vino (mejor
  // intentarlo que no navegar) — si no existe, React Router mostrará 404.
  return limpia
}

function obtenerClienteSesion() {
  try {
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    const token = localStorage.getItem('token')
    if (cliente?.email && token) return cliente
  } catch {
    // localStorage corrupto o inaccesible: tratamos como cliente no identificado
  }
  return null
}

function AsistenteWidgetCliente() {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([
    {
      autor: 'asistente',
      texto: '¡Hola! Soy el asistente de Granova. Puedo ayudarte a elegir un café, resolver dudas sobre tu pedido o contarte de nuestras fincas. ¿En qué te ayudo?',
    },
  ])
  const [entrada, setEntrada] = useState('')
  const [cargando, setCargando] = useState(false)
  const finalRef = useRef(null)
  const inputRef = useRef(null)

  const panel = {
    background: 'linear-gradient(180deg, rgba(8,14,11,0.97), rgba(4,8,6,0.98))',
    border: `1px solid ${NEON_DIM}`,
    boxShadow: `0 0 0 1px rgba(57,255,138,0.08), 0 0 32px rgba(57,255,138,0.18), 0 20px 60px rgba(0,0,0,0.55)`,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  }

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando])

  useEffect(() => {
    if (abierto) inputRef.current?.focus()
  }, [abierto])

  async function enviarMensaje(e) {
    e.preventDefault()
    const texto = entrada.trim()
    if (!texto || cargando) return

    setMensajes((prev) => [...prev, { autor: 'usuario', texto }])
    setEntrada('')
    setCargando(true)

    try {
      const cliente = obtenerClienteSesion()
      const idCliente = cliente.email

      const respuesta = await fetch(`${API_URL}/asistente/chat-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto, idCliente }),
      })

      const data = await respuesta.json()

      setMensajes((prev) => [
        ...prev,
        {
          autor: 'asistente',
          texto: data.respuesta || 'No obtuve una respuesta del asistente.',
        },
      ])

      if (data.accion === 'navegar' && data.parametros?.ruta) {
        const rutaFinal = normalizarRuta(data.parametros.ruta)
        if (rutaFinal) navigate(rutaFinal)
      }
    } catch (error) {
      console.error('Error en AsistenteWidgetCliente:', error)
      setMensajes((prev) => [
        ...prev,
        { autor: 'asistente', texto: 'No hay conexión con el servidor. Verifica tu internet e intenta de nuevo.' },
      ])
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {abierto && (
        <div
          className="w-72 sm:w-80 h-[22rem] sm:h-[24rem] flex flex-col rounded-2xl overflow-hidden animate-[granova-pop_0.18s_ease-out]"
          style={panel}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 relative overflow-hidden"
            style={{ borderBottom: `1px solid ${NEON_DIM}` }}
          >
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{ background: `radial-gradient(120px 40px at 20% 0%, ${NEON_DIM}, transparent 70%)` }}
            />
            <div className="flex items-center gap-2.5 relative">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
                style={{
                  background: 'rgba(57,255,138,0.08)',
                  border: `1px solid ${NEON_DIM}`,
                  boxShadow: `0 0 12px rgba(57,255,138,0.35)`,
                }}
              >
                <span
                  className="absolute inline-flex w-2 h-2 rounded-full -top-0.5 -right-0.5"
                  style={{ background: NEON, boxShadow: `0 0 6px ${NEON}`, animation: 'granova-blink 1.8s infinite' }}
                />
                <span className="text-xs font-bold tracking-tight" style={{ color: NEON }}>G</span>
              </span>
              <div>
                <p className="text-sm font-medium leading-tight" style={{ color: '#eafff2' }}>Asistente Granova</p>
                <p className="text-[11px] leading-tight font-mono tracking-wide" style={{ color: NEON_DIM }}>en línea</p>
              </div>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition relative"
              style={{ color: 'rgba(234,255,242,0.5)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = NEON)}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(234,255,242,0.5)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[82%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    m.autor === 'usuario'
                      ? {
                          background: 'rgba(57,255,138,0.14)',
                          border: `1px solid ${NEON_DIM}`,
                          color: '#eafff2',
                          borderBottomRightRadius: '4px',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: 'rgba(234,255,242,0.85)',
                          borderBottomLeftRadius: '4px',
                        }
                  }
                >
                  {m.texto}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex justify-start">
                <div
                  className="px-3.5 py-2.5 rounded-2xl rounded-bl-[4px] flex items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: NEON,
                        boxShadow: `0 0 6px ${NEON}`,
                        opacity: 0.7,
                        animation: `granova-bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={finalRef} />
          </div>

          {/* Entrada */}
          <form
            onSubmit={enviarMensaje}
            className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
            style={{ borderTop: `1px solid ${NEON_DIM}` }}
          >
            <input
              ref={inputRef}
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3.5 py-2 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${NEON_DIM}`,
                color: '#eafff2',
              }}
            />
            <button
              type="submit"
              disabled={cargando || !entrada.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
              style={{
                background: NEON,
                boxShadow: `0 0 14px rgba(57,255,138,0.55)`,
                opacity: cargando || !entrada.trim() ? 0.35 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2 11 13" stroke="#04140c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2 15 22l-4-9-9-4 20-7Z" stroke="#04140c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => {
          const cliente = obtenerClienteSesion()
          if (!cliente) {
            toast.error('Inicia sesión para hablar con el asistente')
            navigate('/login')
            return
          }
          setAbierto((v) => !v)
        }}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-full transition-all duration-300 hover:scale-105 relative"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #0f2b1c, #04140c)',
          border: `1px solid ${NEON_DIM}`,
          boxShadow: `0 0 0 1px rgba(57,255,138,0.15), 0 0 20px rgba(57,255,138,0.35), 0 8px 24px rgba(0,0,0,0.4)`,
        }}
      >
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ animation: abierto ? 'none' : 'granova-ring 2.2s infinite' }}
        />
        <span className="text-sm sm:text-base relative" style={{ filter: `drop-shadow(0 0 4px ${NEON})` }}>☕</span>
        <span className="text-[11px] sm:text-xs font-medium relative" style={{ color: NEON }}>
          {abierto ? 'Cerrar chat' : ''}
        </span>
      </button>

      <style>{`
        @keyframes granova-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes granova-pop {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes granova-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes granova-ring {
          0% { box-shadow: 0 0 0 0 rgba(57,255,138,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(57,255,138,0); }
          100% { box-shadow: 0 0 0 0 rgba(57,255,138,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

export default AsistenteWidgetCliente
