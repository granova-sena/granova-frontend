const LOGO_URL = '/logoGranova.png'

const TAMAÑOS = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-44 h-44',
}

// Presentación única del logo de Granova: solo la imagen (logoGranova.png)
// grande y limpia, sin fondo ni recorte, para que resalte en la página.
function LogoGranova({ tamano = 'md', mostrarTexto = true, textoClases = '' }) {
  return (
    <span className="inline-flex items-center gap-2.5 shrink-0">
      <img src={LOGO_URL} alt="Granova logo" className={`${TAMAÑOS[tamano] || TAMAÑOS.md} rounded-[30%] object-cover object-center shrink-0 drop-shadow-md`} />
      {mostrarTexto && (
        <span className={`text-[#E1F5EE] text-xl font-medium tracking-tight ${textoClases}`}>Granova</span>
      )}
    </span>
  )
}

export default LogoGranova