import { useState } from 'react'
import { API_URL } from '../config'

const PREGUNTAS = [
  {
    id: 'sabor_preferido',
    pregunta: '¿Qué sabor prefieres en tu café?',
    opciones: [
      { valor: 'afrutado', label: 'Afrutado', emoji: '🍓', desc: 'Notas frescas y brillantes' },
      { valor: 'achocolatado', label: 'Achocolatado', emoji: '🍫', desc: 'Suave y cremoso' },
      { valor: 'tostado', label: 'Tostado', emoji: '🔥', desc: 'Intenso y ahumado' },
      { valor: 'floral', label: 'Floral', emoji: '🌸', desc: 'Delicado y aromático' },
    ]
  },
  {
    id: 'metodo_preparacion',
    pregunta: '¿Cómo preparas tu café?',
    opciones: [
      { valor: 'espresso', label: 'Espresso', emoji: '☕', desc: 'Concentrado y potente' },
      { valor: 'prensa_francesa', label: 'Prensa francesa', emoji: '🫖', desc: 'Cuerpo completo' },
      { valor: 'filtrado', label: 'Filtrado', emoji: '💧', desc: 'Limpio y suave' },
      { valor: 'instantaneo', label: 'Instantáneo', emoji: '⚡', desc: 'Rápido y práctico' },
    ]
  },
  {
    id: 'presupuesto',
    pregunta: '¿Cuál es tu presupuesto por kg?',
    opciones: [
      { valor: 'menos_20000', label: 'Menos de $20.000', emoji: '💚', desc: 'Económico' },
      { valor: '20000_50000', label: '$20.000 - $50.000', emoji: '💛', desc: 'Equilibrado' },
      { valor: 'mas_50000', label: 'Más de $50.000', emoji: '💎', desc: 'Premium' },
    ]
  }
]

function RecomendadorModal({ onClose, onRecomendaciones }) {
  const [paso, setPaso] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [cargando, setCargando] = useState(false)

  const preguntaActual = PREGUNTAS[paso]

  const seleccionar = async (valor) => {
    const nuevasRespuestas = { ...respuestas, [preguntaActual.id]: valor }
    setRespuestas(nuevasRespuestas)

    if (paso < PREGUNTAS.length - 1) {
      setPaso(paso + 1)
      return
    }

    // Es la última pregunta — guardar y obtener recomendaciones
    setCargando(true)
    try {
      const cliente = JSON.parse(localStorage.getItem('cliente'))
      const id_cliente = cliente?.id

      if (id_cliente) {
        // Guardar preferencias en la base de datos
        await fetch(`${API_URL}/api/preferencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_cliente, ...nuevasRespuestas })
        })

        // Obtener recomendaciones
        const res = await fetch(`${API_URL}/api/preferencias/${id_cliente}/recomendaciones`)
        const json = await res.json()
        if (json.ok) onRecomendaciones(json.data)
      }

      onClose()
    } catch (err) {
      console.error(err)
      onClose()
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-2xl p-6 sm:p-8">

        {/* Progreso */}
        <div className="flex items-center gap-2 mb-6">
          {PREGUNTAS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= paso ? 'bg-[#6FA98C]' : 'bg-white/15'}`} />
          ))}
        </div>

        {/* Pregunta */}
        <p className="text-xs text-[#9DC9B4] uppercase tracking-wide mb-2">
          Pregunta {paso + 1} de {PREGUNTAS.length}
        </p>
        <h2 className="text-xl font-semibold text-white mb-6">
          {preguntaActual.pregunta}
        </h2>

        {/* Opciones */}
        <div className="grid grid-cols-2 gap-3">
          {preguntaActual.opciones.map((opcion) => (
           <button
              type="button"
              key={opcion.valor}
              onClick={() => seleccionar(opcion.valor)}
              disabled={cargando}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.12] hover:border-[#6FA98C]/50 transition-all duration-200 text-left disabled:opacity-50"
            >
              <span className="text-3xl">{opcion.emoji}</span>
              <p className="text-sm font-medium text-white text-center">{opcion.label}</p>
              <p className="text-[11px] text-white/40 text-center">{opcion.desc}</p>
            </button>
          ))}
        </div>

        {/* Botones navegación */}
        <div className="flex items-center justify-between mt-6">
          {paso > 0 ? (
            <button type="button" onClick={() => setPaso(paso - 1)} className="text-sm text-white/40 hover:text-white transition">
              ← Anterior
            </button>
          ) : (
            <div />
          )}
          <button type="button" onClick={onClose} className="text-sm text-white/30 hover:text-white/60 transition">
            Omitir
          </button>
        </div>

        {cargando && (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#9DC9B4] animate-pulse">Buscando tu café perfecto...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecomendadorModal