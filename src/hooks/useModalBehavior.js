import { useEffect } from 'react'

// Cierra con la tecla Escape y bloquea el scroll del fondo
// mientras un modal, drawer o panel esté abierto.
export function useModalBehavior(onClose) {
  useEffect(() => {
    function alPresionarTecla(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', alPresionarTecla)

    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = overflowOriginal
    }
  }, [onClose])
}
