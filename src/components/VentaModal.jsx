import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { bloquearNoNumerico, normalizarEntero } from '../utils/validacion'
import ErrorModal from './ui/ErrorModal'

let contadorId = 0
function nuevoItem() {
  contadorId += 1
  return { key: contadorId, id_producto: '', cantidad: '' }
}

function VentaModal({ onClose, onCreado }) {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [idCliente, setIdCliente] = useState('')
  const [metodoPago, setMetodoPago] = useState('Nequi')
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

  const productoPorId = (id) => productos.find(p => String(p.id_producto) === String(id))

  const cambiarItem = (key, campo, valor) => {
    setItems(prev => prev.map(it => (it.key === key ? { ...it, [campo]: valor } : it)))
  }

  const agregarItem = () => setItems(prev => [...prev, nuevoItem()])
  const quitarItem = (key) => setItems(prev => prev.filter(it => it.key !== key))

  const total = items.reduce((sum, it) => {
    const producto = productoPorId(it.id_producto)
    const cantidad = Number(it.cantidad) || 0
    return sum + (producto ? Number(producto.precio) * cantidad : 0)
  }, 0)

  const guardar = async (e) => {
    e.preventDefault()
    setError(null)

    if (!idCliente) {
      setError('Selecciona un cliente.')
      return
    }
    const itemsValidos = items.filter(it => it.id_producto && Number(it.cantidad) > 0)
    if (itemsValidos.length === 0) {
      setError('Agrega al menos un producto con cantidad.')
      return
    }
    for (const it of itemsValidos) {
      const producto = productoPorId(it.id_producto)
      if (producto && Number(it.cantidad) > Number(producto.stock)) {
        setError(`Stock insuficiente para ${producto.nombre} (disponible: ${producto.stock} ${producto.categoria_producto === 'maquina' ? 'unidades' : 'bolsas'}).`)
        return
      }
    }

    setGuardando(true)
    try {
      await api.post('/ventas', {
        id_cliente: idCliente,
        metodo_pago: metodoPago,
        items: itemsValidos.map(it => ({ id_producto: it.id_producto, cantidad: Number(it.cantidad) })),
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
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Nueva venta</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-4">

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
                  {c.nombre} {c.apellido} · {c.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm text-gray-600 mb-2">Productos *</span>
            <div className="space-y-3">
              {items.map((it) => {
                const producto = productoPorId(it.id_producto)
                return (
                  <div key={it.key} className="border border-gray-200 rounded-xl p-3 space-y-2">
                    <select
                      value={it.id_producto}
                      onChange={(e) => cambiarItem(it.key, 'id_producto', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      disabled={cargando}
                    >
                      <option value="">Selecciona un producto</option>
                      {productos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>
                          {p.nombre} — {formatMoney(p.precio)}{p.categoria_producto === 'maquina' ? '/unidad' : '/bolsa'} ({p.stock} {p.categoria_producto === 'maquina' ? 'unid.' : 'bolsas'} disp.)
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={producto ? producto.stock : undefined}
                        step="1"
                        onKeyDown={bloquearNoNumerico}
                        value={it.cantidad}
                        onChange={(e) => {
                          const limpio = normalizarEntero(e.target.value)
                          const stock = producto ? Number(producto.stock) : Infinity
                          const valor = Number(limpio)
                          const maximo = limpio !== '' && !Number.isNaN(valor) && valor > stock
                            ? String(stock)
                            : limpio
                          cambiarItem(it.key, 'cantidad', maximo)
                        }}
                        onBlur={() => {
                          const stock = producto ? Number(producto.stock) : 0
                          const valor = Number(String(it.cantidad).replace(',', '.') || 0)
                          let fijado = it.cantidad
                          if (it.cantidad === '' || valor < 1) fijado = '1'
                          else if (valor > stock) fijado = String(stock)
                          cambiarItem(it.key, 'cantidad', fijado)
                        }}
                        placeholder={producto
                          ? `Cantidad (${producto.categoria_producto === 'maquina' ? 'unid.' : 'bolsas'})`
                          : 'Cantidad'}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      />
                      {producto && (
                        <span className="w-10 text-center text-xs font-medium text-gray-400">
                          {producto.categoria_producto === 'maquina' ? 'unid.' : 'bolsas'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={agregarItem}
                        className="text-sm text-[#1D9E75] hover:underline"
                      >
                        + Agregar producto
                      </button>
                      <button
                        type="button"
                        onClick={() => quitarItem(it.key)}
                        disabled={items.length === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
              <span className="block text-sm text-gray-600 mb-2">Método de pago *</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodoPago('Nequi')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition ${
                    metodoPago === 'Nequi'
                      ? 'border-[#9C0BBA] bg-[#9C0BBA]/5 shadow-sm'
                      : 'border-gray-200 hover:border-[#9C0BBA]/50'
                  }`}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="2" width="18" height="20" rx="4" fill="#9C0BBA" />
                    <circle cx="12" cy="17" r="1.4" fill="white" />
                    <path d="M8 6h8v7a4 4 0 0 1-8 0V6Z" fill="white" />
                  </svg>
                  <span className="text-xs font-semibold" style={{ color: metodoPago === 'Nequi' ? '#9C0BBA' : '#6b7280' }}>Nequi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('Tarjeta')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition ${
                    metodoPago === 'Tarjeta'
                      ? 'border-[#2F5CD0] bg-[#2F5CD0]/5 shadow-sm'
                      : 'border-gray-200 hover:border-[#2F5CD0]/50'
                  }`}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="#2F5CD0" strokeWidth="2" />
                    <path d="M2 10h20" stroke="#2F5CD0" strokeWidth="2" />
                    <rect x="4.5" y="13.5" width="5" height="2" rx="0.5" fill="#2F5CD0" />
                  </svg>
                  <span className="text-xs font-semibold" style={{ color: metodoPago === 'Tarjeta' ? '#2F5CD0' : '#6b7280' }}>Tarjeta</span>
                </button>
              </div>
            </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-semibold text-gray-800">{formatMoney(total)}</span>
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

      <ErrorModal mensaje={error} onClose={() => setError(null)} />
    </div>
  )
}

export default VentaModal