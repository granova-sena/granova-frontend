// Frente D (Jhon) — Lealtad: niveles según puntos acumulados
// 🥉 Bronce (0-999) · 🥈 Plata (1.000-4.999) · 🥇 Oro (5.000+)
// Nombres familiares para el cliente (como bancos y tiendas de siempre).
export function calcularNivel(puntos) {
  const pts = Number(puntos) || 0;
  if (pts >= 5000) {
    return { nombre: 'Oro', icono: '🥇', rangoMin: 5000, siguiente: null };
  }
  if (pts >= 1000) {
    return { nombre: 'Plata', icono: '🥈', rangoMin: 1000, siguiente: 5000 };
  }
  return { nombre: 'Bronce', icono: '🥉', rangoMin: 0, siguiente: 1000 };
}
