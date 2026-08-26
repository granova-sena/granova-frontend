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

// Si el backend responde 401 (token ausente/vencido), limpiamos la sesión
// y mandamos al usuario a iniciar sesión, en vez de mostrar errores raros.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const estado = error.response?.status

    // No redirigimos si es una petición de login/registro (ahí el 401 es
    // "credenciales inválidas", no "sesión vencida").
    const esLogin = /\/auth\/(login|login-admin|google)/.test(error.config?.url || '')

    if (estado === 401 && !esLogin) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      // Evita redirigir en bucle si ya estamos en una pantalla de login.
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/control-interno')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
