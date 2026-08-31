import { useEffect, useRef } from 'react'

export default function ErrorModal({ mensaje, onClose }) {
  const refAceptar = useRef(null)

  useEffect(() => {
    if (mensaje) refAceptar.current?.focus()
  }, [mensaje])

  useEffect(() => {
    if (!mensaje) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mensaje, onClose])

  if (!mensaje) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 anim-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      role="alertdialog"
      aria-modal="true"
      aria-describedby="error-modal-mensaje"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl anim-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold text-[#B3261E] flex items-center gap-2">
          <span aria-hidden="true" className="inline-flex items-center justify-center w-9 h-9 rounded-full text-lg" style={{ background: '#B3261E18', color: '#B3261E' }}>!</span>
          Ocurrió un error
        </p>
        <p id="error-modal-mensaje" className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{mensaje}</p>
        <div className="mt-6 flex">
          <button
            type="button"
            ref={refAceptar}
            onClick={onClose}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl text-white font-medium transition"
            style={{ background: '#B3261E' }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}