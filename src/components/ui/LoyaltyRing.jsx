import { useEffect, useRef, useState } from "react";

const COLORES_NIVEL = {
  Bronce: { stroke: "#D97706", bg: "rgba(217,119,6,0.10)", text: "#FBBF24" },
  Plata:  { stroke: "#94A3B8", bg: "rgba(148,163,184,0.10)", text: "#CBD5E1" },
  Oro:    { stroke: "#F59E0B", bg: "rgba(245,158,11,0.10)",  text: "#FCD34D" },
};

export default function LoyaltyRing({ puntos = 0, nivel, progresoPct = 0, puntosFaltantes = 0, size = 160 }) {
  const [animado, setAnimado] = useState(0);
  const ref = useRef(null);
  const colores = COLORES_NIVEL[nivel?.nombre] || COLORES_NIVEL.Bronce;

  const radio = (size - 16) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (animado / 100) * circunferencia;
  const grosor = size > 140 ? 10 : 8;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimado(progresoPct), 150);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [progresoPct]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Fondo del anillo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={grosor}
          />
          {/* Progreso animado */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            fill="none"
            stroke={colores.stroke}
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              filter: `drop-shadow(0 0 6px ${colores.stroke}40)`,
            }}
          />
        </svg>

        {/* Contenido central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl mb-1">{nivel?.icono}</span>
          <span className="text-lg font-bold text-white">{puntos.toLocaleString("es-CO")}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wide">puntos</span>
        </div>
      </div>

      {/* Info debajo del anillo */}
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold" style={{ color: colores.text }}>
          Nivel {nivel?.nombre}
        </p>
        {puntosFaltantes > 0 ? (
          <p className="text-xs text-white/40 mt-1">
            Faltan <span className="text-white/60 font-medium">{puntosFaltantes.toLocaleString("es-CO")}</span> pts para el siguiente nivel
          </p>
        ) : (
          <p className="text-xs text-white/40 mt-1">Nivel máximo alcanzado 🎉</p>
        )}
      </div>
    </div>
  );
}
