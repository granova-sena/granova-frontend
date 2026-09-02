import { useEffect, useState } from 'react'
const LOGO_URL = '/logoGranova.png'

// Splash de entrada al estilo Nequi: overlay a pantalla completa con el logo,
// se desvanece y se desmonta solo para no bloquear la app.
function Splash({ duracion = 1500 }) {
  const [oculto, setOculto] = useState(false)
  const [desmontado, setDesmontado] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setOculto(true), duracion)
    const t2 = setTimeout(() => setDesmontado(true), duracion + 550)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [duracion])

  if (desmontado) return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${oculto ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(160deg, #0a1a0a 0%, #123324 55%, #1D9E75 140%)' }}
    >
      <div className={`transition-all duration-500 ${oculto ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
        <span className="w-24 h-24 flex items-center justify-center mx-auto drop-shadow-xl">
          <img src={LOGO_URL} alt="Granova" className="w-full h-full rounded-[30%] object-cover object-center" />
        </span>
        <p className="text-center text-white text-lg font-medium tracking-tight mt-5">Granova</p>
        <p className="text-center text-white/40 text-xs mt-1">Café colombiano de origen</p>
      </div>
    </div>
  )
}

export default Splash