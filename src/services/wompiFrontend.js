import axios from 'axios';

const wompiPublicApi = axios.create({
  baseURL: 'https://sandbox.wompi.co/v1', 
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_WOMPI_PUBLIC_KEY}`,
  },
});

export async function tokenizarTarjeta({ numero, cvc, mesExpiracion, anioExpiracion, nombreTitular }) {
  const { data } = await wompiPublicApi.post('/tokens/cards', {
    number: numero,
    cvc,
    exp_month: mesExpiracion,
    exp_year: anioExpiracion,
    card_holder: nombreTitular,
  });
  return data.data; 
}