import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

const estadosPedido = [
  { id: 'pendiente',  label: 'Pendiente',       icono: '🕐' },
  { id: 'confirmado', label: 'Confirmado',       icono: '✓'  },
  { id: 'en_proceso', label: 'En preparación',   icono: '📦' },
  { id: 'enviado',    label: 'Enviado',           icono: '🚚' },
  { id: 'entregado',  label: 'Entregado',         icono: '🏠' },
]

function EstadoPedidoPage() {
  const navigate    = useNavigate()
  const { id }      = useParams()
  const [pedido, setPedido]   = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function cargarPedido() {
      try {
        setCargando(true)
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/${id}`)
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        setPedido(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargarPedido()
  }, [id])

  if (cargando) return (
    <div className="min-h-screen bg-[#F7F2E8] flex items-center justify-center">
      <p className="text-[#888888] text-sm">Cargando pedido...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F7F2E8] flex items-center justify-center">
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  )

  const indexActual = estadosPedido.findIndex(e => e.id === pedido.estado)

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

  const formatearNumero = (id) =>
    `PED-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`

  return (
    <div className="min-h-screen bg-[#F7F2E8]">
      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* Encabezado */}
        <h1 className="text-3xl font-bold text-[#010101] mb-1">Estado del pedido</h1>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-medium text-[#010101]">
            Pedido #{formatearNumero(pedido.id_pedido)}
          </span>
          <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            {pedido.estado === 'en_proceso' ? 'En preparación' : pedido.estado}
          </span>
        </div>
        <p className="text-xs text-[#888888] mb-8">
          Realizado el {formatearFecha(pedido.fecha_pedido)}
        </p>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-[#E7E7E7] p-8 mb-6">
          <div className="flex items-start justify-between">
            {estadosPedido.map((e, i) => (
              <div key={e.id} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10
                    ${i < indexActual
                      ? 'bg-[#2D5A27] border-[#2D5A27] text-white'
                      : i === indexActual
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-white border-[#E7E7E7] text-[#888888]'
                    }`}>
                    {e.icono}
                  </div>
                  <p className={`text-xs mt-2 text-center font-medium
                    ${i <= indexActual ? 'text-[#010101]' : 'text-[#888888]'}`}>
                    {e.label}
                  </p>
                  {i === 0 && (
                    <p className="text-[10px] text-[#888888]">
                      {formatearFecha(pedido.fecha_pedido)}
                    </p>
                  )}
                  {i > indexActual && (
                    <p className="text-[10px] text-[#888888]">Pendiente</p>
                  )}
                </div>
                {i < estadosPedido.length - 1 && (
                  <div className={`h-px w-full mt-5 mx-1
                    ${i < indexActual ? 'bg-[#2D5A27]' : 'bg-[#E7E7E7]'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cards info */}
        <div className="grid grid-cols-3 gap-4 mb-6">

          {/* Información del pedido */}
          <div className="bg-white rounded-xl border border-[#E7E7E7] p-6">
            <h3 className="text-sm font-semibold text-[#010101] mb-4">Información del pedido</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888888]">Número</span>
                <span className="text-[#010101] font-medium">{formatearNumero(pedido.id_pedido)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Método de pago</span>
                <span className="text-[#2D5A27] font-medium">{pedido.metodo_pago}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#888888]">Dirección</span>
                <span className="text-[#010101] text-right">
                  {pedido.direccion_envio}<br/>{pedido.ciudad_envio}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E7E7E7] pt-3 mt-1">
                <span className="text-[#888888]">Total pagado</span>
                <span className="text-[#010101] font-semibold">${Number(pedido.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-xl border border-[#E7E7E7] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-[#010101]">
                Productos ({pedido.productos?.length || 0})
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {pedido.productos?.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#f0f7ee] rounded-lg flex items-center justify-center text-sm">
                    ☕
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[#010101]">{p.producto_nombre}</p>
                    <p className="text-[10px] text-[#888888]">{p.presentacion}</p>
                  </div>
                  <span className="text-xs text-[#888888]">{p.cantidad} und</span>
                </div>
              ))}
            </div>
          </div>

          {/* Información de envío */}
          <div className="bg-white rounded-xl border border-[#E7E7E7] p-6">
            <h3 className="text-sm font-semibold text-[#010101] mb-4">Información de envío</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <p className="text-[#888888]">Dirección de envío</p>
                <p className="text-[#010101] font-semibold mt-1">{pedido.direccion_envio}</p>
              </div>
              <div>
                <p className="text-[#888888]">Ciudad</p>
                <p className="text-[#010101] font-semibold mt-1">{pedido.ciudad_envio}</p>
              </div>
              <button className="mt-2 w-full border border-[#E7E7E7] rounded-xl py-2 text-xs text-[#010101] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                📍 Rastrear envío
              </button>
            </div>
          </div>

        </div>

        {/* Notificación */}
        <div className="bg-white rounded-xl border border-[#E7E7E7] px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 bg-[#f0f7ee] rounded-full flex items-center justify-center text-sm flex-shrink-0">
            🛡️
          </div>
          <div>
            <p className="text-sm font-medium text-[#010101]">Te notificaremos cuando tu pedido esté en camino.</p>
            <p className="text-xs text-[#888888]">Si tienes dudas, contáctanos por WhatsApp 300 123 4567</p>
          </div>
        </div>

        {/* Volver */}
        <button
          onClick={() => navigate('/mis-pedidos')}
          className="mt-6 flex items-center gap-2 text-[#2D5A27] text-sm hover:underline"
        >
          ← Volver al historial
        </button>

      </div>
    </div>
  )
}

export default EstadoPedidoPage