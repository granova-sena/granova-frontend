// Insignia circular tipo sello de certificación de café.
// Elemento de firma del sistema visual de Granova: se usa para
// origen, disponibilidad, y estados a lo largo de todo el sitio.
function Sello({ children, tono = 'verde', size = 'sm' }) {
  const tonos = {
    verde: 'border-[#1F6F4F] text-[#1F6F4F]',
    tinta: 'border-[#2B231A]/50 text-[#2B231A]/70',
    crema: 'border-[#F5F1E6]/50 text-[#F5F1E6]',
  }
  const sizes = { sm: 'text-[9px] px-2 py-1', md: 'text-[10px] px-2.5 py-1.5' }
  return (
    <span className={`stamp inline-flex items-center gap-1 rounded-full border ${sizes[size]} ${tonos[tono]} uppercase font-medium leading-none whitespace-nowrap`}>
      {children}
    </span>
  )
}

export default Sello
