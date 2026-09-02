import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

const API = `${API_URL}/api/notificaciones`

// ── CAMPANITA DE NOTIFICACIONES 🔔 ─────────────────────────
// Polling cada 60s: badge rojo con no leídas, dropdown con las últimas 30.
// Una notificación de "entregado" permite abrir el modal de reseña.
function CampanitaNotificaciones({ onAbrirResena }) {
  const navigate = useNavigate()
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [abierta, setAbierta] = useState(false)
  const ref = useRef(null)

  async function cargar() {
    try {
      const token = localStorage.getItem('token_cliente')
      if (!token) return
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const json = await res.json()
      if (json.ok) {
        setNotificaciones(json.data || [])
        setNoLeidas(json.no_leidas || 0)
      }
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 10000)

    function onVisibilidad() {
      if (document.visibilityState === 'visible') cargar()
    }
    document.addEventListener('visibilitychange', onVisibilidad)
    window.addEventListener('focus', cargar)

    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', onVisibilidad)
      window.removeEventListener('focus', cargar)
    }
  }, [])

  useEffect(() => {
    function cerrarFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierta(false)
    }
    document.addEventListener('mousedown', cerrarFuera)
    return () => document.removeEventListener('mousedown', cerrarFuera)
  }, [])

  async function marcarLeida(n) {
    // La de reseña persiste hasta que el cliente reseñe; las demás
    // desaparecen de la bandeja en cuanto se leen (estilo MercadoLibre).
    if (n.leida || n.tipo === 'reseña') return
    try {
      const token = localStorage.getItem('token_cliente')
      await fetch(`${API}/${n.id_notificacion}/leida`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotificaciones(prev => prev.filter(x => x.id_notificacion !== n.id_notificacion))
      setNoLeidas(c => Math.max(0, c - 1))
    } catch { /* silencioso */ }
  }

  function abrirNotificacion(n) {
    marcarLeida(n)
    setAbierta(false)
    if (n.id_pedido) navigate(`/cliente/pedidos/${n.id_pedido}`)
  }

  function formatearFecha(f) {
    return new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative" ref={ref}>
      {/* Campana */}
      <button
        type="button"
        onClick={() => setAbierta(o => !o)}
        className="relative w-9 h-9 rounded-full bg-[#14291B] border border-white/10 text-white/70 hover:text-white transition flex items-center justify-center"
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#D85A30] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#0a1a0a]">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {abierta && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-50" style={{ background: 'rgba(20,40,20,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-sm font-semibold text-white">Notificaciones</p>
            {noLeidas > 0 && <span className="text-[10px] text-[#9DC9B4]">{noLeidas} sin leer</span>}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {notificaciones.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-white/40">No tienes notificaciones todavía.</p>
            ) : (
              notificaciones.map(n => (
                <div key={n.id_notificacion} className={`px-4 py-3 ${n.leida ? '' : 'bg-[#6FA98C]/[0.06]'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-medium ${n.leida ? 'text-white/60' : 'text-white'}`}>{n.titulo}</p>
                    {!n.leida && <span className="w-2 h-2 rounded-full bg-[#D85A30] shrink-0 mt-1" />}
                  </div>
                  {n.mensaje && <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{n.mensaje}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-white/25">{formatearFecha(n.fecha)}</span>
                    <div className="flex items-center gap-2">
                      {n.tipo === 'reseña' && n.id_pedido && (
                        <button
                          type="button"
                          onClick={() => { setAbierta(false); onAbrirResena?.(n.id_pedido); }}
                          className="text-[11px] font-semibold text-[#9DC9B4] hover:text-white transition"
                        >
                          ✍️ Reseñar
                        </button>
                      )}
                      {n.id_pedido && (
                        <button
                          type="button"
                          onClick={() => abrirNotificacion(n)}
                          className="text-[11px] text-white/40 hover:text-white transition"
                        >
                          Ver pedido →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CampanitaNotificaciones
