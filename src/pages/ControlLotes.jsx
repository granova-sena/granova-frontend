import { useState, useEffect } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const entregaVacia = { id_finca: '', id_lote: '', cantidad_kg: '', valor: '' }

function ControlLotes() {
  const [entregas, setEntregas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [fincas, setFincas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

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

  async function anularEntrega(entrega) {
    if (!window.confirm(`¿Anular la entrega de ${entrega.finca_nombre} (${entrega.cantidad_kg} kg)? El kg se restará del lote.`)) return
    setGuardando(true)
    try {
      await api.patch(`/inventario/entregas/${entrega.id_entrega}/anular`, {}, { headers: authHeaders() })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Control de lotes</h1>
          <p className="text-sm text-gray-500 mt-1">Registra cuándo una finca entrega café y marca si ya se le pagó.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalEntrega(true)}
          className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap"
        >
          + Registrar entrega
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      {resumen && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Entregado (mes)</p>
            <p className="text-lg font-medium text-gray-800 mt-1">{resumen.kg_entregados} kg</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Pagado</p>
            <p className="text-lg font-medium text-gray-800 mt-1">{formatMoney(resumen.total_pagado)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs text-amber-700">Pendiente</p>
            <p className="text-lg font-medium text-amber-800 mt-1">{formatMoney(resumen.total_pendiente)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-3 px-4">Finca</th>
              <th className="py-3 px-4">Lote</th>
              <th className="py-3 px-4">Kg</th>
              <th className="py-3 px-4">Valor</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {entregas.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400">Aún no hay entregas registradas.</td></tr>
            ) : (
              entregas.map((e) => (
                <tr key={e.id_entrega} className="border-b border-gray-50">
                  <td className="py-3 px-4 text-gray-800">{e.finca_nombre}</td>
                  <td className="py-3 px-4 text-gray-600">{e.codigo_lote}</td>
                  <td className="py-3 px-4 text-gray-600">{e.cantidad_kg} kg</td>
                  <td className="py-3 px-4 text-gray-600">{formatMoney(e.valor)}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(e.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="py-3 px-4">
                    {e.estado_pago === 'pagado' ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Pagado</span>
                    ) : (
                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() => marcarPagado(e)}
                        className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        Marcar pagado
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => anularEntrega(e)}
                      className="text-xs text-gray-300 hover:text-red-500"
                      title="Anular entrega"
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalEntrega && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Registrar entrega</h2>
            <form onSubmit={registrarEntrega} className="space-y-3">
              <select required value={form.id_finca}
                onChange={(e) => setForm({ ...form, id_finca: e.target.value, id_lote: '' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]">
                <option value="">Selecciona la finca</option>
                {fincas.map((f) => <option key={f.id_finca} value={f.id_finca}>{f.nombre}</option>)}
              </select>
              <select required value={form.id_lote} disabled={!form.id_finca}
                onChange={(e) => setForm({ ...form, id_lote: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] disabled:opacity-50">
                <option value="">Selecciona el lote</option>
                {lotesDeFincaSeleccionada.map((l) => <option key={l.id_lote} value={l.id_lote}>{l.codigo_lote}</option>)}
              </select>
              <input required placeholder="Kg entregados" type="number" value={form.cantidad_kg}
                onChange={(e) => setForm({ ...form, cantidad_kg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <input required placeholder="Valor a pagar" type="number" value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]" />
              <p className="text-xs text-gray-400">Este kg se suma al lote, no reemplaza lo que ya había.</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalEntrega(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlLotes
