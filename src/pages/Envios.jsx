import { useState, useEffect } from 'react'
import { useModalBehavior } from '../hooks/useModalBehavior'
import api from '../services/api'
import { bloquearNoNumerico, normalizarNumerico } from '../utils/validacion'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorModal from '../components/ui/ErrorModal'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'

function esAdmin() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.rol === 'admin'
  } catch {
    return false
  }
}

const ESTADOS = ['Preparando', 'En tránsito', 'Entregado', 'Novedad']

function Envios() {
  const [envios, setEnvios] = useState([])
  const [transportadoras, setTransportadoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(null)

  function cargar() {
    setLoading(true)
    Promise.all([
      api.get('/logistica/envios'),
      api.get('/logistica/transportadoras'),
    ])
      .then(([enviosRes, transRes]) => {
        setEnvios(enviosRes.data.envios)
        setTransportadoras(transRes.data.transportadoras.filter((t) => t.estado === 'Activo'))
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroTransportadora, setFiltroTransportadora] = useState('Todos')

  const [mostrarModal, setMostrarModal] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [errorForm, setErrorForm] = useState(null)

  const formVacio = {
    producto: '',
    peso: '',
    origen: '',
    destino: '',
    id_transportadora: '',
    destinatario: '',
    fecha_estimada: '',
    estado: 'Preparando',
  }
  const [form, setForm] = useState(formVacio)

  useModalBehavior(() => setMostrarModal(false))

  const abrirModal = () => {
    setForm(formVacio)
    setEditandoId(null)
    setErrorForm(null)
    setMostrarModal(true)
  }

  const editarEnvio = (envio) => {
    setForm({
      producto: envio.producto,
      peso: envio.peso,
      origen: envio.origen,
      destino: envio.destino,
      id_transportadora: envio.id_transportadora || '',
      destinatario: envio.destinatario,
      fecha_estimada: envio.fecha_estimada?.slice(0, 10) || '',
      estado: envio.estado,
    })
    setEditandoId(envio.id_envio)
    setErrorForm(null)
    setMostrarModal(true)
  }

  const eliminarEnvio = async () => {
    const e = eliminando
    setEliminando(null)
    if (!e) return
    try {
      await api.delete(`/logistica/envios/${e.id_envio}`)
      cargar()
      toast.success('Envío eliminado')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    }
  }

  const cambiarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const guardarEnvio = async (e) => {
    e.preventDefault()
    const obligatorios = [
      ['producto', 'Producto / contenido'],
      ['peso', 'Peso'],
      ['origen', 'Origen'],
      ['destino', 'Destino'],
      ['destinatario', 'Destinatario'],
      ['fecha_estimada', 'Fecha estimada de entrega'],
    ]
    const faltante = obligatorios.find(([campo]) => !String(form[campo] || '').trim())
    if (faltante) {
      setErrorForm(`Completa el campo "${faltante[1]}" (*)`)
      return
    }
    setGuardando(true)
    try {
      if (editandoId != null) {
        await api.patch(`/logistica/envios/${editandoId}`, form)
      } else {
        await api.post('/logistica/envios', form)
      }
      setEditandoId(null)
      setMostrarModal(false)
      cargar()
    } catch (err) {
      setErrorForm(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  const enviosFiltrados = envios.filter(e => {
    const coincideEstado = filtroEstado === 'Todos' || e.estado === filtroEstado
    const coincideTransportadora = filtroTransportadora === 'Todos' || e.transportadora_nombre === filtroTransportadora
    return coincideEstado && coincideTransportadora
  })

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Preparando': 'bg-blue-100 text-blue-700',
      'En tránsito': 'bg-amber-100 text-amber-700',
      'Entregado': 'bg-green-100 text-green-700',
      'Novedad': 'bg-red-100 text-red-700',
    }
    return estilos[estado] || 'bg-gray-100 text-gray-700'
  }

  const totalEnvios = envios.length
  const enTransito = envios.filter(e => e.estado === 'En tránsito').length
  const entregados = envios.filter(e => e.estado === 'Entregado').length
  const novedades = envios.filter(e => e.estado === 'Novedad').length
  const nombresTransportadoras = [...new Set(envios.map((e) => e.transportadora_nombre).filter(Boolean))]

  const stats = [
    { label: 'Total envíos', valor: totalEnvios, descripcion: 'Paquetes registrados', tono: 'verde',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" /></svg>) },
    { label: 'En tránsito', valor: enTransito, descripcion: 'En camino hacia el destino', tono: 'ambar',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" /><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" /></svg>) },
    { label: 'Entregados', valor: entregados, descripcion: 'Completados con éxito', tono: 'cielo',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
    { label: 'Novedades', valor: novedades, descripcion: 'Requieren atención', tono: 'rojo',
      icono: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>) },
  ]

  const mostrarColumnaEstado = filtroEstado === 'Todos'
  const mostrarColumnaTransportadora = filtroTransportadora === 'Todos'
  const admin = esAdmin()
  const colSpanTabla = 7 + (mostrarColumnaEstado ? 1 : 0) + (mostrarColumnaTransportadora ? 1 : 0) + (admin ? 0 : 1)

  if (loading) return <PanelSkeleton filas={4} columnas={4} />

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Envíos"
        subtitulo="Seguimiento de paquetes y creación de envíos"
        acciones={!admin && (
          <BotonPrimario onClick={abrirModal}>+ Crear envío</BotonPrimario>
        )}
      />

      <ErrorModal mensaje={error} onClose={() => setError(null)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.valor}
            sub={stat.descripcion}
            icono={stat.icono}
            tono={stat.tono}
            delay={i ? `panel-come-d${i + 1}` : ''}
          />
        ))}
      </div>

      <PanelCard animado={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Todos', ...ESTADOS].map((estado) => (
                <button key={estado} onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${filtroEstado === estado ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {estado}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-200"></div>

          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transportadora</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Todos', ...nombresTransportadoras].map((t) => (
                <button key={t} onClick={() => setFiltroTransportadora(t)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${filtroTransportadora === t ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PanelCard>

      <PanelCard animado={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">N° guía</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Peso</th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Ruta</th>
                {mostrarColumnaTransportadora && (
                  <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Transportadora</th>
                )}
                <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Destinatario</th>
                <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Entrega</th>
                {mostrarColumnaEstado && (
                  <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                )}
                {!admin && <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {enviosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={colSpanTabla} className="px-5 py-8">
                    <EmptyState icono="📦" titulo="Sin envíos" descripcion="No hay envíos con los filtros seleccionados" />
                  </td>
                </tr>
              ) : (
                enviosFiltrados.map((e, idx) => (
                  <tr key={e.id_envio} className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx === enviosFiltrados.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4"><p className="font-medium text-admin-heading">{e.numero_guia}</p></td>
                    <td className="px-5 py-4"><p className="text-sm text-gray-700">{e.producto}</p></td>
                    <td className="px-5 py-4 text-center"><p className="text-sm font-medium text-admin-heading">{e.peso} kg</p></td>
                    <td className="px-5 py-4"><p className="text-sm text-gray-600">{e.origen} → {e.destino}</p></td>
                    {mostrarColumnaTransportadora && (
                      <td className="px-5 py-4"><p className="text-sm text-gray-600">{e.transportadora_nombre || '—'}</p></td>
                    )}
                    <td className="px-5 py-4"><p className="text-sm text-gray-600">{e.destinatario}</p></td>
                    <td className="px-5 py-4 text-center"><p className="text-sm text-gray-600">{e.fecha_estimada?.slice(0, 10)}</p></td>
                    {mostrarColumnaEstado && (
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(e.estado)}`}>{e.estado}</span>
                      </td>
                    )}
                    {!admin && (
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => editarEnvio(e)} className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">Editar</button>
                          <span className="text-gray-300">·</span>
                          <button onClick={() => setEliminando(e)} className="text-red-600 hover:text-red-800 text-sm font-medium transition">Eliminar</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PanelCard>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl panel-come">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-admin-heading">{editandoId != null ? 'Editar envío' : 'Crear envío'}</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={guardarEnvio} className="p-6 space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Peso (kg) *</label>
                  <input type="number" min="0" step="0.1" onKeyDown={bloquearNoNumerico} value={form.peso}
                    onChange={(e) => cambiarCampo('peso', normalizarNumerico(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800" placeholder="Ej: 2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha estimada *</label>
                  <input type="date" value={form.fecha_estimada}
                    onChange={(e) => cambiarCampo('fecha_estimada', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Producto / contenido *</label>
                <input type="text" value={form.producto}
                  onChange={(e) => cambiarCampo('producto', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800" placeholder="Ej: Café Molido Especial" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Origen *</label>
                  <input type="text" value={form.origen}
                    onChange={(e) => cambiarCampo('origen', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800" placeholder="Ej: Ibagué" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Destino *</label>
                  <input type="text" value={form.destino}
                    onChange={(e) => cambiarCampo('destino', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800" placeholder="Ej: Bogotá" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Destinatario *</label>
                <input type="text" value={form.destinatario}
                  onChange={(e) => cambiarCampo('destinatario', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800" placeholder="Ej: María González" />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Transportadora</label>
                <select value={form.id_transportadora}
                  onChange={(e) => cambiarCampo('id_transportadora', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800">
                  <option value="">Sin asignar todavía</option>
                  {transportadoras.map((t) => (
                    <option key={t.id_transportadora} value={t.id_transportadora}>{t.nombre} ({t.tipo})</option>
                  ))}
                </select>
                {transportadoras.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No hay transportadoras activas — créalas primero en la pestaña Transportadoras.</p>
                )}
              </div>

              {editandoId != null && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Estado</label>
                  <select value={form.estado}
                    onChange={(e) => cambiarCampo('estado', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[#1D9E75] transition text-gray-800">
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErrorModal mensaje={errorForm} onClose={() => setErrorForm(null)} />

      <ConfirmDialog
        abierto={!!eliminando}
        titulo="¿Eliminar envío?"
        mensaje={eliminando ? `¿Eliminar el envío ${eliminando.numero_guia}? Esta acción no se puede deshacer.` : ''}
        confirmarTexto="Eliminar"
        onConfirmar={eliminarEnvio}
        onCancelar={() => setEliminando(null)}
      />
    </div>
  )
}

export default Envios
