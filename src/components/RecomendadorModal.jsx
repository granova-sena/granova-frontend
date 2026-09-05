import { useState } from 'react'
import { API_URL } from '../config'

const PREGUNTAS_CAFE = [
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

const PREGUNTAS_MAQUINA = [
  {
    id: 'uso_equipo',
    pregunta: '¿Dónde usarás la máquina?',
    opciones: [
      { valor: 'hogar', label: 'En casa', emoji: '🏠', desc: 'Para tu familia y visitas' },
      { valor: 'negocio', label: 'En mi negocio', emoji: '☕', desc: 'Cafetería, restaurante o tienda' },
      { valor: 'profesional', label: 'Uso profesional', emoji: '👨‍🍳', desc: 'Baristas y alta exigencia' },
    ]
  },
  {
    id: 'metodo_equipo',
    pregunta: '¿Qué preparación buscas?',
    opciones: [
      { valor: 'espresso', label: 'Espresso / capuchino', emoji: '☕', desc: 'Bebidas con crema' },
      { valor: 'filtrado', label: 'Filtrado / goteo', emoji: '💧', desc: 'Café limpio y suave' },
      { valor: 'molido', label: 'Molino / grano', emoji: '🌰', desc: 'Molido y conservación' },
    ]
  },
  {
    id: 'presupuesto_equipo',
    pregunta: '¿Cuánto quieres invertir?',
    opciones: [
      { valor: 'economico', label: 'Menos de $1M', emoji: '💚', desc: 'Básico y práctico' },
      { valor: 'medio', label: '$1M - $3M', emoji: '💛', desc: 'Equilibrado' },
      { valor: 'premium', label: 'Más de $3M', emoji: '💎', desc: 'Alta gama' },
    ]
  }
]

const CATEGORIAS = [
  {
    valor: 'cafe',
    emoji: '☕',
    titulo: 'Café',
    desc: 'Grano, tostado y preparación'
  },
  {
    valor: 'maquina',
    emoji: '⚙️',
    titulo: 'Maquinaria',
    desc: 'Equipos y accesorios'
  }
]

const TITULO_CATEGORIA = { cafe: 'café', maquina: 'maquinaria' }

function RecomendadorModal({ onClose, onRecomendaciones }) {
  const [categoria, setCategoria] = useState(null) // null = selector inicial
  const [paso, setPaso] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [cargando, setCargando] = useState(false)

  const preguntas = categoria === 'maquina' ? PREGUNTAS_MAQUINA : PREGUNTAS_CAFE
  const preguntaActual = preguntas[paso]

  const elegirCategoria = (cat) => {
    setCategoria(cat)
    setPaso(0)
    setRespuestas({})
  }

  const seleccionar = async (valor) => {
    const nuevasRespuestas = { ...respuestas, [preguntaActual.id]: valor }
    setRespuestas(nuevasRespuestas)

    if (paso < preguntas.length - 1) {
      setPaso(paso + 1)
      return
    }

    // Es la última pregunta — guardar y obtener recomendaciones
    setCargando(true)
    try {
      const cliente = JSON.parse(localStorage.getItem('cliente'))
      const id_cliente = cliente?.id

      if (id_cliente) {
        const body = categoria === 'maquina'
          ? {
              categoria: 'maquina',
              uso_equipo: nuevasRespuestas.uso_equipo,
              metodo_equipo: nuevasRespuestas.metodo_equipo,
              presupuesto_equipo: nuevasRespuestas.presupuesto_equipo,
            }
          : {
              categoria: 'cafe',
              sabor_preferido: nuevasRespuestas.sabor_preferido,
              metodo_preparacion: nuevasRespuestas.metodo_preparacion,
              presupuesto: nuevasRespuestas.presupuesto,
            }

        // Guardar preferencias en la base de datos
        await fetch(`${API_URL}/api/preferencias`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token_cliente')}`,
          },
          body: JSON.stringify(body)
        })

        // Obtener recomendaciones de la categoría elegida
        const res = await fetch(`${API_URL}/api/preferencias/${id_cliente}/recomendaciones?categoria=${categoria}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token_cliente')}` },
        })
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

  if (categoria === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-2xl p-6 sm:p-8">
          <p className="text-xs text-[#9DC9B4] uppercase tracking-wide mb-2">Recomendador</p>
          <h2 className="text-xl font-semibold text-white mb-1">¿Sobre qué quieres recomendaciones?</h2>
          <p className="text-sm text-white/40 mb-6">Elige una categoría y responderás un quiz rápido.</p>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIAS.map((c) => (
              <button
                type="button"
                key={c.valor}
                onClick={() => elegirCategoria(c.valor)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.12] hover:border-[#6FA98C]/50 transition-all duration-200 text-left"
              >
                <span className="text-3xl">{c.emoji}</span>
                <p className="text-sm font-medium text-white text-center">{c.titulo}</p>
                <p className="text-[11px] text-white/40 text-center">{c.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div />
            <button type="button" onClick={onClose} className="text-sm text-white/30 hover:text-white/60 transition">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-2xl p-6 sm:p-8">

        {/* Progreso */}
        <div className="flex items-center gap-2 mb-6">
          {preguntas.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= paso ? 'bg-[#6FA98C]' : 'bg-white/15'}`} />
          ))}
        </div>

        {/* Pregunta */}
        <p className="text-xs text-[#9DC9B4] uppercase tracking-wide mb-2">
          {TITULO_CATEGORIA[categoria]} · Pregunta {paso + 1} de {preguntas.length}
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
            <button type="button" onClick={() => setPaso(paso - 1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/40 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
              </svg>
              Anterior
            </button>
          ) : (
            <button type="button" onClick={() => elegirCategoria(null)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/40 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
              </svg>
              Cambiar categoría
            </button>
          )}
          <button type="button" onClick={onClose} className="text-sm text-white/30 hover:text-white/60 transition">
            Omitir
          </button>
        </div>

        {cargando && (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#9DC9B4] animate-pulse">Buscando tu {TITULO_CATEGORIA[categoria]} perfecto...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecomendadorModal