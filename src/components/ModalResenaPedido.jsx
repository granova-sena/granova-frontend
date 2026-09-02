import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import { useModalBehavior } from '../hooks/useModalBehavior'
import FormularioResena from './FormularioResena'
import toast from 'react-hot-toast'

// ── MODAL: ESCRIBIR RESEÑA DESDE UNA NOTIFICACIÓN ──────────
// El cliente recibe la notificación de "entregado", la abre desde la
// campanita y escribe su reseña aquí sin tener que entrar al pedido.
function ModalResenaPedido({ pedidoId, onClose }) {
  useModalBehavior(onClose)
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [resenando, setResenando] = useState(null) // id_detalle en formulario abierto
  const [enviados, setEnviados] = useState([]) // ids ya reseñados

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        const token = localStorage.getItem('token_cliente')
        const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        if (!cancelado) setPedido(json.data)
      } catch (err) {
        if (!cancelado) setError(err.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [pedidoId])

  const pendientes = (pedido?.productos || []).filter(p => !enviados.includes(p.id_detalle))

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 anim-overlay"
      role="button"
      tabIndex={0}
      aria-label="Cerrar"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div
        className="rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-2xl anim-pop"
        style={{ background: '#0F1D13', border: '1px solid rgba(255,255,255,0.12)' }}
        role="presentation"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-semibold text-base">✍️ Reseña tu pedido</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.06] text-white/50 hover:text-white text-lg leading-none flex items-center justify-center">✕</button>
        </div>
        <p className="text-white/40 text-xs mb-5">Cuéntanos qué tal te fue con cada producto de tu pedido.</p>

        {cargando ? (
          <p className="text-center text-sm text-white/40 py-10">Cargando pedido...</p>
        ) : error ? (
          <p className="text-center text-sm text-white/50 py-10">{error}</p>
        ) : pendientes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm text-white/60">Ya reseñaste todos los productos de este pedido.</p>
            <p className="text-xs text-white/35 mt-1">¡Gracias por tu feedback!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.map(p => (
              <div key={p.id_detalle} className="rounded-xl border border-white/[0.08] bg-[#14291B] p-4">
                {resenando === p.id_detalle ? (
                  <FormularioResena
                    id_detalle={p.id_detalle}
                    producto_nombre={p.producto_nombre}
                    onCerrar={() => setResenando(null)}
                    onEnviado={() => {
                      setEnviados(prev => [...prev, p.id_detalle])
                      setResenando(null)
                      toast.success(`Reseña de "${p.producto_nombre}" enviada 🎉`)
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{p.producto_nombre}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{p.cantidad} {p.cantidad === 1 ? 'unidad' : 'unidades'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResenando(p.id_detalle)}
                      className="shrink-0 h-9 px-4 rounded-xl bg-[#6FA98C] text-white text-xs font-semibold hover:bg-[#4F8A70] transition"
                    >
                      Reseñar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ModalResenaPedido
