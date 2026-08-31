  import { useState, useEffect } from 'react'
  import { jsPDF } from 'jspdf'
  import autoTable from 'jspdf-autotable'
  import api from '../services/api'
  import { formatMoney, formatFecha } from '../utils/format'
  import ErrorModal from './ui/ErrorModal'

  function FacturaModal({ idPedido, onClose }) {
    const [factura, setFactura] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
      api.get(`/facturas/${idPedido}`)
        .then(res => setFactura(res.data.data))
        .catch(err => setError(err.response?.data?.error || err.message))
    }, [idPedido])

    // Compatibilidad con campos nuevos del contrato y sus versiones previas.
    const nFactura = factura?.numero_factura || factura?.pedido?.numero_factura || `FE-${idPedido}`
    const fecha = factura?.fecha || factura?.fecha_emision
    const subtotal = Number(factura?.subtotal ?? factura?.pedido?.subtotal ?? 0)
    const impuestos = Number(factura?.impuestos ?? factura?.pedido?.impuestos ?? 0)
    const total = Number(factura?.total ?? factura?.pedido?.total ?? 0)
    const estadoPago = factura?.estado_pago
    const impuestosPorTasa = factura?.impuestos_por_tasa || []
    const productos = factura?.productos || factura?.pedido?.items || []

    // Datos fiscales
    const tipoPersona = factura?.tipo_persona
    const numeroDocumento = factura?.numero_documento
    const razonSocial = factura?.razon_social
    const email = factura?.email
    const nombreCliente = factura?.razon_social || factura?.pedido?.cliente || ''

    const generarPDF = () => {
      if (!factura) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.setTextColor(29, 158, 117)
      doc.text('Granova', 14, 18)
      doc.setFontSize(10)
      doc.setTextColor(90, 90, 90)
      doc.text('Café de origen colombiano', 14, 24)

      doc.setFontSize(11)
      doc.setTextColor(30, 30, 30)
      doc.text(`Factura: ${nFactura}`, 150, 18, { align: 'right' })
      if (fecha) doc.text(`Fecha: ${formatFecha(fecha)}`, 150, 24, { align: 'right' })

      doc.setDrawColor(220, 220, 220)
      doc.line(14, 30, 196, 30)

      doc.setFontSize(11)
      doc.text('Datos fiscales:', 14, 38)
      doc.setFontSize(10)
      doc.text(`Tipo de persona: ${tipoPersona || '—'}`, 14, 44)
      doc.text(`N° documento: ${numeroDocumento || '—'}`, 14, 49)
      doc.text(`${razonSocial ? 'Razón social: ' : 'Nombre: '}${razonSocial || nombreCliente || '—'}`, 14, 54)
      if (email) doc.text(`Email: ${email}`, 14, 59)

      let startY = fecha || tipoPersona ? 68 : 62
      autoTable(doc, {
        startY,
        head: [['Producto', 'Cantidad', 'Precio unit.', 'Subtotal']],
        body: (productos || []).map(it => [
          it.producto_nombre || it.nombre,
          `${it.cantidad} ${it.producto_presentacion ? 'bolsa(s)' : 'unid.'}`,
          formatMoney(it.precio_unitario),
          formatMoney(it.subtotal),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [29, 158, 117] },
      })

      const finalY = doc.lastAutoTable.finalY + 8
      doc.setFontSize(10)
      doc.text(`Subtotal: ${formatMoney(subtotal)}`, 150, finalY, { align: 'right' })
      doc.text(`Impuestos: ${formatMoney(impuestos)}`, 150, finalY + 6, { align: 'right' })
      if (impuestosPorTasa.length > 0) {
        impuestosPorTasa.forEach((t, i) => {
          doc.text(`IVA ${t.tasa}%: ${formatMoney(t.valor)}`, 150, finalY + 12 + i * 5, { align: 'right' })
        })
      }
      doc.setFontSize(12)
      doc.text(`Total: ${formatMoney(total)}`, 150, finalY + 12 + impuestosPorTasa.length * 5 + 6, { align: 'right' })

      if (estadoPago) {
        const estadoY = finalY + 28 + impuestosPorTasa.length * 5
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.text(`Estado de pago: ${estadoPago === 'pagado' ? 'Pagado' : estadoPago}`, 14, estadoY)
      }
      doc.setTextColor(29, 158, 117)
      doc.setFontSize(12)
      doc.text('¡Gracias por tu compra!', 14, (estadoPago ? finalY + 36 : finalY + 28) + impuestosPorTasa.length * 5)

      doc.save(`factura-${nFactura}.pdf`)
    }

    return (
      <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Factura</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generarPDF}
                disabled={!factura}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition disabled:opacity-50"
              >
                🖨 Imprimir
              </button>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
          </div>

          {!factura && !error && (
            <div className="p-6 text-sm text-gray-400">Cargando factura...</div>
          )}

          {factura && (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#6FA98C]">Granova</p>
                  <p className="text-xs text-gray-400">Café de origen colombiano</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-800 font-medium">{nFactura}</p>
                  {fecha && <p className="text-gray-400 text-xs">{formatFecha(fecha)}</p>}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-1">Datos fiscales</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <p className="text-gray-700">Tipo de persona</p>
                  <p className="text-gray-800 capitalize">{tipoPersona || '—'}</p>
                  <p className="text-gray-700">N° documento</p>
                  <p className="text-gray-800">{numeroDocumento || '—'}</p>
                  <p className="text-gray-700">{razonSocial ? 'Razón social' : 'Nombre'}</p>
                  <p className="text-gray-800">{razonSocial || nombreCliente || '—'}</p>
                  {email && (<>
                    <p className="text-gray-700">Email</p>
                    <p className="text-gray-800">{email}</p>
                  </>)}
                </div>
              </div>

              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-left">
                      <th className="py-2 px-3 font-medium">Producto</th>
                      <th className="py-2 px-3 font-medium">Cant.</th>
                      <th className="py-2 px-3 font-medium">Precio</th>
                      <th className="py-2 px-3 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(productos || []).map((it, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-2 px-3 text-gray-700">{it.producto_nombre || it.nombre}</td>
                        <td className="py-2 px-3 text-gray-600">{it.cantidad} {it.producto_presentacion ? 'bolsa(s)' : 'unid.'}</td>
                        <td className="py-2 px-3 text-gray-600">{formatMoney(it.precio_unitario)}</td>
                        <td className="py-2 px-3 text-gray-800 text-right">{formatMoney(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-end gap-1 text-sm">
                <p className="text-gray-500">Subtotal: <span className="text-gray-800">{formatMoney(subtotal)}</span></p>
                <p className="text-gray-500">Impuestos: <span className="text-gray-800">{formatMoney(impuestos)}</span></p>
                {impuestosPorTasa.length > 0 && impuestosPorTasa.map((t, i) => (
                  <p key={i} className="text-gray-500">IVA {t.tasa}%: <span className="text-gray-800">{formatMoney(t.valor)}</span></p>
                ))}
                <p className="text-base font-semibold text-gray-800">Total: {formatMoney(total)}</p>
              </div>

              {estadoPago && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Estado de pago</span>
                  <span className={`font-medium ${estadoPago === 'pagado' ? 'text-[#6FA98C]' : 'text-amber-600'}`}>
                    {estadoPago === 'pagado' ? '💚 Pagado' : estadoPago}
                  </span>
                </div>
              )}

              <div className="bg-[#6FA98C]/10 border border-[#6FA98C]/30 text-[#6FA98C] text-sm rounded-lg px-4 py-3 font-medium">
                ¡Gracias por tu compra!
              </div>
            </div>
          )}
        </div>
      </div>

      <ErrorModal mensaje={error} onClose={() => setError(null)} />
      </>
    )
  }

  export default FacturaModal