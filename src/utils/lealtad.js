// Frente D (Jhon) — Lealtad: niveles según puntos acumulados
// Tripulante ⚓ (0-999) · Oficial 🏴☠️ (1.000-4.999) · Capitán 👑 (5.000+)
export function calcularNivel(puntos) {
  const pts = Number(puntos) || 0;
  if (pts >= 5000) {
    return { nombre: 'Capitán', icono: '👑', rangoMin: 5000, siguiente: null };
  }
  if (pts >= 1000) {
    return { nombre: 'Oficial', icono: '🏴‍☠️', rangoMin: 1000, siguiente: 5000 };
  }
  return { nombre: 'Tripulante', icono: '⚓', rangoMin: 0, siguiente: 1000 };
}
