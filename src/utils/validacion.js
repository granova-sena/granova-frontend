// ── Utilidades de validación de formularios ───────────────
// Centraliza el bloqueo de teclas y la limpieza de valores para
// evitar que se escriban letras donde van números, o caracteres
// especiales donde va texto normal.

// 1) Inputs numéricos (solo dígitos, con coma/punto decimal opcional)
// -------------------------------------------------------------
// Bloquea en el onKeyDown las teclas que no son válidas en un número:
// letras, notación científica (e/E), signos (+/-), y otros símbolos.
// Permite dígitos, Backspace, Delete, flechas, Tab y la coma/punto decimal.
export function bloquearNoNumerico(e) {
  const teclasPermitidas = [
    'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
    'ArrowDown', 'Home', 'End', 'Enter',
  ]
  if (teclasPermitidas.includes(e.key)) return
  if (e.ctrlKey || e.metaKey) return
  // Permite una sola coma o punto (decimal). Se valida que no exista ya.
  if (e.key === '.' || e.key === ',') {
    if (e.target.value.includes('.') || e.target.value.includes(',')) {
      e.preventDefault()
    }
    return
  }
  // Solo dígitos dejan pasar.
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}

// Quita los ceros a la izquierda de un número: '000000' -> '0',
// '000123' -> '123'. Respeta el cero simple y los decimales ('0.75').
function quitarCerosIzquierda(s) {
  return String(s).replace(/^0+(?=\d)/, '')
}

// Limpia el valor pegado/escrito dejando solo dígitos y un único separador decimal.
// Convierte la coma en punto para guardar consistente. No deja que queden
// valores mutilados tipo '1.....9', '1.,.2' ni ceros a la izquierda.
export function normalizarNumerico(valor) {
  if (valor === '' || valor == null) return ''
  const limpio = String(valor).replace(/[^\d.,]/g, '')
  const primeraComa = limpio.indexOf(',')
  const primerPunto = limpio.indexOf('.')
  let sep
  if (primeraComa !== -1 && (primerPunto === -1 || primeraComa < primerPunto)) {
    sep = primeraComa
    const parteEntera = quitarCerosIzquierda(limpio.slice(0, sep).replace(/\./g, ''))
    return parteEntera + '.' + limpio.slice(sep + 1).replace(/[,.]/g, '')
  }
  if (primerPunto !== -1) {
    sep = primerPunto
    const parteEntera = quitarCerosIzquierda(limpio.slice(0, sep).replace(/[,.]/g, ''))
    return parteEntera + '.' + limpio.slice(sep + 1).replace(/[,.]/g, '')
  }
  return quitarCerosIzquierda(limpio)
}

// Handler onChange listo para inputs numéricos. Uso:
//   onChange={manejarNumerico((valor) => setForm({ ...form, campo: valor }))}
export const manejarNumerico = (setter) => (e) => {
  setter(normalizarNumerico(e.target.value))
}

// 1b) Inputs de ENTEROS puros (cantidades, unidades, cédula, teléfono, $
//     sin decimales). Bloquea las mismas teclas que bloquearNoNumerico pero
//     TAMBIÉN el punto y la coma: aquí no hay decimales de ninguna forma.
// -------------------------------------------------------------------------
export function bloquearEntero(e) {
  const teclasPermitidas = [
    'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
    'ArrowDown', 'Home', 'End', 'Enter',
  ]
  if (teclasPermitidas.includes(e.key)) return
  if (e.ctrlKey || e.metaKey) return
  // Solo dígitos dejan pasar (punto y coma también quedan fuera).
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}

// Deja SOLO dígitos y quita los ceros a la izquierda: '000000' -> '0',
// 'abc1,2.3e' -> '123'. Un solo separador decimal no es posible (se elimina).
export function normalizarEntero(valor) {
  if (valor === '' || valor == null) return ''
  const soloDigitos = String(valor).replace(/\D+/g, '')
  return quitarCerosIzquierda(soloDigitos)
}

// Handler onChange listo para inputs de enteros.
export const manejarEntero = (setter) => (e) => {
  setter(normalizarEntero(e.target.value))
}

// 2) Coordenadas (números que sí pueden ser negativos y con decimal)
// -----------------------------------------------------------------
// Útil para latitud/longitud. Permite un signo menos inicial y un decimal.
export function normalizarCoordenada(valor) {
  if (valor === '' || valor == null) return ''
  const limpio = String(valor).replace(/[^\d.,-]/g, '')
  const negocios = (limpio.match(/-/g) || []).length
  let sinSignos = limpio.replace(/-/g, '')
  if (negocios % 2 === 1 && !sinSignos.startsWith('-')) {
    sinSignos = '-' + sinSignos
  }
  const primeraComa = sinSignos.indexOf(',')
  const primerPunto = sinSignos.indexOf('.')
  const base = primeraComa !== -1 && (primerPunto === -1 || primeraComa < primerPunto) ? primeraComa : primerPunto
  const sinDecimal = base === -1 ? sinSignos.replace(/[,.]/g, '') : sinSignos.slice(0, base + 1).replace(/[,.]/g, '') + '.' + sinSignos.slice(base + 1).replace(/[,.]/g, '')
  return sinDecimal
}

// 3) Texto normal (sin caracteres especiales)
// --------------------------------------------
// Deja pasar letras (incluido ñ y tildes), números, espacios, guiones,
// puntos y comas. Bloquea símbolos raros como @ # $ % etc.
export function normalizarTexto(valor) {
  if (valor == null) return ''
  return String(valor).replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 ,.;()/-]/g, '')
}

export const manejarTexto = (setter) => (e) => {
  setter(normalizarTexto(e.target.value))
}

// 3) Evitar duplicados
// ---------------------
// Revisa si `valor` ya existe en `lista` en el campo `campo`.
// `idIgnorar` (opcional) sirve al editar para no chocar contra el propio registro.
export function existeDuplicado(lista, campo, valor, idIgnorar) {
  const clave = String(valor || '').trim().toLowerCase()
  if (!clave) return false
  return lista.some((item) => {
    if (idIgnorar != null && item.id === idIgnorar) return false
    return String(item[campo] ?? '').trim().toLowerCase() === clave
  })
}
