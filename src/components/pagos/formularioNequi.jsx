import { useState, useEffect } from 'react'
import { crearPagoNequi } from '../../services/pagosApi'
import { useEstadoPago } from '../../hooks/useEstadoDePago'

const ESTADOS_UI = {
  PENDING: 'Procesando tu pago... revisa la notificación en tu app Nequi',
  APPROVED: '¡Pago aprobado! 🎉',
  DECLINED: 'Tu pago fue rechazado',
  ERROR: 'Hubo un error con tu pago',
  VOIDED: 'La transacción fue anulada',
}

const ESTADOS_FINALES = ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']

function claseTextoEstado(estado) {
  if (estado === 'APPROVED') return 'text-[#6FA98C]'
  if (estado === 'DECLINED' || estado === 'ERROR' || estado === 'VOIDED') return 'text-[#D85A30]'
  return 'text-gray-100'
}

// Formulario de pago con Nequi (Wompi, modo TEST).
// onFinalizado(final) -> 'aprobado' | 'rechazado' para que la página padre
// muestre su pantalla de resultado (confeti / fallo).
export function FormularioNequi({ idPedido, onFinalizado }) {
  const [numeroCelular, setNumeroCelular] = useState('')
  const [idTransaccion, setIdTransaccion] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  const { estado, mensaje, cargando, error } = useEstadoPago(idTransaccion)

  useEffect(() => {
    if (ESTADOS_FINALES.includes(estado) && onFinalizado) {
      onFinalizado(estado === 'APPROVED' ? 'aprobado' : 'rechazado')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  const celularValido = /^3\d{9}$/.test(numeroCelular)

  async function manejarSubmit(e) {
    e.preventDefault()
    if (!celularValido) return

    setEnviando(true)
    setErrorEnvio(null)

    try {
      const transaccion = await crearPagoNequi(idPedido, numeroCelular)
      setIdTransaccion(transaccion.id_transaccion ?? transaccion.idTransaccion)
    } catch (err) {
      setErrorEnvio(err.response?.data?.mensaje ?? 'No se pudo iniciar el pago con Nequi')
    } finally {
      setEnviando(false)
    }
  }

  if (idTransaccion) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        {cargando && (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-[#6FA98C]" />
        )}
        <p className={`text-lg font-medium ${error ? 'text-[#D85A30]' : claseTextoEstado(estado)}`}>
          {error ?? ESTADOS_UI[estado] ?? 'Verificando el estado del pago...'}
        </p>
        {estado === 'DECLINED' && mensaje && (
          <p className="text-sm text-white/50">{mensaje}</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-white/80">Número de celular Nequi</span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="3001234567"
          value={numeroCelular}
          onChange={(e) => setNumeroCelular(e.target.value)}
          className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2.5 text-white placeholder:text-white/40 focus:border-[#6FA98C] focus:outline-none"
        />
        {numeroCelular && !celularValido && (
          <span className="text-xs text-[#D85A30]">Debe tener 10 dígitos y empezar por 3</span>
        )}
      </label>

      {errorEnvio && <p className="text-sm text-[#D85A30]">{errorEnvio}</p>}

      <button
        type="submit"
        disabled={!celularValido || enviando}
        className="rounded-lg bg-[#6FA98C] px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Pagar con Nequi'}
      </button>
    </form>
  )
}