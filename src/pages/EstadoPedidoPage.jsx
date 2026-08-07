import { useNavigate, useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from "../config";
import FormularioResena from '../components/FormularioResena'


const estadosPedido = [
  { id: 'pendiente', label: 'Pendiente', icono: '🕐' },
  { id: 'confirmado', label: 'Confirmado', icono: '✓' },
  { id: 'en_proceso', label: 'En preparación', icono: '📦' },
  { id: 'enviado', label: 'Enviado', icono: '🚚' },
  { id: 'entregado', label: 'Entregado', icono: '🏠' },
]
function obtenerIdCliente() {
  try {
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    return cliente?.id ?? null
  } catch {
    return null
  }
}

function EstadoPedidoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [resenaAbierta, setResenaAbierta] = useState(null) // guarda el id_detalle abierto, o null

  useEffect(() => {
    async function cargarPedido() {
      try {
        setCargando(true)
        const res = await fetch(`${API_URL}/pedidos/${id}`)
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
      <p className="text-white/50 text-sm">Cargando pedido...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
      <p className="text-[#D85A30] text-sm">{error}</p>
    </div>
  )

  const indexActual = estadosPedido.findIndex(e => e.id === pedido.estado)

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

  const formatearNumero = (id) =>
    `PED-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`

  const productoEnResena = pedido.productos?.find(p => p.id_detalle === resenaAbierta)

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 text-white">

        {/* Encabezado */}
        <h1 className="text-2xl sm:text-3xl font-semibold mb-1 tracking-tight">Estado del pedido</h1>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-medium text-white">
            Pedido #{formatearNumero(pedido.id_pedido)}
          </span>
          <span className="bg-[#6FA98C] text-white text-xs px-3 py-1 rounded-full font-medium">
            {pedido.estado === 'en_proceso' ? 'En preparación' : pedido.estado}
          </span>
        </div>
        <p className="text-xs text-white/40 mb-8">
          Realizado el {formatearFecha(pedido.fecha_pedido)}
        </p>

        {/* Timeline */}
        <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between overflow-x-auto">
            {estadosPedido.map((e, i) => (
              <div key={e.id} className="flex items-start flex-1 min-w-[80px]">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10
                                        ${i < indexActual
                      ? 'bg-[#6FA98C] border-[#6FA98C] text-white'
                      : i === indexActual
                      ? 'bg-[#6FA98C] border-[#6FA98C] text-white animate-pulse ring-4 ring-[#6FA98C]/30'
                      : 'bg-transparent border-white/20 text- white/40'
                    }`}>
                    {e.icono}
                  </div>
                  <p className={`text-xs mt-2 text-center font-medium
                    ${i <= indexActual ? 'text-white' : 'text-white/40'}`}>
                    {e.label}
                  </p>
                  {i === 0 && (
                    <p className="text-[10px] text-white/30">
                      {formatearFecha(pedido.fecha_pedido)}
                    </p>
                  )}
                  {i > indexActual && (
                    <p className="text-[10px] text-white/30">Pendiente</p>
                  )}
                </div>
                {i < estadosPedido.length - 1 && (
                  <div className={`h-px w-full mt-5 mx-1
                    ${i < indexActual ? 'bg-[#6FA98C]' : 'bg-white/15'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cards info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          {/* Información del pedido */}
          <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Información del pedido</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Número</span>
                <span className="text-white font-medium">{formatearNumero(pedido.id_pedido)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Método de pago</span>
                <span className="text-[#9DC9B4] font-medium">{pedido.metodo_pago}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/40">Dirección</span>
                <span className="text-white text-right">
                  {pedido.direccion_envio}<br />{pedido.ciudad_envio}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 mt-1">
                <span className="text-white/40">Total pagado</span>
                <span className="text-white font-semibold">${Number(pedido.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Productos */}
      <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-white">
            Productos ({pedido.productos?.length || 0})
          </h3>
        </div>
        <div className="flex flex-col gap-3">
     {pedido.productos?.map((p, i) => (
  <div key={i} className="flex items-center gap-3">
    <div className="w-8 h-8 bg-[#6FA98C]/15 rounded-lg flex items-center justify-center text-sm">☕</div>
    <div className="flex-1">
      <p className="text-xs font-medium text-white">{p.producto_nombre}</p>
      <p className="text-[10px] text-white/40">{p.presentacion}</p>
      {p.id_lote && (
        <Link to={`/cliente/trazabilidad/${p.id_lote}`} className="text-[10px] text-[#9DC9B4] hover:underline block">
          Ver origen →
        </Link>
      )}
      {pedido.estado === 'entregado' && resenaAbierta !== p.id_detalle && (
        <button
          onClick={() => setResenaAbierta(p.id_detalle)}
          className="text-[10px] text-[#9DC9B4] hover:underline block mt-1"
        >
          Escribir reseña →
        </button>
      )}
    </div>
    <span className="text-xs text-white/40">{p.cantidad} und</span>
  </div>
))}
        </div>
      </div>

          {/* Información de envío */}
          <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Información de envío</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <p className="text-white/40">Dirección de envío</p>
                <p className="text-white font-semibold mt-1">{pedido.direccion_envio}</p>
              </div>
              <div>
                <p className="text-white/40">Ciudad</p>
                <p className="text-white font-semibold mt-1">{pedido.ciudad_envio}</p>
              </div>
              <button className="mt-2 w-full border border-white/15 rounded-xl py-2 text-xs text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                📍 Rastrear envío
              </button>
            </div>
          </div>

        </div>

        {/* Formulario de reseña: a todo el ancho, fuera del grid de 3 columnas */}
        {resenaAbierta && productoEnResena && (
          <div className="mb-6">
            <FormularioResena
              id_detalle={resenaAbierta}
              producto_nombre={productoEnResena.producto_nombre}
              onCerrar={() => setResenaAbierta(null)}
              onEnviado={() => setResenaAbierta(null)}
            />
          </div>
        )}

        {/* Notificación */}
        <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 bg-[#6FA98C]/15 rounded-full flex items-center justify-center text-sm flex-shrink-0">
            🛡️
          </div>
          <div>
            <p className="text-sm font-medium text-white">Te notificaremos cuando tu pedido esté en camino.</p>
            <p className="text-xs text-white/40">Si tienes dudas, contáctanos por WhatsApp 300 123 4567</p>
          </div>
        </div>

        {/* Volver */}
        <button
          onClick={() => navigate('/cliente/pedidos')}
          className="mt-6 flex items-center gap-2 text-[#9DC9B4] text-sm hover:underline"
        >
          ← Volver al historial
        </button>

      </div>
    </div>
  )
}



export default EstadoPedidoPage