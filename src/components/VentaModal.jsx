import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'

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
  const [estado, setEstado] = useState('Pendiente')
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
        setError(`Stock insuficiente para ${producto.nombre} (disponible: ${producto.stock} ${producto.categoria_producto === 'maquina' ? 'unidades' : 'kg'}).`)
        return
      }
    }

    setGuardando(true)
    try {
      await api.post('/ventas', {
        id_cliente: idCliente,
        metodo_pago: metodoPago,
        estado,
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Cliente *</label>
            <select
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
            <label className="block text-sm text-gray-600 mb-2">Productos *</label>
            <div className="space-y-2">
              {items.map((it) => {
                const producto = productoPorId(it.id_producto)
                return (
                  <div key={it.key} className="flex items-center gap-2">
                    <select
                      value={it.id_producto}
                      onChange={(e) => cambiarItem(it.key, 'id_producto', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      disabled={cargando}
                    >
                      <option value="">Selecciona un producto</option>
                      {productos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>
                          {p.nombre} — {formatMoney(p.precio)}{p.categoria_producto === 'maquina' ? '/unidad' : '/kg'} ({p.stock} {p.categoria_producto === 'maquina' ? 'unid.' : 'kg'} disp.)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      max={producto ? producto.stock : undefined}
                      value={it.cantidad}
                      onChange={(e) => cambiarItem(it.key, 'cantidad', e.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Método de pago</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('Nequi')}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border-2 transition ${
                    metodoPago === 'Nequi' ? 'border-[#e6007e] bg-[#e6007e]/5' : 'border-gray-200'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="2" width="18" height="20" rx="4" fill="#e6007e" />
                    <circle cx="12" cy="17" r="1.4" fill="white" />
                    <path d="M8 6h8v7a4 4 0 0 1-8 0V6Z" fill="white" />
                  </svg>
                  <span className="text-xs font-medium" style={{ color: '#e6007e' }}>Nequi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('Tarjeta')}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border-2 transition ${
                    metodoPago === 'Tarjeta' ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-200'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="#1D9E75" strokeWidth="2" />
                    <path d="M2 10h20" stroke="#1D9E75" strokeWidth="2" />
                    <rect x="4.5" y="13.5" width="5" height="2" rx="0.5" fill="#1D9E75" />
                  </svg>
                  <span className="text-xs font-medium text-[#1D9E75]">Tarjeta</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmado">Confirmado</option>
              </select>
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
    </div>
  )
}

export default VentaModal