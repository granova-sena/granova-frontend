import { createContext, useContext, useState } from 'react'

const CarritoContext = createContext()

const productosIniciales = [
  { id: 1, nombre: 'Cafe tostado',  presentacion: 'Grano-100g',  precio: 15000, cantidad: 10 },
  { id: 2, nombre: 'Cafe premium',  presentacion: 'Molido-150g', precio: 30000, cantidad: 3  },
  { id: 3, nombre: 'Cafe Orgánico', presentacion: 'Grano-300g',  precio: 35000, cantidad: 1  },
]

const DESCUENTO = 0.06
const IVA       = 0.19

export function CarritoProvider({ children }) {
  const [productos, setProductos] = useState(productosIniciales)
  const [datosCliente, setDatosCliente] = useState(null)

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

  const subtotal       = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0)
  const descuentoMonto = Math.round(subtotal * DESCUENTO)
  const ivaMonto       = Math.round((subtotal - descuentoMonto) * IVA)
  const total          = subtotal - descuentoMonto + ivaMonto

  return (
    <CarritoContext.Provider value={{
      productos,
      aumentarCantidad,
      disminuirCantidad,
      eliminarProducto,
      datosCliente,
      guardarDatosCliente,
      subtotal,
      descuentoMonto,
      ivaMonto,
      total,
      DESCUENTO,
      IVA,
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}