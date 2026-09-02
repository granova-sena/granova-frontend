import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { API_URL } from '../config'
import { FormularioNequi } from '../components/pagos/formularioNequi'
import { FormularioTarjeta } from '../components/pagos/FormularioTarjeta'
import { FormularioPSE } from '../components/pagos/FormularioPSE'

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

function PagarPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const referencia = searchParams.get('ref') || ''
  const idPedidoParam = searchParams.get('id_pedido') || ''

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [estadoPago, setEstadoPago] = useState(null)       // 'pendiente' | 'pagado' | 'fallido'
  const [pago, setPago] = useState(null)                    // { metodo_pago, monto, referencia, ... }
  const [idPedido, setIdPedido] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)          // { estado: 'aprobado' | 'rechazado', puntos }
  const [modoPasarela, setModoPasarela] = useState('simulador')  // 'simulador' | 'wompi'
  const [finWompi, setFinWompi] = useState(null)            // 'aprobado' | 'rechazado' cuando termina Wompi

  useEffect(() => {
    async function consultarEstado() {
      setCargando(true)
      setError(null)
      const token = localStorage.getItem('token_cliente')
      if (!token) {
        setError('Debes iniciar sesión para completar el pago.')
        setCargando(false)
        return
      }

      // El frontend decide la UI según el modo de pasarela del backend.
      try {
        const resModo = await fetch(`${API_URL}/api/public/parametros/pasarela`)
        const jsonModo = await resModo.json()
        const modo = jsonModo?.data?.modo ?? jsonModo?.modo
        if (modo) setModoPasarela(modo)
      } catch (e) { /* si falla, seguimos en simulador */ }

      // Si no venimos de la confirmación, intentamos resolver el pedido.
      // La referencia (SIM-xxx) no es un id; necesitamos el id del pedido.
      // Para la ruta directa "/pagar?ref=..." sin id_pedido, usamos el id
      // que se guardó en localStorage al crear el último pedido pendiente.
      let idAPreguntar = idPedidoParam
      if (!idAPreguntar && referencia) {
        idAPreguntar = localStorage.getItem('granova_pago_pedido_id') || ''
      }

      if (!idAPreguntar) {
        setError('No se encontró el pedido a pagar.')
        setCargando(false)
        return
      }

      try {
        const res = await fetch(`${API_URL}/api/pagos/pedido/${idAPreguntar}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        setIdPedido(Number(idAPreguntar))
        setPago(json.data.pago)
        setEstadoPago(json.data.estado_pago)

        // Guardar el id para retomar la pasarela desde la ruta directa.
        localStorage.setItem('granova_pago_pedido_id', String(idAPreguntar))
        // Referencia por defecto si el uso directo no la trae.
        if (!referencia && json.data.pago?.referencia) {
          // no reescribimos searchParams; usamos pago.referencia más abajo.
        }
      } catch (err) {
        setError(err.message || 'No se pudo consultar el estado del pago.')
      } finally {
        setCargando(false)
      }
    }
    consultarEstado()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPedidoParam])

  const refEfectiva = referencia || pago?.referencia || ''

  // Al cambiar de pedido/modo se descarta un resultado Wompi anterior
  // para poder volver a intentar el pago.
  useEffect(() => {
    setFinWompi(null)
  }, [idPedido, modoPasarela, pago?.metodo_pago])

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
      if (json.data.unidades_acumuladas != null) {
        try {
          const clienteGuardado = JSON.parse(localStorage.getItem('cliente')) || {}
          localStorage.setItem('cliente', JSON.stringify({
            ...clienteGuardado,
            unidades_acumuladas: json.data.unidades_acumuladas,
          }))
        } catch (e) { /* ignore */ }
      }
    } catch (err) {
      setError(err.message || 'No se pudo procesar el pago.')
    } finally {
      setProcesando(false)
    }
  }

  const monto = pago?.monto ?? null

  // Métodos que pasan por la pasarela Wompi real (modalTEST).
  const METODOS_WOMPI = ['nequi', 'tarjeta', 'pse', 'daviplata']
  const esPasarelaWompi = modoPasarela === 'wompi' && METODOS_WOMPI.includes((pago?.metodo_pago || '').toLowerCase())

  function manejarFinWompi(estadoFinal) {
    setFinWompi(estadoFinal)
  }

  function renderFormularioWompi() {
    const metodo = (pago?.metodo_pago || '').toLowerCase()
    if (metodo === 'nequi' || metodo === 'daviplata') {
      return <FormularioNequi idPedido={idPedido} onFinalizado={manejarFinWompi} />
    }
    if (metodo === 'pse') {
      return <FormularioPSE idPedido={idPedido} onFinalizado={manejarFinWompi} />
    }
    return <FormularioTarjeta idPedido={idPedido} onFinalizado={manejarFinWompi} />
  }

  // Estamos mostrando el estado cargando / error
  if (cargando) {    return (
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

  if (error) {
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
  if (resultado?.estado === 'aprobado' || estadoPago === 'pagado' || finWompi === 'aprobado') {
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
          <h2 className="text-2xl font-semibold mb-2">¡Pago aprobado!</h2>
          <p className="text-white/60 text-sm mb-2">
            Tu pago fue procesado correctamente.
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
  if (resultado?.estado === 'rechazado' || finWompi === 'rechazado' || (estadoPago === 'fallido' && !resultado)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1a0a' }}>
        <div className="max-w-md w-full mx-auto px-6 py-12 text-white text-center rounded-xl border border-[#D85A30]/30 bg-white/[0.08] backdrop-blur-xl">
          <div className="w-20 h-20 bg-[#D85A30]/15 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">❌</div>
          <h2 className="text-2xl font-semibold mb-2">Pago no procesado</h2>
          <p className="text-white/60 text-sm mb-2">
            No se pudo completar el pago. Puedes intentarlo de nuevo.
          </p>
          <p className="text-[11px] text-white/30 mb-6">
            Los productos vuelven a estar disponibles en el catálogo.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => { setEstadoPago('pendiente'); setResultado(null) }}
              className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition"
            >
              Intentar de nuevo
            </button>
            <button
              type="button"
              onClick={() => navigate(`/cliente/pedidos/${idPedido}`)}
              className="px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-medium hover:bg-white/10 transition"
            >
              Ver mi pedido
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

  // Pasarela simulada (pago pendiente)
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

        {esPasarelaWompi ? (
          renderFormularioWompi()
        ) : (
        <div className="flex flex-col gap-2">
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
        </div>
        )}
      </div>
    </div>
  )
}

export default PagarPage
