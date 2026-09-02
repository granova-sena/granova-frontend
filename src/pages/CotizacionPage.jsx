import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'
import { API_URL } from '../config'
import api from '../services/api'
import LogoGranova from '../components/ui/LogoGranova'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

const INFO_GRANOVA = {
  nombre: 'GRANOVA',
  lema: 'Café de origen colombiano',
  nit: 'NIT 000.000.000-0',
  direccion: 'Colombia',
  telefono: '+57 300 000 0000',
  email: 'ventas@granovaoficial.com',
}

const DIAS_VALIDEZ = 8

function numeroCotizacion() {
  const ahora = new Date()
  const aa = ahora.getFullYear()
  const seq = String(ahora.getTime()).slice(-6)
  return `COT-${aa}-${seq}`
}

function CotizacionPage() {
  const navigate = useNavigate()
  const { productos, subtotal, descuentoMonto, total, DESCUENTO, datosCliente, cliente } = useCarrito()

  const [guardando, setGuardando] = useState(false)
  const [misCotizaciones, setMisCotizaciones] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  const clienteSesion = (() => {
    try {
      return JSON.parse(localStorage.getItem('cliente')) || null
    } catch {
      return null
    }
  })()

  useEffect(() => {
    if (!clienteSesion) return
    let activo = true
    setCargandoHistorial(true)
    api.get('/cotizaciones')
      .then(({ data }) => {
        if (activo && data?.ok) setMisCotizaciones(data.cotizaciones || [])
      })
      .catch(() => {
        if (activo) setMisCotizaciones([])
      })
      .finally(() => {
        if (activo) setCargandoHistorial(false)
      })
    return () => { activo = false }
  }, [])

  const guardarCotizacion = async () => {
    if (!clienteSesion) {
      toast.error('Inicia sesión para guardar tu cotización')
      return
    }
    if (productos.length === 0) return
    setGuardando(true)
    try {
      const { data } = await api.post('/cotizaciones', {
        numero_cotizacion: numero,
        items: productos.map(p => ({
          id_producto: p.id,
          nombre: p.nombre,
          presentacion: p.presentacion || p.etiqueta_formato || null,
          cantidad: Number(p.cantidad ?? p.cant ?? 1),
          precio: Number(p.precio),
          subtotal: Number(p.precio) * Number(p.cantidad ?? p.cant ?? 1),
        })),
        subtotal,
        descuento: descuentoMonto,
        total,
        validez_dias: DIAS_VALIDEZ,
      })
      if (data?.ok) {
        toast.success(`Cotización ${numero} guardada`)
        api.get('/cotizaciones')
          .then(({ data: historial }) => {
            if (historial?.ok) setMisCotizaciones(historial.cotizaciones || [])
          })
          .catch(() => {})
      } else {
        toast.error(data?.error || 'No se pudo guardar la cotización')
      }
    } catch (error) {
      console.error('Error guardando cotización:', error)
      toast.error(error?.response?.data?.error || 'No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const infoCliente = {
    nombre: datosCliente?.nombre || clienteSesion?.nombre || '—',
    apellido: clienteSesion?.apellido || '',
    razonSocial: clienteSesion?.razon_social || cliente?.razon_social || null,
    email: datosCliente?.correo || clienteSesion?.email || '—',
    telefono: datosCliente?.telefono || '—',
    direccion: datosCliente?.direccion || '—',
    ciudad: datosCliente?.ciudad || '—',
    nit: clienteSesion?.numero_documento || null,
  }

  const fechaHoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  const fechaValida = new Date(Date.now() + DIAS_VALIDEZ * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  const numero = numeroCotizacion()

  const generarPDF = () => {
    const doc = new jsPDF()
    const verde = [45, 90, 39]

    // Cabecera
    doc.setFillColor(verde[0], verde[1], verde[2])
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('GRANOVA', 14, 13)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(INFO_GRANOVA.lema, 14, 19)
    doc.text(`NIT: ${INFO_GRANOVA.nit}`, 14, 24)
    doc.text(`${INFO_GRANOVA.direccion} · ${INFO_GRANOVA.telefono}`, 14, 28)
    doc.text(INFO_GRANOVA.email, 14, 32)
    doc.text('COTIZACIÓN', 196, 16, { align: 'right' })
    doc.setFontSize(9)
    doc.text(`N° ${numero}`, 196, 22, { align: 'right' })
    doc.text(`Fecha: ${fechaHoy}`, 196, 27, { align: 'right' })
    doc.text(`Válida hasta: ${fechaValida}`, 196, 32, { align: 'right' })

    // Datos del cliente
    doc.setTextColor(0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Datos del cliente', 14, 46)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Cliente: ${infoCliente.razonSocial || `${infoCliente.nombre} ${infoCliente.apellido}`}`, 14, 52)
    if (infoCliente.nit) doc.text(`NIT/Documento: ${infoCliente.nit}`, 14, 57)
    doc.text(`Correo: ${infoCliente.email}`, 14, 62)
    doc.text(`Teléfono: ${infoCliente.telefono}`, 14, 67)
    if (infoCliente.ciudad !== '—') doc.text(`Ciudad: ${infoCliente.ciudad}`, 14, 72)

    // Tabla
    autoTable(doc, {
      startY: 80,
      head: [['Producto', 'Presentación', 'Cantidad', 'Precio unitario', 'Subtotal']],
      body: productos.map(p => [
        p.nombre,
        p.presentacion || p.etiqueta_formato || '-',
        p.cantidad ?? p.cant ?? 1,
        `$${Number(p.precio).toLocaleString('es-CO')}`,
        `$${(Number(p.precio) * Number(p.cantidad ?? p.cant ?? 1)).toLocaleString('es-CO')}`,
      ]),
      headStyles: { fillColor: verde, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 247, 238] },
    })

    const finalY = doc.lastAutoTable.finalY + 12

    // Totales
    doc.setFontSize(9)
    doc.text(`Subtotal:`, 120, finalY)
    doc.text(`$${subtotal.toLocaleString('es-CO')}`, 196, finalY, { align: 'right' })
    if (descuentoMonto > 0) {
      doc.text(`Descuento (${(DESCUENTO * 100).toFixed(0)}%):`, 120, finalY + 6)
      doc.text(`- $${descuentoMonto.toLocaleString('es-CO')}`, 196, finalY + 6, { align: 'right' })
    }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL (IVA incluido):`, 120, finalY + 14)
    doc.text(`$${total.toLocaleString('es-CO')}`, 196, finalY + 14, { align: 'right' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('* Todos los precios incluyen IVA.', 120, finalY + 19)

    // Condiciones
    doc.setFontSize(8)
    doc.setTextColor(80)
    doc.text('Condiciones comerciales:', 14, finalY + 30)
    doc.text('• Esta cotización no representa una orden de compra.', 14, finalY + 36)
    doc.text(`• Validez de la oferta: ${DIAS_VALIDEZ} días calendario a partir de la fecha de emisión.`, 14, finalY + 41)
    doc.text('• Sujeto a disponibilidad de inventario al momento de confirmar el pedido.', 14, finalY + 46)

    doc.save(`cotizacion-granova-${numero}.pdf`)
  }

  const enviarPorCorreo = async () => {
    if (!clienteSesion?.email) {
      toast.error('No hay sesión activa')
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/correo/cotizacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clienteSesion.email,
          nombre: clienteSesion.nombre,
          numero,
          productos: productos.map(p => ({
            nombre: p.nombre,
            presentacion: p.presentacion,
            cantidad: p.cantidad ?? p.cant ?? 1,
            precio: p.precio,
          })),
          subtotal,
          descuento: descuentoMonto,
          total,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        toast.success('Cotización enviada a ' + clienteSesion.email)
      } else {
        toast.error(json.mensaje)
      }
    } catch (error) {
      console.error('Error en CotizacionPage:', error)
      toast.error('No se pudo conectar con el servidor')
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6" style={{ background: '#0a1a0a' }}>
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#9DC9B4] text-sm mb-6 hover:underline">
        ← Volver
      </button>

      {productos.length === 0 ? (
        <div className="max-w-2xl mx-auto bg-[#FDFBF5] rounded-2xl p-10 text-center shadow-2xl">
          <p className="text-xl font-bold text-[#1a2e1a] mb-2">No hay productos para cotizar</p>
          <p className="text-sm text-[#3D3D3D]/70 mb-6">
            Agrega productos a tu carrito para generar la cotización.
          </p>
          <button
            type="button"
            onClick={() => navigate('/cliente/catalogo')}
            className="bg-[#6FA98C] text-white text-sm px-6 py-3 rounded-xl hover:bg-[#4F8A70] transition-colors"
          >
            Ir al catálogo
          </button>
        </div>
      ) : (
      <>

      {/* ── Documento ── */}
      <div className="max-w-4xl mx-auto bg-[#FDFBF5] rounded-xl overflow-hidden shadow-2xl mb-8">
        {/* Cabecera verde */}
        <div className="px-6 sm:px-10 py-8" style={{ background: '#1a2e1a' }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <LogoGranova tamano="lg" fondo="blanco" mostrarTexto={false} />
                <div>
                  <p className="text-2xl font-bold text-white tracking-widest">GRANOVA</p>
                  <p className="text-[11px] text-white/60">{INFO_GRANOVA.lema}</p>
                </div>
              </div>
              <div className="mt-4 text-[11px] text-white/60 leading-relaxed">
                <p>{INFO_GRANOVA.nit}</p>
                <p>{INFO_GRANOVA.direccion}</p>
                <p>{INFO_GRANOVA.telefono} · {INFO_GRANOVA.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white tracking-widest">COTIZACIÓN</p>
              <div className="mt-3 text-[11px] text-white/70 flex flex-col gap-1">
                <p><span className="text-white/45">N°:</span> {numero}</p>
                <p><span className="text-white/45">Fecha:</span> {fechaHoy}</p>
                <p><span className="text-white/45">Válida hasta:</span> {fechaValida}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-8">
          {/* Datos del cliente */}
          <div className="rounded-xl border border-[#1a2e1a]/15 bg-white p-5 mb-8">
            <p className="text-xs font-bold text-[#1a2e1a] uppercase tracking-wide mb-3">Datos del cliente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[13px] text-[#3D3D3D]">
              <p><span className="text-[#3D3D3D]/50">Cliente:</span> {infoCliente.razonSocial || `${infoCliente.nombre} ${infoCliente.apellido}`}</p>
              {infoCliente.nit && <p><span className="text-[#3D3D3D]/50">NIT/Documento:</span> {infoCliente.nit}</p>}
              <p><span className="text-[#3D3D3D]/50">Correo:</span> {infoCliente.email}</p>
              <p><span className="text-[#3D3D3D]/50">Teléfono:</span> {infoCliente.telefono}</p>
              {infoCliente.direccion !== '—' && <p><span className="text-[#3D3D3D]/50">Dirección:</span> {infoCliente.direccion}</p>}
              {infoCliente.ciudad !== '—' && <p><span className="text-[#3D3D3D]/50">Ciudad:</span> {infoCliente.ciudad}</p>}
            </div>
          </div>

          {/* Tabla productos */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full min-w-[540px] text-[13px]">
              <thead>
                <tr className="bg-[#1a2e1a]/[0.07]">
                  <th className="text-left px-4 py-3 font-semibold text-[#1a2e1a]">Producto</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a2e1a]">Presentación</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#1a2e1a]">Cantidad</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#1a2e1a]">Precio unitario</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#1a2e1a]">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const cant = Number(p.cantidad ?? p.cant ?? 1)
                  return (
                    <tr key={p.id} className="border-b border-[#1a2e1a]/10">
                      <td className="px-4 py-3 text-[#3D3D3D] font-medium">{p.nombre}</td>
                      <td className="px-4 py-3 text-[#3D3D3D]">{p.presentacion || p.etiqueta_formato || '—'}</td>
                      <td className="px-4 py-3 text-center text-[#3D3D3D]">{cant}</td>
                      <td className="px-4 py-3 text-right text-[#3D3D3D]">${Number(p.precio).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3 text-right text-[#3D3D3D] font-semibold">${(Number(p.precio) * cant).toLocaleString('es-CO')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex flex-col sm:flex-row gap-6 sm:justify-between items-start sm:items-end">
            <div className="text-[11px] text-[#3D3D3D]/60 leading-relaxed">
              <p className="font-bold text-[#1a2e1a] uppercase tracking-wide text-xs mb-1">Condiciones comerciales</p>
              <p>• Esta cotización no representa una orden de compra.</p>
              <p>• Validez de la oferta: {DIAS_VALIDEZ} días calendario a partir de la fecha de emisión.</p>
              <p>• Sujeto a disponibilidad de inventario al momento de confirmar el pedido.</p>
            </div>
            <div className="w-72 bg-white rounded-xl border border-[#1a2e1a]/15 p-5 text-[13px] flex flex-col gap-2">
              <div className="flex justify-between text-[#3D3D3D]">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-CO')}</span>
              </div>
              {descuentoMonto > 0 && (
                <div className="flex justify-between text-[#1a2e1a]">
                  <span>Descuento ({(DESCUENTO * 100).toFixed(0)}%)</span>
                  <span>- ${descuentoMonto.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E7E7E7] pt-3 font-bold text-[#1a2e1a] text-sm">
                <span>TOTAL:</span>
                <span>${total.toLocaleString('es-CO')}</span>
              </div>
              <p className="text-[10px] text-[#3D3D3D]/50 text-right">* Todos los precios incluyen IVA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={enviarPorCorreo}
          className="flex-1 border border-white/15 bg-white/[0.08] backdrop-blur-xl text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors"
        >
          ✉️ Enviar por correo
        </button>
        <button
          type="button"
          onClick={generarPDF}
          className="flex-1 border border-white/15 bg-white/[0.08] backdrop-blur-xl text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors"
        >
          📄 Descargar PDF
        </button>
        <button
          type="button"
          onClick={guardarCotizacion}
          disabled={guardando || productos.length === 0}
          className="flex-1 bg-[#B8860B] text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#9d740a] transition-colors disabled:opacity-60"
        >
          💾 {guardando ? 'Guardando...' : 'Guardar cotización'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/cliente/configurar-pedido')}
          className="flex-1 bg-[#6FA98C] text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4F8A70] transition-colors"
        >
          Confirmar pedido
        </button>
      </div>

      {/* ── Historial ── */}
      {clienteSesion && (
        <div className="max-w-4xl mx-auto mt-10 mb-4">
          <p className="text-white font-semibold text-sm mb-3">📂 Mis cotizaciones guardadas</p>
          {cargandoHistorial ? (
            <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6 text-white/50 text-sm">Cargando…</div>
          ) : misCotizaciones.length === 0 ? (
            <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6 text-white/50 text-sm">
              Aún no tienes cotizaciones guardadas.
            </div>
          ) : (
            <div className="bg-white/[0.05] border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.08]">
                    <th className="text-left px-4 py-3 font-semibold text-white/80">N°</th>
                    <th className="text-left px-4 py-3 font-semibold text-white/80">Fecha</th>
                    <th className="text-right px-4 py-3 font-semibold text-white/80">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-white/80">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {misCotizaciones.map((c) => (
                    <tr key={c.id_cotizacion} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white/90">{c.numero_cotizacion || `COT-${c.id_cotizacion}`}</td>
                      <td className="px-4 py-3 text-white/60">
                        {new Date(c.creada_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right text-white/90">
                        ${Number(c.total).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={
                          c.estado === 'aceptada' ? 'text-emerald-300'
                          : c.estado === 'vencida' ? 'text-amber-300'
                          : c.estado === 'anulada' ? 'text-red-300'
                          : 'text-sky-300'
                        }>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  )
}

export default CotizacionPage
