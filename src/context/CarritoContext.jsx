import { createContext, useContext, useState } from 'react'
import { API_URL } from "../config";
const CarritoContext = createContext()

const productosIniciales = []

// Frente 1 (Jhon): descuento diferenciado por tipo de cliente.
// Ajustar estos valores según la política comercial de Granova.
const DESCUENTO_MINORISTA = 0.06
const DESCUENTO_MAYORISTA = 0.12
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
          // El mayorista paga precio con descuento: se envía el valor que paga
          // para que el total guardado en el pedido coincida con lo cobrado.
          precio_unitario: esMayorista ? Math.round(p.precio * (1 - DESCUENTO_MAYORISTA)) : p.precio,
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
  const esMayorista = obtenerTipoCliente() === 'mayorista'
  const DESCUENTO = esMayorista ? DESCUENTO_MAYORISTA : DESCUENTO_MINORISTA
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
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- patrón estándar Context+Provider+hook en un solo archivo; separarlo rompería los imports existentes sin beneficio real.
export function useCarrito() {
  return useContext(CarritoContext)
}
