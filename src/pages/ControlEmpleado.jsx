import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ProductoModal from '../components/ProductoModal'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fincaVacia = { nombre: '', region: '', altitud: '', lat: '', lng: '' }
const loteVacio = { codigo_lote: '', region: '', variedad: '', cantidad_kg: '' }

// Búsqueda tolerante a errores: sin tildes/mayúsculas, y permite hasta
// 2 letras de diferencia (typo) en palabras de 4+ caracteres.
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

  const [modalFinca, setModalFinca] = useState(false)
  const [formFinca, setFormFinca] = useState(fincaVacia)

  const [modalLote, setModalLote] = useState(false)
  const [formLote, setFormLote] = useState(loteVacio)

  const [productoEditar, setProductoEditar] = useState(null)
  const [loteParaNuevoProducto, setLoteParaNuevoProducto] = useState(null)

  const [loteProceso, setLoteProceso] = useState(null) // lote completo abierto en el modal de procesar
  const [presentaciones, setPresentaciones] = useState([])
  const [repartos, setRepartos] = useState({}) // { id_presentacion: cantidad }
  const [editandoPerdida, setEditandoPerdida] = useState(null) // id_lote
  const [formPerdida, setFormPerdida] = useState({ kg_perdido: '', kg_en_proceso: '' })
  const [loteLiberar, setLoteLiberar] = useState(null) // id_lote con el input de liberar abierto
  const [kgLiberar, setKgLiberar] = useState('')

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

  async function eliminarProducto(producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" del inventario?`)) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/productos/${producto.id_producto}/eliminar`, {}, { headers: authHeaders() })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  function abrirEdicionPerdida(lote) {
    setEditandoPerdida(lote.id_lote)
    setFormPerdida({ kg_perdido: String(lote.kg_perdido), kg_en_proceso: String(lote.kg_en_proceso) })
  }

  async function guardarPerdida(idLote) {
    setGuardando(true)
    try {
      await api.patch(`/inventario/lotes/${idLote}/perdida-proceso`, formPerdida, { headers: authHeaders() })
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
      await api.post(`/inventario/lotes/${loteProceso.id_lote}/procesar`, { repartos: detalle }, { headers: authHeaders() })
      setLoteProceso(null)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando inventario...</p>

  const finca = fincasFiltradas.find((f) => f.id_finca === fincaId) || fincasFiltradas[0]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Control de inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Elige una finca para ver el detalle de sus lotes y productos.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalFinca(true)}
          className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap"
        >
          + Nueva finca
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar finca, lote o producto..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      {fincasFiltradas.length === 0 ? (
        <p className="text-sm text-gray-400">
          {busqueda.trim() ? `Nada coincide con "${busqueda}".` : 'Aún no hay fincas registradas.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fincasFiltradas.map((f) => (
              <button
                key={f.id_finca}
                type="button"
                onClick={() => setFincaId(f.id_finca)}
                className={`text-left rounded-xl p-4 bg-white transition ${
                  f.id_finca === fincaId ? 'border-2 border-[#1D9E75]' : 'border border-gray-200 hover:border-[#1D9E75]/40'
                }`}
              >
                <p className="font-medium text-sm text-gray-800">{f.nombre}</p>
                <p className="text-xs text-gray-500 mt-1">{f.lotes.length} lote{f.lotes.length === 1 ? '' : 's'} activo{f.lotes.length === 1 ? '' : 's'}</p>
                <p className="text-lg font-medium text-gray-800 mt-2">{f.kgTotales} kg</p>
                <p className="text-xs text-gray-400">en inventario</p>
              </button>
            ))}
          </div>

          {finca && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-medium text-gray-800">{finca.nombre}</h2>
                <span className="text-xs text-gray-400">{finca.kgTotales} kg totales</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Cada lote en su propia tarjeta, con sus productos</p>

              <button
                type="button"
                onClick={() => setModalLote(true)}
                className="w-full border border-dashed border-gray-300 text-[#0F6E56] text-sm py-2 rounded-lg mb-5 hover:bg-[#1D9E75]/5 transition"
              >
                + Nuevo lote de esta finca
              </button>

              {finca.lotes.length === 0 ? (
                <p className="text-sm text-gray-400">Esta finca todavía no tiene lotes.</p>
              ) : (
                <div className="space-y-4">
                  {finca.lotes.map((lote) => (
                    <div key={lote.id_lote} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-800">Lote {lote.codigo_lote}</p>
                        <span className="text-xs text-gray-400">
                          {(lote.cantidad_kg - lote.kg_perdido - lote.kg_en_proceso).toFixed(2)} kg disponibles de {lote.cantidad_kg} kg
                        </span>
                      </div>

                      {editandoPerdida === lote.id_lote ? (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Kg perdido</label>
                            <input type="number" min="0" value={formPerdida.kg_perdido}
                              onChange={(e) => setFormPerdida({ ...formPerdida, kg_perdido: e.target.value })}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Kg en proceso</label>
                            <input type="number" min="0" value={formPerdida.kg_en_proceso}
                              onChange={(e) => setFormPerdida({ ...formPerdida, kg_en_proceso: e.target.value })}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <div className="col-span-2 flex gap-2 mt-1">
                            <button type="button" onClick={() => setEditandoPerdida(null)}
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                            <button type="button" disabled={guardando} onClick={() => guardarPerdida(lote.id_lote)}
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50">Guardar</button>
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
                                <input type="number" min="0" max={lote.kg_en_proceso} value={kgLiberar}
                                  onChange={(e) => setKgLiberar(e.target.value)}
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
                        <table className="w-full text-sm mb-3">
                          <tbody>
                            {lote.productos.map((p) => (
                              <tr key={p.id_producto} className="border-t border-gray-50">
                                <td className="py-2 text-gray-700">{p.nombre}</td>
                                <td className="py-2 text-gray-500">{formatMoney(p.precio)}</td>
                                <td className="py-2 text-right text-gray-700">{p.stock} kg</td>
                                <td className="py-2 pl-3 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setProductoEditar({ ...p, id: p.id_producto })}
                                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 mr-1.5"
                                    title="Editar producto"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarProducto(p)}
                                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                    title="Eliminar producto"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      <div className="flex gap-2">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modalFinca && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Nueva finca</h2>
            <form onSubmit={crearFinca} className="space-y-3">
              <input required placeholder="Nombre" value={formFinca.nombre}
                onChange={(e) => setFormFinca({ ...formFinca, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <input placeholder="Región" value={formFinca.region}
                onChange={(e) => setFormFinca({ ...formFinca, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <input placeholder="Altitud (msnm)" type="number" value={formFinca.altitud}
                onChange={(e) => setFormFinca({ ...formFinca, altitud: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Latitud" value={formFinca.lat}
                  onChange={(e) => setFormFinca({ ...formFinca, lat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
                <input placeholder="Longitud" value={formFinca.lng}
                  onChange={(e) => setFormFinca({ ...formFinca, lng: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalFinca(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50">
                  {guardando ? 'Creando...' : 'Crear finca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalLote && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-gray-800 mb-1">Nuevo lote</h2>
            <p className="text-xs text-gray-400 mb-4">Para {finca?.nombre}</p>
            <form onSubmit={crearLote} className="space-y-3">
              <input required placeholder="Código de lote (ej. LOTE-VERGEL-03)" value={formLote.codigo_lote}
                onChange={(e) => setFormLote({ ...formLote, codigo_lote: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <input placeholder="Región" value={formLote.region}
                onChange={(e) => setFormLote({ ...formLote, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <input placeholder="Variedad (ej. Bourbon Rosado)" value={formLote.variedad}
                onChange={(e) => setFormLote({ ...formLote, variedad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <input required placeholder="Cantidad inicial (kg)" type="number" value={formLote.cantidad_kg}
                onChange={(e) => setFormLote({ ...formLote, cantidad_kg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalLote(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-gray-800 mb-1">Procesar lote {loteProceso.codigo_lote}</h2>
            <p className="text-xs text-gray-400 mb-4">
              Reparte el kg disponible entre las presentaciones. El stock se suma, no se reemplaza.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500">Kg disponibles</p>
              <p className="text-lg font-medium text-gray-800">{kgDisponibleLote.toFixed(2)} kg</p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
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
                      value={repartos[p.id_presentacion] || ''}
                      onChange={(e) => setRepartos({ ...repartos, [p.id_presentacion]: e.target.value })}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right"
                    />
                  </div>
                )
              })}
              {presentaciones.length === 0 && (
                <p className="text-sm text-gray-400">No hay presentaciones en el catálogo todavía.</p>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Si no existe todavía un producto para esa presentación en este lote, el sistema lo crea solo, con el costo y precio calculados desde lo que le pagaste a la finca.
            </p>

            <div className="flex items-center justify-between text-sm mb-4 pt-3 border-t border-gray-100">
              <span className="text-gray-500">Usado / disponible</span>
              <span className={`font-medium ${kgUsadoReparto > kgDisponibleLote ? 'text-red-500' : 'text-gray-800'}`}>
                {kgUsadoReparto.toFixed(2)} kg / {kgDisponibleLote.toFixed(2)} kg
              </span>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setLoteProceso(null)}
                className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
              <button
                type="button"
                disabled={guardando || kgUsadoReparto === 0 || kgUsadoReparto > kgDisponibleLote}
                onClick={confirmarProcesar}
                className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50"
              >
                {guardando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlEmpleado
