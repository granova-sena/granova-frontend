import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Sin cliente de Supabase en el frontend: hablamos con nuestro propio backend Express
// Mismo patrón que usa Catalogo.jsx para consumir /productos
const API_URL = "http://localhost:3000/fincas";

const CENTRO_IBAGUE = [4.4389, -75.2322];

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
          <Marker key={finca.id} position={[finca.lat, finca.lng]}>
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
      </MapContainer>
    </div>
  );
}

export default MapaFincas;