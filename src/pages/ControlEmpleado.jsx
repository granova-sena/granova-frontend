import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ProductoModal from '../components/ProductoModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorModal from '../components/ui/ErrorModal'
import { bloquearNoNumerico, bloquearEntero, normalizarNumerico, normalizarEntero, normalizarCoordenada, normalizarTexto } from '../utils/validacion'
import toast from 'react-hot-toast'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'

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

function ControlEmpleado() {
  const [fincas, setFincas] = useState([])
  const [fincaId, setFincaId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoProducto, setEliminandoProducto] = useState(null)

  const [modalFinca, setModalFinca] = useState(false)
  const [formFinca, setFormFinca] = useState(fincaVacia)

  const [modalLote, setModalLote] = useState(false)
  const [formLote, setFormLote] = useState(loteVacio)

  const [productoEditar, setProductoEditar] = useState(null)
  const [loteParaNuevoProducto, setLoteParaNuevoProducto] = useState(null)

  const [loteProceso, setLoteProceso] = useState(null)
  const [presentaciones, setPresentaciones] = useState([])
  const [repartos, setRepartos] = useState({})
  const [valorEstimado, setValorEstimado] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [editandoPerdida, setEditandoPerdida] = useState(null)
  const [formPerdida, setFormPerdida] = useState({ kg_perdido: '' })
  const [loteLiberar, setLoteLiberar] = useState(null)
  const [kgLiberar, setKgLiberar] = useState('')
  const [loteEvento, setLoteEvento] = useState(null)
  const [formEvento, setFormEvento] = useState({ tipo_evento: 'cosecha', descripcion: '', ubicacion: '' })

  function cargar() {
    setLoading(true)
    api.get('/inventario/por-finca', { headers: authHeaders() })
      .then((res) => {
        setFincas(res.data.fincas)
        if (res.data.fincas.length > 0) {
          setFincaId((actual) => actual ?? res.data.fincas[0].id_finca)
        }
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    api.get('/inventario/presentaciones', { headers: authHeaders() })
      .then((res) => setPresentaciones(res.data.presentaciones.filter((p) => p.activo)))
      .catch(() => {})
  }, [])

  const fincasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return fincas
    return fincas.filter((f) =>
      coincideAproximado(f.nombre, busqueda) ||
      f.lotes.some((l) =>
        coincideAproximado(l.codigo_lote, busqueda) ||
        l.productos.some((p) => coincideAproximado(p.nombre, busqueda))
      )
    )
  }, [fincas, busqueda])

  useEffect(() => {
    if (busqueda.trim() && fincasFiltradas.length > 0 && !fincasFiltradas.some((f) => f.id_finca === fincaId)) {
      setFincaId(fincasFiltradas[0].id_finca)
    }
  }, [busqueda, fincasFiltradas, fincaId])

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
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function crearLote(e) {
    e.preventDefault()
    const finca = fincas.find((f) => f.id_finca === fincaId)
    if (!formLote.codigo_lote.trim() || !finca) return
    const codigoClave = formLote.codigo_lote.trim().toLowerCase()
    const existeLote = fincas.some((f) =>
      (f.lotes || []).some((l) => String(l.codigo_lote).trim().toLowerCase() === codigoClave)
    )
    if (existeLote) {
      setError(`El código de lote "${formLote.codigo_lote}" ya existe`)
      setModalLote(false)
      return
    }
    setGuardando(true)
    try {
      await api.post('/inventario/lotes', { ...formLote, finca: finca.nombre }, { headers: authHeaders() })
      setModalLote(false)
      setFormLote(loteVacio)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
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
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function abrirProcesar(lote) {
    setLoteProceso(lote)
    setRepartos({})
    setValorEstimado('')
  }

  const kgDisponibleLote = loteProceso
    ? loteProceso.cantidad_kg - loteProceso.kg_perdido - loteProceso.kg_en_proceso
    : 0
  const kgUsadoReparto = presentaciones.reduce(
    (suma, p) => suma + (Number(repartos[p.id_presentacion]) || 0) * (p.kg_equivalente || 0),
    0
  )

  async function confirmarProcesar() {
    const detalle = Object.entries(repartos)
      .filter(([, cantidad]) => Number(cantidad) > 0)
      .map(([id_presentacion, cantidad]) => ({ id_presentacion: Number(id_presentacion), cantidad: Number(cantidad) }))
    if (detalle.length === 0) return
    setGuardando(true)
    try {
      const kgUsadoNeto = Math.round(kgUsadoReparto * 1000) / 1000
      await api.post('/inventario/cosechas', {
        id_finca: loteProceso.id_finca ?? fincaId,
        id_lote: loteProceso.id_lote,
        kg_estimados: kgUsadoNeto,
        tipo_cafe: 'pergamino',
        valor_estimado: Number(valorEstimado) || 0,
        repartos: detalle,
        marcar_en_proceso: true,
      }, { headers: authHeaders() })
      setLoteProceso(null)
      setMensaje('Lote marcado en proceso — revísalo en "Cosechas planeadas" y confírmalo para sumarlo al catálogo. Al confirmarlo, sus kg dejan de estar disponibles en el lote (no se duplican).')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function liberarProceso(idLote) {
    if (!kgLiberar || Number(kgLiberar) <= 0) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/lotes/${idLote}/liberar-proceso`, { kg: kgLiberar }, { headers: authHeaders() })
      setLoteLiberar(null)
      setKgLiberar('')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
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
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <PanelSkeleton filas={3} columnas={4} />

  const finca = fincasFiltradas.find((f) => f.id_finca === fincaId) || fincasFiltradas[0]

  const totalFincas = fincasFiltradas.length
  const totalLotes = fincasFiltradas.reduce((s, f) => s + f.lotes.length, 0)
  const totalKg = fincasFiltradas.reduce((s, f) => s + (f.kgTotales || 0), 0)
  const totalProductos = fincasFiltradas.reduce((s, f) => s + f.lotes.reduce((sl, l) => sl + l.productos.length, 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Control de inventario"
        subtitulo="Elige una finca para ver el detalle de sus lotes y productos."
        acciones={
          <BotonPrimario onClick={() => setModalFinca(true)}>
            + Nueva finca
          </BotonPrimario>
        }
      />

      <div className="panel-come relative">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar finca, lote o producto..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400 text-gray-800"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      <ErrorModal mensaje={error} onClose={() => setError(null)} />

      {mensaje && (
        <div className="panel-come text-sm text-[#0F6E56] bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-xl px-4 py-3 flex justify-between items-center">
          <span>{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="text-[#0F6E56] hover:opacity-70 transition ml-3">✕</button>
        </div>
      )}

      {fincasFiltradas.length === 0 ? (
        <EmptyState
          icono={busqueda.trim() ? '🔍' : '🌾'}
          titulo={busqueda.trim() ? 'Sin coincidencias' : 'Sin fincas aún'}
          descripcion={busqueda.trim() ? `Nada coincide con "${busqueda}".` : 'Registra tu primera finca para comenzar a gestionar el inventario.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icono="🌾" label="Fincas" value={totalFincas} tono="verde" delay="panel-come-d1" />
            <StatCard icono="📦" label="Lotes activos" value={totalLotes} tono="cielo" delay="panel-come-d2" />
            <StatCard icono="🫘" label="Productos" value={totalProductos} tono="ambar" delay="panel-come-d3" />
            <StatCard icono="⚖️" label="Kg en inventario" value={`${totalKg} kg`} tono="violeta" delay="panel-come-d4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fincasFiltradas.map((f) => (
              <button
                key={f.id_finca}
                type="button"
                onClick={() => setFincaId(f.id_finca)}
                className={`panel-card panel-come text-left rounded-2xl p-5 bg-white transition ${
                  f.id_finca === fincaId ? 'border-2 border-[#1D9E75]' : 'border border-gray-200 hover:border-[#1D9E75]/40'
                }`}
              >
                <p className="font-medium text-sm text-admin-heading">{f.nombre}</p>
                <p className="text-xs text-gray-500 mt-1">{f.lotes.length} lote{f.lotes.length === 1 ? '' : 's'} activo{f.lotes.length === 1 ? '' : 's'}</p>
                <p className="text-lg font-semibold text-admin-heading mt-2">{f.kgTotales} kg</p>
                <p className="text-xs text-gray-400">en inventario</p>
              </button>
            ))}
          </div>

          {finca && (
            <div className="panel-come">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-admin-heading">{finca.nombre}</h2>
                <span className="text-xs text-gray-400">{finca.kgTotales} kg totales</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Cada lote en su propia tarjeta, con sus productos</p>

              <button
                type="button"
                onClick={() => setModalLote(true)}
                className="w-full border border-dashed border-gray-300 text-[#0F6E56] text-sm py-2.5 rounded-xl mb-5 hover:bg-[#1D9E75]/5 transition"
              >
                + Nuevo lote de esta finca
              </button>

              {finca.lotes.length === 0 ? (
                <PanelCard className="p-8">
                  <EmptyState icono="📋" titulo="Sin lotes" descripcion="Esta finca todavía no tiene lotes registrados." />
                </PanelCard>
              ) : (
                <div className="space-y-4">
                  {finca.lotes.map((lote) => (
                    <PanelCard key={lote.id_lote} className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-admin-heading">Lote {lote.codigo_lote}</p>
                        <span className="text-xs text-gray-400">
                          {(lote.cantidad_kg - lote.kg_perdido - lote.kg_en_proceso).toFixed(2)} kg disponibles de {lote.cantidad_kg} kg
                        </span>
                      </div>

                      {editandoPerdida === lote.id_lote ? (
                        <div className="bg-gray-50 rounded-xl p-3 mb-3">
                          <label className="block text-xs text-gray-500 mb-1">Kg perdido</label>
                          <input type="number" min="0" onKeyDown={bloquearNoNumerico} value={formPerdida.kg_perdido}
                            onChange={(e) => setFormPerdida({ kg_perdido: normalizarNumerico(e.target.value) })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                          <div className="flex gap-2 mt-2">
                            <button type="button" onClick={() => setEditandoPerdida(null)}
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                            <button type="button" disabled={guardando} onClick={() => guardarPerdida(lote.id_lote)}
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                          <span>Perdido: {lote.kg_perdido} kg</span>
                          <span>En proceso: {lote.kg_en_proceso} kg</span>
                          <button type="button" onClick={() => abrirEdicionPerdida(lote)} className="text-[#0F6E56] underline">Actualizar</button>
                          {lote.kg_en_proceso > 0 && (
                            loteLiberar === lote.id_lote ? (
                              <span className="flex items-center gap-1">
                                <input type="number" min="0" max={lote.kg_en_proceso} onKeyDown={bloquearNoNumerico} value={kgLiberar}
                                  onChange={(e) => setKgLiberar(normalizarNumerico(e.target.value))}
                                  placeholder="kg listos"
                                  className="w-20 px-1.5 py-0.5 border border-gray-200 rounded text-xs" />
                                <button type="button" disabled={guardando} onClick={() => liberarProceso(lote.id_lote)}
                                  className="text-[#0F6E56] underline">OK</button>
                                <button type="button" onClick={() => { setLoteLiberar(null); setKgLiberar('') }}
                                  className="text-gray-400">✕</button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => setLoteLiberar(lote.id_lote)} className="text-[#0F6E56] underline">
                                Ya terminó de procesarse
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {lote.productos.length === 0 ? (
                        <p className="text-sm text-gray-400 mb-3">Sin productos generados de este lote todavía.</p>
                      ) : (
                        <div className="overflow-x-auto mb-3">
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
                                  <td className="py-2.5 px-3 text-right text-gray-700">
                                    {p.stock} bolsas
                                    {p.kg_equivalente ? (
                                      <span className="block text-xs text-gray-400 mt-0.5">
                                        {(p.stock * p.kg_equivalente).toFixed(2)} kg
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => setProductoEditar({ ...p, id: p.id_producto })}
                                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition mr-1.5"
                                      title="Editar producto"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEliminandoProducto(p)}
                                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                                      title="Eliminar producto"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLoteEvento({ id_lote: lote.id_lote, codigo_lote: lote.codigo_lote })}
                          className="px-3 border border-dashed border-gray-300 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                          ➕ Evento
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoteParaNuevoProducto(lote.id_lote)}
                          className="flex-1 border border-dashed border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                          + Agregar producto a este lote
                        </button>
                        {(lote.cantidad_kg - lote.kg_perdido - lote.kg_en_proceso) > 0 && (
                          <button
                            type="button"
                            onClick={() => abrirProcesar(lote)}
                            className="flex-1 border border-[#1D9E75]/40 text-[#0F6E56] text-xs py-1.5 rounded-lg hover:bg-[#1D9E75]/5 transition"
                          >
                            Procesar lote
                          </button>
                        )}
                      </div>
                    </PanelCard>
                  ))}
                </div>
              )}
            </div>
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
                <select
                  value={formEvento.tipo_evento}
                  onChange={(e) => setFormEvento({ ...formEvento, tipo_evento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800"
                >
                  <option value="cosecha">🌱 Cosecha</option>
                  <option value="procesado">💧 Procesado</option>
                  <option value="tostado">🔥 Tueste</option>
                  <option value="envasado">📦 Envasado</option>
                  <option value="enviado">🚚 Enviado</option>
                  <option value="entregado">🏠 Entregado</option>
                </select>
              </div>
              <input
                placeholder="Descripción (opcional)"
                value={formEvento.descripcion}
                onChange={(e) => setFormEvento({ ...formEvento, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800"
              />
              <input
                placeholder="Ubicación (opcional)"
                value={formEvento.ubicacion}
                onChange={(e) => setFormEvento({ ...formEvento, ubicacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800"
              />
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
              <input placeholder="Altitud (msnm)" type="number" min="0" onKeyDown={bloquearEntero} value={formFinca.altitud}
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
              <input required placeholder="Cantidad inicial (kg)" type="number" min="0" onKeyDown={bloquearNoNumerico} value={formLote.cantidad_kg}
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
      {loteProceso && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold text-admin-heading mb-1">Procesar lote {loteProceso.codigo_lote}</h2>
            <p className="text-xs text-gray-400 mb-4">
              Reparte el kg disponible entre las presentaciones. El lote pasa a <strong>en proceso</strong> y
              queda esperando en <strong>Cosechas planeadas</strong>: al confirmarlo allá, las unidades se suman
              al catálogo y ese kg se descuenta de la capacidad del lote (no se duplica).
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500">Kg disponibles</p>
              <p className="text-xl font-semibold text-admin-heading">{kgDisponibleLote.toFixed(2)} kg</p>
            </div>

            <div className="space-y-3 max-h-52 overflow-y-auto mb-4">
              {presentaciones.map((p) => {
                const restanteParaEste = kgDisponibleLote - kgUsadoReparto + (Number(repartos[p.id_presentacion]) || 0) * p.kg_equivalente
                const maxUnidades = Math.floor(restanteParaEste / p.kg_equivalente)
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
                      value={repartos[p.id_presentacion] || ''}
                      onChange={(e) => setRepartos({ ...repartos, [p.id_presentacion]: normalizarEntero(e.target.value) })}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-xl text-sm text-right"
                    />
                  </div>
                )
              })}
              {presentaciones.length === 0 && (
                <p className="text-sm text-gray-400">No hay presentaciones en el catálogo todavía.</p>
              )}
            </div>

            <label className="block text-xs text-gray-500 mb-1">Costo del proceso (opcional, informativo)</label>
            <input
              type="number"
              min="0"
              onKeyDown={bloquearEntero}
              value={valorEstimado}
              onChange={(e) => setValorEstimado(normalizarEntero(e.target.value))}
              placeholder="Ej: 450000"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:border-[#1D9E75] bg-white text-gray-800"
            />

            <div className="flex items-center justify-between text-sm mb-4 pt-3 border-t border-gray-100">
              <span className="text-gray-500">Usado / disponible</span>
              <span className={`font-medium ${kgUsadoReparto > kgDisponibleLote ? 'text-red-500' : 'text-gray-800'}`}>
                {kgUsadoReparto.toFixed(2)} kg / {kgDisponibleLote.toFixed(2)} kg
              </span>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setLoteProceso(null)}
                className="flex-1 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button
                type="button"
                disabled={guardando || kgUsadoReparto === 0 || kgUsadoReparto > kgDisponibleLote}
                onClick={confirmarProcesar}
                className="flex-1 text-sm px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
              >
                {guardando ? 'Enviando...' : 'Mandar a cosecha planeada'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!eliminandoProducto}
        titulo="¿Eliminar producto?"
        mensaje={eliminandoProducto ? `¿Eliminar "${eliminandoProducto.nombre}" del inventario?` : ''}
        confirmarTexto="Eliminar"
        onConfirmar={eliminarProducto}
        onCancelar={() => setEliminandoProducto(null)}
      />
    </div>
  )
}

export default ControlEmpleado
