import toast from 'react-hot-toast'

// Errores de carga ya mostrados en esta "sesión" del SPA.
// Al navegar entre vistas no se repite el mismo mensaje; solo se
// vuelve a permitir mostrar al iniciar sesión (se resetea en session.js).
const erroresVistos = new Set()

export function toastErrorUnico(mensaje) {
  if (!mensaje) return
  if (erroresVistos.has(mensaje)) return
  erroresVistos.add(mensaje)
  toast.error(mensaje)
}

export function resetErroresVistos() {
  erroresVistos.clear()
}