import axios from 'axios'

// Tokenización de tarjetas contra la API pública de Wompi (modo TEST/sandbox).
// La llave pública es segura para el navegador y se configura en VITE_WOMPI_PUBLIC_KEY.
const WOMPI_BASE_URL = 'https://sandbox.wompi.co/v1'

const wompiPublicApi = axios.create({
  baseURL: WOMPI_BASE_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_WOMPI_PUBLIC_KEY}`,
  },
})

export async function tokenizarTarjeta({ numero, cvc, mesExpiracion, anioExpiracion, nombreTitular }) {
  const { data } = await wompiPublicApi.post('/tokens/cards', {
    number: numero,
    cvc,
    exp_month: mesExpiracion,
    exp_year: anioExpiracion,
    card_holder: nombreTitular,
  })
  return data.data
}