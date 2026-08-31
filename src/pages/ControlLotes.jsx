import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorModal from '../components/ui/ErrorModal'
import { bloquearNoNumerico, bloquearEntero, normalizarNumerico, normalizarEntero } from '../utils/validacion'
import toast from 'react-hot-toast'
import { PageHeader, StatCard, PanelCard, PanelSkeleton, EmptyState, BotonPrimario } from '../components/ui/panel/PanelKit'

function authHeaders() {
  const token = localStorage.getItem('token_empleado')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const entregaVacia = { id_finca: '', id_lote: '', cantidad_kg: '', valor: '' }

function ControlLotes() {
  const [entregas, setEntregas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [resumenPorFinca, setResumenPorFinca] = useState([])
  const [fincas, setFincas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [anulandoEntrega, setAnulandoEntrega] = useState(null)

  const [modalEntrega, setModalEntrega] = useState(false)
  const [form, setForm] = useState(entregaVacia)

  function cargar() {
    setLoading(true)
    Promise.all([
      api.get('/inventario/entregas', { headers: authHeaders() }),
      api.get('/inventario/por-finca', { headers: authHeaders() }),
    ])
      .then(([entregasRes, fincasRes]) => {
        setEntregas(entregasRes.data.entregas)
        setResumen(entregasRes.data.resumen)
        setResumenPorFinca(entregasRes.data.resumenPorFinca || [])
        setFincas(fincasRes.data.fincas)
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const lotesDeFincaSeleccionada = fincas.find((f) => String(f.id_finca) === String(form.id_finca))?.lotes || []

  async function registrarEntrega(e) {
    e.preventDefault()
    if (!form.id_finca || !form.id_lote || !form.cantidad_kg || !form.valor) return
    setGuardando(true)
    try {
      await api.post('/inventario/entregas', form, { headers: authHeaders() })
      setModalEntrega(false)
      setForm(entregaVacia)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function marcarPagado(entrega) {
    setGuardando(true)
    try {
      await api.patch(`/inventario/entregas/${entrega.id_entrega}/pagar`, {}, { headers: authHeaders() })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function anularEntrega() {
    const entrega = anulandoEntrega
    setAnulandoEntrega(null)
    if (!entrega) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/entregas/${entrega.id_entrega}/anular`, {}, { headers: authHeaders() })
      cargar()
      toast.success('Entrega anulada')
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          titulo="Control de lotes"
          subtitulo="Registra cuándo una finca entrega café y marca si ya se le pagó."
        />
        <PanelSkeleton filas={4} columnas={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Control de lotes"
        subtitulo="Registra cuándo una finca entrega café y marca si ya se le pagó."
        acciones={
          <BotonPrimario onClick={() => setModalEntrega(true)}>
            + Registrar entrega
          </BotonPrimario>
        }
      />

      <ErrorModal mensaje={error} onClose={() => setError(null)} />

      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icono="📦" label="Entregado (mes)" value={`${resumen.kg_entregados} kg`} sub="kg recibidos este mes" tono="verde" delay="panel-come-d1" />
          <StatCard icono="💰" label="Pagado" value={formatMoney(resumen.total_pagado)} sub="sumado a las fincas" tono="cielo" delay="panel-come-d2" />
          <StatCard icono="⏳" label="Pendiente" value={formatMoney(resumen.total_pendiente)} sub="por liquidar a las fincas" tono="ambar" delay="panel-come-d3" />
        </div>
      )}

      {resumenPorFinca.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Cuánto le debemos a cada finca</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {resumenPorFinca.map((f) => (
              <div key={f.id_finca} className="panel-card panel-come bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-800">{f.finca_nombre}</p>
                <p className="text-lg font-semibold text-amber-600 mt-1">{formatMoney(f.pendiente)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {f.entregas_pendientes} entrega{f.entregas_pendientes === '1' ? '' : 's'} sin pagar
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <PanelCard className="overflow-x-auto">
        {entregas.length === 0 ? (
          <EmptyState
            icono="📭"
            titulo="Aún no hay entregas registradas"
            descripcion="Registra la primera entrega de una finca con el botón '+ Registrar entrega'."
          />
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-5 font-medium">Finca</th>
                <th className="py-3 px-5 font-medium">Lote</th>
                <th className="py-3 px-5 font-medium">Kg</th>
                <th className="py-3 px-5 font-medium">Valor</th>
                <th className="py-3 px-5 font-medium">Fecha</th>
                <th className="py-3 px-5 font-medium">Estado</th>
                <th className="py-3 px-5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {entregas.map((e) => (
                <tr key={e.id_entrega} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-5 text-gray-800">{e.finca_nombre}</td>
                  <td className="py-3 px-5 text-gray-600">{e.codigo_lote}</td>
                  <td className="py-3 px-5 text-gray-600">{e.cantidad_kg} kg</td>
                  <td className="py-3 px-5 text-gray-800 font-medium">{formatMoney(e.valor)}</td>
                  <td className="py-3 px-5 text-gray-500">{new Date(e.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="py-3 px-5">
                    {e.estado_pago === 'pagado' ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Pagado</span>
                    ) : (
                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() => marcarPagado(e)}
                        className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                      >
                        Marcar pagado
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-5">
                    <button
                      type="button"
                      onClick={() => setAnulandoEntrega(e)}
                      className="text-xs text-gray-400 hover:text-red-500"
                      title="Anular entrega"
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PanelCard>

      {modalEntrega && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-admin-heading mb-4">Registrar entrega</h2>
            <form onSubmit={registrarEntrega} className="space-y-3">
              <select required value={form.id_finca}
                onChange={(e) => setForm({ ...form, id_finca: e.target.value, id_lote: '' })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition">
                <option value="">Selecciona la finca</option>
                {fincas.map((f) => <option key={f.id_finca} value={f.id_finca}>{f.nombre}</option>)}
              </select>
              <select required value={form.id_lote} disabled={!form.id_finca}
                onChange={(e) => setForm({ ...form, id_lote: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] disabled:opacity-50 transition">
                <option value="">Selecciona el lote</option>
                {lotesDeFincaSeleccionada.map((l) => <option key={l.id_lote} value={l.id_lote}>{l.codigo_lote}</option>)}
              </select>
              <input required placeholder="Kg entregados" type="number" min="0" onKeyDown={bloquearNoNumerico} value={form.cantidad_kg}
                onChange={(e) => setForm({ ...form, cantidad_kg: normalizarNumerico(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400" />
              <input required placeholder="Valor a pagar" type="number" min="0" onKeyDown={bloquearEntero} value={form.valor}
                onChange={(e) => setForm({ ...form, valor: normalizarEntero(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#1D9E75] transition placeholder:text-gray-400" />
              <p className="text-xs text-gray-400">Este kg se suma al lote, no reemplaza lo que ya había.</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalEntrega(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!anulandoEntrega}
        titulo="¿Anular entrega?"
        mensaje={anulandoEntrega ? `¿Anular la entrega de ${anulandoEntrega.finca_nombre} (${anulandoEntrega.cantidad_kg} kg)? El kg se restará del lote.` : ''}
        confirmarTexto="Anular"
        onConfirmar={anularEntrega}
        onCancelar={() => setAnulandoEntrega(null)}
      />
    </div>
  )
}

export default ControlLotes