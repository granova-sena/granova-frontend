import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ProductoModal from '../components/ProductoModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { toastErrorUnico } from '../utils/toastError'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario, BotonVolver } from '../components/ui/panel/PanelKit'
import { bloquearNoNumerico, bloquearEntero, normalizarEntero, normalizarNumerico, normalizarCoordenada, normalizarTexto } from '../utils/validacion'

function authHeaders() {
  const token = localStorage.getItem('token_empleado')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fincaVacia = { nombre: '', region: '', altitud: '', lat: '', lng: '' }
const loteVacio = { codigo_lote: '', region: '', variedad: '', cantidad_kg: '' }

function normalizar(txt) {
  return String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
function distancia(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}
function coincideAproximado(texto, query) {
  const t = normalizar(texto)
  const q = normalizar(query)
  if (!q) return true
  if (t.includes(q)) return true
  const tolerancia = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0
  return t.split(/\s+/).some((palabra) => distancia(palabra.slice(0, q.length + tolerancia), q) <= tolerancia)
}

const kgDisponibleDe = (lote) => lote.cantidad_kg - lote.kg_perdido - lote.kg_en_proceso

function ControlEmpleado() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [fincas, setFincas] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoProducto, setEliminandoProducto] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const [paso, setPaso] = useState(1)
  const [fincaId, setFincaId] = useState(null)
  const [loteDestacado, setLoteDestacado] = useState(null)
  const loteDestacadoRef = useRef(null)
  const [busquedaFinca, setBusquedaFinca] = useState('')
  const [busquedaLote, setBusquedaLote] = useState('')

  const [modalFinca, setModalFinca] = useState(false)
  const [formFinca, setFormFinca] = useState(fincaVacia)

  const [modalLote, setModalLote] = useState(false)
  const [formLote, setFormLote] = useState(loteVacio)

  const [modalEditarLote, setModalEditarLote] = useState(false)
  const [formEditarLote, setFormEditarLote] = useState(loteVacio)
  const [eliminandoLote, setEliminandoLote] = useState(null)

  const [productoEditar, setProductoEditar] = useState(null)
  const [loteParaNuevoProducto, setLoteParaNuevoProducto] = useState(null)

  const [seleccionados, setSeleccionados] = useState([])
  const [lotesPlanear, setLotesPlanear] = useState(null)
  const [presentaciones, setPresentaciones] = useState([])
  const [planearDatos, setPlanearDatos] = useState({})

  const [editandoPerdida, setEditandoPerdida] = useState(null)
  const [formPerdida, setFormPerdida] = useState({ kg_perdido: '' })
  const [loteEvento, setLoteEvento] = useState(null)
  const [formEvento, setFormEvento] = useState({ tipo_evento: 'cosecha', descripcion: '', ubicacion: '' })
  const [validacionPerdidas, setValidacionPerdidas] = useState(null)

  function cargar() {
    setLoading(true)
    api.get('/inventario/por-finca', { headers: authHeaders() })
      .then((res) => {
        const nuevas = res.data.fincas || []
        setFincas(nuevas)
        // Si venimos de eliminar una cosecha llegamos con ?finca=<id>&lote=<id>
        // para restablecer al control de inventario marcando ese lote.
        const fincaParam = searchParams.get('finca')
        const loteParam = searchParams.get('lote')
        if (fincaParam) {
          const id = Number(fincaParam)
          if (nuevas.some((f) => f.id_finca === id)) {
            setFincaId(id)
            setSeleccionados([])
            setBusquedaLote('')
            setPaso(2)
            if (loteParam) setLoteDestacado(Number(loteParam))
          }
          setSearchParams({}, { replace: true })
        }
      })
      .catch((err) => toastErrorUnico(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (!loteDestacado || !loading || !loteDestacadoRef.current) return
    loteDestacadoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loteDestacado, loading])

  useEffect(() => {
    api.get('/inventario/presentaciones', { headers: authHeaders() })
      .then((res) => setPresentaciones(res.data.presentaciones))
      .catch(() => {})
  }, [])

  const fincasFiltradas = useMemo(() => {
    if (!busquedaFinca.trim()) return fincas
    return fincas.filter((f) => coincideAproximado(f.nombre, busquedaFinca))
  }, [fincas, busquedaFinca])

  const finca = fincas.find((f) => f.id_finca === fincaId) || null

  const lotesFiltrados = useMemo(() => {
    if (!finca) return []
    if (!busquedaLote.trim()) return finca.lotes
    return finca.lotes.filter(
      (l) => coincideAproximado(l.codigo_lote, busquedaLote) ||
        l.productos.some((p) => coincideAproximado(p.nombre, busquedaLote))
    )
  }, [finca, busquedaLote])

  const totalFincas = fincas.length
  const totalLotes = fincas.reduce((s, f) => s + f.lotes.length, 0)
  const totalKg = fincas.reduce((s, f) => s + (f.kgTotales || 0), 0)
  const totalProductos = fincas.reduce((s, f) => s + f.lotes.reduce((sl, l) => sl + l.productos.length, 0), 0)

  function elegirFinca(id) {
    setFincaId(id)
    setSeleccionados([])
    setBusquedaLote('')
    setLoteDestacado(null)
    setPaso(2)
  }

  function alternarSeleccion(id) {
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function crearFinca(e) {
    e.preventDefault()
    if (!formFinca.nombre.trim()) return
    setGuardando(true)
    try {
      await api.post('/inventario/fincas', formFinca, { headers: authHeaders() })
      setModalFinca(false)
      setFormFinca(fincaVacia)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function crearLote(e) {
    e.preventDefault()
    if (!formLote.codigo_lote.trim() || !finca) return
    setGuardando(true)
    try {
      await api.post('/inventario/lotes', { ...formLote, finca: finca.nombre }, { headers: authHeaders() })
      setModalLote(false)
      setFormLote(loteVacio)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function abrirEditarLote(lote) {
    setFormEditarLote({
      codigo_lote: lote.codigo_lote,
      region: lote.region || '',
      variedad: lote.variedad || '',
      cantidad_kg: lote.cantidad_kg,
    })
    setModalEditarLote(true)
  }

  async function guardarEdicionLote(e) {
    e.preventDefault()
    if (!modalEditarLote || !formEditarLote.codigo_lote.trim()) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/lotes/${modalEditarLote.id_lote}`, {
        codigo_lote: formEditarLote.codigo_lote,
        region: formEditarLote.region,
        variedad: formEditarLote.variedad,
        cantidad_kg: Number(formEditarLote.cantidad_kg) || 0,
      }, { headers: authHeaders() })
      setModalEditarLote(false)
      cargar()
      toast.success('Lote actualizado')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarLoteConfirmado() {
    const lote = eliminandoLote
    setEliminandoLote(null)
    if (!lote) return
    setGuardando(true)
    try {
      await api.delete(`/inventario/lotes/${lote.id_lote}`, { headers: authHeaders() })
      setSeleccionados((prev) => prev.filter((x) => x !== lote.id_lote))
      cargar()
      toast.success(`Lote ${lote.codigo_lote} eliminado`)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarProducto() {
    const producto = eliminandoProducto
    setEliminandoProducto(null)
    if (!producto) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/productos/${producto.id_producto}/eliminar`, {}, { headers: authHeaders() })
      cargar()
      toast.success('Producto eliminado del inventario')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function abrirEdicionPerdida(lote) {
    setEditandoPerdida(lote.id_lote)
    setFormPerdida({ kg_perdido: String(lote.kg_perdido) })
  }

  async function guardarPerdida(idLote) {
    setGuardando(true)
    try {
      await api.patch(`/inventario/lotes/${idLote}/perdida-proceso`, { kg_perdido: Number(formPerdida.kg_perdido) || 0 }, { headers: authHeaders() })
      setEditandoPerdida(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function abrirPlanear(lotes) {
    const datos = {}
    lotes.forEach((l) => { datos[l.id_lote] = { repartos: {}, valorEstimado: '' } })
    setLotesPlanear(lotes)
    setPlanearDatos(datos)
  }

  const datosLote = (id) => planearDatos[id] || { repartos: {}, valorEstimado: '' }
  const kgUsadoDe = (id) => presentaciones.reduce(
    (suma, p) => suma + (Number(datosLote(id).repartos[p.id_presentacion]) || 0) * (p.kg_equivalente || 0),
    0
  )
  const restanteParaPresentacion = (lote, presentacion) => {
    const usado = kgUsadoDe(lote.id_lote)
    const datoPresentacion = Number(datosLote(lote.id_lote).repartos[presentacion.id_presentacion]) || 0
    return kgDisponibleDe(lote) - usado + datoPresentacion * presentacion.kg_equivalente
  }

  async function confirmarPlanear() {
    if (!lotesPlanear) return
    let planeados = 0
    setGuardando(true)
    try {
      for (const lote of lotesPlanear) {
        const detalle = Object.entries(datosLote(lote.id_lote).repartos)
          .filter(([, cantidad]) => Number(cantidad) > 0)
          .map(([id_presentacion, cantidad]) => ({ id_presentacion: Number(id_presentacion), cantidad: Number(cantidad) }))
        if (detalle.length === 0) continue
        const kgUsado = presentaciones.reduce(
          (suma, p) => suma + (Number(datosLote(lote.id_lote).repartos[p.id_presentacion]) || 0) * (p.kg_equivalente || 0),
          0
        )
        const kgBrutoEstimado = Math.ceil((kgUsado / 0.82) * 1000) / 1000
        await api.post('/inventario/cosechas', {
          id_finca: lote.id_finca ?? fincaId,
          id_lote: lote.id_lote,
          kg_estimados: kgBrutoEstimado,
          tipo_cafe: 'pergamino',
          valor_estimado: Number(datosLote(lote.id_lote).valorEstimado) || 0,
          repartos: detalle,
          marcar_en_proceso: true,
        }, { headers: authHeaders() })
        planeados++
      }
      setLotesPlanear(null)
      setSeleccionados([])
      setMensaje(
        planeados === 0
          ? 'Debes repartir kg en al menos una presentación para planear una cosecha.'
          : `Cosecha${planeados > 1 ? 's' : ''} planeada${planeados > 1 ? 's' : ''} para ${planeados} lote${planeados > 1 ? 's' : ''} — revísalo${planeados > 1 ? 's' : ''} en "Planear cosechas" y confirma la llegada para sumarlo al catálogo.`
      )
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function validarPerdidas(lotes) {
    const conCero = lotes.filter((l) => Number(l.kg_perdido || 0) === 0)
    if (conCero.length > 0) {
      const nombres = conCero.map((l) => l.codigo_lote).join(', ')
      setValidacionPerdidas({
        titulo: 'Actualiza las pérdidas',
        mensaje: `El${conCero.length > 1 ? 's lote' + (conCero.length > 1 ? 's' : '') : ' lote'} ${nombres} tiene${conCero.length === 1 ? '' : 'n'} 0 kg de pérdidas registradas. Actualiza las pérdidas antes de planear la cosecha para que el inventario sea correcto.`,
        lotes,
      })
      return
    }
    setValidacionPerdidas({
      titulo: '¿Revisaste las pérdidas?',
      mensaje: '¿Ya verificaste que las pérdidas de cada lote sean correctas? Al confirmar se creará la cosecha planeada y el café pasará a "en proceso".',
      lotes,
    })
  }

  function confirmarValidacionPerdidas() {
    const lotes = validacionPerdidas?.lotes
    setValidacionPerdidas(null)
    if (lotes && lotes.length > 0) abrirPlanear(lotes)
  }

  async function guardarEventoLote(e) {
    e.preventDefault()
    if (!loteEvento) return
    setGuardando(true)
    try {
      await api.post(`/inventario/lotes/${loteEvento.id_lote}/eventos`, formEvento, { headers: authHeaders() })
      setLoteEvento(null)
      setFormEvento({ tipo_evento: 'cosecha', descripcion: '', ubicacion: '' })
      setMensaje('Evento registrado — ya aparece en "Ver origen" del cliente.')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  const hayRepartoEn = (id) => presentaciones.some(
    (p) => Number(datosLote(id).repartos[p.id_presentacion]) > 0
  )
  const puedeEnviar = lotesPlanear ? lotesPlanear.some((l) => hayRepartoEn(l.id_lote)) : false

  const seleccionadosConDisponibilidad = finca
    ? seleccionados.filter((id) => kgDisponibleDe(finca.lotes.find((l) => l.id_lote === id)) > 0)
    : []

  if (loading) return <PanelSkeleton filas={3} columnas={4} />

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Control de inventario"
        subtitulo={paso === 1
          ? 'Paso 1 de 2: elige la finca para ver sus lotes.'
          : `Paso 2 de 2: lotes de ${finca?.nombre || 'la finca'} — puedes seleccionar varios y planear cosecha.`}
        acciones={
          <BotonPrimario onClick={() => setModalFinca(true)}>
            + Nueva finca
          </BotonPrimario>
        }
      />

      {paso === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icono="🌾" label="Fincas" value={totalFincas} tono="verde" delay="panel-come-d1" />
          <StatCard icono="📦" label="Lotes activos" value={totalLotes} tono="cielo" delay="panel-come-d2" />
          <StatCard icono="🫘" label="Productos" value={totalProductos} tono="ambar" delay="panel-come-d3" />
          <StatCard icono="⚖️" label="Kg en inventario" value={`${totalKg} kg`} tono="violeta" delay="panel-come-d4" />
        </div>
      )}

      {mensaje && (
        <div className="panel-come text-sm text-[#0F6E56] bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-xl px-4 py-3 flex justify-between items-center">
          <span>{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="text-[#0F6E56] hover:opacity-70 transition ml-3">✕</button>
        </div>
      )}

      {paso === 1 ? (
        <>
          <div className="panel-come relative">
            <input
              type="text"
              value={busquedaFinca}
              onChange={(e) => setBusquedaFinca(e.target.value)}
              placeholder="Buscar finca..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400 text-gray-800"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {fincasFiltradas.length === 0 ? (
            <EmptyState
              icono={busquedaFinca.trim() ? '🔍' : '🌾'}
              titulo={busquedaFinca.trim() ? 'Sin coincidencias' : 'Sin fincas aún'}
              descripcion={busquedaFinca.trim() ? `Nada coincide con "${busquedaFinca}".` : 'Registra tu primera finca para comenzar a gestionar el inventario.'}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fincasFiltradas.map((f) => (
                <button
                  key={f.id_finca}
                  type="button"
                  onClick={() => elegirFinca(f.id_finca)}
                  className="panel-card panel-come text-left rounded-2xl p-5 bg-white border border-gray-200 hover:border-[#1D9E75]/60 hover:shadow-sm transition group"
                >
                  <p className="font-medium text-sm text-admin-heading">{f.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">{f.lotes.length} lote{f.lotes.length === 1 ? '' : 's'} activo{f.lotes.length === 1 ? '' : 's'}</p>
                  <p className="text-lg font-semibold text-admin-heading mt-2">{f.kgTotales} kg</p>
                  <p className="text-xs text-gray-400">en inventario</p>
                  <span className="text-[11px] text-[#0F6E56] font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ver lotes →
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <BotonVolver onClick={() => setPaso(1)} texto="Cambiar de finca" />
              <h2 className="font-semibold text-admin-heading mt-1">{finca?.nombre}</h2>
            </div>
            <button
              type="button"
              onClick={() => setModalLote(true)}
              className="border border-dashed border-gray-300 text-[#0F6E56] text-sm py-2 px-4 rounded-xl hover:bg-[#1D9E75]/5 transition"
            >
              + Nuevo lote de esta finca
            </button>
          </div>

          <div className="panel-come relative">
            <input
              type="text"
              value={busquedaLote}
              onChange={(e) => setBusquedaLote(e.target.value)}
              placeholder="Buscar lote o producto de esta finca..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400 text-gray-800"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {lotesFiltrados.length === 0 ? (
            <PanelCard className="p-8">
              <EmptyState icono="📋" titulo="Sin lotes" descripcion={busquedaLote ? 'Nada coincide con la búsqueda.' : 'Esta finca todavía no tiene lotes registrados.'} />
            </PanelCard>
          ) : (
            <>
              <div className="space-y-4">
                {lotesFiltrados.map((lote) => {
                  const seleccionado = seleccionados.includes(lote.id_lote)
                  const dispon = kgDisponibleDe(lote)
                  const destacado = lote.id_lote === loteDestacado
                  return (
                    <div key={lote.id_lote} ref={destacado ? loteDestacadoRef : undefined}>
                    <PanelCard
                      className={`p-5 transition ${seleccionado ? 'border-[#1D9E75] ring-1 ring-[#1D9E75]/40' : ''} ${destacado ? 'border-[#1D9E75]/70 ring-2 ring-[#1D9E75]/30 anim-pop' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => alternarSeleccion(lote.id_lote)}
                              className="w-4 h-4 accent-[#1D9E75]"
                            />
                            <span className="text-sm font-semibold text-admin-heading">Lote {lote.codigo_lote}</span>
                          </label>
                        </div>
                        <span className="text-xs text-gray-400">
                          {dispon.toFixed(2)} kg disponibles de {lote.cantidad_kg} kg
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button type="button" onClick={() => abrirEditarLote(lote)} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition" title="Editar lote">
                          ✎ Editar lote
                        </button>
                        <button type="button" onClick={() => setEliminandoLote(lote)} className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition" title="Eliminar lote">
                          ✕ Eliminar
                        </button>
                        {editandoPerdida === lote.id_lote ? (
                          <span className="flex items-center gap-1">
                            <input type="number" min="0" value={formPerdida.kg_perdido}
                              onKeyDown={bloquearNoNumerico}
                              onChange={(e) => setFormPerdida({ kg_perdido: normalizarNumerico(e.target.value) })}
                              className="w-20 px-1.5 py-1 border border-gray-200 rounded text-xs" />
                            <button type="button" disabled={guardando} onClick={() => guardarPerdida(lote.id_lote)} className="text-[#0F6E56] underline">OK</button>
                            <button type="button" onClick={() => setEditandoPerdida(null)} className="text-gray-400">✕</button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => abrirEdicionPerdida(lote)} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                            Perdido: {lote.kg_perdido} kg
                          </button>
                        )}
                        <span className="text-xs text-gray-400">En proceso: {lote.kg_en_proceso} kg</span>
                      </div>

                      {lote.productos.length === 0 ? (
                        <p className="text-sm text-gray-400 mb-3">Sin productos generados de este lote todavía.</p>
                      ) : (
                        <>
                          <div className="hidden md:block overflow-x-auto mb-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-gray-500 bg-gray-50">
                                  <th className="py-2 px-3 font-medium rounded-tl-lg">Producto</th>
                                  <th className="py-2 px-3 font-medium">Precio</th>
                                  <th className="py-2 px-3 font-medium text-right">Stock</th>
                                  <th className="py-2 px-3 font-medium text-right rounded-tr-lg">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lote.productos.map((p) => (
                                  <tr key={p.id_producto} className="border-t border-gray-100">
                                    <td className="py-2.5 px-3 text-gray-700 font-medium">{p.nombre}</td>
                                    <td className="py-2.5 px-3 text-gray-500">{formatMoney(p.precio)}</td>
                                    <td className="py-2.5 px-3 text-right text-gray-700">{p.stock} kg</td>
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                      <button type="button" onClick={() => setProductoEditar({ ...p, id: p.id_producto })}
                                        className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition mr-1.5" title="Editar producto">✎</button>
                                      <button type="button" onClick={() => setEliminandoProducto(p)}
                                        className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition" title="Eliminar producto">✕</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100 mb-3">
                            {lote.productos.map((p) => (
                              <div key={p.id_producto} className="p-4 flex flex-col gap-1.5">
                                <p className="text-sm font-medium text-gray-700">{p.nombre}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">{formatMoney(p.precio)}</span>
                                  <span className="text-gray-700">{p.stock} kg</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <button type="button" onClick={() => setProductoEditar({ ...p, id: p.id_producto })}
                                    className="inline-flex items-center justify-center px-3 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition text-xs">✎ Editar</button>
                                  <button type="button" onClick={() => setEliminandoProducto(p)}
                                    className="inline-flex items-center justify-center px-3 h-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition text-xs">✕ Eliminar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <button type="button" onClick={() => setLoteEvento({ id_lote: lote.id_lote, codigo_lote: lote.codigo_lote })}
                          className="px-3 border border-dashed border-gray-300 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition">
                          ➕ Evento
                        </button>
                        <button type="button" onClick={() => setLoteParaNuevoProducto(lote.id_lote)}
                          className="flex-1 border border-dashed border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition">
                          + Agregar producto a este lote
                        </button>
                        {dispon > 0 ? (
                          <button type="button" onClick={() => validarPerdidas([lote])}
                            className="flex-1 border border-[#1D9E75]/40 text-[#0F6E56] text-xs py-1.5 rounded-lg hover:bg-[#1D9E75]/5 transition">
                            Planear cosecha
                          </button>
                        ) : (
                          <button type="button" disabled
                            className="flex-1 border border-gray-200 text-gray-300 text-xs py-1.5 rounded-lg cursor-not-allowed">
                            Planear cosecha
                          </button>
                        )}
                      </div>
                    </PanelCard>
                    </div>
                  )
                })}
              </div>

              {seleccionados.length > 0 && (
                <div className="sticky bottom-4 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg bg-[#1a2e1a] text-white">
                  <span className="text-sm">
                    {seleccionados.length} lote{seleccionados.length === 1 ? '' : 's'} seleccionado{seleccionados.length === 1 ? '' : 's'}
                    <span className="block text-xs text-white/60 text-[#9DC9B4]">Se planea una cosecha por cada lote seleccionado</span>
                  </span>
                  <button
                    type="button"
                    disabled={seleccionadosConDisponibilidad.length === 0}
                    onClick={() => validarPerdidas(finca.lotes.filter((l) => seleccionados.includes(l.id_lote)))}
                    className="text-sm px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Planear cosecha ({seleccionados.length}) →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {loteEvento && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-admin-heading mb-1">Registrar evento</h2>
            <p className="text-xs text-gray-400 mb-4">Lote {loteEvento.codigo_lote} · aparecerá en "Ver origen" del cliente</p>
            <form onSubmit={guardarEventoLote} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo de evento</label>
                <select value={formEvento.tipo_evento}
                  onChange={(e) => setFormEvento({ ...formEvento, tipo_evento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800">
                  <option value="cosecha">🌱 Cosecha</option>
                  <option value="procesado">💧 Procesado</option>
                  <option value="tostado">🔥 Tueste</option>
                  <option value="envasado">📦 Envasado</option>
                  <option value="enviado">🚚 Enviado</option>
                  <option value="entregado">🏠 Entregado</option>
                </select>
              </div>
              <input placeholder="Descripción (opcional)" value={formEvento.descripcion}
                onChange={(e) => setFormEvento({ ...formEvento, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input placeholder="Ubicación (opcional)" value={formEvento.ubicacion}
                onChange={(e) => setFormEvento({ ...formEvento, ubicacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setLoteEvento(null)}
                  className="flex-1 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalFinca && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-admin-heading mb-4">Nueva finca</h2>
            <form onSubmit={crearFinca} className="space-y-3">
              <input required placeholder="Nombre" value={formFinca.nombre}
                onChange={(e) => setFormFinca({ ...formFinca, nombre: normalizarTexto(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input placeholder="Región" value={formFinca.region}
                onChange={(e) => setFormFinca({ ...formFinca, region: normalizarTexto(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input placeholder="Altitud (msnm)" type="number" value={formFinca.altitud}
                onKeyDown={bloquearEntero}
                onChange={(e) => setFormFinca({ ...formFinca, altitud: normalizarEntero(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Latitud" value={formFinca.lat}
                  onChange={(e) => setFormFinca({ ...formFinca, lat: normalizarCoordenada(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
                <input placeholder="Longitud" value={formFinca.lng}
                  onChange={(e) => setFormFinca({ ...formFinca, lng: normalizarCoordenada(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalFinca(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Creando...' : 'Crear finca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalLote && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-admin-heading mb-1">Nuevo lote</h2>
            <p className="text-xs text-gray-400 mb-4">Para {finca?.nombre}</p>
            <form onSubmit={crearLote} className="space-y-3">
              <input required placeholder="Código de lote (ej. LOTE-VERGEL-03)" value={formLote.codigo_lote}
                onChange={(e) => setFormLote({ ...formLote, codigo_lote: normalizarTexto(e.target.value).toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input placeholder="Región" value={formLote.region}
                onChange={(e) => setFormLote({ ...formLote, region: normalizarTexto(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input placeholder="Variedad (ej. Bourbon Rosado)" value={formLote.variedad}
                onChange={(e) => setFormLote({ ...formLote, variedad: normalizarTexto(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input required placeholder="Cantidad inicial (kg)" type="number" value={formLote.cantidad_kg}
                onKeyDown={bloquearNoNumerico}
                onChange={(e) => setFormLote({ ...formLote, cantidad_kg: normalizarNumerico(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalLote(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Creando...' : 'Crear lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEditarLote && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-admin-heading mb-1">Editar lote</h2>
            <p className="text-xs text-gray-400 mb-4">{modalEditarLote.codigo_lote} de {finca?.nombre}</p>
            <form onSubmit={guardarEdicionLote} className="space-y-3">
              <input required placeholder="Código de lote" value={formEditarLote.codigo_lote}
                onChange={(e) => setFormEditarLote({ ...formEditarLote, codigo_lote: normalizarTexto(e.target.value).toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input placeholder="Región" value={formEditarLote.region}
                onChange={(e) => setFormEditarLote({ ...formEditarLote, region: normalizarTexto(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input placeholder="Variedad" value={formEditarLote.variedad}
                onChange={(e) => setFormEditarLote({ ...formEditarLote, variedad: normalizarTexto(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <input required placeholder="Cantidad (kg)" type="number" value={formEditarLote.cantidad_kg}
                onKeyDown={bloquearNoNumerico}
                onChange={(e) => setFormEditarLote({ ...formEditarLote, cantidad_kg: normalizarNumerico(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalEditarLote(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {productoEditar && (
        <ProductoModal
          producto={productoEditar}
          onClose={() => setProductoEditar(null)}
          onGuardado={() => { setProductoEditar(null); cargar() }}
        />
      )}

      {loteParaNuevoProducto && (
        <ProductoModal
          producto={null}
          loteInicial={loteParaNuevoProducto}
          onClose={() => setLoteParaNuevoProducto(null)}
          onGuardado={() => { setLoteParaNuevoProducto(null); cargar() }}
        />
      )}

      {lotesPlanear && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-8">
            <h2 className="font-semibold text-admin-heading mb-1">
              Planear cosecha{lotesPlanear.length > 1 ? ` (${lotesPlanear.length} lotes)` : ` — Lote ${lotesPlanear[0]?.codigo_lote}`}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Reparte el kg disponible entre las presentaciones. Cada lote pasará a <strong>en proceso</strong> y
              quedará esperando en <strong>Cosechas planeadas</strong>: al confirmar la llegada ahí, se suma al catálogo.
            </p>

            <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
              {lotesPlanear.map((lote) => {
                const disponible = kgDisponibleDe(lote)
                const usado = kgUsadoDe(lote.id_lote)
                return (
                  <div key={lote.id_lote} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-admin-heading">Lote {lote.codigo_lote}</p>
                      <span className="text-xs text-gray-400">{disponible.toFixed(2)} kg disponibles</span>
                    </div>
                    <div className="space-y-2">
                      {presentaciones.map((p) => {
                        const restante = restanteParaPresentacion(lote, p)
                        const maxUnidades = Math.floor(restante / p.kg_equivalente)
                        return (
                          <div key={p.id_presentacion} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-700 truncate">{p.nombre}</p>
                              <p className="text-xs text-gray-400">máx {maxUnidades} unidades</p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              onKeyDown={bloquearEntero}
                              value={datosLote(lote.id_lote).repartos[p.id_presentacion] || ''}
                              onChange={(e) => setPlanearDatos((prev) => ({
                                ...prev,
                                [lote.id_lote]: {
                                  ...prev[lote.id_lote],
                                  repartos: { ...prev[lote.id_lote].repartos, [p.id_presentacion]: normalizarEntero(e.target.value) },
                                },
                              }))}
                              className="w-20 px-2 py-1.5 border border-gray-200 rounded-xl text-sm text-right"
                            />
                          </div>
                        )
                      })}
                      {presentaciones.length === 0 && (
                        <p className="text-sm text-gray-400">No hay presentaciones en el catálogo todavía.</p>
                      )}
                    </div>
                    <label className="block text-xs text-gray-500 mt-3 mb-1">Valor estimado del reparto (opcional)</label>
                    <input
                      type="number"
                      min="0"
                      onKeyDown={bloquearEntero}
                      value={datosLote(lote.id_lote).valorEstimado}
                      onChange={(e) => setPlanearDatos((prev) => ({
                        ...prev,
                        [lote.id_lote]: { ...prev[lote.id_lote], valorEstimado: normalizarEntero(e.target.value) },
                      }))}
                      placeholder="Ej: 450000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800"
                    />
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                      <span className="text-gray-500">Usado / disponible</span>
                      <span className={`font-medium ${usado > disponible ? 'text-red-500' : 'text-gray-800'}`}>
                        {usado.toFixed(2)} kg / {disponible.toFixed(2)} kg
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => setLotesPlanear(null)}
                className="flex-1 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button
                type="button"
                disabled={guardando || !puedeEnviar}
                onClick={confirmarPlanear}
                className="flex-1 text-sm px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
              >
                {guardando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!eliminandoLote}
        titulo="¿Eliminar lote?"
        mensaje={eliminandoLote ? `Se eliminarán el lote ${eliminandoLote.codigo_lote} y sus eventos. No se podrá si tiene productos activos, procesamientos, cosechas en curso o entregas registradas.` : ''}
        confirmarTexto="Eliminar"
        onConfirmar={eliminarLoteConfirmado}
        onCancelar={() => setEliminandoLote(null)}
      />

      <ConfirmDialog
        abierto={!!eliminandoProducto}
        titulo="¿Eliminar producto?"
        mensaje={eliminandoProducto ? `¿Eliminar "${eliminandoProducto.nombre}" del inventario?` : ''}
        confirmarTexto="Eliminar"
        onConfirmar={eliminarProducto}
        onCancelar={() => setEliminandoProducto(null)}
      />

      <ConfirmDialog
        abierto={!!validacionPerdidas}
        titulo={validacionPerdidas?.titulo || '¿Continuar?'}
        mensaje={validacionPerdidas?.mensaje || ''}
        confirmarTexto="Continuar"
        colorConfirmar="#1D9E75"
        onConfirmar={confirmarValidacionPerdidas}
        onCancelar={() => setValidacionPerdidas(null)}
      />
    </div>
  )
}

export default ControlEmpleado