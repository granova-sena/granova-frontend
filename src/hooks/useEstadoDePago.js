import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { consultarEstadoPago } from '../services/pagosApi.js'

const ESTADOS_FINALES = ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']
const INTERVALO_MS = 2500
const MAX_INTENTOS = 40 // ~100 segundos como límite de seguridad

const MENSAJES_TOAST = {
  APPROVED: '¡Pago aprobado con éxito!',
  DECLINED: 'Tu pago fue rechazado',
  ERROR: 'Hubo un error con tu pago',
  VOIDED: 'La transacción fue anulada',
}

export function useEstadoPago(idTransaccion) {
  const [estado, setEstado] = useState('PENDING')
  const [mensaje, setMensaje] = useState(null)
  const [urlBanco, setUrlBanco] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const intentosRef = useRef(0)
  const estadoNotificadoRef = useRef(null)

  useEffect(() => {
    if (!idTransaccion) return

    let cancelado = false
    intentosRef.current = 0
    estadoNotificadoRef.current = null

    async function consultar() {
      try {
        const transaccion = await consultarEstadoPago(idTransaccion)
        if (cancelado) return

        setUrlBanco(transaccion.urlBanco ?? null)
        setEstado(transaccion.estado)
        setMensaje(transaccion.mensaje)

        const esFinal = ESTADOS_FINALES.includes(transaccion.estado)
        intentosRef.current += 1

        if (esFinal) {
          setCargando(false)

          if (estadoNotificadoRef.current !== transaccion.estado) {
            estadoNotificadoRef.current = transaccion.estado
            const idToast = `pago-${idTransaccion}`
            if (transaccion.estado === 'APPROVED') {
              toast.success(MENSAJES_TOAST.APPROVED, { id: idToast, duration: 5000 })
            } else {
              const texto = MENSAJES_TOAST[transaccion.estado] ?? 'No se pudo completar el pago'
              const detalle = transaccion.mensaje ? ` · ${transaccion.mensaje}` : ''
              toast.error(`${texto}${detalle}`, { id: idToast, duration: 6000 })
            }
          }

          return
        }

        if (intentosRef.current >= MAX_INTENTOS) {
          setCargando(false)
          return
        }

        setTimeout(consultar, INTERVALO_MS)
      } catch (err) {
        if (cancelado) return
        setError('No se pudo verificar el estado del pago')
        setCargando(false)
        toast.error('No se pudo verificar el estado del pago', { id: `pago-${idTransaccion}` })
      }
    }

    consultar()

    return () => {
      cancelado = true
    }
  }, [idTransaccion])

  return { estado, mensaje, cargando, error, urlBanco }
}