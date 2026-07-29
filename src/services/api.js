import axios from 'axios'
import { API_URL } from '../config'

// Cliente axios para el panel admin (endpoints creados por Daniel Rocha).
// Reutiliza la misma variable de entorno VITE_API_URL que el resto del
// frontend, agregando el prefijo /api con el que están montadas estas rutas
// en el backend (ver servidor.js).
const api = axios.create({
  baseURL: `${API_URL}/api`,
})

export default api
