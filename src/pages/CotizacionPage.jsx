import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { API_URL } from '../config'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
fetch
function CotizacionPage() {
  const navigate = useNavigate()
  const { productos, subtotal, descuentoMonto, ivaMonto, total, DESCUENTO, IVA, datosCliente } = useCarrito()
  // Agrega esto al inicio del componente, junto a los otros estados
const clienteSesion = (() => {
  try {
    return JSON.parse(localStorage.getItem('cliente')) || null
  } catch {
    return null
  }
})()
  const generarPDF = () => {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setTextColor(45, 90, 39)
  doc.text('COTIZACIÓN', 105, 20, { align: 'center' })

  doc.setFontSize(9)
  doc.setTextColor(100)
  const fechaHoy    = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  const fechaValida = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(`Fecha: ${fechaHoy}`,          150, 30)
  doc.text(`Válida hasta: ${fechaValida}`, 150, 35)

  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text('Datos del cliente', 15, 45)
  doc.setFontSize(9)
  doc.setTextColor(80)

  if (datosCliente) {
    doc.text(`Nombre: ${datosCliente.nombre}`,     15, 52)
    doc.text(`Correo: ${datosCliente.correo}`,     15, 57)
    doc.text(`Teléfono: ${datosCliente.telefono}`, 15, 62)
    doc.text(`Ciudad: ${datosCliente.ciudad}`,     15, 67)
  }

  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text('Condiciones comerciales', 110, 45)
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text('• Los precios incluyen IVA.',                      110, 52)
  doc.text('• Esta cotización no representa orden de compra.', 110, 57)
  doc.text('• Sujeto a disponibilidad de inventario.',         110, 62)

  autoTable(doc, {
    startY: 75,
    head: [['Producto', 'Presentación', 'Cantidad', 'Precio Unitario', 'Subtotal']],
    body: productos.map(p => [
      p.nombre,
      p.presentacion || '-',
      p.cantidad,
      `$${p.precio.toLocaleString()}`,
      `$${(p.precio * p.cantidad).toLocaleString()}`
    ]),
    headStyles:          { fillColor: [45, 90, 39], textColor: 255, fontSize: 9 },
    bodyStyles:          { fontSize: 9 },
    alternateRowStyles:  { fillColor: [240, 247, 238] }
  })

  const finalY = doc.lastAutoTable.finalY + 10

  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(`Subtotal:`,                             130, finalY)
  doc.text(`$${subtotal.toLocaleString()}`,         175, finalY,      { align: 'right' })

  doc.setTextColor(45, 90, 39)
  doc.text(`Descuento (${(DESCUENTO * 100).toFixed(0)}%):`, 130, finalY + 6)
  doc.text(`- $${descuentoMonto.toLocaleString()}`, 175, finalY + 6,  { align: 'right' })

  doc.setTextColor(200, 0, 0)
  doc.text(`IVA (${(IVA * 100).toFixed(0)}%):`,    130, finalY + 12)
  doc.text(`$${ivaMonto.toLocaleString()}`,         175, finalY + 12, { align: 'right' })

  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL:`,                                130, finalY + 20)
  doc.text(`$${total.toLocaleString()}`,            175, finalY + 20, { align: 'right' })

  doc.save(`cotizacion-granova-${Date.now()}.pdf`)
}

const enviarPorCorreo = async () => {
  const clienteGuardado = JSON.parse(localStorage.getItem('cliente') || '{}')

  if (!clienteGuardado.email) {
    alert('No hay sesión activa')
    return
  }

  try {
      const res = await fetch(`${API_URL}/api/correo/cotizacion`, {      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:     clienteGuardado.email,
        nombre:    clienteGuardado.nombre,
        productos: productos.map(p => ({
          nombre:       p.nombre,
          presentacion: p.presentacion,
          cantidad:     p.cantidad,
          precio:       p.precio,
        })),
        subtotal,
        descuento: descuentoMonto,
        iva:       ivaMonto,
        total,
      })
    })

    const json = await res.json()

    if (json.ok) {
      alert('✅ Cotización enviada a ' + clienteGuardado.email)
    } else {
      alert('❌ Error: ' + json.mensaje)
    }

  } catch (error) {
    console.error('Error en CotizacionPage:', error)
    alert('❌ No se pudo conectar con el servidor')
  }
}

  return (
    
    <div className="min-h-screen px-4 sm:px-8 py-6" style={{ background: '#0a1a0a' }}>

      {/* Volver */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#9DC9B4] text-sm mb-6 hover:underline">
        ← Volver
      </button>

      {/* Documento (mantiene fondo claro: simula una cotización imprimible / para enviar por correo) */}
      <div className="max-w-3xl mx-auto bg-[#F7F2E8] rounded-xl p-6 sm:p-10 mb-8">

        {/* Logo y título */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-0 mb-6 text-center sm:text-left">
          <img src="/logoGranova.jpeg" alt="Logo Granova" className="w-16 h-16 object-contain rounded" />
          <h1 className="flex-1 text-center text-xl sm:text-2xl font-bold text-[#1a2e1a] tracking-widest sm:mt-4">
            COTIZACIÓN
          </h1>
        </div>

        {/* Fecha */}
        <div className="flex justify-center sm:justify-end mb-8">
          <div className="text-center sm:text-right text-xs text-[#3D3D3D]">
            <p><span className="font-semibold">Fecha:</span> {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><span className="font-semibold">Válida hasta:</span> {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Datos cliente */}
        <div className="flex gap-8 mb-8">
          <div className="flex-1 text-xs text-[#3D3D3D] flex flex-col gap-1">
            <p className="font-semibold mb-1">Datos del cliente</p>
            {(() => {
  const cliente = datosCliente || clienteSesion
  return cliente ? (
    <>
      <p>Nombre: {cliente.nombre} {cliente.apellido || ''}</p>
      <p>Correo: {cliente.email || cliente.correo || '—'}</p>
      <p>Teléfono: {datosCliente?.telefono || '—'}</p>
      <p>Dirección: {datosCliente?.direccion || '—'}</p>
      <p>Ciudad: {datosCliente?.ciudad || '—'}</p>
    </>
  ) : (
    <>
      <p>Nombre: —</p>
      <p>Correo: —</p>
      <p>Teléfono: —</p>
      <p>Dirección: —</p>
      <p>Ciudad: —</p>
    </>
  )
})()}
          </div>
        </div>

        {/* Tabla productos (scroll horizontal en móvil para que no se rompa el layout) */}
        <div className="overflow-x-auto mb-6 -mx-6 px-6 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="bg-[#1a2e1a]/10">
                <th className="text-left px-4 py-2 font-semibold text-[#1a2e1a]">Producto</th>
                <th className="text-left px-4 py-2 font-semibold text-[#1a2e1a]">Presentación</th>
                <th className="text-left px-4 py-2 font-semibold text-[#1a2e1a]">Cantidad</th>
                <th className="text-left px-4 py-2 font-semibold text-[#1a2e1a]">Precio unitario</th>
                <th className="text-left px-4 py-2 font-semibold text-[#1a2e1a]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b border-[#1a2e1a]/10">
                  <td className="px-4 py-2 text-[#3D3D3D]">{p.nombre}</td>
                  <td className="px-4 py-2 text-[#3D3D3D]">{p.presentacion}</td>
                  <td className="px-4 py-2 text-[#3D3D3D]">{p.cantidad}</td>
                  <td className="px-4 py-2 text-[#3D3D3D]">${p.precio.toLocaleString()}</td>
                  <td className="px-4 py-2 text-[#3D3D3D]">${(p.precio * p.cantidad).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="bg-white rounded-lg p-4 w-64 text-xs flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[#3D3D3D]">Subtotal</span>
              <span className="text-[#3D3D3D]">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1a2e1a]">Descuento ({(DESCUENTO * 100).toFixed(0)}%)</span>
              <span className="text-[#1a2e1a]">- ${descuentoMonto.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#D85A30]">IVA ({(IVA * 100).toFixed(0)}%)</span>
              <span className="text-[#D85A30]">${ivaMonto.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-[#E7E7E7] pt-2">
              <span className="font-semibold text-[#3D3D3D]">TOTAL:</span>
              <span className="font-semibold text-[#3D3D3D]">${total.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Botones */}
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
        <button 
        onClick={enviarPorCorreo}
        className="flex-1 border border-white/15 bg-white/[0.08] backdrop-blur-xl text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors">
          ✉️ Enviar por correo
        </button>
        <button 
        onClick={generarPDF}
        className="flex-1 border border-white/15 bg-white/[0.08] backdrop-blur-xl text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors">
          📄 Descargar PDF
        </button>
        <button
          onClick={() => navigate('/cliente/configurar-pedido')}
          className="flex-1 bg-[#6FA98C] text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4F8A70] transition-colors"
        >
          Confirmar pedido
        </button>
      </div>

    </div>
  )
}

export default CotizacionPage
