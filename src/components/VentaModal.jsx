import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { leerParametro } from '../services/parametros'
import { bloquearNoNumerico, normalizarNumerico } from '../utils/validacion'

let contadorId = 0
function nuevoItem() {
  contadorId += 1
  return { key: contadorId, id_producto: '', id_formato: '', cantidad: '' }
}

const METODOS = ['nequi', 'daviplata', 'tarjeta', 'pse', 'efectivo', 'transferencia', 'contra_entrega']
const ETIQUETA_METODO = {
  nequi: 'Nequi', daviplata: 'Daviplata', tarjeta: 'Tarjeta', pse: 'PSE',
  efectivo: 'Efectivo', transferencia: 'Transferencia', contra_entrega: 'Contra entrega',
}
const ESTADOS_PAGO = [
  { valor: 'pagado', etiqueta: 'Pagado' },
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'pendiente_verificacion', etiqueta: 'Pendiente de verificación' },
  { valor: 'fallido', etiqueta: 'Fallido' },
  { valor: 'reembolsado', etiqueta: 'Reembolsado' },
]

function porTasa(lineas) {
  const mapa = new Map()
  for (const it of lineas) {
    const bruto = it.subtotal
    const tasa = Math.round(Number(it.iva_pct) || 0)
    const base = tasa === 0 ? bruto : bruto / (1 + tasa / 100)
    const acum = mapa.get(tasa) || { tasa, base: 0, impuesto: 0 }
    acum.base += base
    acum.impuesto += bruto - base
    mapa.set(tasa, acum)
  }
  return [...mapa.values()].sort((a, b) => a.tasa - b.tasa)
}

