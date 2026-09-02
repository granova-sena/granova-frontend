import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from "../config";
import { getActiveToken, idDeTokenCliente, idClienteActual, limpiarTodo } from '../services/session'
import { leerParametro } from '../services/parametros'
const CarritoContext = createContext()

// Clave POR USUARIO: cada cliente logueado tiene su propio carrito en
// el mismo navegador. Sin sesión → sufijo "_invitado".
const claveCarrito = () => `granova_carrito_u${idClienteActual()}`

function cargarCarrito() {
  try {
    const guardado = localStorage.getItem(claveCarrito())
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
      const id_cliente = idDeTokenCliente()

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
        sector_envio: datosFormulario.sector || datosFormulario.sector_envio || null,
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token_cliente')}`,
        },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!json.ok) throw new Error(json.mensaje)

      localStorage.removeItem(claveCarrito())
      setProductos([])
      setCuponValidado(null)

      // Refrescar perfil del cliente para actualizar puntos
      try {
        if (id_cliente) {
          const r = await fetch(`${API_URL}/api/clientes/${id_cliente}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token_cliente')}` },
          })
          const pj = await r.json()
          if (pj.ok) {
            setClienteActual(prev => ({ ...prev, ...pj.data }))
            localStorage.setItem('cliente', JSON.stringify({ ...obtenerCliente(), ...pj.data }))
          }
        }
      } catch { /* best effort */ }

      return {
        ok: true,
        id_pedido: json.data.id_pedido,
        numero_pedido: json.data?.numero_pedido ?? null,
        estado: json.data?.estado ?? null,
        estado_pago: json.data?.estado_pago ?? null,
        pago: json.data?.pago ?? null,
        total: json.data?.total ?? null,
        mensaje: json.data?.mensaje ?? null,
        descuento_aplicado: json.data?.descuento_aplicado ?? 0,
        descuento_empresa: json.data?.descuento_empresa ?? false,
        descuento_fuente: json.data?.descuento_fuente ?? null,
        descuento_ganado: json.data?.descuento_ganado ?? false,
        codigo_cupon: json.data?.codigo_cupon ?? null,
        puntos_ganados: json.data?.puntos_ganados ?? 0,
        unidades_acumuladas: json.data?.unidades_acumuladas ?? 0,
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
    localStorage.setItem(claveCarrito(), JSON.stringify(productos))
  }, [productos])

  // Cambio de sesión: cargar el carrito del cliente activo.
  // Al cerrar sesión, 'cliente' ya fue removido de localStorage, así que esta
  // lectura cae en el carrito de invitado y el guardado posterior NO pisa
  // el carrito guardado del usuario que salió (persiste para su regreso).
  const uidCarrito = clienteActual?.id ?? null
  useEffect(() => {
    setProductos(cargarCarrito())
  }, [uidCarrito])

  // Sincronizar perfil del cliente desde el backend.
  // SOLO para sesión de cliente real: si no hay token_cliente válido
  // (por ejemplo al estar en el dashboard admin), no se toca nada y así
  // no se contamina el perfil con la sesión de empleado/admin.
  useEffect(() => {
    const id = idDeTokenCliente()
    if (!id) return

    fetch(`${API_URL}/api/clientes/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token_cliente')}` },
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

  // ── Limpiar sesión (logout): resetea todo el estado React ──
  // El carrito por usuario NO se borra de localStorage: persiste para
  // cuando esa persona vuelva a iniciar sesión.
  const limpiarSesion = () => {
    setClienteActual({})
    setProductos([])
    setCuponValidado(null)
    setDatosCliente(null)
    limpiarTodo()
  }

  // ── Re-sincronizar sesión (login): re-lee localStorage + fetch perfil ──
  const sincronizarSesion = async () => {
    const nuevoCliente = obtenerCliente()
    setClienteActual(nuevoCliente)
    setCuponValidado(null)
    setDatosCliente(null)

    const id = idDeTokenCliente()
    if (!id) return

    try {
      const res = await fetch(`${API_URL}/api/clientes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token_cliente')}` },
      })
      const json = await res.json()
      if (json.ok) {
        setClienteActual(prev => ({ ...prev, ...json.data }))
        localStorage.setItem('cliente', JSON.stringify({ ...obtenerCliente(), ...json.data }))
      }
    } catch { /* best effort */ }
  }

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
  const pctJuridica = esJuridica ? leerParametro('descuento_empresa_pct', 15) : 0

  // Subtotal base (sin ningún descuento)
  const subtotalBase = productos.reduce((acc, p) => {
    return acc + (Number(p.precio) || 0) * (Number(p.cantidad) || 0)
  }, 0)

  // Cada producto gana: mayor entre promo y volumen → subtotal con descuento de producto
  const subtotalConDescuento = productos.reduce((acc, p) => {
    const precio = Number(p.precio) || 0
    const cant = Number(p.cantidad) || 0
    const pctGanador = Math.max(Number(p.promo_pct) || 0, pctVolumen, pctJuridica)
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
    const pctGanador = Math.max(Number(p.promo_pct) || 0, pctVolumen, pctJuridica)
    const precioFinal = Math.round(precio * (1 - pctGanador / 100))
    const tasa = Number(p.iva_pct ?? 5)
    return acc + (precioFinal * cant * tasa) / (100 + tasa)
  }, 0))

  const total = subtotal

  const validarCupon = async (codigo) => {
    const token = getActiveToken()
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

  // Premio de lealtad: cada 5 unidades acumuladas dan 10% de descuento.
  // El panel confirma la liquidación al cobrar (las unidades se reinician).
  const tienePremio = !esJuridica && Number(clienteActual?.unidades_acumuladas || 0) >= 5
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
      limpiarSesion,
      sincronizarSesion,
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrito() {
  return useContext(CarritoContext)
}
