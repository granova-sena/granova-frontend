import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  abierto,
  titulo = '¿Estás seguro?',
  mensaje,
  confirmarTexto = 'Confirmar',
  cancelarTexto = 'Cancelar',
  colorConfirmar = '#D85A30',
  onConfirmar,
  onCancelar,
  cargando = false,
}) {
  const refAceptar = useRef(null)
  const refCancelar = useRef(null)

  useEffect(() => {
    if (abierto) refAceptar.current?.focus()
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancelar?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 anim-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !cargando) onCancelar?.()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-titulo"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111c17] p-6 text-white shadow-xl anim-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p id="confirm-titulo" className="text-base font-semibold flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-lg"
            style={{ background: `${colorConfirmar}18`, color: colorConfirmar }}
          >
            ⚠
          </span>
          {titulo}
        </p>
        {mensaje && <p className="mt-3 text-sm text-white/70 leading-relaxed">{mensaje}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            ref={refCancelar}
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/10 transition disabled:opacity-50"
          >
            {cancelarTexto}
          </button>
          <button
            type="button"
            ref={refAceptar}
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl text-white font-medium transition disabled:opacity-50"
            style={{ background: colorConfirmar }}
          >
            {cargando ? 'Procesando...' : confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  )
}
