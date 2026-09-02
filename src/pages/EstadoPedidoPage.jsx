import { useNavigate, useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from "../config";
import FormularioResena from '../components/FormularioResena'
import OrderStepper from '../components/ui/OrderStepper'
import EstadoPagoBadge from '../components/ui/EstadoPagoBadge'
import OperacionBadge from '../components/ui/OperacionBadge'

const METODOS_PASARELA = ['tarjeta', 'pse', 'nequi', 'daviplata']
const esMetodoPasarela = (metodo) => METODOS_PASARELA.includes(String(metodo || '').toLowerCase())

function necesitaPagar(estadoPago, metodoPago) {
  if (estadoPago === 'fallido') return true
  // Pendiente con método de pasarela (online): el cliente aún debe pagar.
  if (estadoPago === 'pendiente' && esMetodoPasarela(metodoPago)) return true
  return false
}

function EstadoPedidoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [resenaAbierta, setResenaAbierta] = useState(null) // guarda el id_detalle abierto, o null

  useEffect(() => {
    let cancelado = false
    async function cargarPedido(silencioso = false) {
      try {
        if (!silencioso) setCargando(true)
        const token = localStorage.getItem('token_cliente')
        const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        if (!cancelado) setPedido(json.data)
      } catch (err) {
        if (!cancelado) setError(err.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargarPedido(true)

    // Refresco automático para ver el cambio de estado (p. ej. a "Empacando")
    // sin recargar la página, igual que las notificaciones.
    const intervalo = setInterval(() => cargarPedido(true), 10000)
    function onVisibilidad() {
      if (document.visibilityState === 'visible') cargarPedido(true)
    }
    document.addEventListener('visibilitychange', onVisibilidad)
    window.addEventListener('focus', onVisibilidad)

    return () => {
      cancelado = true
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', onVisibilidad)
      window.removeEventListener('focus', onVisibilidad)
    }
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
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <span className="text-sm font-medium text-white">
            Pedido #{pedido.numero_pedido || formatearNumero(pedido.id_pedido)}
          </span>
          <span className="bg-[#6FA98C] text-white text-xs px-3 py-1 rounded-full font-medium">
            {pedido.estado === 'en_proceso' ? 'En preparación' : pedido.estado}
          </span>
          <EstadoPagoBadge estadoPago={pedido.estado_pago} />
          {pedido.operacion && <OperacionBadge operacion={pedido.operacion} sector={pedido.sector_envio} />}
        </div>
        <p className="text-xs text-white/40 mb-4">
          Realizado el {formatearFecha(pedido.fecha_pedido)}
        </p>

        {/* Aviso + botón "Pagar ahora" si el pago quedó pendiente/fallido */}
        {necesitaPagar(pedido.estado_pago, pedido.metodo_pago) && (
          <div className="rounded-xl border border-[#D8A92E]/30 bg-[#D8A92E]/10 px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {pedido.estado_pago === 'fallido'
                  ? '❌ Tu pago no se procesó.'
                  : '🕘 Tu pedido está pendiente de pago.'}
              </p>
              <p className="text-xs text-white/50">
                Completa el pago para confirmar el pedido.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/cliente/pagar?ref=&id_pedido=${pedido.id_pedido}`)}
              className="shrink-0 px-6 py-2.5 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition"
            >
              💳 Pagar ahora
            </button>
          </div>
        )}

        {/* Pago */}
        <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Pago</h2>
            <EstadoPagoBadge estadoPago={pedido.estado_pago} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
            <div className="flex-1 flex flex-wrap gap-2">
              <span className="text-white/40">Método:</span>
              <span className="text-white capitalize">{pedido.metodo_pago || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40">Total:</span>
              <span className="text-white font-semibold">${Number(pedido.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Timeline (Entrega) */}
        <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6 sm:p-8 mb-6">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-4">Entrega</p>
          <OrderStepper estado={pedido.estado} fechaPedido={formatearFecha(pedido.fecha_pedido)} />
        </div>

        {/* Cards info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          {/* Información del pedido */}
          <div className="rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Información del pedido</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Número</span>
                <span className="text-white font-medium">{pedido.numero_pedido || formatearNumero(pedido.id_pedido)}</span>
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
              <div className="flex justify-between gap-4">
                <span className="text-white/40">Sector</span>
                <span className="text-[#9DC9B4] text-right">{pedido.sector_envio || '—'}</span>
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
              <div className="mt-2 w-full border border-white/15 rounded-xl py-2 text-xs text-white/60 flex items-center justify-center gap-2 bg-white/[0.03]">
                📍 El rastreo se te enviará por correo al despachar tu pedido
              </div>
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
          type="button"
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