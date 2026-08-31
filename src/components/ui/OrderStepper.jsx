import { motion } from "framer-motion";

const PASOS = [
  { id: "pendiente",   label: "Confirmado",       icono: "✅", desc: "Tu pedido quedó confirmado" },
  { id: "en_proceso",  label: "Empacando",        icono: "📦", desc: "Tostamos y empacamos tu café" },
  { id: "enviado",     label: "En camino",        icono: "🚚", desc: "Va hacia tu ciudad" },
  { id: "entregado",   label: "Entregado",        icono: "🏠", desc: "¡Café en tu puerta!" },
];

// Mapea el estado del backend al índice del stepper
function estadoAIndice(estado) {
  const mapa = { pendiente: 0, confirmado: 0, en_proceso: 1, empacando: 1, enviado: 2, en_camino: 2, entregado: 3 };
  return mapa[estado] ?? -1;
}

export default function OrderStepper({ estado, compacto = false, fechaPedido = null, pagado = false }) {
  const indexActual = estadoAIndice(estado);
  const cancelado = estado === "cancelado" || estado === "rechazado";

  if (cancelado) {
    return (
      <div className={`flex items-center gap-2 ${compacto ? "" : "justify-center"}`}>
        <span
          className="inline-flex items-center justify-center rounded-full shrink-0"
          style={{ background: "rgba(216,93,48,0.15)", color: "#D85A30" }}
          aria-hidden="true"
        >
          <span className={compacto ? "text-sm w-5 h-5 flex items-center justify-center" : "text-lg w-10 h-10"}>✕</span>
        </span>
        <div>
          <p className={`font-medium ${compacto ? "text-xs" : "text-sm"}`} style={{ color: "#D85A30" }}>
            Cancelado
          </p>
          {!compacto && (
            <p className="text-[11px] text-white/50">Este pedido fue cancelado o rechazado.</p>
          )}
        </div>
      </div>
    );
  }

  if (compacto) {
    return (
      <div className="flex items-center gap-1">
        {PASOS.map((paso, i) => (
          <div key={paso.id} className="flex items-center gap-1">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 15 }}
              className={`w-2.5 h-2.5 rounded-full ${
                i <= indexActual ? "bg-[#6FA98C] shadow-sm shadow-[#6FA98C]/40" : "bg-white/15"
              }`}
            />
            {i < PASOS.length - 1 && (
              <div className={`w-4 h-px ${i < indexActual ? "bg-[#6FA98C]" : "bg-white/15"}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between overflow-x-auto">
      {PASOS.map((paso, i) => (
        <div key={paso.id} className="flex items-start flex-1 min-w-[80px]">
          <div className="flex flex-col items-center flex-1">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 400, damping: 15 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${
                i < indexActual
                  ? "bg-[#6FA98C] border-[#6FA98C] text-white"
                  : i === indexActual
                  ? "bg-[#6FA98C] border-[#6FA98C] text-white ring-4 ring-[#6FA98C]/30"
                  : "bg-transparent border-white/20 text-white/40"
              } ${i === indexActual ? "animate-pulse" : ""}`}
            >
              {paso.icono}
            </motion.div>
            <p className={`text-xs mt-2 text-center font-medium ${
              i <= indexActual ? "text-white" : "text-white/40"
            }`}>
              {paso.id === "pendiente" && pagado ? "Pagado" : paso.label}
            </p>
            {i === 0 && fechaPedido && (
              <p className="text-[10px] text-white/30">{fechaPedido}</p>
            )}
            {i > indexActual && (
              <p className="text-[10px] text-white/30">
                {paso.id === "pendiente" && pagado
                  ? "Tu pago fue recibido. Tu pedido será enviado en menos de 2 días."
                  : paso.desc}
              </p>
            )}
          </div>
          {i < PASOS.length - 1 && (
            <div className={`h-px w-full mt-5 mx-1 ${
              i < indexActual ? "bg-[#6FA98C]" : "bg-white/15"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
