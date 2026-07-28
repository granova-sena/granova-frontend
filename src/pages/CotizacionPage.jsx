import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'

function CotizacionPage() {
  const navigate = useNavigate()
  const { productos, subtotal, descuentoMonto, ivaMonto, total, DESCUENTO, IVA, datosCliente } = useCarrito()

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6" style={{ background: '#0a1a0a' }}>

      {/* Volver */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#9DC9B4] text-sm mb-6 hover:underline">
        ← Volver
      </button>

      {/* Documento (mantiene fondo claro: simula una cotización imprimible / para enviar por correo) */}
      <div className="max-w-3xl mx-auto bg-[#F7F2E8] rounded-xl p-6 sm:p-10 mb-8">

        {/* Logo y título */}
        <div className="flex items-start mb-6">
          <img src="/logoGranova.jpeg" alt="Logo Granova" className="w-16 h-16 object-contain rounded" />
          <h1 className="flex-1 text-center text-2xl font-bold text-[#1a2e1a] tracking-widest mt-4">
            COTIZACIÓN
          </h1>
        </div>

        {/* Fecha */}
        <div className="flex justify-end mb-8">
          <div className="text-right text-xs text-[#3D3D3D]">
            <p><span className="font-semibold">Fecha:</span> {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><span className="font-semibold">Válida hasta:</span> {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Datos cliente */}
        <div className="flex gap-8 mb-8">
          <div className="flex-1 text-xs text-[#3D3D3D] flex flex-col gap-1">
            <p className="font-semibold mb-1">Datos del cliente</p>
            {datosCliente ? (
              <>
                <p>Nombre: {datosCliente.nombre}</p>
                <p>Correo: {datosCliente.correo}</p>
                <p>Teléfono: {datosCliente.telefono}</p>
                <p>Dirección: {datosCliente.direccion}</p>
                <p>Ciudad: {datosCliente.ciudad}</p>
              </>
            ) : (
              <>
                <p>Nombre: —</p>
                <p>Correo: —</p>
                <p>Teléfono: —</p>
              </>
            )}
          </div>
        </div>

        {/* Tabla productos */}
        <table className="w-full text-xs mb-6">
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
        <button className="flex-1 border border-white/15 bg-white/[0.08] backdrop-blur-xl text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors">
          ✉️ Enviar por correo
        </button>
        <button className="flex-1 border border-white/15 bg-white/[0.08] backdrop-blur-xl text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.14] transition-colors">
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
