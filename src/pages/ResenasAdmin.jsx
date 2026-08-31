import { useState, useEffect } from 'react'
import api from '../services/api'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState } from '../components/ui/panel/PanelKit'
import ErrorModal from '../components/ui/ErrorModal'

// ── ADMIN: MODERACIÓN DE RESEÑAS ───────────────────────────
// El administrador ve TODAS las reseñas (visibles y ocultas) y
// puede ocultar las inapropiadas o volver a mostrarlas.
function ResenasAdmin() {
  const [resenas, setResenas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(null)
  const [filtro, setFiltro] = useState('todas') // todas | visibles | ocultas

  function cargar() {
    setCargando(true)
    api.get('/admin/resenas')
      .then((res) => setResenas(res.data.data || []))
      .catch((err) => setError(err.response?.data?.mensaje || err.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  async function cambiarVisibilidad(r, visible) {
    setProcesando(r.id_resena)
    try {
      await api.patch(`/admin/resenas/${r.id_resena}/visibilidad`, { visible })
      setResenas((prev) => prev.map((x) => (x.id_resena === r.id_resena ? { ...x, visible } : x)))
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo actualizar la reseña')
    } finally {
      setProcesando(null)
    }
  }

  const visibles = filtro === 'todas' ? resenas : resenas.filter((r) => (filtro === 'visibles' ? r.visible : !r.visible))

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Moderación de reseñas"
        subtitulo="Las reseñas ocultas dejan de verse en el catálogo y en los foros del cliente."
      />

      <ErrorModal mensaje={error} onClose={() => setError(null)} />

      <div className="flex items-center gap-2">
        {[['todas', 'Todas'], ['visibles', 'Visibles'], ['ocultas', 'Ocultas']].map(([val, label]) => (
          <button
            type="button"
            key={val}
            onClick={() => setFiltro(val)}
            className={`text-xs px-4 h-9 rounded-xl border transition ${filtro === val ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'bg-white border-gray-200 text-gray-500 hover:border-[#1D9E75]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {cargando ? (
        <PanelSkeleton filas={3} columnas={3} />
      ) : visibles.length === 0 ? (
        <PanelCard animado={false}>
          <EmptyState icono="⭐" titulo="No hay reseñas" descripcion={`No hay reseñas con este filtro.`} />
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {visibles.map((r, i) => (
            <PanelCard
              key={r.id_resena}
              className={`p-5 ${r.visible ? '' : 'border-red-200 opacity-70'} ${i ? `panel-come-d${Math.min(i + 1, 5)}` : 'panel-come'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-admin-heading">{r.cliente_nombre}</span>
                    <span className="text-xs text-[#D8A230]">{'★'.repeat(Number(r.calificacion))}{'☆'.repeat(5 - Number(r.calificacion))}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.visible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {r.visible ? 'Visible' : 'Oculta'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.producto_nombre} · {new Date(r.fecha_resena).toLocaleDateString('es-CO')}</p>
                  {r.comentario && <p className="text-sm text-gray-600 mt-2 leading-relaxed">"{r.comentario}"</p>}
                </div>
                <button
                  type="button"
                  onClick={() => cambiarVisibilidad(r, !r.visible)}
                  disabled={procesando === r.id_resena}
                  className={`shrink-0 h-9 px-4 rounded-lg text-xs font-medium border transition disabled:opacity-50 ${r.visible ? 'border-red-300 text-red-500 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                >
                  {r.visible ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </PanelCard>
          ))}
        </div>
      )}
    </div>
  )
}

export default ResenasAdmin
