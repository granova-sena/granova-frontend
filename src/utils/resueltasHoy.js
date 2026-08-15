// Contador simple en memoria (sin tabla en BD). Se reinicia si el
// servidor se reinicia, y se resetea solo cuando cambia el día.
let fecha = null;
let contador = 0;

function resetSiCambioDia() {
  const hoy = new Date().toDateString();
  if (fecha !== hoy) {
    fecha = hoy;
    contador = 0;
  }
}

function registrarResuelta() {
  resetSiCambioDia();
  contador++;
}

function getContadorHoy() {
  resetSiCambioDia();
  return contador;
}

module.exports = { registrarResuelta, getContadorHoy };