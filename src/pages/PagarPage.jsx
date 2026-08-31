import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { API_URL } from '../config'

const WOMPI_WIDGET_URL = 'https://checkout.wompi.co/widget.js'

function crearParticulas() {
  const colores = ['#6FA98C', '#9DC9B4', '#D85A30', '#D8A92E', '#ffffff', '#4C8C2A']
  return Array.from({ length: 40 }).map((_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2 + Math.random() * 2,
    color: colores[i % colores.length],
  }))
}

function Confeti() {
  const [particulas] = useState(crearParticulas)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particulas.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block w-2 h-3 rounded-sm"
          style={{ left: `${p.left}%`, top: '-20px', backgroundColor: p.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 1 }}
        />
      ))}
    </div>
  )
}

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    if (window.WidgetCheckout) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar el medio de pago de Wompi'))
    document.head.appendChild(s)
  })
}

function PagarPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const referencia = searchParams.get('ref') || ''
  const idPedidoParam = searchParams.get('id_pedido') || ''

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [estadoPago, setEstadoPago] = useState(null)       // 'pendiente' | 'pagado' | 'fallido' | 'pendiente_verificacion'
  const [pago, setPago] = useState(null)                    // { metodo_pago, monto, referencia, ... }
  const [checkout, setCheckout] = useState(null)            // config del botón Wompi (null = simulador)
  const [idPedido, setIdPedido] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)          // { estado: 'aprobado' | 'rechazado', puntos }
  const widgetAbierto = useRef(false)

  const refEfectiva = referencia || pago?.referencia || ''

  async function refreshEstado(mostrarCarga = false) {
    if (mostrarCarga) {
      setCargando(true)
      setError(null)
    }
    const token = localStorage.getItem('token_cliente')
    if (!token) {
      if (mostrarCarga) {
        setError('Debes iniciar sesión para completar el pago.')
        setCargando(false)
      }
      return
    }

    // La referencia (WOMPI-xxx / SIM-xxx) no es un id; necesitamos el id del pedido.
    // Para la ruta directa "/pagar?ref=..." sin id_pedido, usamos el id
    // que se guardó en localStorage al crear el último pedido pendiente.
    let idAPreguntar = idPedidoParam
    if (!idAPreguntar && idPedido) idAPreguntar = String(idPedido)
    if (!idAPreguntar && referencia) {
      idAPreguntar = localStorage.getItem('granova_pago_pedido_id') || ''
    }

    if (!idAPreguntar) {
      if (mostrarCarga) {
        setError('No se encontró el pedido a pagar.')
        setCargando(false)
      }
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/pagos/pedido/${idAPreguntar}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!json.ok) {
        if (mostrarCarga) throw new Error(json.mensaje)
        return
      }
      setIdPedido(Number(idAPreguntar))
      setPago(json.data.pago)
      setCheckout(json.data.checkout || null)
      setEstadoPago(json.data.estado_pago)

      localStorage.setItem('granova_pago_pedido_id', String(idAPreguntar))
      if (json.data.estado_pago === 'pagado') {
        setResultado(prev => (prev?.estado === 'aprobado' ? prev : { estado: 'aprobado' }))
      }
    } catch (err) {
      if (mostrarCarga) setError(err.message || 'No se pudo consultar el estado del pago.')
    } finally {
      if (mostrarCarga) setCargando(false)
    }
  }

  useEffect(() => {
    refreshEstado(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPedidoParam])

  // Poll ligero: mientras el pago sigue 'pendiente', vamos preguntando si el
  // webhook de Wompi (PSE/Nequi/Daviplata) ya lo confirmó.
  useEffect(() => {
    if (estadoPago !== 'pendiente' || cargando) return undefined
    const id = setInterval(() => { refreshEstado(false) }, 5000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoPago, cargando, idPedido])

  // Al llegar con un pago de pasarela pendiente, el medio de pago (widget de
  // Wompi) se abre SOLO la primera vez, sin que el cliente tenga que hacer clic.
  useEffect(() => {
    if (checkout && estadoPago === 'pendiente' && !procesando && !widgetAbierto.current) {
      widgetAbierto.current = true
      pagarConWompi()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout, estadoPago, procesando])

  // Le dice al backend que verifique la transacción real contra Wompi.
  async function confirmarConWompi(transactionId) {
    const token = localStorage.getItem('token_cliente')
    try {
      const res = await fetch(`${API_URL}/api/pagos/wompi/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referencia: refEfectiva, transaction_id: transactionId }),
      })
      const json = await res.json()
      if (!json.ok && res.status === 503) {
        setError(json.mensaje)
        return
      }
      if (json.ok) {
        setEstadoPago(json.data.estado_pago)
        if (json.data.estado_pago === 'pagado') {
          setResultado({ estado: 'aprobado', ...json.data })
        } else if (json.data.estado_pago === 'fallido') {
          setResultado({ estado: 'rechazado', ...json.data })
        }
      }
    } catch {
      // Sin conexión: el polling y el webhook terminan confirmando.
    }
  }

  async function pagarConWompi() {
    if (!checkout || procesando) return
    setError(null)
    setProcesando(true)
    try {
      await cargarScript(WOMPI_WIDGET_URL)
      const widget = new window.WidgetCheckout({
        currency: checkout.currency,
        amountInCents: checkout.amount_in_cents,
        reference: checkout.reference,
        publicKey: checkout.public_key,
        signature: checkout.signature,
        customerData: checkout.customer_data || undefined,
        shippingAddress: checkout.shipping_address || undefined,
      })
      widget.open(async (resultadoWidget) => {
        const tx = resultadoWidget?.transaction
        if (!tx?.id) {
          setError('El pago no se completó en el medio de pago.')
          setProcesando(false)
          return
        }
        if (tx.status === 'APPROVED') {
          await confirmarConWompi(tx.id)
        } else {
          // PSE/Nequi/Daviplata quedan PENDING: el webhook confirma al terminar.
          setError('Esperando confirmación del banco. Puedes cerrar esta pantalla.')
        }
        setProcesando(false)
      })
    } catch (err) {
      setError(err.message || 'No se pudo abrir el medio de pago de Wompi.')
      setProcesando(false)
    }
  }

  // Simulador didáctico (PASARELA=simulador en el backend).
  async function procesar(resultadoValor) {
    setProcesando(true)
    setError(null)
    try {
      const token = localStorage.getItem('token_cliente')
      const res = await fetch(`${API_URL}/api/pagos/${encodeURIComponent(refEfectiva)}/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resultado: resultadoValor }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.mensaje)
      setResultado({ estado: resultadoValor, ...json.data })
      setEstadoPago(json.data.estado_pago)
    } catch (err) {
      setError(err.message || 'No se pudo procesar el pago.')
    } finally {
      setProcesando(false)
    }
  }

  const monto = pago?.monto ?? null

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
        <div className="flex flex-col items-center gap-4 text-white">
          <motion.div
            className="w-12 h-12 rounded-full border-4 border-white/15 border-t-[#6FA98C]"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          />
          <p className="text-sm text-white/60">Redirigiendo a la pasarela segura...</p>
        </div>
      </div>
    )
  }

  if (error && estadoPago !== 'pendiente' && !pago) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
        <div className="max-w-md mx-auto px-6 py-12 text-white text-center rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
          <div className="w-16 h-16 bg-[#D85A30]/15 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">No se pudo continuar</h2>
          <p className="text-sm text-white/50 mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate(idPedido || idPedidoParam ? `/cliente/pedidos/${idPedido || idPedidoParam}` : '/cliente/pedidos')}
              className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition"
            >
              Ver mi pedido
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pantalla de ÉXITO (pago aprobado)
  if (resultado?.estado === 'aprobado' || estadoPago === 'pagado') {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#0a1a0a' }}>
        <Confeti />
        <div className="max-w-md w-full mx-auto px-6 py-12 text-white text-center rounded-xl border border-[#6FA98C]/30 bg-white/[0.08] backdrop-blur-xl relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 15 }}
            className="w-20 h-20 bg-[#6FA98C]/20 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
          >
            🎉
          </motion.div>
          <h2 className="text-2xl font-semibold mb-2">¡Pago exitoso!</h2>
          <p className="text-white/60 text-sm mb-2">
            Tu pago fue recibido. Tu pedido será enviado en menos de 2 días.
          </p>
          {resultado?.puntos_ganados > 0 && (
            <p className="text-sm text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/25 rounded-lg px-4 py-2 mb-2">
              ⭐ ¡Ganaste {resultado.puntos_ganados} puntos de lealtad!
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate(`/cliente/pedidos/${idPedido}`)}
            className="mt-6 px-8 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition"
          >
            Ver mi pedido
          </button>
        </div>
      </div>
    )
  }

  // Pantalla de FALLO (pago rechazado)
  if (resultado?.estado === 'rechazado' || (estadoPago === 'fallido' && !resultado)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
        <div className="max-w-md w-full mx-auto px-6 py-12 text-white text-center rounded-xl border border-[#D85A30]/30 bg-white/[0.08] backdrop-blur-xl">
          <div className="w-20 h-20 bg-[#D85A30]/15 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Pago no procesado</h2>
          <p className="text-white/60 text-sm mb-2">
            No pudimos confirmar tu pago, así que tu pedido fue cancelado.
          </p>
          <p className="text-[11px] text-white/30 mb-6">
            Los productos vuelven a estar disponibles en el catálogo.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => navigate('/cliente/catalogo')}
              className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition"
            >
              Volver a la tienda
            </button>
            <button
              type="button"
              onClick={() => navigate(`/cliente/pedidos/${idPedido}`)}
              className="px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-medium hover:bg-white/10 transition"
            >
              Ver mis pedidos
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pago en verificación manual (transferencia/efectivo): no es pasarela.
  if (estadoPago === 'pendiente_verificacion') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
        <div className="max-w-md w-full mx-auto px-6 py-12 text-white text-center rounded-xl border border-[#D8A92E]/30 bg-white/[0.08] backdrop-blur-xl">
          <div className="w-20 h-20 bg-[#D8A92E]/15 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⏳</div>
          <h2 className="text-2xl font-semibold mb-2">Pedido en verificación de pago</h2>
          <p className="text-white/60 text-sm mb-6">
            Nuestro equipo está revisando el pago. Cuando se confirme, tu pedido avanzará.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/cliente/pedidos/${idPedido}`)}
            className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition"
          >
            Ver mi pedido
          </button>
        </div>
      </div>
    )
  }

  // Pago pendiente de pasarela (Wompi real o simulador)
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
      <div className="max-w-md w-full mx-auto px-6 py-10 text-white rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Pasarela de pago segura</h2>
            <p className="text-xs text-white/40">Granova · Café de origen</p>
          </div>
          <span className="text-2xl">🔒</span>
        </div>

        <div className="flex flex-col gap-3 text-sm rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6">
          <div className="flex justify-between">
            <span className="text-white/50">Método</span>
            <span className="font-medium capitalize">{pago?.metodo_pago || 'online'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Referencia</span>
            <span className="font-medium text-[#9DC9B4]">{refEfectiva}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-white/50">Total a pagar</span>
            <span className="text-lg font-semibold">${(monto ?? 0).toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#D85A30] bg-[#D85A30]/10 border border-[#D85A30]/30 rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {checkout ? (
            <>
              <button
                type="button"
                disabled={procesando || !refEfectiva}
                onClick={pagarConWompi}
                className="px-6 py-3.5 bg-[#6FA98C] text-white rounded-xl text-sm font-semibold hover:bg-[#4F8A70] transition disabled:opacity-50"
              >
                {procesando ? 'Abriendo medio de pago...' : 'Pagar ahora 🔒'}
              </button>
              <p className="text-[10px] text-white/30 text-center mt-2">
                Serás llevado al medio de pago seguro de Wompi. Al confirmar, tu pedido se envía en menos de 2 días.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={procesando || !refEfectiva}
                onClick={() => procesar('aprobado')}
                className="px-6 py-3.5 bg-[#6FA98C] text-white rounded-xl text-sm font-semibold hover:bg-[#4F8A70] transition disabled:opacity-50"
              >
                {procesando ? 'Procesando...' : 'Pagar (simular éxito)'}
              </button>
              <button
                type="button"
                disabled={procesando || !refEfectiva}
                onClick={() => procesar('rechazado')}
                className="px-6 py-3.5 border border-white/20 text-white/80 rounded-xl text-sm font-medium hover:bg-white/10 transition disabled:opacity-50"
              >
                Cancelar (simular fallo)
              </button>
              <p className="text-[10px] text-white/30 text-center mt-2">
                Pasarela simulada para pruebas. En producción se redirige a la entidad bancaria.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PagarPage