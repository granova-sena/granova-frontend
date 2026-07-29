import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'

const formVacio = {
  categoria_producto: 'cafe',
  id_lote: '',
  nombre: '',
  tipo_cafe: '',
  presentacion: '',
  marca: '',
  modelo: '',
  garantia_meses: '',
  precio: '',
  stock: '',
  descripcion: '',
  imagen_url: '',
}

function ProductoModal({ producto, onClose, onGuardado }) {
  const [modo, setModo] = useState('individual') // 'individual' | 'excel'

  const [lotes, setLotes] = useState([])
  const [cargandoLotes, setCargandoLotes] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cargandoProducto, setCargandoProducto] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(formVacio)

  const [archivoExcel, setArchivoExcel] = useState(null)
  const [filasExcel, setFilasExcel] = useState([])
  const [errorExcel, setErrorExcel] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState(null)

  useEffect(() => {
    api.get('/inventario/lotes')
      .then(res => setLotes(res.data.lotes))
      .catch(err => setError('No se pudieron cargar los lotes: ' + err.message))
      .finally(() => setCargandoLotes(false))
  }, [])

  useEffect(() => {
    if (!producto) {
      setForm(formVacio)
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
          marca: data.marca || '',
          modelo: data.modelo || '',
          garantia_meses: data.garantia_meses != null ? String(data.garantia_meses) : '',
          precio: data.precio != null ? String(data.precio) : '',
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

  const guardar = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre || form.precio === '' || form.stock === '') {
      setError('Completa todos los campos obligatorios (*)')
      return
    }
    if (esMaquina) {
      if (!form.marca || !form.modelo) {
        setError('Para máquinas, marca y modelo son obligatorios.')
        return
      }
    } else {
      if (!form.id_lote || !form.tipo_cafe || !form.presentacion) {
        setError('Para café, lote, categoría y presentación son obligatorios.')
        return
      }
    }

    setGuardando(true)
    try {
      const payload = {
        ...form,
        precio: Number(form.precio),
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
    }
  }

  const onArchivoSeleccionado = async (e) => {
    const archivo = e.target.files[0]
    setErrorExcel(null)
    setResultadoImport(null)
    setFilasExcel([])
    if (!archivo) return

    setArchivoExcel(archivo)
    try {
      const buffer = await archivo.arrayBuffer()
      const libro = XLSX.read(buffer, { type: 'array' })
      const hoja = libro.Sheets[libro.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json(hoja)
      if (filas.length === 0) {
        setErrorExcel('El archivo no tiene filas de datos.')
        return
      }
      setFilasExcel(filas)
    } catch (err) {
      setErrorExcel('No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.')
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
      setErrorExcel(err.response?.data?.error || 'No se pudo importar el archivo.')
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{producto ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
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
              Sube un .xlsx con columnas: <strong>nombre, categoria (tipo de café), presentacion, precio, stock, codigo_lote</strong>.
              La primera fila debe ser el encabezado. Por ahora esta opción solo sirve para café (no máquinas).
            </div>

            {errorExcel && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorExcel}
              </div>
            )}

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onArchivoSeleccionado}
              className="w-full text-sm"
            />

            {filasExcel.length > 0 && !resultadoImport && (
              <div className="text-sm text-gray-600">
                Se detectaron <strong>{filasExcel.length}</strong> fila(s) en "{archivoExcel?.name}". Revisa que estén bien y dale a importar.
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
          <form onSubmit={guardar} className="p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">¿Qué estás agregando? *</label>
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
              <label className="block text-sm text-gray-600 mb-1">Nombre del producto *</label>
              <input
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
                    <label className="block text-sm text-gray-600 mb-1">Marca *</label>
                    <input
                      type="text"
                      value={form.marca}
                      onChange={(e) => cambiarCampo('marca', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: DeLonghi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => cambiarCampo('modelo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: EC685M"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Garantía (meses)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.garantia_meses}
                    onChange={(e) => cambiarCampo('garantia_meses', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Ej: 12"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Lote de origen *</label>
                  <select
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
                    <label className="block text-sm text-gray-600 mb-1">Categoría *</label>
                    <input
                      type="text"
                      value={form.tipo_cafe}
                      onChange={(e) => cambiarCampo('tipo_cafe', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: Especiales"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Presentación *</label>
                    <input
                      type="text"
                      value={form.presentacion}
                      onChange={(e) => cambiarCampo('presentacion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: Libra (500g)"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Precio {esMaquina ? '' : 'por kg'} *</label>
                <input
                  type="number"
                  min="0"
                  value={form.precio}
                  onChange={(e) => cambiarCampo('precio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder="28500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Stock {esMaquina ? '(unidades)' : 'inicial (kg)'} *</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => cambiarCampo('stock', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder={esMaquina ? '10' : '320'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => cambiarCampo('descripcion', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">URL de imagen</label>
              <input
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
