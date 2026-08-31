import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from "../config";
import { idDeTokenCliente } from '../services/session'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SkeletonRow } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import FadeIn from '../components/ui/FadeIn';
import OrderStepper from '../components/ui/OrderStepper';
import EstadoPagoBadge from '../components/ui/EstadoPagoBadge';

const METODOS_PASARELA = ['tarjeta', 'pse', 'nequi', 'daviplata']
const esMetodoPasarela = (metodo) => METODOS_PASARELA.includes(String(metodo || '').toLowerCase())

function necesitaPagar(p) {
  if (p.estado_pago === 'fallido') return true
  if (p.estado_pago === 'pendiente' && esMetodoPasarela(p.metodo_pago)) return true
  return false
}

const descargarFactura = async (id_pedido) => {
  try {
      const token = localStorage.getItem('token_cliente') // ← mover aquí arriba

    // Genera la factura si no existe
    await fetch(`${API_URL}/api/facturas`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:    JSON.stringify({ id_pedido })
    })

    // Obtiene la factura
    const res  = await fetch(`${API_URL}/api/facturas/${id_pedido}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
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
    const fechaEmision = factura.fecha_emision || factura.fecha
    doc.text(`Fecha: ${new Date(fechaEmision).toLocaleDateString('es-CO')}`, 150, 35)

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text('Datos fiscales', 15, 45)
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`Tipo de persona: ${factura.tipo_persona || '—'}`, 15, 52)
    doc.text(`N° documento: ${factura.numero_documento || '—'}`, 15, 57)
    doc.text(`Razón social / Nombre: ${factura.razon_social || `${factura.nombre_cliente || ''} ${factura.apellido_cliente || ''}`.trim() || '—'}`, 15, 62)
    doc.text(`Email: ${factura.email || factura.email_cliente || '—'}`, 15, 67)

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text('Datos del pedido', 110, 45)
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`Método de pago: ${factura.metodo_pago || '—'}`, 110, 52)
    doc.text(`Estado: ${factura.estado_pedido || factura.pedido?.estado || '—'}`, 110, 57)
    if (factura.estado_pago) {
      doc.text(`Estado de pago: ${factura.estado_pago === 'pagado' ? 'Pagado' : factura.estado_pago}`, 110, 62)
    }

    autoTable(doc, {
      startY: 75,
      head: [['Producto', 'Presentación', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: (factura.productos || []).map(p => [
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

    if (factura.descuento > 0) {
      doc.setTextColor(200, 0, 0)
      doc.text('Descuento:', 130, finalY + 6)
      doc.text(`-$${Number(factura.descuento).toLocaleString()}`, 175, finalY + 6, { align: 'right' })
    }

    // Desglose de IVA por tasa
    const tasaInicio = finalY + 12
    if (Array.isArray(factura.impuestos_por_tasa) && factura.impuestos_por_tasa.length > 0) {
      factura.impuestos_por_tasa.forEach((t, i) => {
        doc.text(`IVA ${t.tasa}%:`, 130, tasaInicio + i * 6)
        doc.text(`$${Number(t.valor).toLocaleString()}`, 175, tasaInicio + i * 6, { align: 'right' })
      })
    } else {
      doc.text('Impuestos:', 130, tasaInicio)
      doc.text(`$${Number(factura.impuestos || 0).toLocaleString()}`, 175, tasaInicio, { align: 'right' })
    }

    doc.setTextColor(0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', 130, tasaInicio + 10)
    doc.text(`$${Number(factura.total).toLocaleString()}`, 175, tasaInicio + 10, { align: 'right' })

    doc.save(`factura-${factura.numero_factura}.pdf`)

  } catch (error) {
    console.error('Error descargando factura:', error.message)
    toast.error('No se pudo generar la factura')  }
}

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

function MisPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState({ totalPages: 1, totalRows: 0 })

  useEffect(() => {
    const id_cliente = idDeTokenCliente()
    if (!id_cliente) {
      setCargando(false)
      return
    }

    let cancelado = false
    async function cargarPedidos() {
      try {
        setCargando(true)
        const token = localStorage.getItem('token_cliente')
        const res = await fetch(`${API_URL}/api/pedidos/cliente/${id_cliente}?page=${pagina}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.mensaje)
        if (!cancelado) {
          setPedidos(json.data)
          setPaginacion(json.paginacion || { totalPages: 1, totalRows: 0 })
        }
      } catch (err) {
        if (!cancelado) setError(err.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    cargarPedidos()
    return () => { cancelado = true }
  }, [pagina])

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const formatearNumero = (id) =>
    `PED-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`

  return (
    <div className="min-h-screen" style={{ background: '#0a1a0a' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
        <span className="text-xs font-medium text-[#9DC9B4] uppercase tracking-wide">Historial</span>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold mt-2 tracking-tight">Mis pedidos</h1>
        </div>
        <div className="h-8 sm:h-10" />

            {cargando && (
          <div className="rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm divide-y divide-white/10">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
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
              type="button"
              onClick={() => navigate('/cliente/catalogo')}
              className="px-6 py-3 bg-[#6FA98C] text-white rounded-xl text-sm font-medium hover:bg-[#4F8A70] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FA98C] focus-visible:ring-offset-2"
            >
              Explorar catálogo
            </button>
          </div>
        )}

        {!cargando && !error && pedidos.length > 0 && (
        <FadeIn>
        <div className="rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm divide-y divide-white/10">
          {pedidos.map((p) => (
            <div key={p.id_pedido} className="px-5 sm:px-6 py-4 hover:bg-white/[0.06] transition flex flex-wrap items-center gap-3">
              
              {/* Info del pedido — navega al detalle */}
              <button
                type="button"
                onClick={() => navigate(`/cliente/pedidos/${p.id_pedido}`)}
                className="flex-1 text-left min-w-[140px]"
              >
                <p className="text-sm font-medium text-white">{formatearNumero(p.id_pedido)}</p>
                <p className="text-xs text-white/40 mt-0.5">{formatearFecha(p.fecha_pedido)}</p>
                <div className="mt-2">
                  <EstadoPagoBadge estadoPago={p.estado_pago} />
                </div>
              </button>

              <div className="flex items-center gap-4 ml-auto">
                <div className="hidden sm:block">
                  <OrderStepper estado={p.estado} compacto />
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${estadoTexto[p.estado] || 'text-white/50'}`}>
                    {estadoLabel[p.estado] || p.estado}
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    ${Number(p.total).toLocaleString('es-CO')}
                  </p>
                </div>
                {necesitaPagar(p) ? (
                  <button onClick={() => navigate(`/cliente/pedidos/${p.id_pedido}`)}>
                    💳 Pagar ahora
                  </button>
                ) : p.estado_pago === 'pagado' ? (
                  <button onClick={() => descargarFactura(p.id_pedido)}>
                    ⬇️
                  </button>
                ) : (
                  <span className="text-xs text-white/30">Verificando pago</span>
                )}
                
              </div>

            </div>
          ))}
        </div>
        </FadeIn>
        )}

        {paginacion.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <button
              type="button"
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.08] text-white/70 hover:bg-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>
            <span className="text-xs text-white/40">
              Página {pagina} de {paginacion.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPagina(p => Math.min(paginacion.totalPages, p + 1))}
              disabled={pagina >= paginacion.totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.08] text-white/70 hover:bg-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Siguiente →
            </button>
          </div>
        )}

        <FadeIn>
        <div className="mt-6 rounded-2xl p-6 sm:p-8 bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-sm">
          <p className="text-sm font-semibold text-white mb-6">Así se ve el seguimiento de tu pedido</p>
          <OrderStepper estado="enviado" />
        </div>
        </FadeIn>
      </div>
    </div>
  )
}

export default MisPedidos
