import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from "../config";
const CarritoContext = createContext()

const productosIniciales = []

// Frente 1 (Jhon): reglas de descuento.
// - Empresa (tipo_persona = 'juridica'): 10% fijo en todos sus pedidos.
// - Persona natural: compra 5+ unidades → gana 10% para la PRÓXIMA compra.
// - Nadie suma: máximo 10%.
// El backend es quien aplica el descuento de verdad (el navegador solo muestra).
// IVA: los precios ya lo incluyen (no se suma en pantalla ni en el backend).
const DESCUENTO_EMPRESA = 0.10
const UMBRAL_UNIDADES_PREMIO = 5

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

function obtenerCliente() {
  try {
    return JSON.parse(localStorage.getItem('cliente')) || {}
  } catch {
    return {}
  }
}

export function CarritoProvider({ children }) {
  const [productos, setProductos] = useState(productosIniciales)
  const [datosCliente, setDatosCliente] = useState(null)
  const [clienteActual, setClienteActual] = useState(() => obtenerCliente())
  const [descuentosVolumen, setDescuentosVolumen] = useState([])
  // El premio se lee al montar el carrito; después se actualiza con la respuesta
  // de cada pedido (si ganó, el backend devuelve descuento_ganado) o al guardar
  // los datos de facturación (si se identifica como empresa, aplica el 10% fijo).
  const [tienePremio, setTienePremio] = useState(() => obtenerCliente()?.descuento_proxima_compra === true)
  // Cupón validado en el checkout: solo informa (el backend lo aplica al confirmar).
  const [cuponValidado, setCuponValidado] = useState(null)

  const esJuridica = clienteActual?.tipo_persona === 'juridica'

  // Valida el cupón contra el backend SIN consumirlo. Si es válido, se guarda
  // en el estado para mostrarlo al instante en los resúmenes.
  const validarCupon = async (codigo) => {
    if (!codigo?.trim()) {
      return { ok: false, mensaje: 'Escribe el código del cupón' }
    }
    const token = localStorage.getItem('token')
    if (!token) {
      return { ok: false, mensaje: 'Debes iniciar sesión para usar un cupón' }
    }
    try {
      const res = await fetch(`${API_URL}/api/cupones/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ codigo: codigo.trim() }),
      })
      const json = await res.json()
      if (!json.ok) {
        setCuponValidado(null)
        return { ok: false, mensaje: json.mensaje || 'Cupón inválido' }
      }
      setCuponValidado({ codigo: json.data.codigo, pct: Number(json.data.descuento_pct) })
      return { ok: true, pct: Number(json.data.descuento_pct) }
    } catch (error) {
      console.error('Error validando cupón:', error.message)
      return { ok: false, mensaje: 'No se pudo conectar con el servidor' }
    }
  }

  // Actualiza el perfil del cliente en el localStorage y en el estado del carrito
  // para que los descuentos reaccionen al instante (sin recargar ni re-login).
  const actualizarPerfilCliente = (nuevosDatos) => {
    const clienteGuardado = obtenerCliente()
    const nuevo = { ...clienteGuardado, ...nuevosDatos }
    localStorage.setItem('cliente', JSON.stringify(nuevo))
    setClienteActual(nuevo)
    if (nuevosDatos.descuento_proxima_compra !== undefined) {
      setTienePremio(nuevosDatos.descuento_proxima_compra === true)
    }
  }

  const confirmarPedido = async (datosFormulario, metodoPago, codigoCupon = '') => {
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
        // Se envía el precio normal o el id_formato: el backend es quien
        // resuelve el precio real (nunca se fía del navegador).
        productos: productos.map(p => {
          if (p.id_formato) {
            return { id_producto: p.id, cantidad: p.cantidad, id_formato: p.id_formato }
          }
          return { id_producto: p.id, cantidad: p.cantidad, precio_unitario: p.precio }
        }),
        // Cupón de lealtad (Frente D): opcional
        ...(codigoCupon ? { codigo_cupon: codigoCupon.trim() } : {}),
      }

      const res = await fetch(`${API_URL}/api/pedidos`,
         {        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!json.ok) throw new Error(json.mensaje)

      // Actualizar el estado local del premio y los puntos según lo que diga el backend
      const descuentoGanado = json.data?.descuento_ganado === true
      actualizarPerfilCliente({
        descuento_proxima_compra: descuentoGanado,
        ...(json.data?.unidades_acumuladas !== undefined ? { unidades_acumuladas: json.data.unidades_acumuladas } : {}),
        ...(json.data?.puntos_totales !== undefined ? { puntos: json.data.puntos_totales } : {}),
      })
      // El pedido ya se confirmó: el cupón queda descartado del estado
      // (si el backend lo usó, se marcó usado; si no, el cliente puede revalidarlo).
      setCuponValidado(null)

      return {
        ok: true,
        id_pedido: json.data.id_pedido,
        descuento_aplicado: json.data?.descuento_aplicado ?? 0,
        descuento_fuente: json.data?.descuento_fuente ?? null,
        descuento_empresa: json.data?.descuento_empresa === true,
        descuento_ganado: descuentoGanado,
        unidades_acumuladas: json.data?.unidades_acumuladas ?? 0,
        puntos_ganados: json.data?.puntos_ganados ?? 0,
        puntos_totales: json.data?.puntos_totales ?? 0,
      }
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
      img: p.img || '',
      unidad: p.unidad || 'kg',
      // Frente A (formatos): si el ítem se agregó desde un formato (250g, bulto...),
      // se conservan esos datos para que el checkout los mande al backend.
      id_formato: p.id_formato ?? null,
      etiqueta_formato: p.etiqueta_formato || '',
      peso_kg: p.peso_kg ?? null,
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

  // Escalones de descuento por volumen (frente B): el carrito muestra el
  // MISMO descuento que aplicará el backend. Si el servidor no responde,
  // se queda vacío y el carrito sigue funcionando con empresa/premio.
  useEffect(() => {
    fetch(`${API_URL}/productos/descuentos`)
      .then(res => res.json())
      .then(json => {
        if (json.ok) setDescuentosVolumen(json.data || [])
      })
      .catch(() => {})
  }, [])

  // Sincronización del perfil: el servidor es la fuente de verdad.
  // Al abrir la app, si hay sesión, traemos el perfil fresco (fecha_creacion,
  // tipo_persona, premio, etc.) y refrescamos el localStorage — así los usuarios
  // viejos reciben los cambios sin tener que cerrar sesión y volver a entrar.
  // El localStorage queda como caché rápida, no como dueño de la verdad. 📰
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
          if (json.data.descuento_proxima_compra !== undefined) {
            setTienePremio(json.data.descuento_proxima_compra === true)
          }
        }
      })
      .catch(() => {
        // Si el servidor no responde, seguimos con lo que haya en localStorage.
      })
  }, [])

  const subtotal = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0)
  const totalUnidades = productos.reduce((acc, p) => acc + p.cantidad, 0)
  // Kg de café del carrito: ítems con formato usan peso_kg × cantidad;
  // ítems legacy de café (unidad 'kg') cuentan la cantidad como kg.
  const totalKgCafe = productos.reduce((acc, p) => {
    if (p.peso_kg) return acc + p.peso_kg * p.cantidad
    if (p.unidad === 'kg') return acc + p.cantidad
    return acc
  }, 0)
  const tier = descuentosVolumen.find(t =>
    totalKgCafe >= Number(t.kg_min) && (t.kg_max === null || totalKgCafe <= Number(t.kg_max))
  )
  const volumenPct = tier ? Number(tier.descuento_pct) : 0
  // EL MAYOR GANA (igual que el backend): volumen vs empresa 10% vs premio 10% vs cupón
  const fuentes = [
    { fuente: 'volumen', pct: volumenPct },
    { fuente: 'empresa', pct: esJuridica ? DESCUENTO_EMPRESA * 100 : 0 },
    { fuente: 'premio', pct: tienePremio && !esJuridica ? DESCUENTO_EMPRESA * 100 : 0 },
    { fuente: 'cupon', pct: cuponValidado ? cuponValidado.pct : 0 },
  ].filter(f => f.pct > 0).sort((a, b) => b.pct - a.pct)
  const ganador = fuentes[0] || { fuente: null, pct: 0 }
  const DESCUENTO = ganador.pct / 100
  const descuentoFuente = ganador.fuente
  // Premio acumulativo: el contador del cliente + lo que lleva en el carrito
  // cuentan juntos rumbo a los 5 productos para ganar el 10%.
  const unidadesAcumuladas = Number(clienteActual?.unidades_acumuladas) || 0
  const unidadesFaltantes = esJuridica
    ? 0
    : Math.max(0, UMBRAL_UNIDADES_PREMIO - (unidadesAcumuladas + totalUnidades))
  const unidadesRumboPremio = unidadesAcumuladas + totalUnidades
  const descuentoMonto = Math.round(subtotal * DESCUENTO)
  // IVA incluido: el total que se muestra es exactamente el que cobra el backend.
  const total = subtotal - descuentoMonto

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
      actualizarPerfilCliente,
      validarCupon,
      cuponValidado,
      cliente: clienteActual,
      subtotal,
      descuentoMonto,
      total,
      DESCUENTO,
      esJuridica,
      tienePremio,
      totalUnidades,
      unidadesFaltantes,
      umbralPremio: UMBRAL_UNIDADES_PREMIO,
      descuentoFuente,
      descuentoVolumenPct: volumenPct,
      totalKgCafe,
      descuentosVolumen,
      unidadesAcumuladas,
      unidadesRumboPremio,
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- patrón estándar Context+Provider+hook en un solo archivo; separarlo rompería los imports existentes sin beneficio real.
export function useCarrito() {
  return useContext(CarritoContext)
}
