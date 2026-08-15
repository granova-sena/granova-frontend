  import { useState, useRef, useEffect } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { API_URL } from "../config";
  import { jwtDecode } from 'jwt-decode'

  const NEON = '#39ff8a'
  const NEON_DIM = 'rgba(57,255,138,0.35)'

  // Igual que en AsistenteWidgetCliente: en vez de un mapa de alias exactos
  // (frágil), buscamos por palabras clave dentro de la ruta que devuelve
  // n8n y la traducimos al destino real más probable del panel admin.
  // Los destinos más específicos van primero para que "inventario/alertas"
  // no caiga por error en el match genérico de "inventario".
  const DESTINOS_ADMIN = [
    { ruta: '/dashboard/inventario/alertas', palabras: ['alerta', 'stock bajo', 'agotado'] },
    { ruta: '/dashboard/inventario', palabras: ['inventario', 'stock', 'existencia'] },
    { ruta: '/dashboard/pedidos', palabras: ['pedido', 'orden'] },
    { ruta: '/dashboard/envios', palabras: ['envio', 'shipment', 'entrega'] },
    { ruta: '/dashboard/transportadoras', palabras: ['transportadora', 'courier', 'mensajeria'] },
    { ruta: '/dashboard/usuarios', palabras: ['usuario', 'cliente', 'admin', 'equipo'] },
    { ruta: '/dashboard/ventas', palabras: ['venta', 'registro de venta'] },
    { ruta: '/dashboard/reportes', palabras: ['reporte', 'informe', 'estadistica', 'analisis'] },
    { ruta: '/dashboard', palabras: ['inicio', 'home', 'principal', 'dashboard'] },
  ]

  function quitarAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  function quitarSlashFinal(texto) {
  let resultado = texto
  while (resultado.endsWith('/')) {
    resultado = resultado.slice(0, -1)
  }
  return resultado
}

function normalizarRutaAdmin(ruta) {
  if (!ruta) return null
  const limpia = quitarSlashFinal(ruta.trim()) || '/dashboard'

  const yaEsValida = limpia === '/dashboard' || DESTINOS_ADMIN.some(d => d.ruta === limpia)
  if (yaEsValida) return limpia

  const texto = quitarAcentos(limpia.toLowerCase())
  const match = DESTINOS_ADMIN.find(d => d.palabras.some(p => texto.includes(p)))
  if (match) return match.ruta

  return limpia
}

  function AsistenteWidget() {
    const navigate = useNavigate()
    const [abierto, setAbierto] = useState(false)
    const [mensajes, setMensajes] = useState([
      {
        autor: 'asistente',
        texto: 'Hola, soy el asistente administrativo de Granova. ¿En qué puedo ayudarte hoy?',
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
        const token = localStorage.getItem('token')
        let idAdmin = 'admin-desconocido'
        if (token) {
          try {
            const decoded = jwtDecode(token)
            idAdmin = decoded.email || decoded.nombre || 'admin-desconocido'
          } catch {
            // Token inválido o corrupto: seguimos con el idAdmin por defecto
          }
        }

        const respuesta = await fetch(`${API_URL}/asistente/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mensaje: texto, idAdmin }),
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
          const rutaFinal = normalizarRutaAdmin(data.parametros.ruta)
          if (rutaFinal) navigate(rutaFinal)
        }
      } catch (error) {
        console.error('Error en AsistenteWidget:', error)
        setMensajes((prev) => [
          ...prev,
          { autor: 'asistente', texto: 'No hay conexión con el servidor. Verifica tu internet e intenta de nuevo.' },
        ])
      } finally {
        setCargando(false)
      }
    }

    return (
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {abierto && (
          <div
            className="w-[22rem] sm:w-96 h-[28rem] flex flex-col rounded-2xl overflow-hidden animate-[granova-pop_0.18s_ease-out]"
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
                  <p className="text-sm font-medium leading-tight" style={{ color: '#eafff2' }}>Asistente IA</p>
                  <p className="text-[11px] leading-tight font-mono tracking-wide" style={{ color: NEON_DIM }}>granova · admin</p>
                </div>
              </div>
              <button
                type="button"
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
                placeholder="Escribe tu consulta..."
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
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 relative"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #4dffa0, #0a3d24)',
            boxShadow: `0 0 0 1px rgba(57,255,138,0.4), 0 0 24px rgba(57,255,138,0.55), 0 8px 24px rgba(0,0,0,0.4)`,
          }}
        >
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: `0 0 0 0 rgba(57,255,138,0.5)`, animation: abierto ? 'none' : 'granova-ring 2.2s infinite' }}
          />
          {abierto ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="#04140c" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#04140c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
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
            0% { box-shadow: 0 0 0 0 rgba(57,255,138,0.45); }
            70% { box-shadow: 0 0 0 14px rgba(57,255,138,0); }
            100% { box-shadow: 0 0 0 0 rgba(57,255,138,0); }
          }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>
      </div>
    )
  }

  export default AsistenteWidget
