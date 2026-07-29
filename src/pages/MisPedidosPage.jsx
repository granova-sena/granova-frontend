import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

const estadoColor = {
  'pendiente':    'text-[#888888]',
  'confirmado':   'text-green-600',
  'en_proceso':   'bg-amber-100 text-amber-700',
  'enviado':      'text-blue-600',
  'entregado':    'text-green-600',
  'cancelado':    'text-red-500',
}

const estadoLabel = {
  'pendiente':  'Pendiente',
  'confirmado': 'Confirmado',
  'en_proceso': 'En preparación',
  'enviado':    'Enviado',
  'entregado':  'Entregado',
  'cancelado':  'Cancelado',
}

function BadgeEstado({ estado }) {
  const clase = estadoColor[estado] || 'text-[#888888]'
  const conFondo = ['en_proceso'].includes(estado)

  return (
    <span className={`text-xs font-medium ${conFondo ? `px-3 py-1 rounded-full ${clase}` : clase}`}>
      {estadoLabel[estado] || estado}
    </span>
  )
}

function MisPedidosPage() {
  const navigate = useNavigate()
  const [pedidos, setPedidos]     = useState([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState(null)
  const [tipo, setTipo]           = useState('Todos')
  const [estado, setEstado]       = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

   1

  useEffect(() => {
    async function cargarPedidos() {
      const clienteGuardado = JSON.parse(localStorage.getItem('cliente') || '{}')
      const id_cliente = Number(clienteGuardado.id)
      try {
        setCargando(true)
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/cliente/${id_cliente}`)
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        setPedidos(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargarPedidos()
  }, [])

  const filtrados = pedidos.filter(p => {
    const matchEstado = estado === 'Todos' || p.estado === estado
    return matchEstado
  })

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const formatearNumero = (id) =>
    `PED-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`

  return (
    <div className="min-h-screen bg-[#F7F2E8]">
            <Navbar />

      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* Encabezado */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#010101]">Historial de pedidos y cotizaciones</h1>
            <p className="text-sm text-[#888888] mt-1">Consulta tus pedidos anteriores y cotizaciones generadas</p>
          </div>
          <button
            onClick={() => navigate('/cotizacion')}
            className="flex items-center gap-2 bg-[#2D5A27] text-white text-sm px-5 py-3 rounded-xl hover:bg-[#215511] transition-colors"
          >
            📋 Nueva cotización
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-end gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#3D3D3D]">Estado</label>
            <select
              value={estado}
              onChange={e => setEstado(e.target.value)}
              className="border border-[#E7E7E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2D5A27] bg-white"
            >
              <option>Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_proceso">En preparación</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#3D3D3D]">Fecha desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="border border-[#E7E7E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2D5A27] bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#3D3D3D]">Fecha hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="border border-[#E7E7E7] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2D5A27] bg-white"
            />
          </div>
        </div>

        {/* Estados */}
        {cargando && (
          <div className="text-center py-20 text-[#888888]">
            <p className="text-3xl mb-2">☕</p>
            <p className="text-sm">Cargando pedidos...</p>
          </div>
        )}

        {!cargando && error && (
          <div className="text-center py-20 text-red-400">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!cargando && !error && filtrados.length === 0 && (
          <div className="text-center py-20 text-[#888888]">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">No tienes pedidos aún.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-[#2D5A27] text-white text-sm px-6 py-2 rounded-xl hover:bg-[#215511] transition-colors"
            >
              Ir al catálogo
            </button>
          </div>
        )}

        {!cargando && !error && filtrados.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E7E7E7] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7E7E7]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#888888] uppercase">Número</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#888888] uppercase">Fecha</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#888888] uppercase">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#888888] uppercase">Total</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#888888] uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id_pedido} className="border-b border-[#E7E7E7] hover:bg-[#fafaf8] transition-colors">
                    <td className="px-6 py-4 text-[#010101] font-medium">{formatearNumero(p.id_pedido)}</td>
                    <td className="px-6 py-4 text-[#3D3D3D]">{formatearFecha(p.fecha_pedido)}</td>
                    <td className="px-6 py-4"><BadgeEstado estado={p.estado} /></td>
                    <td className="px-6 py-4 text-[#010101]">${Number(p.total).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/mis-pedidos/${p.id_pedido}`)}
                          className="text-[#888888] hover:text-[#2D5A27] transition-colors"
                          title="Ver detalle"
                        >
                          👁️
                        </button>
                        <button
                          className="text-[#888888] hover:text-[#2D5A27] transition-colors"
                          title="Descargar"
                        >
                          ⬇️
                        </button>
                        <button
                          className="text-[#888888] hover:text-[#2D5A27] transition-colors"
                          title="Repetir pedido"
                        >
                          🔄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default MisPedidosPage