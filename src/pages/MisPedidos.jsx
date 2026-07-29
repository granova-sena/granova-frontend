import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from "../config";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const descargarFactura = async (id_pedido) => {
  try {
    // Genera la factura si no existe
    await fetch(`${API_URL}/api/facturas`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id_pedido })
    })

    // Obtiene la factura
    const res  = await fetch(`${API_URL}/api/facturas/${id_pedido}`)
    const json = await res.json()

    if (!json.ok) throw new Error(json.mensaje)

    const factura = json.data
    const doc     = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(45, 90, 39)
    doc.text('FACTURA', 105, 20, { align: 'center' })

    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`N°: ${factura.numero_factura}`, 150, 30)
    doc.text(`Fecha: ${new Date(factura.fecha_emision).toLocaleDateString('es-CO')}`, 150, 35)

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text('Datos del cliente', 15, 45)
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`Nombre: ${factura.nombre_cliente} ${factura.apellido_cliente}`, 15, 52)
    doc.text(`Correo: ${factura.email_cliente}`,      15, 57)
    doc.text(`Ciudad: ${factura.ciudad_envio}`,       15, 62)
    doc.text(`Dirección: ${factura.direccion_envio}`, 15, 67)

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text('Datos del pedido', 110, 45)
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`Método de pago: ${factura.metodo_pago}`, 110, 52)
    doc.text(`Estado: ${factura.estado_pedido}`,        110, 57)

    autoTable(doc, {
      startY: 75,
      head: [['Producto', 'Presentación', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: factura.productos.map(p => [
        p.producto_nombre,
        p.producto_presentacion || '-',
        p.cantidad,
        `$${Number(p.precio_unitario).toLocaleString()}`,
        `$${Number(p.subtotal).toLocaleString()}`
      ]),
      headStyles:         { fillColor: [45, 90, 39], textColor: 255, fontSize: 9 },
      bodyStyles:         { fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 247, 238] }
    })

    const finalY = doc.lastAutoTable.finalY + 10

    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text('Subtotal:', 130, finalY)
    doc.text(`$${Number(factura.subtotal).toLocaleString()}`, 175, finalY, { align: 'right' })

    doc.setTextColor(200, 0, 0)
    doc.text('IVA:', 130, finalY + 6)
    doc.text(`$${Number(factura.impuestos).toLocaleString()}`, 175, finalY + 6, { align: 'right' })

    doc.setTextColor(0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', 130, finalY + 14)
    doc.text(`$${Number(factura.total).toLocaleString()}`, 175, finalY + 14, { align: 'right' })

    doc.save(`factura-${factura.numero_factura}.pdf`)

  } catch (error) {
    console.error('Error descargando factura:', error.message)
    alert('❌ No se pudo generar la factura')
  }
}

const PASOS = [
  { titulo: 'Pedido confirmado', desc: 'Recibimos tu compra' },
  { titulo: 'En preparación', desc: 'Tostamos y empacamos' },
  { titulo: 'En camino', desc: 'Sale hacia tu ciudad' },
  { titulo: 'Entregado', desc: 'Café en tu puerta' },
]

const estadoTexto = {
  pendiente: 'text-white/50',
  confirmado: 'text-[#9DC9B4]',
  en_proceso: 'text-amber-400',
  enviado: 'text-[#9DC9B4]',
  entregado: 'text-[#9DC9B4]',
  cancelado: 'text-[#D85A30]',
}

const estadoLabel = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_proceso: 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

function obtenerIdCliente() {
  try {
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    return cliente?.id ?? null
  } catch {
    return null
  }
}

function MisPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id_cliente = obtenerIdCliente()
    if (!id_cliente) {
      setCargando(false)
      return
    }

    let cancelado = false
    async function cargarPedidos() {
      try {
        setCargando(true)
        const res = await fetch(`${API_URL}/api/pedidos/cliente/${id_cliente}`)
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        if (!cancelado) setPedidos(json.data)
      } catch (err) {
        if (!cancelado) setError(err.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargarPedidos()
    return () => { cancelado = true }
  }, [])

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const formatearNumero = (id) =>
    `PED-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Historial</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2 mb-8 sm:mb-10 tracking-tight">Mis pedidos</h1>

        {cargando && (
          <div className="rounded-2xl p-10 sm:p-16 text-center bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
            <p className="text-white/50 text-sm">Cargando pedidos...</p>
          </div>
        )}

        {!cargando && error && (
          <div className="rounded-2xl p-10 sm:p-16 text-center bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
            <p className="text-[#D85A30] text-sm">{error}</p>
          </div>
        )}

        {!cargando && !error && pedidos.length === 0 && (
          <div className="rounded-2xl p-10 sm:p-16 text-center bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white/50 flex items-center justify-center mx-auto mb-5">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M4 7l8-4 8 4-8 4-8-4zm0 0v10l8 4m0-14v14m8-14v10l-8 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Aún no tienes pedidos</p>
            <p className="text-white/50 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              Cuando compres en el catálogo, cada pedido y su estado de envío aparecerán aquí.
            </p>
            <button
              onClick={() => navigate('/cliente/catalogo')}
              className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2"
            >
              Explorar catálogo
            </button>
          </div>
        )}

        {!cargando && !error && pedidos.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm divide-y divide-white/10">
          {pedidos.map((p) => (
            <div key={p.id_pedido} className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-white/[0.06] transition">
              
              {/* Info del pedido — navega al detalle */}
              <button
                onClick={() => navigate(`/cliente/pedidos/${p.id_pedido}`)}
                className="flex-1 text-left"
              >
                <p className="text-sm font-medium text-white">{formatearNumero(p.id_pedido)}</p>
                <p className="text-xs text-white/40 mt-0.5">{formatearFecha(p.fecha_pedido)}</p>
              </button>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-xs font-medium ${estadoTexto[p.estado] || 'text-white/50'}`}>
                    {estadoLabel[p.estado] || p.estado}
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    ${Number(p.total).toLocaleString('es-CO')}
                  </p>
                </div>

                {/* Botón descargar factura */}
                <button
                  onClick={() => descargarFactura(p.id_pedido)}
                  title="Descargar factura"
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50 hover:text-[#9DC9B4] hover:bg-white/20 transition"
                >
                  ⬇️
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

        <div className="mt-6 rounded-2xl p-6 sm:p-8 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          <p className="text-sm font-semibold text-white mb-6">Así se ve un pedido en camino</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {PASOS.map((paso, i) => (
              <div key={paso.titulo} className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-white/10 text-white/40 text-[11px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                  {i < PASOS.length - 1 && <span className="hidden sm:block flex-1 h-px bg-white/10"></span>}
                </div>
                <p className="text-xs font-medium text-white/70">{paso.titulo}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MisPedidos
