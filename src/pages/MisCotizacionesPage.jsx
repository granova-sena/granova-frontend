import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { SkeletonRow } from '../components/ui/Skeleton'
import FadeIn from '../components/ui/FadeIn'
import { listarCotizaciones, eliminarCotizacion } from '../services/cotizacionApi'
import toast from 'react-hot-toast'

const ESTADO_LABEL = {
  activa: { texto: 'Activa', clase: 'text-[#9DC9B4]' },
  comprada: { texto: 'Comprada', clase: 'text-[#6FA98C]' },
  expirada: { texto: 'Expirada', clase: 'text-white/40' },
  eliminada: { texto: 'Eliminada', clase: 'text-white/30' },
}

function MisCotizaciones() {
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [eliminando, setEliminando] = useState(null)
  const [paginacion, setPaginacion] = useState({ totalPages: 1, totalRows: 0 })

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        setCargando(true)
        const resultado = await listarCotizaciones(pagina)
        if (!cancelado) {
          setCotizaciones(resultado.data)
          setPaginacion(resultado.paginacion)
        }
      } catch (err) {
        if (!cancelado) setError(err.response?.data?.mensaje ?? 'No se pudieron cargar tus cotizaciones')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [pagina])

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const estaExpirada = (c) => c.estado === 'activa' && new Date(c.fecha_validez) < new Date()


  async function manejarEliminar(id_cotizacion) {
  const confirmar = window.confirm('¿Seguro que deseas eliminar esta cotización?')
  if (!confirmar) return

  setEliminando(id_cotizacion)
  try {
    await eliminarCotizacion(id_cotizacion)
    setCotizaciones((prev) => prev.filter((c) => c.id_cotizacion !== id_cotizacion))
    toast.success('Cotización eliminada')
  } catch (error) {
    toast.error(error.response?.data?.mensaje ?? 'No se pudo eliminar la cotización')
  } finally {
    setEliminando(null)
  }
}
  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Historial</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2 tracking-tight">Mis cotizaciones</h1>
        <div className="h-8 sm:h-10" />

        {cargando && (
          <div className="rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm divide-y divide-white/10">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {!cargando && error && (
          <div className="rounded-2xl p-10 text-center bg-white/[0.08] backdrop-blur-xl border border-white/15">
            <p className="text-[#D85A30] text-sm">{error}</p>
          </div>
        )}

        {!cargando && !error && cotizaciones.length === 0 && (
          <div className="rounded-2xl p-10 sm:p-16 text-center bg-white/[0.08] backdrop-blur-xl border border-white/15">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white/50 flex items-center justify-center mx-auto mb-5">📋</div>
            <p className="text-white font-semibold mb-2">Aún no tienes cotizaciones guardadas</p>
            <p className="text-white/50 text-sm max-w-sm mx-auto mb-8">
              Arma una simulación de compra y guarda la cotización para verla aquí después.
            </p>
            <button
              type="button"
              onClick={() => navigate('/cliente/simulador')}
              className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition"
            >
              Ir al simulador
            </button>
          </div>
        )}

        {!cargando && !error && cotizaciones.length > 0 && (
          <FadeIn>
          <div className="rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15 divide-y divide-white/10">
            {cotizaciones.map((c) => {
  const expirada = estaExpirada(c)
  const estadoInfo = expirada ? ESTADO_LABEL.expirada : ESTADO_LABEL[c.estado]
  return (
    <div key={c.id_cotizacion} className="px-5 sm:px-6 py-4 hover:bg-white/[0.06] transition flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => navigate(`/cliente/cotizaciones/${c.id_cotizacion}`)}
        className="flex-1 text-left min-w-[140px]"
      >
        <p className="text-sm font-medium text-white">{c.numero_cotizacion}</p>
        <p className="text-xs text-white/40 mt-0.5">{formatearFecha(c.fecha_creacion)}</p>
        <p className={`text-xs font-medium mt-1 ${estadoInfo.clase}`}>{estadoInfo.texto}</p>
      </button>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">${Number(c.total).toLocaleString('es-CO')}</p>
      </div>

      {c.estado === 'activa' && !expirada && (
        <button
          type="button"
          onClick={() => manejarEliminar(c.id_cotizacion)}
          disabled={eliminando === c.id_cotizacion}
          aria-label="Eliminar cotización"
          className="shrink-0 w-8 h-8 rounded-lg text-white/40 hover:text-[#D85A30] hover:bg-[#D85A30]/10 transition flex items-center justify-center disabled:opacity-30"
        >
          {eliminando === c.id_cotizacion ? '...' : '✕'}
        </button>
      )}
    </div>
  )
})}
          </div>
          </FadeIn>
        )}
        

        {paginacion.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <button type="button" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina <= 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.08] text-white/70 hover:bg-white/[0.15] disabled:opacity-30 transition">
              ← Anterior
            </button>
            <span className="text-xs text-white/40">Página {pagina} de {paginacion.totalPages}</span>
            <button type="button" onClick={() => setPagina(p => Math.min(paginacion.totalPages, p + 1))} disabled={pagina >= paginacion.totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.08] text-white/70 hover:bg-white/[0.15] disabled:opacity-30 transition">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MisCotizaciones 