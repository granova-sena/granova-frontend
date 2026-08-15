import { createContext, useContext, useState } from 'react'
import { API_URL } from "../config";
const CarritoContext = createContext()

const productosIniciales = []

// Frente 1 (Jhon): descuento diferenciado por tipo de cliente y volumen.
// Minorista: 6% solo si lleva 5+ unidades en el carrito.
// Mayorista: 12% siempre. Ajustar valores según política comercial.
const DESCUENTO_MINORISTA = 0.06
const DESCUENTO_MAYORISTA = 0.12
const UNIDADES_MINIMAS_DESCUENTO_MINORISTA = 5
const IVA = 0.19

// ── CONFIG API ────────────────────────────────────────────
// Sigue la misma convención que el resto del proyecto (sin prefijo /api),
// coincidiendo con cómo servidor.js monta app.use("/pedidos", pedidosRoutes)


function obtenerIdCliente() {
  try {
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    return cliente?.id ?? null
  } catch {
    return null
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
  const [productos, setProductos] = useState(productosIniciales)
  const [datosCliente, setDatosCliente] = useState(null)

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
        productos: productos.map(p => ({
          id_producto: p.id,
          cantidad: p.cantidad,
          // Se envía el precio efectivo (con descuento si aplica) para que
          // el total guardado en el pedido coincida con lo que paga el cliente.
          precio_unitario: Math.round(p.precio * (1 - DESCUENTO)),
        })),
      }

      const res = await fetch(`${API_URL}/api/pedidos`,
         {        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!json.ok) throw new Error(json.mensaje)

      return { ok: true, id_pedido: json.data.id_pedido }
    } catch (error) {
      console.error('Error confirmando pedido:', error.message)
      return { ok: false, mensaje: error.message }
    }
  }

  const sincronizarCarrito = (productosExternos) => {
    const productosAdaptados = productosExternos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      presentacion: p.origen || '',
      precio: p.precio,
      cantidad: p.cant || 1,
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

  return (
    <CarritoContext.Provider value={{
      productos,
      aumentarCantidad,
      disminuirCantidad,
      eliminarProducto,
      sincronizarCarrito,
      datosCliente,
      guardarDatosCliente,
      confirmarPedido,
      subtotal,
      descuentoMonto,
      ivaMonto,
      total,
      DESCUENTO,
      IVA,
      esMayorista,
      totalUnidades,
      unidadesFaltantes,
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- patrón estándar Context+Provider+hook en un solo archivo; separarlo rompería los imports existentes sin beneficio real.
export function useCarrito() {
  return useContext(CarritoContext)
}
