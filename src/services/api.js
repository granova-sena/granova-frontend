import axios from 'axios'
import { API_URL } from '../config'
import { getActiveToken, clearClienteToken, clearEmpleadoToken, esRutaCliente } from './session'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  // Evita que una petición se quede "congelada" para siempre si el
  // servidor no responde (antes la ventana parecía trabada sin límite).
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = getActiveToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const estado = error.response?.status
    const esLogin = /\/auth\/(login|login-admin|google)/.test(error.config?.url || '')

    if (estado === 401 && !esLogin) {
      if (esRutaCliente()) {
        clearClienteToken()
      } else {
        clearEmpleadoToken()
      }
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/control-interno')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
