import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { API_URL } from '../config'

// Estilos del campo de tarjeta — se adaptan al diseño oscuro del proyecto
const estilosTarjeta = {
  style: {
    base: {
      color:           '#ffffff',
      fontFamily:      'Arial, sans-serif',
      fontSize:        '16px',
      '::placeholder': { color: '#ffffff40' },
    },
    invalid: {
      color: '#D85A30',
    },
    
  },
}


// ─────────────────────────────────────────────────────────────
function FormularioPago({ clientSecret, id_pedido, onExito }) {
  const stripe   = useStripe()    // hook para acceder a Stripe
  const elements = useElements()  // hook para acceder a los elementos de Stripe

  const [procesando, setProcesando] = useState(false)
  const [errorPago,  setErrorPago]  = useState(null)

  const manejarPago = async (e) => {
    e.preventDefault()

    // Stripe no está listo aún — esperamos
    if (!stripe || !elements) return

    setProcesando(true)
    setErrorPago(null)

    // Obtenemos el elemento de la tarjeta
    const cardElement = elements.getElement(CardElement)

    // Confirmamos el pago con Stripe
    // stripe.confirmCardPayment usa el clientSecret para identificar el Payment Intent
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })

    if (error) {
      // El pago falló — mostramos el error al usuario
      setErrorPago(error.message)
      setProcesando(false)
      return
    }

    if (paymentIntent.status === 'succeeded') {
      // El pago fue exitoso — llamamos a onExito
      onExito()
    }
  }

  return (
    <form onSubmit={manejarPago} className="flex flex-col gap-4">

      {/* Campo de tarjeta de Stripe */}
      <div className="border border-white/15 rounded-xl px-4 py-4 bg-white/[0.08]">
        <CardElement options={estilosTarjeta} />
      </div>

      {/* Mensaje de error */}
      {errorPago && (
        <p className="text-sm text-[#D85A30]">{errorPago}</p>
      )}

      {/* Botón de pago */}
      <button
        type="submit"
        disabled={!stripe || procesando}
        className="w-full h-12 rounded-xl bg-[#6FA98C] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#4F8A70] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {procesando ? 'Procesando...' : '🔒 Pagar con tarjeta'}
      </button>

      <p className="text-xs text-white/40 text-center">
        Pago seguro con Stripe · Tus datos nunca tocan nuestros servidores
      </p>

    </form>
  )
}

export default FormularioPago