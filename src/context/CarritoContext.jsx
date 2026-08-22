import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from "../config";
const CarritoContext = createContext()

const STORAGE_KEY = 'granova_carrito'

function cargarCarrito() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (!guardado) return []
    const raw = JSON.parse(guardado)
    if (!Array.isArray(raw)) return []
    return raw
      .map(p => ({
        ...p,
        cantidad: Number.isFinite(Number(p.cantidad)) && Number(p.cantidad) > 0
          ? Number(p.cantidad)
          : Number.isFinite(Number(p.cant)) && Number(p.cant) > 0
            ? Number(p.cant)
            : 1,
      }))
      .filter(p => p.id != null)
  } catch {
    return []
  }
}

// Descuentos: mayorista siempre, minorista solo si lleva 5+ unidades
const DESCUENTO_MINORISTA = 0.06
const DESCUENTO_MAYORISTA = 0.12
const UNIDADES_MINIMAS_DESCUENTO_MINORISTA = 5
const IVA = 0.19

function obtenerIdCliente() {
  try {
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    return cliente?.id ?? null
  } catch {
    return null
  }
}

function obtenerCliente() {
  try {
    return JSON.parse(localStorage.getItem('cliente')) || {}
  } catch {
    return {}
  }
}

function obtenerTipoCliente() {
  try {
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    return cliente?.tipo_cliente === 'mayorista' ? 'mayorista' : 'minorista'
  } catch {
    return 'minorista'
  }
}

export function CarritoProvider({ children }) {
  const [productos, setProductos] = useState(cargarCarrito)
  const [datosCliente, setDatosCliente] = useState(null)
  const [clienteActual, setClienteActual] = useState(() => obtenerCliente())

  const esJuridica = clienteActual?.tipo_persona === 'juridica'

  const confirmarPedido = async (datosFormulario, metodoPago, codigoCupon = null) => {
    try {
      const id_cliente = obtenerIdCliente()

      if (!id_cliente) {
        return { ok: false, mensaje: 'Debes iniciar sesión para confirmar un pedido' }
      }

      const itemsValidos = productos.filter(p =>
        p.id != null && Number.isFinite(Number(p.cantidad)) && Number(p.cantidad) > 0
      )

      if (itemsValidos.length === 0) {
        return { ok: false, mensaje: 'El carrito no tiene productos válidos' }
      }

      const body = {
        id_cliente,
        metodo_pago: metodoPago,
        direccion_envio: datosFormulario.direccion,
        ciudad_envio: datosFormulario.ciudad,
        productos: itemsValidos.map(p => ({
          id_producto: p.id,
          cantidad: Math.floor(Number(p.cantidad)),
          ...(p.id_formato ? { id_formato: p.id_formato } : {}),
          ...(p.precio ? { precio_unitario: p.precio } : {}),
        })),
      }

      if (codigoCupon) body.codigo_cupon = String(codigoCupon).trim()

      const res = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!json.ok) throw new Error(json.mensaje)

      localStorage.removeItem(STORAGE_KEY)
      setProductos([])
      setCuponValidado(null)

      return {
        ok: true,
        id_pedido: json.data.id_pedido,
        descuento_aplicado: json.data?.descuento_aplicado ?? 0,
        descuento_fuente: json.data?.descuento_fuente ?? null,
      }
    } catch (error) {
      console.error('Error confirmando pedido:', error.message)
      return { ok: false, mensaje: error.message }
    }
  }

  const agregarAlCarrito = (item) => {
    const cantNueva = item.cant || item.cantidad || 1
    setProductos(prev => {
      const existe = prev.find(x => x.id === item.id)
      if (existe) return prev.map(x => x.id === item.id ? { ...x, cantidad: (x.cantidad || 1) + cantNueva } : x)
      return [...prev, { ...item, cantidad: cantNueva }]
    })
  }

  const sincronizarCarrito = (productosExternos) => {
    const productosAdaptados = productosExternos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      presentacion: p.origen || '',
      precio: p.precio,
      cantidad: p.cant || 1,
      img: p.img || '',
      unidad: p.unidad || 'kg',
      id_formato: p.id_formato ?? null,
      etiqueta_formato: p.etiqueta_formato || '',
      peso_kg: p.peso_kg ?? null,
      promo_pct: p.promoPct ?? null,
      iva_pct: p.iva_pct == null ? 5 : Number(p.iva_pct),
    }))
    setProductos(productosAdaptados)
  }

  const aumentarCantidad = (id) => {
    setProductos(prev =>
      prev.map(p => p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p)
    )
  }

  const disminuirCantidad = (id) => {
    setProductos(prev =>
      prev.map(p => p.id === id && p.cantidad > 1 ? { ...p, cantidad: p.cantidad - 1 } : p)
    )
  }

  const eliminarProducto = (id) => {
    setProductos(prev => prev.filter(p => p.id !== id))
  }

  const guardarDatosCliente = (datos) => {
    setDatosCliente(datos)
  }

  // Persistir carrito en localStorage cada vez que cambia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos))
  }, [productos])

  // Sincronizar perfil del cliente desde el backend
  useEffect(() => {
    const token = localStorage.getItem('token')
    const id = obtenerIdCliente()
    if (!token || !id) return

    fetch(`${API_URL}/api/clientes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(json => {
        if (json.ok) {
          setClienteActual(prev => ({ ...prev, ...json.data }))
          localStorage.setItem('cliente', JSON.stringify({ ...obtenerCliente(), ...json.data }))
        }
      })
      .catch(() => {})
  }, [])

  const actualizarPerfilCliente = (datos) => {
    setClienteActual(prev => ({ ...prev, ...datos }))
    localStorage.setItem('cliente', JSON.stringify({ ...obtenerCliente(), ...datos }))
  }

  const [cuponValidado, setCuponValidado] = useState(null)

  // ── Totales: per-item "mayor gana" + cupón + IVA extraído ──
  const totalUnidades = productos.reduce((acc, p) => acc + Number(p.cantidad || 0), 0)
  const esMayorista = obtenerTipoCliente() === 'mayorista'
  const DESCUENTO = esMayorista
    ? DESCUENTO_MAYORISTA
    : (totalUnidades >= UNIDADES_MINIMAS_DESCUENTO_MINORISTA ? DESCUENTO_MINORISTA : 0)
  const unidadesFaltantes = esMayorista
    ? 0
    : Math.max(0, UNIDADES_MINIMAS_DESCUENTO_MINORISTA - totalUnidades)

  // Descuento por volumen/mayorista como porcentaje
  const pctVolumen = DESCUENTO * 100

  // Subtotal base (sin ningún descuento)
  const subtotalBase = productos.reduce((acc, p) => {
    return acc + (Number(p.precio) || 0) * (Number(p.cantidad) || 0)
  }, 0)

  // Cada producto gana: mayor entre promo y volumen → subtotal con descuento de producto
  const subtotalConDescuento = productos.reduce((acc, p) => {
    const precio = Number(p.precio) || 0
    const cant = Number(p.cantidad) || 0
    const pctGanador = Math.max(Number(p.promo_pct) || 0, pctVolumen)
    return acc + Math.round(precio * (1 - pctGanador / 100)) * cant
  }, 0)

  // Descuento por productos (volumen/promo) — separado para mostrar en resumen
  const descuentoProductos = subtotalBase - subtotalConDescuento

  // Cupón: descuento adicional sobre el subtotal ya con descuento de producto/volumen
  const cuponPct = Number(cuponValidado?.pct) || 0
  const descuentoCuponMonto = cuponPct > 0 ? Math.round(subtotalConDescuento * cuponPct / 100) : 0

  const subtotal = Math.max(0, subtotalConDescuento - descuentoCuponMonto)
  const descuentoMonto = descuentoProductos + descuentoCuponMonto

  // IVA: se EXTRAe de los precios (ya incluyen IVA). Tasa real por producto.
  const ivaMonto = Math.round(productos.reduce((acc, p) => {
    const precio = Number(p.precio) || 0
    const cant = Number(p.cantidad) || 0
    const pctGanador = Math.max(Number(p.promo_pct) || 0, pctVolumen)
    const precioFinal = Math.round(precio * (1 - pctGanador / 100))
    const tasa = Number(p.iva_pct ?? 5)
    return acc + (precioFinal * cant * tasa) / (100 + tasa)
  }, 0))

  const total = subtotal

  const validarCupon = async (codigo) => {
    const token = localStorage.getItem('token')
    if (!token) return { ok: false, mensaje: 'Debes iniciar sesión para usar un cupón' }
    try {
      const res = await fetch(`${API_URL}/api/cupones/validar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo: String(codigo).trim() }),
      })
      const json = await res.json()
      if (!json.ok) return { ok: false, mensaje: json.mensaje || 'Cupón inválido' }
      const cupon = { ...json.data, pct: Number(json.data.descuento_pct) || 0 }
      setCuponValidado(cupon)
      return { ok: true, pct: cupon.pct }
    } catch {
      return { ok: false, mensaje: 'No se pudo validar el cupón' }
    }
  }

  const tienePremio = false
  const descuentoFuente = DESCUENTO > 0 ? (esMayorista ? 'empresa' : 'volumen') : (cuponPct > 0 ? 'cupon' : null)

  return (
    <CarritoContext.Provider value={{
      productos,
      agregarAlCarrito,
      aumentarCantidad,
      disminuirCantidad,
      eliminarProducto,
      sincronizarCarrito,
      datosCliente,
      guardarDatosCliente,
      confirmarPedido,
      cliente: clienteActual,
      esJuridica,
      subtotal,
      subtotalBase,
      descuentoMonto,
      descuentoProductos,
      descuentoCuponMonto,
      ivaMonto,
      total,
      DESCUENTO,
      IVA,
      esMayorista,
      totalUnidades,
      unidadesFaltantes,
      descuentoFuente,
      tienePremio,
      validarCupon,
      cuponValidado,
      cuponPct,
      descuentoCuponMonto,
      actualizarPerfilCliente,
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrito() {
  return useContext(CarritoContext)
}
