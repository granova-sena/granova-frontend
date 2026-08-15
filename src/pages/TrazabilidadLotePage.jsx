import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from "../config";

// Diccionario: traduce el valor crudo de la base (tipo_evento) a lo que ve el cliente.
// Las llaves coinciden exactamente con el CHECK de la tabla eventos_lote.
const iconosEvento = {
  cosecha:   { label: 'Cosecha',   icono: '🌱' },
  procesado: { label: 'Procesado', icono: '💧' },
  tostado:   { label: 'Tueste',    icono: '🔥' },
  envasado:  { label: 'Envasado',  icono: '📦' },
  enviado:   { label: 'Enviado',   icono: '🚚' },
  entregado: { label: 'Entregado', icono: '🏠' },
}

function TrazabilidadLotePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [lote, setLote] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargarTrazabilidad() {
      try {
        setCargando(true)
        const res = await fetch(`${API_URL}/lotes/${id}/trazabilidad`)
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        setLote(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargarTrazabilidad()
  }, [id])

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
      <p className="text-white/50 text-sm">Cargando trazabilidad...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
      <p className="text-[#D85A30] text-sm">{error}</p>
    </div>
  )

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 text-white">

        <h1 className="text-2xl sm:text-3xl font-semibold mb-1 tracking-tight">Origen de tu café</h1>
        <p className="text-xs text-white/40 mb-8">Lote {lote.codigo_lote} · Variedad {lote.variedad}</p>

        {/* Tarjeta de origen: finca, región, altitud */}
        <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#6FA98C]/15 rounded-full flex items-center justify-center text-lg">☕</div>
            <div>
              <p className="text-sm font-semibold text-white">{lote.finca_nombre || 'Finca de origen no registrada'}</p>
              {lote.region && <p className="text-xs text-white/40">{lote.region}</p>}
            </div>
          </div>
          {lote.altitud && (
            <div className="flex justify-between text-xs border-t border-white/10 pt-3">
              <span className="text-white/40">Altitud</span>
              <span className="text-white font-medium">{lote.altitud}</span>
            </div>
          )}
        </div>

        {/* Timeline de eventos */}
        <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 sm:p-8 mb-6">
          <h3 className="text-sm font-semibold text-white mb-6">Recorrido del lote</h3>

          {lote.eventos.length === 0 ? (
            <p className="text-xs text-white/40">Todavía no hay eventos registrados para este lote.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {lote.eventos.map((evento, i) => {
                const info = iconosEvento[evento.tipo_evento] || { label: evento.tipo_evento, icono: '•' }
                const esUltimo = i === lote.eventos.length - 1
                return (
                  <div key={evento.id_evento} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border-2
                                      bg-[#6FA98C] border-[#6FA98C] text-white flex-shrink-0">
                        {info.icono}
                      </div>
                      {!esUltimo && <div className="w-px flex-1 bg-white/15 mt-2" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium text-white">{info.label}</p>
                      <p className="text-[10px] text-white/30 mb-1">{formatearFecha(evento.fecha)}</p>
                      {evento.descripcion && <p className="text-xs text-white/60">{evento.descripcion}</p>}
                      {evento.ubicacion && <p className="text-[10px] text-white/40 mt-1">📍 {evento.ubicacion}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
{/* Volver + descargar certificado */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#9DC9B4] text-sm hover:underline"
          >
            ← Volver
          </button>

          <a
            href={`${API_URL}/lotes/${id}/certificado`}
            download
            className="flex items-center gap-2 bg-[#6FA98C] text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            📄 Descargar certificado
          </a>
        </div>

      </div>
    </div>
  )
}
        
      

export default TrazabilidadLotePage