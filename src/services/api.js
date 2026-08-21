import axios from 'axios'
import { API_URL } from '../config'

// Cliente axios para el panel admin (endpoints creados por Daniel Rocha).
// Reutiliza la misma variable de entorno VITE_API_URL que el resto del
// frontend, agregando el prefijo /api con el que están montadas estas rutas
// en el backend (ver servidor.js).
const api = axios.create({
  baseURL: `${API_URL}/api`,
})

// Manda el token en TODAS las peticiones automáticamente, para no
// tener que acordarse de agregarlo a mano en cada archivo (así se nos
// olvidó una vez y el Dashboard quedó dando error de autenticación).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
