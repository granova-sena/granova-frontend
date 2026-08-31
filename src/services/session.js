// ── SESSION HELPERS ─────────────────────────────────────────
// Claves de localStorage por rol para evitar contaminación
// entre sesiones de cliente y empleado/admin en el mismo navegador.
import { jwtDecode } from 'jwt-decode'

const CLAVE_CLIENTE  = 'token_cliente'
const CLAVE_EMPLEADO = 'token_empleado'

// Claves que se usaban antes de separar por rol (se limpian al arrancar).
const LEGACY = ['token', 'authToken', 'cliente_token']

// Rutas del panel de cliente + autenticación/flujo de cliente.
const RUTAS_CLIENTE = /^\/(cliente|login|register|registro-empresa|olvide-password|verificar-cuenta|reset-password|auth|catalogo)(\/|$)/
// La landing ("/") la usan clientes y administradores; ante la duda se
// prefiere la sesión de cliente, que es el flujo principal de esa página.
const RUTAS_LANDING = /^\/?$/

/** ¿La ruta actual pertenece al flujo de cliente? (landing incluida). */
export function esRutaCliente(path = window.location.pathname) {
  return RUTAS_LANDING.test(path) || RUTAS_CLIENTE.test(path)
}

/** Elimina claves de token que se usaban antes de separar por rol. */
export function limpiarTokensLegacy() {
  LEGACY.forEach((k) => localStorage.removeItem(k))
}

/** Devuelve el token JWT correcto según la ruta actual. */
export function getActiveToken() {
  return esRutaCliente()
    ? localStorage.getItem(CLAVE_CLIENTE)
    : localStorage.getItem(CLAVE_EMPLEADO)
}

/** Guarda el token del cliente (login). */
export function setClienteToken(token) {
  localStorage.setItem(CLAVE_CLIENTE, token)
}

/** Guarda el token del empleado/admin (login-admin). */
export function setEmpleadoToken(token) {
  localStorage.setItem(CLAVE_EMPLEADO, token)
}

/** Limpia la sesión del cliente (logout desde panel cliente). */
export function clearClienteToken() {
  localStorage.removeItem(CLAVE_CLIENTE)
}

/** Limpia la sesión del empleado/admin (logout desde dashboard). */
export function clearEmpleadoToken() {
  localStorage.removeItem(CLAVE_EMPLEADO)
}

/**
 * Id del cliente logueado de forma segura: se lee del propio token_cliente
 * y solo si el token NO pertenece a empleado/admin (esos traen `rol`).
 * Devuelve null cuando no hay sesión de cliente válida, evitando que una
 * sesión de empleado/admin contamine el perfil de cliente.
 */
export function idDeTokenCliente() {
  const token = localStorage.getItem(CLAVE_CLIENTE)
  if (!token) return null
  try {
    const datos = jwtDecode(token)
    if (datos?.rol) return null
    return datos?.id ?? null
  } catch {
    return null
  }
}