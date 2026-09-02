import { useState, useEffect } from 'react'
import api from '../services/api'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'
import { bloquearEntero, normalizarEntero, normalizarTexto } from '../utils/validacion'

// ── ADMIN: PROMOCIONES (crear/editar/desactivar) ───────────
// Solo el administrador gestiona las ofertas que ve el cliente.
function PromocionesAdmin() {
  const [promos, setPromos] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null) // promo en edición (null = creando)

  const [form, setForm] = useState({
    nombre: '',
    valor_descuento: '',
    fecha_fin: '',
    estado: 'activa',
    productos: [],
  })

  function cargar() {
    setCargando(true)
    Promise.all([
      api.get('/admin/promociones'),
      api.get('/productos'),
    ])
      .then(([p, prod]) => {
        setPromos(p.data.data || [])
        setProductos((prod.data.data || []).filter((x) => x.estado === 'activo'))
      })
      .catch((err) => setError(err.response?.data?.mensaje || err.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  function abrirNueva() {
    setEditando(null)
    setMostrarForm(true)
    setForm({ nombre: '', valor_descuento: '', fecha_fin: '', estado: 'activa', productos: [] })
  }

  function abrirEdicion(promo) {
    setEditando(promo)
    setMostrarForm(true)
    setForm({
      nombre: promo.nombre,
      valor_descuento: String(promo.valor_descuento),
      fecha_fin: promo.fecha_fin ? String(promo.fecha_fin).slice(0, 10) : '',
      estado: promo.estado,
      productos: (promo.productos || []).map((x) => x.id_producto),
    })
  }

  function cerrarForm() {
    setMostrarForm(false)
    setEditando(null)
  }

  function toggleProducto(idProducto) {
    setForm((prev) => ({
      ...prev,
      productos: prev.productos.includes(idProducto)
        ? prev.productos.filter((x) => x !== idProducto)
        : [...prev.productos, idProducto],
    }))
  }

  async function guardar(e) {
    e.preventDefault()
    const descuento = Number(form.valor_descuento)
    if (!form.nombre.trim()) {
      setError('El nombre de la promoción es obligatorio')
      return
    }
    if (!Number.isFinite(descuento) || descuento < 1 || descuento > 100) {
      setError('El % de descuento debe estar entre 1 y 100')
      return
    }
    if (!form.fecha_fin) {
      setError('La fecha de fin es obligatoria')
      return
    }
    const esCierre = form.estado === 'finalizada' || form.estado === 'inactiva'
    if (!esCierre && new Date(form.fecha_fin) < new Date(new Date().toDateString())) {
      setError('La fecha de fin no puede estar en el pasado')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      if (editando) {
        await api.patch(`/admin/promociones/${editando.id_promocion}`, {
          nombre: form.nombre,
          valor_descuento: descuento,
          fecha_fin: form.fecha_fin,
          estado: form.estado,
          productos: form.productos,
        })
      } else {
        await api.post('/admin/promociones', {
          nombre: form.nombre,
          valor_descuento: descuento,
          fecha_fin: form.fecha_fin,
          productos: form.productos,
        })
      }
      abrirNueva()
      cargar()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar la promoción')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        titulo="Promociones y ofertas"
        subtitulo="Lo que crees aquí se aplica al instante en el catálogo del cliente (mayor gana)."
        acciones={(
          <BotonPrimario onClick={abrirNueva}>+ Nueva promoción</BotonPrimario>
        )}
      />

      {error && (
        <div className="panel-come text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={guardar} className="panel-come panel-card rounded-2xl border border-[#1D9E75]/30 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-admin-heading">{editando ? `Editando: ${editando.nombre}` : 'Nueva promoción'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              placeholder="Nombre (ej: Día del café)"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: normalizarTexto(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1D9E75] transition"
            />
            <input
              type="number"
              min="1"
              max="100"
              placeholder="% descuento"
              value={form.valor_descuento}
              onKeyDown={bloquearEntero}
              onChange={(e) => setForm({ ...form, valor_descuento: normalizarEntero(e.target.value) })}
              onBlur={(e) => {
                const v = Number(normalizarEntero(e.target.value))
                if (v < 1) setForm((prev) => ({ ...prev, valor_descuento: '1' }))
                if (v > 100) setForm((prev) => ({ ...prev, valor_descuento: '100' }))
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1D9E75] transition"
            />
            <input
              type="date"
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1D9E75] transition"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Aplica a estos productos (deja vacío si aún no decides):</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {productos.map((p) => (
                <button
                  type="button"
                  key={p.id_producto}
                  onClick={() => toggleProducto(p.id_producto)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${form.productos.includes(p.id_producto) ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'border-gray-200 text-gray-500 hover:border-[#1D9E75]'}`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {editando && (
              <>
                <label className="text-xs text-gray-500">Estado:</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none">
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                  <option value="finalizada">Finalizada</option>
                </select>
              </>
            )}
            <div className="flex-1" />
            <button type="button" onClick={cerrarForm} className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cerrar</button>
            <button type="submit" disabled={guardando} className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear promoción'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {cargando ? (
        <PanelSkeleton filas={3} columnas={3} />
      ) : promos.length === 0 ? (
        <PanelCard animado={false}>
          <EmptyState icono="🏷️" titulo="Aún no hay promociones" descripcion="Crea la primera con el botón de arriba." />
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {promos.map((p, i) => (
            <PanelCard
              key={p.id_promocion}
              className={`p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${i ? `panel-come-d${Math.min(i + 1, 5)}` : 'panel-come'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-admin-heading">🏷️ {p.nombre}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.estado}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D85A30] text-white">-{Number(p.valor_descuento)}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {p.fecha_fin ? `Válida hasta ${new Date(p.fecha_fin).toLocaleDateString('es-CO')}` : 'Sin fecha de fin'} · {p.productos?.length || 0} productos
                </p>
                {(p.productos || []).length > 0 && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{p.productos.map((x) => x.nombre).join(', ')}</p>
                )}
              </div>
              <button type="button" onClick={() => abrirEdicion(p)} className="shrink-0 h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                Editar
              </button>
            </PanelCard>
          ))}
        </div>
      )}
    </div>
  )
}

export default PromocionesAdmin
