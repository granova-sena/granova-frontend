// Fundamento: Leaflet resuelve las URLs de sus íconos por defecto asumiendo
// un bundler tipo Webpack clásico. Con Vite, esas rutas no se resuelven solas
// y el resultado es el típico "cuadro roto" en vez del pin del marcador.
// Este archivo se importa UNA sola vez (aquí) y arregla el ícono para toda
// la app. Los componentes de mapa (MapaFincas, MapaBase) solo necesitan
// `import "../utils/leafletIconFix"` antes de usar <Marker />.
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});
