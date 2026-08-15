import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from "../config";

function ComparacionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ids = searchParams.get('ids') // ej: "5,9,14"

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargarComparacion() {
      if (!ids) {
        setError('No seleccionaste productos para comparar')
        setCargando(false)
        return
      }
      try {
        setCargando(true)
        const res = await fetch(`${API_URL}/productos/comparar?ids=${ids}`)
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        setProductos(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargarComparacion()
  }, [ids])

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
      <p className="text-white/50 text-sm">Cargando comparación...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#0a1a0a' }}>
      <p className="text-[#D85A30] text-sm">{error}</p>
      <Link to="/cliente/catalogo" className="text-[#9DC9B4] text-sm hover:underline">← Volver al catálogo</Link>
    </div>
  )

  // Filas de la tabla: cada una sabe cómo leer su valor de un producto
  const filas = [
    { label: 'Precio', render: (p) => `$${Number(p.precio).toLocaleString('es-CO')}` },
    { label: 'Tipo', render: (p) => p.tipo_cafe || '—' },
    { label: 'Presentación', render: (p) => p.presentacion || '—' },
    {
      label: 'Valoración',
      render: (p) => Number(p.total_resenas) > 0
        ? `★ ${Number(p.promedio).toFixed(1)} (${p.total_resenas})`
        : 'Sin reseñas todavía'
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-white">

        <h1 className="text-2xl sm:text-3xl font-semibold mb-1 tracking-tight">Comparar cafés</h1>
        <p className="text-xs text-white/40 mb-8">{productos.length} productos seleccionados</p>

        <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 sm:p-8 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <td className="w-32"></td>
                {productos.map(p => (
                  <th key={p.id_producto} className="text-center pb-4 px-3 border-b border-white/15">
                    <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-white/10 mb-2">
                      {p.imagen_url && <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />}
                    </div>
                    <p className="text-white font-medium text-xs leading-snug">{p.nombre}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, i) => (
                <tr key={fila.label}>
                  <td className="text-white/40 text-xs py-3 pr-3">{fila.label}</td>
                  {productos.map(p => (
                    <td
                      key={p.id_producto}
                      className={`text-center py-3 px-3 ${i < filas.length - 1 ? 'border-b border-white/10' : ''}`}
                    >
                      {fila.label === 'Valoración'
                        ? <span className="text-amber-400">{fila.render(p)}</span>
                        : <span className="text-white">{fila.render(p)}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => navigate('/cliente/catalogo')}
          className="mt-6 flex items-center gap-2 text-[#9DC9B4] text-sm hover:underline"
        >
          ← Volver al catálogo
        </button>

      </div>
    </div>
  )
}

export default ComparacionPage