import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../utils/leafletIconFix";

const CENTRO_IBAGUE = [4.4389, -75.2322];
const RETRASO_DEBOUNCE_MS = 800;

function EscuchaClicks({ onSeleccionar }) {
  useMapEvents({
    click(evento) {
      const { lat, lng } = evento.latlng;
      onSeleccionar({ lat, lng });
    },
  });

  return null;
}

/**
 * Llama a Nominatim para convertir coordenadas en una dirección legible.
 * Es una función normal, fuera de React, porque no maneja estado propio:
 * solo recibe datos, hace la petición, devuelve datos.
 */
async function obtenerDireccion(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

  const respuesta = await fetch(url, {
    headers: {
      "User-Agent": "Granova-App (contacto@granova.com)",
    },
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo obtener la dirección");
  }

  const datos = await respuesta.json();
  return datos.display_name;
}

function SelectorDireccion() {
  const [posicion, setPosicion] = useState(null);
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(false);

  const temporizadorRef = useRef(null);

  useEffect(() => {
    if (!posicion) return;

    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
    }

    setCargando(true);

    temporizadorRef.current = setTimeout(async () => {
      try {
        const direccionTexto = await obtenerDireccion(posicion.lat, posicion.lng);
        setDireccion(direccionTexto);
      } catch (error) {
        console.error('Error en MapaBase:', error)
        setDireccion("No se pudo obtener la dirección, intenta de nuevo");
      } finally {
        setCargando(false);
      }
    }, RETRASO_DEBOUNCE_MS);

    return () => clearTimeout(temporizadorRef.current);
  }, [posicion]);

  return (
    <div>
      <MapContainer
        center={CENTRO_IBAGUE}
        zoom={13}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <EscuchaClicks onSeleccionar={setPosicion} />

        {posicion && (
          <Marker
            position={posicion}
            draggable={true}
            eventHandlers={{
              dragend: (evento) => {
                const nuevaPos = evento.target.getLatLng();
                setPosicion({ lat: nuevaPos.lat, lng: nuevaPos.lng });
              },
            }}
          />
        )}
      </MapContainer>

      <div style={{ marginTop: "12px", fontSize: "14px" }}>
        {!posicion && <p>Haz click en el mapa para seleccionar tu dirección de entrega</p>}
        {posicion && cargando && <p>Buscando dirección...</p>}
        {posicion && !cargando && direccion && (
          <p>
            <strong>Dirección de entrega:</strong> {direccion}
          </p>
        )}
      </div>
    </div>
  );
}

export default SelectorDireccion;