import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../config'
import { ImagenProducto, adaptarProducto, eliminarDuplicados } from './Catalogo'
import { useModalBehavior } from '../hooks/useModalBehavior'

const REGEX_ORDEN = /[^a-z0-9áéíóúñ\s]/gi

function normalizarNombre(s = '') {
  return s.toLowerCase().replace(REGEX_ORDEN, ' ').replace(/\s+/g, ' ').trim()
}

function renderEstrellas(promedio) {
  const total = 5
  const enteras = Math.floor(Number(promedio) || 0)
  const llena = (i) => (
    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#6FA98C"><path d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9l6.6-.8z" /></svg>
  )
  const vacia = (i) => (
    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9l6.6-.8z" /></svg>
  )
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (i < enteras ? llena(i) : vacia(i)))}
    </span>
  )
}

export default function CatalogoPublico() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [categoria, setCategoria] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('relevancia')
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        const res = await fetch(`${API_URL}/productos`)
        if (!res.ok) throw new Error('No se pudo cargar el catálogo')
        const j = await res.json()
        const lista = (j.data || j.productos || []).map(adaptarProducto)
        const listaLimpia = eliminarDuplicados(lista)
        if (!cancelado) {
          setProductos(listaLimpia)
          setCargando(false)
        }
      } catch {
        if (!cancelado) {
          setError('No pudimos cargar el catálogo en este momento.')
          setCargando(false)
        }
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const terminoBusqueda = normalizarNombre(busqueda)
  const filtrados = productos.filter((p) => {
    if (categoria !== 'todos' && p.categoria !== categoria) return false
    if (terminoBusqueda) {
      const n = normalizarNombre(`${p.nombre} ${p.origen} ${p.tipo}`)
      if (!n.includes(terminoBusqueda)) return false
    }
    return true
  })

  const ordenados = [...filtrados].sort((a, b) => {
    if (orden === 'precio-asc') return a.precioDesde - b.precioDesde
    if (orden === 'precio-desc') return b.precioDesde - a.precioDesde
    if (orden === 'nombre') return a.nombre.localeCompare(b.nombre)
    return 0
  })

  const conteoCafe = productos.filter((p) => p.categoria === 'cafe').length
  const conteoMaquina = productos.filter((p) => p.categoria === 'maquina').length

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a1a0a' }}>
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-[#9DC9B4] hover:underline">Inicio</Link>
          <span className="text-[#9DC9B4]/50">›</span>
          <span className="text-white/90 font-medium">Catálogo</span>
        </nav>
      </div>

      {/* Encabezado de la vitrina */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-xs font-bold text-[#6FA98C] uppercase tracking-[0.2em] mb-3 font-mono">Catálogo Granova</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-display mb-3">Nuestros productos</h1>
          <p className="text-sm sm:text-base text-white/50 max-w-2xl">
            Explora los cafés colombianos de origen y los equipos que ofrecemos. Para comprar o pedir
            cotizaciones solo necesitas una cuenta gratuita.
          </p>
          <div className="flex flex-wrap gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">{conteoCafe}</span>
              <span className="text-white/50">cafés de origen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{conteoMaquina}</span>
              <span className="text-white/50">equipos y máquinas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{productos.length}</span>
              <span className="text-white/50">productos en total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="sticky top-16 z-30 border-b border-white/10" style={{ background: '#0a1a0a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-white/[0.04] border border-white/10 focus-within:border-[#6FA98C]/50 transition flex-1 min-w-[180px] max-w-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/40 shrink-0">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar café, equipo..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none min-w-0"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-xl px-1 py-1 bg-white/[0.04] border border-white/10">
            {[
              { id: 'todos', label: 'Todo' },
              { id: 'cafe', label: 'Cafés' },
              { id: 'maquina', label: 'Equipos' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  categoria === c.id
                    ? 'bg-[#6FA98C] text-[#0a1a0a]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            aria-label="Ordenar productos"
            className="rounded-xl px-3 py-2 bg-white/[0.04] border border-white/10 text-sm text-white/70 focus:outline-none cursor-pointer"
          >
            <option value="relevancia" className="text-black">Relevancia</option>
            <option value="precio-asc" className="text-black">Precio: menor a mayor</option>
            <option value="precio-desc" className="text-black">Precio: mayor a menor</option>
            <option value="nombre" className="text-black">Nombre (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grilla de productos */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {cargando ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-3xl aspect-[3/4]" style={{ animationDelay: `${i * 120}ms` }}></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-white/60">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 px-6 py-3 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition">
              Reintentar
            </button>
          </div>
        ) : ordenados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-4">☕</p>
            <p className="text-white/60 text-sm sm:text-base">No encontramos productos con esos filtros.</p>
            <button
              type="button"
              onClick={() => { setBusqueda(''); setCategoria('todos') }}
              className="mt-6 px-6 py-3 rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/[0.04] text-sm transition"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {ordenados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSeleccionado(p)}
                className="group text-left h-full flex flex-col bg-[#0F1D13] rounded-3xl border border-white/5 hover:border-[#6FA98C]/40 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="aspect-square w-full shrink-0 bg-[#14291B] overflow-hidden relative">
                  <ImagenProducto
                    src={p.img}
                    alt={p.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[#9DC9B4] uppercase tracking-wider">
                    {p.categoria === 'maquina' ? 'Equipo' : 'Café'}
                  </span>
                  {p.promoPct > 0 && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#6FA98C] text-[#0a1a0a] uppercase">
                      -{p.promoPct}%
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-[10px] font-bold text-[#6FA98C] uppercase tracking-widest truncate mb-1">{p.origen}</p>
                  <h3 className="text-[13px] sm:text-sm font-semibold text-white leading-tight mb-2 line-clamp-2 min-h-[2.4rem]">{p.nombre}</h3>
                  <div className="mt-auto">
                    <p className="text-white font-bold text-lg sm:text-xl tracking-tight">
                      {p.formatos.length > 1 ? 'Desde ' : ''}${p.precioDesde.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </p>
                    <p className={`text-[11px] mt-1 ${p.disponible ? 'text-[#9DC9B4]' : 'text-[#D85A30]'}`}>
                      {p.disponible ? p.stockLabel : 'Agotado'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-14 rounded-3xl border border-[#6FA98C]/30 p-8 sm:p-10 text-center" style={{ background: 'rgba(111,169,140,0.06)' }}>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-display mb-2">¿Listo para pedir?</h3>
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mb-6">
            Crea tu cuenta gratuita para comprar, hacer seguimiento de tus pedidos y guardar tus cafés favoritos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-7 sm:px-8 py-3.5 bg-[#6FA98C] hover:bg-[#4F8A70] text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              Crear cuenta gratis
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-7 sm:px-8 py-3.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/[0.04] text-sm transition"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Detalle del producto: solo información, sin carrito */}
      {seleccionado && <DetallePublicoSeleccionado producto={seleccionado} onClose={() => setSeleccionado(null)} />}
    </div>
  )
}

function DetallePublicoSeleccionado({ producto, onClose }) {
  const navigate = useNavigate()
  const [resenas, setResenas] = useState(null)

  useModalBehavior(onClose)

  useEffect(() => {
    let cancelado = false
    setResenas(null)
    ;(async () => {
      try {
        const r = await fetch(`${API_URL}/api/resenas/producto/${producto.id}`)
        if (!r.ok) return
        const j = await r.json()
        if (cancelado) return
        setResenas({
          promedio: Number(j.data?.promedio || 0),
          total: Number(j.data?.total_resenas || 0),
          lista: (j.data?.resenas || []),
        })
      } catch { /* sin reseñas */ }
    })()
    return () => { cancelado = true }
  }, [producto.id])

  const verPrecio = (f) => f.precio > 0 ? f.precio : producto.precio

  const resenasVisibles = (resenas?.lista || []).filter((r) => r.comentario && r.comentario.trim()).slice(0, 3)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div
        className="bg-[#0F1D13] border border-white/[0.08] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square bg-[#14291B] overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none relative">
            <ImagenProducto src={producto.img} alt={producto.nombre} className="w-full h-full object-cover" />
            <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[#9DC9B4] uppercase tracking-wider">
              {producto.categoria === 'maquina' ? 'Equipo' : 'Café'}
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition"
            >
              ✕
            </button>

            <p className="text-[11px] font-bold text-[#6FA98C] uppercase tracking-widest mb-2">{producto.origen}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 pr-6">{producto.nombre}</h2>

            {resenas && (
              <div className="flex items-center gap-2 mb-3">
                {renderEstrellas(resenas.promedio)}
                <span className="text-xs text-white/50">{resenas.total > 0 ? `${resenas.promedio.toFixed(1)} · ${resenas.total} opiniones` : 'Sin opiniones'}</span>
              </div>
            )}

            <p className="text-sm text-white/60 leading-relaxed mb-4">{producto.desc || 'Información del producto disponible para clientes.'}</p>

            <div className="text-2xl font-bold text-white mb-5">
              {producto.formatos.length > 1 ? 'Desde ' : ''}$
              {producto.precioDesde.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              <span className="text-xs text-white/40 font-medium ml-1">/ {producto.unidadCorta}</span>
            </div>

            {producto.formatos.length > 0 ? (
              <div className="rounded-2xl border border-white/10 overflow-hidden mb-5">
                {producto.formatos.map((f, i) => (
                  <div
                    key={f.id_formato || i}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 ? '' : 'bg-white/[0.02]'}`}
                  >
                    <span className="text-white/70">{f.etiqueta || `${f.peso_kg} kg`}</span>
                    <span className="text-white font-semibold">${verPrecio(f).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/60 mb-5">
                Presentación disponible para clientes.
              </div>
            )}

            <div className={`text-xs rounded-xl px-3 py-2 mb-6 inline-block ${producto.disponible ? 'bg-[#6FA98C]/10 text-[#9DC9B4]' : 'bg-[#D85A30]/10 text-[#D85A30]'}`}>
              {producto.disponible ? `Disponible (${producto.stockLabel})` : 'Agotado por ahora'}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full bg-[#6FA98C] hover:bg-[#4F8A70] text-white text-sm font-semibold py-3.5 rounded-xl transition-colors"
              >
                Crear cuenta para comprar
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full border border-white/15 text-white/70 hover:text-white hover:bg-white/[0.04] text-sm py-3 rounded-xl transition-colors"
              >
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </div>

        {resenasVisibles.length > 0 && (
          <div className="border-t border-white/[0.07] px-6 sm:px-8 py-6">
            <h4 className="text-sm font-semibold text-white mb-4">Opiniones de clientes</h4>
            <div className="flex flex-col gap-4">
              {resenasVisibles.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6FA98C]/15 flex items-center justify-center text-[#9DC9B4] text-sm font-bold shrink-0">
                    {(r.cliente_nombre || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{r.cliente_nombre || 'Cliente Granova'}</span>
                      {renderEstrellas(Number(r.calificacion) || 0)}
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{r.comentario}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}