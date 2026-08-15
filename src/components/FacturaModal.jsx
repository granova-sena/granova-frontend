  import { useState, useEffect } from 'react'
  import { jsPDF } from 'jspdf'
  import autoTable from 'jspdf-autotable'
  import api from '../services/api'
  import { formatMoney, formatFecha } from '../utils/format'

  function FacturaModal({ idPedido, onClose }) {
    const [pedido, setPedido] = useState(null)
    const [error, setError] = useState(null)
    const [verMotivo, setVerMotivo] = useState(false)

    useEffect(() => {
      api.get(`/admin/pedidos/${idPedido}`)
        .then(res => setPedido(res.data.pedido))
        .catch(err => setError(err.response?.data?.error || err.message))
    }, [idPedido])

    const generarPDF = () => {
      if (!pedido) return
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.setTextColor(29, 158, 117)
      doc.text('Granova', 14, 18)
      doc.setFontSize(10)
      doc.setTextColor(90, 90, 90)
      doc.text('Café de origen colombiano', 14, 24)

      doc.setFontSize(11)
      doc.setTextColor(30, 30, 30)
      doc.text(`Factura: ${pedido.numero_factura}`, 150, 18, { align: 'right' })
      doc.text(`Fecha: ${formatFecha(pedido.fecha_emision)}`, 150, 24, { align: 'right' })

      doc.setDrawColor(220, 220, 220)
      doc.line(14, 30, 196, 30)

      doc.setFontSize(11)
      doc.text('Cliente:', 14, 38)
      doc.setFontSize(10)
      doc.text(pedido.cliente, 14, 44)
      doc.text(pedido.email, 14, 49)

      autoTable(doc, {
        startY: 56,
        head: [['Producto', 'Cantidad', 'Precio unit.', 'Subtotal']],
        body: pedido.items.map(it => [
          it.nombre,
          `${it.cantidad} kg`,
          formatMoney(it.precio_unitario),
          formatMoney(it.subtotal),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [29, 158, 117] },
      })

      const finalY = doc.lastAutoTable.finalY + 8
      doc.setFontSize(10)
      doc.text(`Subtotal: ${formatMoney(pedido.subtotal)}`, 150, finalY, { align: 'right' })
      doc.text(`Impuestos: ${formatMoney(pedido.impuestos)}`, 150, finalY + 6, { align: 'right' })
      doc.setFontSize(12)
      doc.text(`Total: ${formatMoney(pedido.total)}`, 150, finalY + 14, { align: 'right' })

      const mensajeY = finalY + 28
      if (pedido.estado === 'Rechazado') {
        doc.setFontSize(11)
        doc.setTextColor(180, 40, 40)
        doc.text('Tu pedido fue rechazado.', 14, mensajeY, { maxWidth: 182 })
        if (pedido.motivo_rechazo) {
          doc.setFontSize(9)
          doc.setTextColor(120, 120, 120)
          doc.text(`Motivo: ${pedido.motivo_rechazo}`, 14, mensajeY + 7, { maxWidth: 182 })
        }
      } else {
        doc.setFontSize(12)
        doc.setTextColor(29, 158, 117)
        doc.text('¡Gracias por tu compra!', 14, mensajeY)
      }

      doc.save(`factura-${pedido.numero_factura}.pdf`)
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Factura</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generarPDF}
                disabled={!pedido}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50"
              >
                🖨 Imprimir
              </button>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
          </div>

          {error && (
            <div className="p-6 text-sm text-red-600">{error}</div>
          )}

          {!pedido && !error && (
            <div className="p-6 text-sm text-gray-400">Cargando factura...</div>
          )}

          {pedido && (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#1D9E75]">Granova</p>
                  <p className="text-xs text-gray-400">Café de origen colombiano</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-800 font-medium">{pedido.numero_factura}</p>
                  <p className="text-gray-400 text-xs">{formatFecha(pedido.fecha_emision)}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-1">Cliente</p>
                <p className="text-sm text-gray-800">{pedido.cliente}</p>
                <p className="text-xs text-gray-400">{pedido.email}</p>
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
                    {pedido.items.map((it, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-2 px-3 text-gray-700">{it.nombre}</td>
                        <td className="py-2 px-3 text-gray-600">{it.cantidad} kg</td>
                        <td className="py-2 px-3 text-gray-600">{formatMoney(it.precio_unitario)}</td>
                        <td className="py-2 px-3 text-gray-800 text-right">{formatMoney(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-end gap-1 text-sm">
                <p className="text-gray-500">Subtotal: <span className="text-gray-800">{formatMoney(pedido.subtotal)}</span></p>
                <p className="text-gray-500">Impuestos: <span className="text-gray-800">{formatMoney(pedido.impuestos)}</span></p>
                <p className="text-base font-semibold text-gray-800">Total: {formatMoney(pedido.total)}</p>
              </div>

              {pedido.estado === 'Rechazado' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm font-semibold">Tu pedido fue rechazado</p>
                  <button
                    type="button"
                    onClick={() => setVerMotivo((v) => !v)}
                    className="text-red-500 text-xs font-medium mt-1.5 hover:underline"
                  >
                    {verMotivo ? '← Ocultar' : 'Ver más →'}
                  </button>
                  {verMotivo && (
                    <p className="text-sm text-red-600/90 mt-2 pt-2 border-t border-red-200">
                      {pedido.motivo_rechazo || 'No se indicó un motivo específico.'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/30 text-[#1D9E75] text-sm rounded-lg px-4 py-3 font-medium">
                  ¡Gracias por tu compra!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  export default FacturaModal