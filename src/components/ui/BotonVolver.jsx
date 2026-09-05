import { useNavigate } from 'react-router-dom'

export default function BotonVolver({ onClick, ruta, texto = 'Volver', className = '' }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (ruta) {
      navigate(ruta)
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 text-[#9DC9B4] text-sm hover:underline ${className}`}
    >
      ← {texto}
    </button>
  )
}
