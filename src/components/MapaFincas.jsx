import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Sin cliente de Supabase en el frontend: hablamos con nuestro propio backend Express
// Mismo patrón que usa Catalogo.jsx para consumir /productos
const API_URL = "http://localhost:3000/fincas";

const CENTRO_IBAGUE = [4.4389, -75.2322];

/**
 * Ícono personalizado con L.divIcon(): HTML/CSS crudo en vez de una imagen.
 * IMPORTANTE: esto es un string plano, no JSX — Leaflet lo inserta directo
 * en el DOM por fuera del control de React (Fundamento 6, llevado al extremo).
 */
const iconoFinca = L.divIcon({
  className: "", // vacío para que Leaflet no le agregue sus estilos por defecto
  html: `
    <div style="
      width: 30px;
      height: 30px;
      background: #6FA98C;
      border: 2px solid rgba(255,255,255,0.85);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
    ">
      <span style="
        display: block;
        transform: rotate(45deg);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">☕</span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30], // la "punta" del pin (abajo-centro) es el punto exacto de la coordenada
  popupAnchor: [0, -32], // el popup se abre arriba del ícono, no encima
});

/**
 * Ícono para "tu ubicación": deliberadamente distinto en FORMA (círculo, no pin)
 * para que nunca se confunda con una finca real, aunque comparta color.
 * El anillo animado es el patrón visual estándar de "punto GPS activo".
 */
const iconoUsuario = L.divIcon({
  className: "",
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: rgba(111,169,140,0.35);
        animation: pulso-ubicacion 1.8s ease-out infinite;
      "></div>
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #6FA98C;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    </div>
    <style>
      @keyframes pulso-ubicacion {
        0% { transform: scale(0.6); opacity: 0.9; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10], // círculo: el ancla es el centro, no una punta como en el pin
  popupAnchor: [0, -14],
});

function calcularDistanciaKm(lat1, lng1, lat2, lng2) {
  const radioTierraKm = 6371;
  const radianes = (grados) => (grados * Math.PI) / 180;

  const dLat = radianes(lat2 - lat1);
  const dLng = radianes(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radianes(lat1)) * Math.cos(radianes(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierraKm * c;
}

function MapaFincas() {
  // Fundamento 9: los 3 estados que siempre acompañan una carga de datos asíncrona
  const [fincas, setFincas] = useState([]);
  const [cargandoFincas, setCargandoFincas] = useState(true);
  const [errorFincas, setErrorFincas] = useState(null);

  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState("");

  // Fundamento 9: array vacío [] = "ejecuta esto una sola vez, al montar el componente"
  // Fundamento 10: patrón "cancelado" (igual que ClienteInicio.jsx) para no actualizar
  // estado si el usuario ya navegó a otra página antes de que responda el fetch
  useEffect(() => {
    let cancelado = false;

    async function cargarFincas() {
      try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
          throw new Error("Respuesta no exitosa del servidor");
        }

        const data = await respuesta.json();
        if (!cancelado) setFincas(data);
      } catch (error) {
        if (!cancelado) setErrorFincas("No se pudieron cargar las fincas");
      } finally {
        if (!cancelado) setCargandoFincas(false);
      }
    }

    cargarFincas();
    return () => { cancelado = true };
  }, []);

  const solicitarUbicacion = () => {
    setBuscandoUbicacion(true);
    setErrorUbicacion("");

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacionUsuario({
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude,
        });
        setBuscandoUbicacion(false);
      },
      () => {
        setErrorUbicacion("No pudimos obtener tu ubicación. Mostrando todas las fincas.");
        setBuscandoUbicacion(false);
      },
      { timeout: 8000 }
    );
  };

  const fincasOrdenadas = ubicacionUsuario
    ? [...fincas]
        .map((finca) => ({
          ...finca,
          distanciaKm: calcularDistanciaKm(
            ubicacionUsuario.lat,
            ubicacionUsuario.lng,
            finca.lat,
            finca.lng
          ),
        }))
        .sort((a, b) => a.distanciaKm - b.distanciaKm)
    : fincas;

  // Mientras cargan las fincas desde Supabase, no tiene sentido mostrar un mapa vacío
  if (cargandoFincas) {
    return <p>Cargando fincas...</p>;
  }

  if (errorFincas) {
    return <p style={{ color: "#993C1D" }}>{errorFincas}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-[#17140F]/8">
        <button
          onClick={solicitarUbicacion}
          disabled={buscandoUbicacion}
          className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#15805F] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buscandoUbicacion ? "Buscando tu ubicación..." : "Ver fincas más cercanas a mí"}
        </button>

        {errorUbicacion && (
          <p className="text-xs text-[#993C1D] ml-3">{errorUbicacion}</p>
        )}
      </div>

      {/*
        Fundamento de layout: Leaflet necesita una altura explícita en píxeles,
        no "auto" ni "100%" sin un padre con altura definida. h-[360px] de Tailwind
        se traduce a height: 360px, así que sigue siendo válido para Leaflet.
      */}
      <MapContainer
        center={CENTRO_IBAGUE}
        zoom={11}
        scrollWheelZoom={false}
        className="h-[320px] sm:h-[400px] w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {fincasOrdenadas.map((finca) => (
          <Marker key={finca.id} position={[finca.lat, finca.lng]} icon={iconoFinca}>
            <Popup>
              <strong>{finca.nombre}</strong>
              <br />
              {finca.altitud}
              {finca.distanciaKm !== undefined && (
                <>
                  <br />
                  {finca.distanciaKm.toFixed(1)} km de distancia
                </>
              )}
            </Popup>
          </Marker>
        ))}

        {/* Marcador de "tu ubicación": solo existe si ya se obtuvo el permiso del navegador */}
        {ubicacionUsuario && (
          <Marker position={[ubicacionUsuario.lat, ubicacionUsuario.lng]} icon={iconoUsuario}>
            <Popup>Estás aquí</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapaFincas;