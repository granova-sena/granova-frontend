import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { formatMoney } from '../utils/format'

const formVacio = {
  categoria_producto: 'cafe',
  id_lote: '',
  nombre: '',
  tipo_cafe: '',
  presentacion: '',
  id_presentacion: '',
  marca: '',
  modelo: '',
  garantia_meses: '',
  precio: '',
  precio_mayorista: '',
  costo_unitario: '',
  stock: '',
  descripcion: '',
  imagen_url: '',
}

// Bloquea letras, símbolos y notación científica (e/+/-) en inputs numéricos.
// Los inputs type="number" del navegador igual dejan escribir "e", "+" y "-".
function bloquearNoNumerico(e) {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault()
  }
}

function ProductoModal({ producto, onClose, onGuardado, loteInicial = null }) {
  const [modo, setModo] = useState('individual') // 'individual' | 'excel'

  const [lotes, setLotes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [presentaciones, setPresentaciones] = useState([])
  const [cargandoLotes, setCargandoLotes] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cargandoProducto, setCargandoProducto] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(formVacio)

  const [sugerenciasPrecio, setSugerenciasPrecio] = useState([])
  const [sugerenciasGarantia, setSugerenciasGarantia] = useState([])

  const [confirmarPrecioBajo, setConfirmarPrecioBajo] = useState(false)
  const [confirmarPrecioAlto, setConfirmarPrecioAlto] = useState(false)
  const precioRef = useRef(null)

  const [archivoExcel, setArchivoExcel] = useState(null)
  const [filasExcel, setFilasExcel] = useState([])
  const [errorExcel, setErrorExcel] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState(null)

  useEffect(() => {
    api.get('/inventario/lotes').then(res => setLotes(res.data.lotes)).catch(() => {}).finally(() => setCargandoLotes(false))
    api.get('/inventario/categorias').then(res => setCategorias(res.data.categorias)).catch(() => {})
    api.get('/inventario/marcas').then(res => setMarcas(res.data.marcas)).catch(() => {})
    api.get('/inventario/presentaciones').then(res => setPresentaciones(res.data.presentaciones.filter(p => p.activo))).catch(() => {})
  }, [])

  useEffect(() => {
    if (!producto) {
      setForm(loteInicial ? { ...formVacio, id_lote: loteInicial } : formVacio)
      setError(null)
      return
    }

    setCargandoProducto(true)
    api.get(`/inventario/productos/${producto.id}`)
      .then(res => {
        const data = res.data.producto || res.data
        setForm({
          categoria_producto: data.categoria_producto || 'cafe',
          id_lote: data.id_lote || '',
          nombre: data.nombre || '',
          tipo_cafe: data.tipo_cafe || '',
          presentacion: data.presentacion || '',
          id_presentacion: data.id_presentacion || '',
          marca: data.marca || '',
          modelo: data.modelo || '',
          garantia_meses: data.garantia_meses != null ? String(data.garantia_meses) : '',
          precio: data.precio != null ? String(data.precio) : '',
          precio_mayorista: data.precio_mayorista != null ? String(data.precio_mayorista) : '',
          costo_unitario: data.costo_unitario != null ? String(data.costo_unitario) : '',
          stock: data.stock != null ? String(data.stock) : '',
          descripcion: data.descripcion || '',
          imagen_url: data.imagen_url || data.imagen || '',
        })
      })
      .catch(err => setError('No se pudieron cargar los datos del producto: ' + err.message))
      .finally(() => setCargandoProducto(false))
  }, [producto])

  const cambiarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const esMaquina = form.categoria_producto === 'maquina'

  // Sugerencias de precio/garantía basadas en tus propios productos similares
  // (no hay integración con Google ni ningún buscador externo).
  useEffect(() => {
    const clave = esMaquina ? form.marca : form.tipo_cafe
    if (!clave) {
      setSugerenciasPrecio([])
      setSugerenciasGarantia([])
      return
    }
    const timer = setTimeout(() => {
      api.get('/inventario/sugerencias-precio', {
        params: { categoria_producto: form.categoria_producto, marca: form.marca, tipo_cafe: form.tipo_cafe }
      })
        .then(res => {
          setSugerenciasPrecio(res.data.precios || [])
          setSugerenciasGarantia(res.data.garantias || [])
        })
        .catch(() => {})
    }, 400)
    return () => clearTimeout(timer)
  }, [form.marca, form.tipo_cafe, form.categoria_producto])

  const intentarGuardar = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre || form.precio === '' || form.stock === '') {
      setError('Completa todos los campos obligatorios (*)')
      return
    }
    if (esMaquina) {
      if (!form.marca || !form.modelo) {
        setError('Para máquinas, marca y número de identificación son obligatorios.')
        return
      }
      if (form.modelo.length > 20) {
        setError('El número de identificación no puede tener más de 20 caracteres.')
        return
      }
    } else {
      if (!form.id_lote || !form.tipo_cafe || !form.presentacion) {
        setError('Para café, lote, categoría y presentación son obligatorios.')
        return
      }
    }

    if (Number(form.precio) < 10000 && !confirmarPrecioBajo) {
      // pide confirmar antes de crear; no guarda todavía
      precioRef.current?.focus()
      precioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setConfirmarPrecioBajo(true)
      return
    }

    if (Number(form.precio) > 1000000 && !confirmarPrecioAlto) {
      precioRef.current?.focus()
      precioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setConfirmarPrecioAlto(true)
      return
    }

    await guardar()
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const payload = {
        ...form,
        precio: Number(form.precio),
        precio_mayorista: form.precio_mayorista ? Number(form.precio_mayorista) : null,
        costo_unitario: form.costo_unitario ? Number(form.costo_unitario) : 0,
        stock: Number(form.stock),
        garantia_meses: form.garantia_meses ? Number(form.garantia_meses) : null,
      }
      if (producto) {
        await api.patch(`/inventario/productos/${producto.id}`, payload)
      } else {
        await api.post('/inventario/productos', payload)
      }
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el producto.')
    } finally {
      setGuardando(false)
      setConfirmarPrecioBajo(false)
    }
  }

  const onArchivoSeleccionado = async (e) => {
    const archivo = e.target.files[0]
    setErrorExcel(null)
    setResultadoImport(null)
    setFilasExcel([])
    if (!archivo) { setArchivoExcel(null); return }

    setArchivoExcel(archivo)
    try {
      const buffer = await archivo.arrayBuffer()
      const libro = XLSX.read(buffer, { type: 'array' })
      const hoja = libro.Sheets[libro.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json(hoja)
      if (filas.length === 0) {
        setErrorExcel('El archivo no es compatible: no se encontraron filas de datos.')
        return
      }
      setFilasExcel(filas)
    } catch (err) {
      console.error('Error en ProductoModal:', err)
      setErrorExcel('El archivo no es compatible. Asegúrate de subir un .xlsx válido.')
    }
  }

  const importarExcel = async () => {
    if (filasExcel.length === 0) return
    setImportando(true)
    setErrorExcel(null)
    try {
      const res = await api.post('/inventario/productos/importar', { productos: filasExcel })
      setResultadoImport(res.data)
      if (res.data.creados > 0) onGuardado()
    } catch (err) {
      setErrorExcel(err.response?.data?.error || 'El archivo no es compatible.')
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{producto ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {!producto && (
          <div className="flex gap-1 px-6 pt-4">
            <button
              type="button"
              onClick={() => setModo('individual')}
              className={`flex-1 text-sm py-2 rounded-lg transition ${modo === 'individual' ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Un producto
            </button>
            <button
              type="button"
              onClick={() => setModo('excel')}
              className={`flex-1 text-sm py-2 rounded-lg transition ${modo === 'excel' ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Importar desde Excel
            </button>
          </div>
        )}

        {modo === 'excel' && !producto ? (
          <div className="p-6 space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
              Sube un .xlsx con columnas: <strong>nombre, categoria, presentacion, precio, stock, codigo_lote</strong>.
              Si escribes algún encabezado con error de tipeo (ej. "Nombe"), lo detectamos e igual funciona.
              Por ahora esta opción solo sirve para café (no máquinas).
            </div>

            {errorExcel && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorExcel}
              </div>
            )}

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition whitespace-nowrap">
                  Elegir archivo
                </span>
                <span className="text-sm text-gray-500 truncate">
                  {archivoExcel ? archivoExcel.name : 'Ningún archivo seleccionado'}
                </span>
                <input type="file" accept=".xlsx,.xls" onChange={onArchivoSeleccionado} className="hidden" />
              </label>
            </div>

            {filasExcel.length > 0 && !resultadoImport && (
              <div className="text-sm text-gray-600">
                Se detectaron <strong>{filasExcel.length}</strong> fila(s). Revisa que estén bien y dale a importar.
              </div>
            )}

            {resultadoImport && (
              <div className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 space-y-2">
                <p className="text-[#1D9E75] font-medium">{resultadoImport.creados} producto(s) creado(s) correctamente.</p>
                {resultadoImport.errores.length > 0 && (
                  <div>
                    <p className="text-red-600 font-medium mb-1">{resultadoImport.errores.length} fila(s) con error:</p>
                    <ul className="list-disc list-inside text-red-600 space-y-0.5">
                      {resultadoImport.errores.map((e, i) => (
                        <li key={i}>Fila {e.fila}: {e.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                Cerrar
              </button>
              <button
                type="button"
                onClick={importarExcel}
                disabled={filasExcel.length === 0 || importando}
                className="px-4 py-2 text-sm rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
              >
                {importando ? 'Importando...' : `Importar ${filasExcel.length || ''}`}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={intentarGuardar} className="p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <span className="block text-sm text-gray-600 mb-1">¿Qué estás agregando? *</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cambiarCampo('categoria_producto', 'cafe')}
                  className={`flex-1 text-sm py-2 rounded-lg border transition ${!esMaquina ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'border-gray-200 text-gray-600'}`}
                >
                  ☕ Café
                </button>
                <button
                  type="button"
                  onClick={() => cambiarCampo('categoria_producto', 'maquina')}
                  className={`flex-1 text-sm py-2 rounded-lg border transition ${esMaquina ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'border-gray-200 text-gray-600'}`}
                >
                  ⚙️ Máquina de café
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="nombre-producto" className="block text-sm text-gray-600 mb-1">Nombre del producto *</label>
              <input
                id="nombre-producto"
                type="text"
                value={form.nombre}
                onChange={(e) => cambiarCampo('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                placeholder={esMaquina ? 'Ej: Cafetera espresso automática' : 'Ej: Café Huila Especial'}
              />
            </div>

            {esMaquina ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="marca-maquina" className="block text-sm text-gray-600 mb-1">Marca *</label>
                    <input
                      id="marca-maquina"
                      type="text"
                      list="lista-marcas"
                      value={form.marca}
                      onChange={(e) => cambiarCampo('marca', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: DeLonghi"
                    />
                    <datalist id="lista-marcas">
                      {marcas.map((m) => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                  <div>
                    <label htmlFor="modelo-maquina" className="block text-sm text-gray-600 mb-1">Número de identificación *</label>
                    <input
                      id="modelo-maquina"
                      type="text"
                      maxLength={20}
                      value={form.modelo}
                      onChange={(e) => cambiarCampo('modelo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: EC685M (máx. 20 caracteres)"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="garantia-meses" className="block text-sm text-gray-600 mb-1">Garantía (meses)</label>
                  <input
                    id="garantia-meses"
                    type="number"
                    min="0"
                    onKeyDown={bloquearNoNumerico}
                    value={form.garantia_meses}
                    onChange={(e) => cambiarCampo('garantia_meses', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Ej: 12"
                  />
                  {sugerenciasGarantia.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="text-xs text-gray-400 mr-1">Sugeridas:</span>
                      {sugerenciasGarantia.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => cambiarCampo('garantia_meses', String(g))}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-[#1D9E75]/10 hover:text-[#1D9E75] transition"
                        >
                          {g} meses
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="lote-origen" className="block text-sm text-gray-600 mb-1">Lote de origen *</label>
                  <select
                    id="lote-origen"
                    value={form.id_lote}
                    onChange={(e) => cambiarCampo('id_lote', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                    disabled={cargandoLotes}
                  >
                    <option value="">{cargandoLotes ? 'Cargando lotes...' : 'Selecciona un lote'}</option>
                    {lotes.map((l) => (
                      <option key={l.id_lote} value={l.id_lote}>
                        {l.codigo_lote} · {l.finca} · {l.variedad} ({l.cantidad_kg} kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="categoria-cafe" className="block text-sm text-gray-600 mb-1">Categoría *</label>
                    <input
                      id="categoria-cafe"
                      type="text"
                      list="lista-categorias"
                      value={form.tipo_cafe}
                      onChange={(e) => cambiarCampo('tipo_cafe', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: Especiales"
                    />
                    <datalist id="lista-categorias">
                      {categorias.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label htmlFor="presentacion-cafe" className="block text-sm text-gray-600 mb-1">Presentación *</label>
                    <select
                      id="presentacion-cafe"
                      value={form.id_presentacion}
                      onChange={(e) => {
                        const pres = presentaciones.find((p) => String(p.id_presentacion) === e.target.value)
                        cambiarCampo('id_presentacion', e.target.value)
                        cambiarCampo('presentacion', pres ? pres.nombre : '')
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                    >
                      <option value="">Selecciona una presentación</option>
                      {presentaciones.map((p) => (
                        <option key={p.id_presentacion} value={p.id_presentacion}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="precio-producto" className="block text-sm text-gray-600 mb-1">Precio {esMaquina ? '' : 'por kg'} *</label>
                <input
                  id="precio-producto"
                  ref={precioRef}
                  type="number"
                  min="0"
                  value={form.precio}
                  onChange={(e) => { cambiarCampo('precio', e.target.value); setConfirmarPrecioBajo(false); setConfirmarPrecioAlto(false) }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition ${
                    confirmarPrecioBajo || confirmarPrecioAlto ? 'border-amber-400 ring-2 ring-amber-200 scale-105' : 'border-gray-200 focus:border-[#1D9E75]'
                  }`}
                  placeholder="28500"
                />
                {sugerenciasPrecio.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-xs text-gray-400 mr-1">Sugeridos:</span>
                    {sugerenciasPrecio.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => cambiarCampo('precio', String(p))}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-[#1D9E75]/10 hover:text-[#1D9E75] transition"
                      >
                        {formatMoney(p)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="costo-producto" className="block text-sm text-gray-600 mb-1">Costo {esMaquina ? '' : 'por kg'}</label>
                <input
                  id="costo-producto"
                  type="number"
                  min="0"
                  value={form.costo_unitario}
                  onChange={(e) => cambiarCampo('costo_unitario', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] transition"
                  placeholder="Lo que costó comprarlo"
                />
                <p className="text-xs text-gray-400 mt-1">Se usa para calcular la ganancia real en el dashboard.</p>
              </div>
              {!esMaquina && (
                <div>
                  <label htmlFor="precio-mayorista-producto" className="block text-sm text-gray-600 mb-1">Precio mayorista (empresas)</label>
                  <input
                    id="precio-mayorista-producto"
                    type="number"
                    min="0"
                    value={form.precio_mayorista}
                    onChange={(e) => cambiarCampo('precio_mayorista', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] transition"
                    placeholder="Lo que le cobras a Mercacentro, etc."
                  />
                  <p className="text-xs text-gray-400 mt-1">El precio público no puede quedar por debajo del margen mínimo sobre este valor.</p>
                </div>
              )}
              <div>
                <label htmlFor="stock-producto" className="block text-sm text-gray-600 mb-1">Stock {esMaquina ? '(unidades)' : 'inicial (kg)'} *</label>
                <input
                  id="stock-producto"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => cambiarCampo('stock', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder={esMaquina ? '10' : '320'}
                />
              </div>
            </div>

            {confirmarPrecioBajo && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  El precio ({formatMoney(Number(form.precio))}) es menor a {formatMoney(10000)}. ¿Está correcto?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmarPrecioBajo(false)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                  >
                    No, quiero corregirlo
                  </button>
                  <button
                    type="button"
                    onClick={guardar}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                  >
                    Sí, está correcto — crear producto
                  </button>
                </div>
              </div>
            )}

            {confirmarPrecioAlto && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  El precio ({formatMoney(Number(form.precio))}) supera {formatMoney(1000000)}. ¿Está correcto?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmarPrecioAlto(false)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                  >
                    No, quiero corregirlo
                  </button>
                  <button
                    type="button"
                    onClick={guardar}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                  >
                    Sí, está correcto — crear producto
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="descripcion-producto" className="block text-sm text-gray-600 mb-1">Descripción</label>
              <textarea
                id="descripcion-producto"
                value={form.descripcion}
                onChange={(e) => cambiarCampo('descripcion', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label htmlFor="imagen-url" className="block text-sm text-gray-600 mb-1">URL de imagen</label>
              <input
                id="imagen-url"
                type="text"
                value={form.imagen_url}
                onChange={(e) => cambiarCampo('imagen_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                placeholder="Opcional"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || cargandoProducto}
                className="px-4 py-2 text-sm rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : producto ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ProductoModal
