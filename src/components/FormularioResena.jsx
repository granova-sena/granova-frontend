import { useState } from 'react'
import { API_URL } from "../config";

function obtenerIdCliente() {
  try {
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    return cliente?.id ?? null
  } catch {
    return null
  }
}

// Ahora es "controlado": el padre decide si está abierto (onCerrar lo cierra).
// Este componente ya no maneja su propio "abierto" — solo el contenido del formulario.
function FormularioResena({ id_detalle, producto_nombre, onCerrar, onEnviado }) {
  const [calificacion, setCalificacion] = useState(0)
  const [hoverCalificacion, setHoverCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const enviarResena = async () => {
    if (calificacion === 0) {
      setError('Selecciona al menos una estrella')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/resenas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          id_detalle,
          calificacion,
          comentario
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.mensaje)
      onEnviado()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 sm:p-8">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-white">Reseñar {producto_nombre}</h3>
        <button type="button" onClick={onCerrar} className="text-white/40 text-xs hover:text-white">✕</button>
      </div>

      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setCalificacion(valor)}
            onMouseEnter={() => setHoverCalificacion(valor)}
            onMouseLeave={() => setHoverCalificacion(0)}
            className="text-3xl leading-none transition-transform hover:scale-110"
          >
            {(hoverCalificacion || calificacion) >= valor ? '★' : '☆'}
          </button>
        ))}
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Cuéntanos qué te pareció este café: sabor, aroma, empaque..."
        rows={4}
        className="w-full text-sm bg-white/[0.05] border border-white/10 rounded-lg p-4
                   text-white placeholder-white/30 focus:outline-none focus:border-[#6FA98C]
                   resize-none"
      />

      {error && <p className="text-xs text-[#D85A30] mt-2">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={enviarResena}
          disabled={enviando}
          className="text-sm bg-[#6FA98C] text-white px-5 py-2.5 rounded-lg font-medium
                     disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Enviar reseña'}
        </button>
        <button type="button" onClick={onCerrar} className="text-sm text-white/40 px-5 py-2.5">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default FormularioResena