function VentaModal({ onClose, onCreado }) {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [idCliente, setIdCliente] = useState('')
  const [metodoPago, setMetodoPago] = useState('nequi')
  const [estadoPago, setEstadoPago] = useState('pagado')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [sector, setSector] = useState('')
  const [codigoCupon, setCodigoCupon] = useState('')
  const [items, setItems] = useState([nuevoItem()])

  useEffect(() => {
    Promise.all([
      api.get('/ventas/clientes'),
      api.get('/ventas/productos-disponibles'),
    ])
      .then(([resClientes, resProductos]) => {
        setClientes(resClientes.data.clientes)
        setProductos(resProductos.data.productos)
      })
      .catch(err => setError('No se pudieron cargar los datos: ' + err.message))
      .finally(() => setCargando(false))
  }, [])

  const cliente = clientes.find(c => String(c.id_cliente) === String(idCliente))
  const esJuridica = cliente?.tipo_persona === 'juridica'
  const esMayorista = cliente?.tipo_cliente === 'mayorista'
  const descuentoEmpresaPct = Number(leerParametro('descuento_empresa_pct', 15))

  const productoPorId = (id) => productos.find(p => String(p.id_producto) === String(id))

  const totalUnidades = items.reduce((sum, it) => sum + (Number(it.cantidad) || 0), 0)
  const pctVolumen = esMayorista ? 12 : (totalUnidades >= 5 ? 6 : 0)

  const resumen = useMemo(() => {
    let total = 0
    let descuentoProductos = 0
    const lineas = items.map(it => {
      const producto = productoPorId(it.id_producto)
      if (!producto) return null
      const cantidad = Number(it.cantidad) || 0
      const formato = it.id_formato
        ? (producto.formatos || []).find(f => String(f.id_formato) === String(it.id_formato))
        : null
      const precioBase = formato
        ? Number(formato.precio)
        : (esMayorista && producto.precio_mayorista != null ? Number(producto.precio_mayorista) : Number(producto.precio))
      const pctGanador = Math.max(Number(producto.promo_pct) || 0, pctVolumen, esJuridica ? descuentoEmpresaPct : 0)
      const precioUnitario = pctGanador > 0 ? Math.round(precioBase * (1 - pctGanador / 100)) : precioBase
      const subtotal = precioUnitario * cantidad
      total += subtotal
      descuentoProductos += (precioBase - precioUnitario) * cantidad
      return { ...it, cantidad, precioBase, precioUnitario, subtotal, pctGanador, iva_pct: Number(producto.iva_pct) || 0 }
    }).filter(Boolean)
    return { total, descuentoProductos, iva: porTasa(lineas), lineas }
  }, [items, clientes, productos, esMayorista, esJuridica, descuentoEmpresaPct, pctVolumen])

  const cambiarItem = (key, campo, valor) => {
    setItems(prev => prev.map(it => (it.key === key ? { ...it, [campo]: valor } : it)))
  }

  const agregarItem = () => setItems(prev => [...prev, nuevoItem()])
  const quitarItem = (key) => setItems(prev => prev.filter(it => it.key !== key))

  const guardar = async (e) => {
    e.preventDefault()
    setError(null)

    if (!idCliente) {
      setError('Selecciona un cliente.')
      return
    }
    const sinProducto = items.find(it => !it.id_producto)
    if (sinProducto) {
      setError('Quita las filas vacías o selecciona el producto.')
      return
    }
    const conCantidadInvalida = items.find(it => !Number.isFinite(Number(it.cantidad)) || Number(it.cantidad) <= 0)
    if (conCantidadInvalida) {
      setError('Cada producto debe tener una cantidad mayor que 0.')
      return
    }
    for (const it of items) {
      const producto = productoPorId(it.id_producto)
      if (!producto) {
        setError('Hay un producto que ya no está disponible. Recarga la venta.')
        return
      }
      const formato = it.id_formato
        ? (producto.formatos || []).find(f => String(f.id_formato) === String(it.id_formato))
        : null
      const stock = formato ? Number(formato.stock) : Number(producto.stock)
      if (formato || Number.isFinite(stock)) {
        if (Number(it.cantidad) > stock) {
          setError(`${producto.nombre}${formato ? ` (${formato.etiqueta})` : ''}: solo hay ${stock} disponible${stock === 1 ? '' : 's'}.`)
          return
        }
      }
    }

    const itemsValidos = items

    setGuardando(true)
    try {
      await api.post('/ventas', {
        id_cliente: idCliente,
        metodo_pago: metodoPago,
        estado_pago: estadoPago,
        direccion_envio: direccion || null,
        ciudad_envio: ciudad || null,
        sector_envio: sector || null,
        items: itemsValidos.map(it => ({
          id_producto: it.id_producto,
          id_formato: it.id_formato || null,
          cantidad: Number(it.cantidad),
        })),
        codigo_cupon: codigoCupon.trim() || undefined,
      })
      onCreado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la venta.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Nueva venta manual</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="cliente-venta" className="block text-sm text-gray-600 mb-1">Cliente *</label>
            <select
              id="cliente-venta"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
              disabled={cargando}
            >
              <option value="">{cargando ? 'Cargando clientes...' : 'Selecciona un cliente'}</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.apellido} · {c.email}{c.tipo_persona === 'juridica' ? ' · Empresa' : ''}
                </option>
              ))}
            </select>
            {cliente && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                {cliente.tipo_persona === 'juridica'
                  ? `🏢 ${cliente.razon_social || `${cliente.nombre} ${cliente.apellido}`}${cliente.numero_documento ? ` · NIT ${cliente.numero_documento}` : ''}`
                  : `👤 Persona natural · ${cliente.tipo_documento || 'documento'}: ${cliente.numero_documento || '—'}`}
                {esJuridica && <span className="ml-1 text-[#1D9E75] font-medium">· {descuentoEmpresaPct}% de empresa</span>}
              </div>
            )}
          </div>

          <div>
            <span className="block text-sm text-gray-600 mb-2">Productos *</span>
            <div className="space-y-2">
              {items.map((it) => {
                const producto = productoPorId(it.id_producto)
                return (
                  <div key={it.key} className="flex flex-col gap-2 rounded-lg border border-gray-100 p-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={it.id_producto}
                        onChange={(e) => cambiarItem(it.key, 'id_producto', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                        disabled={cargando}
                      >
                        <option value="">Selecciona un producto</option>
                        {productos.map((p) => (
                          <option key={p.id_producto} value={p.id_producto}>
                            {p.nombre} {p.categoria_producto === 'maquina' ? '(máquina)' : ''} — {formatMoney(p.precio)}
                            {Number(p.promo_pct) > 0 ? ` · ${p.promo_pct}% promo` : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        onKeyDown={bloquearNoNumerico}
                        value={it.cantidad}
                        onChange={(e) => cambiarItem(it.key, 'cantidad', normalizarNumerico(e.target.value))}
                        placeholder={producto?.categoria_producto === 'maquina' ? 'unid.' : 'kg'}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      />
                      <button
                        type="button"
                        onClick={() => quitarItem(it.key)}
                        disabled={items.length === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                    {producto?.formatos?.length > 0 && (
                      <select
                        value={it.id_formato}
                        onChange={(e) => cambiarItem(it.key, 'id_formato', e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      >
                        <option value="">Sin formato ({producto.categoria_producto === 'maquina' ? 'por unidad' : 'por kg'})</option>
                        {producto.formatos.map((f) => (
                          <option key={f.id_formato} value={f.id_formato}>
                            {f.etiqueta} — {formatMoney(f.precio)} ({f.stock} disp.)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
            <button
              type="button"
              onClick={agregarItem}
              className="mt-2 text-sm text-[#1D9E75] hover:underline"
            >
              + Agregar producto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="metodo-venta" className="block text-sm text-gray-600 mb-1">Método de pago</label>
              <select
                id="metodo-venta"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
              >
                {METODOS.map((m) => (
                  <option key={m} value={m}>{ETIQUETA_METODO[m]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="estadopago-venta" className="block text-sm text-gray-600 mb-1">Estado de pago</label>
              <select
                id="estadopago-venta"
                value={estadoPago}
                onChange={(e) => setEstadoPago(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
              >
                {ESTADOS_PAGO.map((e) => (
                  <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ciudad-venta" className="block text-sm text-gray-600 mb-1">Ciudad / Sector</label>
              <div className="flex gap-2">
                <input
                  id="ciudad-venta"
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ciudad"
                  className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                />
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Sector"
                  className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="direccion-venta" className="block text-sm text-gray-600 mb-1">Dirección (opcional)</label>
            <input
              id="direccion-venta"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección de entrega"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
            />
          </div>

          <div>
            <label htmlFor="cupon-venta" className="block text-sm text-gray-600 mb-1">Cupón de lealtad (opcional)</label>
            <input
              id="cupon-venta"
              type="text"
              value={codigoCupon}
              onChange={(e) => setCodigoCupon(e.target.value)}
              disabled={esJuridica}
              placeholder={esJuridica ? 'Los cupones no aplican para empresas' : 'Ej: GRANOVA-10'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatMoney(resumen.total)}</span>
            </div>
            {resumen.descuentoProductos > 0 && (
              <div className="flex justify-between text-[#1D9E75]">
                <span>Descuento (mayor gana)</span>
                <span>−{formatMoney(resumen.descuentoProductos)}</span>
              </div>
            )}
            {resumen.iva.filter(t => t.impuesto > 0).map((t) => (
              <div key={t.tasa} className="flex justify-between text-gray-400 text-xs">
                <span>IVA {t.tasa}%</span>
                <span>{formatMoney(t.impuesto)}</span>
              </div>
            ))}
            <div className="flex justify-between text-gray-800 text-base font-semibold pt-1.5 border-t border-gray-100">
              <span>Total (IVA incluido)</span>
              <span>{formatMoney(resumen.total)}</span>
            </div>
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
              disabled={guardando}
              className="px-4 py-2 text-sm rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Registrar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VentaModal