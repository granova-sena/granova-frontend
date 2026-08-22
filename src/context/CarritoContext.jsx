import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from "../config";
const CarritoContext = createContext()

const STORAGE_KEY = 'granova_carrito'

function cargarCarrito() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    return guardado ? JSON.parse(guardado) : []
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

  const confirmarPedido = async (datosFormulario, metodoPago) => {
    try {
      const id_cliente = obtenerIdCliente()

      if (!id_cliente) {
        return { ok: false, mensaje: 'Debes iniciar sesión para confirmar un pedido' }
      }

      const body = {
        id_cliente,
        metodo_pago: metodoPago,
        direccion_envio: datosFormulario.direccion,
        ciudad_envio: datosFormulario.ciudad,
        productos: productos.map(p => {
          if (p.id_formato) {
            return { id_producto: p.id, cantidad: p.cantidad, id_formato: p.id_formato }
          }
          return { id_producto: p.id, cantidad: p.cantidad, precio_unitario: p.precio }
        }),
      }

      const res = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!json.ok) throw new Error(json.mensaje)

      localStorage.removeItem(STORAGE_KEY)
      setProductos([])

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

  const subtotal = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0)
  const totalUnidades = productos.reduce((acc, p) => acc + p.cantidad, 0)
  const esMayorista = obtenerTipoCliente() === 'mayorista'
  const DESCUENTO = esMayorista
    ? DESCUENTO_MAYORISTA
    : (totalUnidades >= UNIDADES_MINIMAS_DESCUENTO_MINORISTA ? DESCUENTO_MINORISTA : 0)
  const unidadesFaltantes = esMayorista
    ? 0
    : Math.max(0, UNIDADES_MINIMAS_DESCUENTO_MINORISTA - totalUnidades)
  const descuentoMonto = Math.round(subtotal * DESCUENTO)
  const ivaMonto = Math.round((subtotal - descuentoMonto) * IVA)
  const total = subtotal - descuentoMonto + ivaMonto

  const [cuponValidado] = useState(null)
  const validarCupon = async () => null
  const tienePremio = false
  const descuentoFuente = DESCUENTO > 0 ? (esMayorista ? 'empresa' : 'volumen') : null

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
      descuentoMonto,
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
