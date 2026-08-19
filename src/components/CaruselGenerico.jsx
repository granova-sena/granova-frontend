import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

const IconoFlechaIzq = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconoFlechaDer = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function CaruselGenerico({ titulo, subtitulo, emoji, children, className = '' }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
  })

  const [puedeIzq, setPuedeIzq] = useState(false)
  const [puedeDer, setPuedeDer] = useState(true)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPuedeIzq(emblaApi.canScrollPrev())
    setPuedeDer(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className={`${className}`}>
      {/* Título */}
      <div className="mb-3">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">
          {emoji} {titulo}
        </span>
        {subtitulo && <p className="text-white/50 text-xs mt-1">{subtitulo}</p>}
      </div>

      {/* Carrusel con flechas dentro */}
      <div className="relative group">
        {/* Flecha izquierda */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!puedeIzq}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0 disabled:cursor-not-allowed hover:bg-black/70"
          aria-label="Anterior"
        >
          <IconoFlechaIzq />
        </button>

        {/* Flecha derecha */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={!puedeDer}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-0 disabled:cursor-not-allowed hover:bg-black/70"
          aria-label="Siguiente"
        >
          <IconoFlechaDer />
        </button>

        {/* Slides */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
