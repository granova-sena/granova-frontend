import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL as BASE_API_URL } from "../config";
import { useCarrito } from '../context/CarritoContext'

const API_URL = `${BASE_API_URL}/productos`

const DESCUENTO_EMPRESA = 10

const BENEFICIOS = [
  { icono: '🏢', titulo: '10% en todos tus pedidos', texto: 'Por comprar como empresa, el descuento se aplica automáticamente, sin cupones ni letra pequeña.' },
  { icono: '📦', titulo: 'Formatos a tu medida', texto: 'Bultos de 50kg, paquetes de 5kg y 1kg. Compra el tamaño que tu negocio necesite.' },
  { icono: '📈', titulo: 'Precios por volumen', texto: 'Entre más café lleves, mayor descuento por kilogramo. El mayor beneficio gana, nunca suma.' },
  { icono: '🚚', titulo: 'Envío a todo el país', texto: 'Coordinamos la entrega de tu café directo desde la finca hasta tu negocio.' },
]

function Empresas() {
  const navigate = useNavigate()
  const { cliente } = useCarrito()
  const esJuridica = cliente?.tipo_persona === 'juridica'

  const [productos, setProductos] = useState([])
  const [descuentosVolumen, setDescuentosVolumen] = useState([])
  const [cargando, setCargando] = useState(true)
  const [productoId, setProductoId] = useState(null)
  const [formatoId, setFormatoId] = useState(null)
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        const res = await fetch(API_URL)
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje || 'Error del servidor')
        if (cancelado) return
        // Solo café con formatos (las máquinas no aplican a la calculadora de bultos)
        const cafes = (json.data || []).filter(p => p.categoria_producto !== 'maquina' && (p.formatos || []).length > 0)
        setProductos(cafes)
        setDescuentosVolumen(json.descuentosVolumen || [])
        if (cafes.length > 0) {
          setProductoId(cafes[0].id_producto)
          setFormatoId(cafes[0].formatos[0].id_formato)
        }
      } catch (error) {
        console.error('Error cargando productos para empresas:', error.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  const producto = productos.find(p => p.id_producto === productoId)
  const formatos = producto?.formatos || []
  const formato = formatos.find(f => f.id_formato === formatoId)

  const kgTotales = formato ? Number(formato.peso_kg) * cantidad : 0
  const bruto = formato ? Number(formato.precio) * cantidad : 0
  const tier = descuentosVolumen.find(t => kgTotales >= Number(t.kg_min) && (t.kg_max === null || kgTotales <= Number(t.kg_max)))
  const volumenPct = tier ? Number(tier.descuento_pct) : 0
  const pctFinal = Math.max(volumenPct, DESCUENTO_EMPRESA)
  const total = Math.round(bruto * (1 - pctFinal / 100))
  const ahorro = bruto - total

  const estilosInput = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a1a0a' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* HERO */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Granova Empresas</span>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-3 tracking-tight">Tu café al por mayor, sin papeleo</h1>
          <p className="text-white/50 text-sm sm:text-base mt-4 leading-relaxed">
            Si compras para tu negocio, Granova te premia desde el primer pedido: 10% siempre,
            precios por bulto y descuentos que crecen con tu volumen.
          </p>
          {esJuridica ? (
            <p className="inline-block mt-5 text-sm text-[#9DC9B4] bg-[#6FA98C]/10 border border-[#6FA98C]/30 rounded-full px-4 py-2">
              🏢 Ya estás registrado como empresa: tienes 10% en todos tus pedidos
            </p>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/cliente/cuenta')}
              className="mt-6 h-12 px-8 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition"
            >
              Registra tu NIT y obtén tu 10% →
            </button>
          )}
        </div>

        {/* BENEFICIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {BENEFICIOS.map(b => (
            <div key={b.titulo} className="rounded-2xl p-5" style={{ background: '#0F1D13', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-2xl">{b.icono}</span>
              <p className="text-sm font-semibold text-white mt-3">{b.titulo}</p>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{b.texto}</p>
            </div>
          ))}
        </div>

        {/* CALCULADORA DE AHORRO */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0F1D13', border: '1px solid rgba(111,169,140,0.35)' }}>
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Calcula tu ahorro</h2>
            <p className="text-xs text-white/40 mt-0.5">Estimado — el descuento final se aplica al confirmar tu pedido</p>
          </div>

          {cargando ? (
            <div className="p-8 text-center text-white/40 text-sm">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">
              Aún no hay productos con formatos por bulto. Vuelve pronto.
            </div>
          ) : (
            <div className="p-6 flex flex-col lg:flex-row gap-8">
              {/* Inputs */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label htmlFor="empresa-producto" className="block text-xs text-white/60 mb-1.5">Café</label>
                  <select
                    id="empresa-producto"
                    value={productoId ?? ''}
                    onChange={e => {
                      const id = Number(e.target.value)
                      setProductoId(id)
                      const prod = productos.find(p => p.id_producto === id)
                      if (prod && prod.formatos.length > 0) setFormatoId(prod.formatos[0].id_formato)
                    }}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={estilosInput}
                  >
                    {productos.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="empresa-formato" className="block text-xs text-white/60 mb-1.5">Formato</label>
                  <select
                    id="empresa-formato"
                    value={formatoId ?? ''}
                    onChange={e => setFormatoId(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={estilosInput}
                  >
                    {formatos.map(f => (
                      <option key={f.id_formato} value={f.id_formato}>
                        {f.etiqueta} — ${Number(f.precio).toLocaleString('es-CO')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="empresa-cantidad" className="block text-xs text-white/60 mb-1.5">Cantidad</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))} className="w-11 h-11 rounded-xl text-xl text-white/70 flex items-center justify-center hover:bg-white/10 transition" style={estilosInput}>−</button>
                    <input
                      id="empresa-cantidad"
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={e => {
                        const val = Number(e.target.value)
                        setCantidad(Number.isFinite(val) && val > 0 ? val : 1)
                      }}
                      className="w-20 px-3 py-2.5 rounded-xl text-sm text-white text-center outline-none"
                      style={estilosInput}
                    />
                    <button type="button" onClick={() => setCantidad(c => c + 1)} className="w-11 h-11 rounded-xl text-xl text-white/70 flex items-center justify-center hover:bg-white/10 transition" style={estilosInput}>+</button>
                  </div>
                  {formato && (
                    <p className="text-xs text-white/40 mt-2">{kgTotales.toLocaleString('es-CO')} kg de café en total</p>
                  )}
                </div>
              </div>

              {/* Resultado */}
              <div className="flex-1 rounded-2xl p-6 flex flex-col justify-center gap-3" style={{ background: '#0B1810', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">${bruto.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Tu descuento {pctFinal}% {volumenPct > DESCUENTO_EMPRESA ? '(por volumen)' : '(empresa)'}</span>
                  <span className="text-[#9DC9B4]">− ${ahorro.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-base font-semibold text-white">Total estimado</span>
                  <span className="text-base font-semibold text-white">${total.toLocaleString('es-CO')}</span>
                </div>
                <p className="text-xs text-[#9DC9B4] mt-2">
                  🎉 Te ahorras ${ahorro.toLocaleString('es-CO')} en este pedido frente al precio sin descuento
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA FINAL */}
        <div className="text-center mt-12">
          <button
            type="button"
            onClick={() => navigate('/cliente/catalogo')}
            className="h-12 px-10 rounded-xl bg-[#6FA98C] text-white text-sm font-semibold hover:bg-[#4F8A70] transition"
          >
            Ir al catálogo
          </button>
          <p className="text-xs text-white/40 mt-4">¿Dudas? Escríbenos y coordinamos tu pedido empresarial.</p>
        </div>
      </div>
    </div>
  )
}

export default Empresas
