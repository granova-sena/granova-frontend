export function formatMoney(valor) {
  const n = Number(valor) || 0
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}K`
  return `$${n.toLocaleString('es-CO')}`
}

export function formatFecha(fechaISO) {
  if (!fechaISO) return '—'
  const fecha = new Date(fechaISO)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)

  const esMismoDia = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (esMismoDia(fecha, hoy)) return 'Hoy'
  if (esMismoDia(fecha, ayer)) return 'Ayer'
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}