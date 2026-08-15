import { useState } from 'react'

// Ícono de reemplazo cuando una imagen de producto no carga.
function IconoTaza(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 9.5h1.5a2.5 2.5 0 010 5H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 4c0 .8-1 .8-1 1.6S8 6.4 8 7.2M12 4c0 .8-1 .8-1 1.6s1 .8 1 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// Muestra la imagen del producto; si no carga (URL rota, sin conexión,
// etc.) cae en un ícono neutro en vez de dejar un espacio en blanco.
function ImagenProducto({ src, alt, className = '' }) {
  const [fallo, setFallo] = useState(false)

  if (!src || fallo) {
    return (
      <div className={`flex items-center justify-center bg-white/10 text-white/25 ${className}`}>
        <IconoTaza />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFallo(true)}
      loading="lazy"
    />
  )
}

export default ImagenProducto
