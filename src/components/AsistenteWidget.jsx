import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AsistenteWidget() {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([
    {
      autor: 'asistente',
      texto: '¡Hola! Soy el asistente administrativo de Granova. ¿En qué puedo ayudarte hoy?',
    },
  ])
  const [entrada, setEntrada] = useState('')
  const [cargando, setCargando] = useState(false)
  const finalRef = useRef(null)
  const inputRef = useRef(null)

  const glass = {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(20,40,32,0.14)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    boxShadow: '0 12px 40px rgba(20,40,32,0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
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
      const respuesta = await fetch('http://localhost:3000/asistente/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto }),
      })

      const data = await respuesta.json()

      setMensajes((prev) => [
        ...prev,
        {
          autor: 'asistente',
          texto: data.respuesta || 'No obtuve una respuesta del asistente.',
        },
      ])

      // Si el asistente decidió ejecutar una acción, la interpretamos aquí.
      if (data.accion === 'navegar' && data.parametros?.ruta) {
        navigate(data.parametros.ruta)
      }
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        { autor: 'asistente', texto: 'No pude conectarme con el asistente. Verifica que el backend y n8n estén corriendo.' },
      ])
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Panel del chat */}
      {abierto && (
        <div
          className="w-[22rem] sm:w-96 h-[28rem] flex flex-col rounded-3xl overflow-hidden animate-[granova-pop_0.18s_ease-out]"
          style={glass}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(20,40,32,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ background: '#1D9E75' }}
              >
                G
              </span>
              <div>
                <p className="text-sm font-medium text-[#1F2A24] leading-tight">Asistente IA</p>
                <p className="text-[11px] text-[#1F2A24]/45 leading-tight">Granova</p>
              </div>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1F2A24]/50 hover:text-[#1F2A24] hover:bg-[#1F2A24]/5 transition"
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
                      ? { background: '#1D9E75', color: '#ffffff', borderBottomRightRadius: '4px' }
                      : { background: 'rgba(20,40,32,0.06)', color: '#1F2A24', borderBottomLeftRadius: '4px' }
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
                  style={{ background: 'rgba(20,40,32,0.06)' }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: '#1D9E75',
                        opacity: 0.6,
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
            style={{ borderTop: '1px solid rgba(20,40,32,0.1)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 px-3.5 py-2 rounded-xl text-sm text-[#1F2A24] outline-none"
              style={{ background: 'rgba(20,40,32,0.05)', border: '1px solid rgba(20,40,32,0.1)' }}
            />
            <button
              type="submit"
              disabled={cargando || !entrada.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
              style={{
                background: '#1D9E75',
                opacity: cargando || !entrada.trim() ? 0.4 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2 11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2 15 22l-4-9-9-4 20-7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
        style={{
          background: '#1D9E75',
          boxShadow: '0 8px 24px rgba(29,158,117,0.4)',
        }}
      >
        {abierto ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      `}</style>
    </div>
  )
}

export default AsistenteWidget