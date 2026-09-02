import axios from 'axios'
import { API_URL } from '../config'
import { getActiveToken, clearClienteToken, clearEmpleadoToken, limpiarTodo, esRutaCliente } from './session'

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

function redirigirLogin() {
  if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/control-interno')) {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const estado = error.response?.status
    const esLogin = /\/auth\/(login|login-admin|google)/.test(error.config?.url || '')
    const esRutaPanel = !esRutaCliente()

    if (estado === 401 && !esLogin) {
      if (esRutaCliente()) {
        clearClienteToken()
        redirigirLogin()
      } else {
        clearEmpleadoToken()
        if (!window.location.pathname.startsWith('/control-interno')) {
          window.location.href = '/control-interno'
        }
      }
    }

    // 403 en rutas de panel: la sesión no tiene el rol que exige el endpoint
    // (p.ej. empleado tratando de entrar a algo solo-admin). Se limpia y se
    // manda al inicio de sesión de panel para evitar estados "congelados".
    if (estado === 403 && !esLogin && esRutaPanel) {
      limpiarTodo()
      if (!window.location.pathname.startsWith('/control-interno')) {
        window.location.href = '/control-interno'
      }
    }

    return Promise.reject(error)
  }
)

export default api
