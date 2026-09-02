// ── Parámetros de negocio públicos (sin sesión) ──────────────
// Se leen una vez del backend y se cachean en localStorage para que el
// catálogo, el carrito, el simulador y la página de empresas muestren los
// mismos valores que usa el servidor al cobrar (p.ej. el % de descuento
// de empresa). El admin los edita desde "Parámetros" del panel.
import { API_URL } from "../config"

const CACHE_KEY = 'granova_parametros_publicos'
let cache = null
let promesa = null

export function leerParametro(clave, porDefecto = 0) {
  if (cache && cache[clave] !== undefined) return Number(cache[clave])
  try {
    const local = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (local && local[clave] !== undefined) return Number(local[clave])
  } catch { /* ignorar */ }
  return porDefecto
}

export async function precargarParametros() {
  if (!promesa) {
    promesa = fetch(`${API_URL}/api/public/parametros`)
      .then(res => res.json())
      .then(json => {
        cache = {}
        ;(json.parametros || []).forEach(p => { cache[p.clave] = p.valor })
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
        return cache
      })
      .catch(() => { cache = cache || {}; return cache })
  }
  return promesa
}