// Badge de ESTADO DE PAGO (separado del estado logístico).
// Colores según el PRONT:
//   pendiente            → gris #9CAA9F
//   pendiente_verificacion → ámbar #D8A92E
//   pagado               → verde #1D9E75
//   fallido              → rojo #D85A30
const CONFIG = {
  pendiente: {
    label: 'Pago pendiente',
    color: '#9CAA9F',
    bg: 'rgba(156,170,159,0.12)',
    border: 'rgba(156,170,159,0.4)',
    icono: '🕘',
  },
  pendiente_verificacion: {
    label: 'En verificación',
    color: '#D8A92E',
    bg: 'rgba(216,169,46,0.12)',
    border: 'rgba(216,169,46,0.4)',
    icono: '⏳',
  },
  pagado: {
    label: 'Pagado',
    color: '#1D9E75',
    bg: 'rgba(29,158,117,0.12)',
    border: 'rgba(29,158,117,0.4)',
    icono: '💚',
  },
  fallido: {
    label: 'Pago fallido',
    color: '#D85A30',
    bg: 'rgba(216,90,48,0.12)',
    border: 'rgba(216,90,48,0.4)',
    icono: '❌',
  },
}

export default function EstadoPagoBadge({ estadoPago, compacto = false }) {
  const cfg = CONFIG[estadoPago] || CONFIG.pendiente
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${compacto ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {!compacto && <span className="text-[11px] leading-none">{cfg.icono}</span>}
      {cfg.label}
    </span>
  )
}
