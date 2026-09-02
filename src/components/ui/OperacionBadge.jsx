// Badge de OPERACIÓN del pedido (domicilio ↔ reparto) + sector de envío.
//   domicilio → verde #1D9E75
//   reparto   → ámbar #D8A92E
export default function OperacionBadge({ operacion, sector, compacto = false }) {
  if (!operacion) return null
  const esReparto = operacion === 'reparto'
  const color = esReparto ? '#D8A92E' : '#1D9E75'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${compacto ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}
      style={{
        color,
        backgroundColor: `${color}1f`,
        border: `1px solid ${color}66`,
      }}
      title={sector ? `Sector: ${sector}` : undefined}
    >
      {esReparto ? '🚚 Reparto' : '🛵 Domicilio'}
      {sector && (
        <span className="opacity-80" style={{ borderLeft: `1px solid ${color}55`, paddingLeft: '6px', marginLeft: '2px' }}>
          {sector}
        </span>
      )}
    </span>
  )
}

export const ETIQUETA_OPERACION = {
  domicilio: 'Domicilio',
  reparto: 'Reparto',
}
