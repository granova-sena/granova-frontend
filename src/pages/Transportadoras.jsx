import { useState, useEffect } from 'react'
import { useModalBehavior } from '../hooks/useModalBehavior'
import api from '../services/api'

function esAdmin() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.rol === 'admin'
  } catch {
    return false
  }
}

function Transportadoras() {
  const [transportadoras, setTransportadoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    setLoading(true)
    api.get('/logistica/transportadoras')
      .then((res) => setTransportadoras(res.data.transportadoras))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  const [mostrarModal, setMostrarModal] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [errorForm, setErrorForm] = useState(null)
  const formVacio = {
    tipoPersona: 'persona_natural',
    nombre: '',
    telefono: '',
    tipo: 'Acarreo',
    placa: '',
    nit: '',
    vehiculos: '',
    estado: 'Activo',
  }
  const [form, setForm] = useState(formVacio)

  useModalBehavior(() => setMostrarModal(false))

  const abrirModal = () => {
    setForm(formVacio)
    setEditandoId(null)
    setErrorForm(null)
    setMostrarModal(true)
  }

  const editarTransportadora = (t) => {
    setForm({
      tipoPersona: t.tipo_persona,
      nombre: t.nombre,
      telefono: t.telefono,
      tipo: t.tipo,
      placa: t.placa || '',
      nit: t.nit || '',
      vehiculos: t.vehiculos ?? '',
      estado: t.estado || 'Activo',
    })
    setEditandoId(t.id_transportadora)
    setErrorForm(null)
    setMostrarModal(true)
  }

  const eliminarTransportadora = async (t) => {
    if (!window.confirm(`¿Eliminar a ${t.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/logistica/transportadoras/${t.id_transportadora}`)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  const cambiarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const guardarTransportadora = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setErrorForm('Completa nombre y teléfono (*)')
      return
    }
    if (form.tipoPersona === 'persona_natural' && !form.placa.trim()) {
      setErrorForm('Ingresa la placa del vehículo (*)')
      return
    }
    if (form.tipoPersona === 'persona_juridica' && !form.nit.trim()) {
      setErrorForm('Ingresa el NIT de la empresa (*)')
      return
    }
    const datos = {
      tipo_persona: form.tipoPersona,
      nombre: form.nombre,
      telefono: form.telefono,
      tipo: form.tipo,
      placa: form.tipoPersona === 'persona_natural' ? form.placa : null,
      nit: form.tipoPersona === 'persona_juridica' ? form.nit : null,
      vehiculos: form.vehiculos === '' ? 0 : Number(form.vehiculos),
      estado: form.estado,
    }
    setGuardando(true)
    try {
      if (editandoId != null) {
        await api.patch(`/logistica/transportadoras/${editandoId}`, datos)
      } else {
        await api.post('/logistica/transportadoras', datos)
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

  const transportadorasFiltradas = transportadoras.filter(t => {
    const coincideTipo = filtroTipo === 'Todos' || t.tipo === filtroTipo
    const coincideEstado = filtroEstado === 'Todos' || t.estado === filtroEstado
    return coincideTipo && coincideEstado
  })

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Activo': 'bg-green-100 text-green-700',
      'Inactivo': 'bg-gray-100 text-gray-700',
    }
    return estilos[estado] || 'bg-gray-100 text-gray-700'
  }

  const totalEnvios = transportadoras.reduce((sum, t) => sum + t.envios, 0)
  const activas = transportadoras.filter((t) => t.estado === 'Activo').length

  const stats = [
    {
      label: 'Total transportadoras',
      valor: transportadoras.length,
      descripcion: 'Domiciliarios registrados',
      color: '#1D9E75',
      bg: 'rgba(29,158,117,0.10)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
    {
      label: 'Envíos totales',
      valor: totalEnvios,
      descripcion: 'Suma de envíos gestionados',
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.10)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
    {
      label: 'Activos',
      valor: activas,
      descripcion: 'Operando actualmente',
      color: '#16a34a',
      bg: 'rgba(22,163,74,0.10)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  const mostrarColumnaTipo = filtroTipo === 'Todos'
  const mostrarColumnaEstado = filtroEstado === 'Todos'
  const admin = esAdmin()

  if (loading) return <p className="text-sm text-gray-500">Cargando transportadoras...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-admin-page-title">Transportadoras</h1>
          <p className="text-sm text-admin-page-subtitle">Gestión de domiciliarios y rendimiento de entregas</p>
        </div>
        {!admin && (
          <button onClick={abrirModal} className="text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#178a64] transition whitespace-nowrap shadow-sm">
            + Agregar transportadora
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </span>
            </div>
            <p className="text-3xl font-bold text-admin-page-title leading-none">{stat.valor}</p>
            <p className="text-sm font-medium text-gray-700 mt-2">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.descripcion}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</span>
            <div className="flex gap-2 mt-1">
              {['Todos', 'Acarreo', 'Domiciliario'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-4 py-1.5 text-sm rounded-lg transition ${
                    filtroTipo === tipo
                      ? 'bg-[#1D9E75] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-200"></div>

          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</span>
            <div className="flex gap-2 mt-1">
              {['Todos', 'Activo', 'Inactivo'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-4 py-1.5 text-sm rounded-lg transition ${
                    filtroEstado === estado
                      ? 'bg-[#1D9E75] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Placa / NIT</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Envíos</th>
                {mostrarColumnaTipo && (
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Tipo</th>
                )}
                {mostrarColumnaEstado && (
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                )}
                {!admin && <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {transportadorasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay transportadoras con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                transportadorasFiltradas.map((t, idx) => (
                  <tr key={t.id_transportadora} className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx === transportadorasFiltradas.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{t.nombre}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{t.telefono}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {t.tipo_persona === 'persona_juridica' ? (t.nit || '—') : (t.placa || '—')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-medium text-gray-900">{t.envios}</p>
                    </td>
                    {mostrarColumnaTipo && (
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.tipo === 'Acarreo' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t.tipo}
                        </span>
                      </td>
                    )}
                    {mostrarColumnaEstado && (
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(t.estado)}`}>
                          {t.estado}
                        </span>
                      </td>
                    )}
                    {!admin && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => editarTransportadora(t)} className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
                            Editar
                          </button>
                          <span className="text-gray-300">·</span>
                          <button onClick={() => eliminarTransportadora(t)} className="text-red-600 hover:text-red-800 text-sm font-medium transition">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">{editandoId != null ? 'Editar transportadora' : 'Agregar transportadora'}</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={guardarTransportadora} className="p-6 space-y-4">
              {errorForm && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorForm}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo de persona</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { valor: 'persona_natural', etiqueta: 'Persona natural' },
                    { valor: 'persona_juridica', etiqueta: 'Persona jurídica' },
                  ].map((op) => (
                    <button
                      type="button"
                      key={op.valor}
                      onClick={() => cambiarCampo('tipoPersona', op.valor)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                        form.tipoPersona === op.valor
                          ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {op.etiqueta}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {form.tipoPersona === 'persona_juridica' ? 'Razón social de la empresa *' : 'Nombre del domiciliario *'}
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder={form.tipoPersona === 'persona_juridica' ? 'Ej: Translog CR S.A.' : 'Ej: Carlos Rodríguez'}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Teléfono *</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => cambiarCampo('telefono', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder="Ej: 300 000 0000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo de transportadora</label>
                <select
                  value={form.tipo}
                  onChange={(e) => cambiarCampo('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                >
                  <option value="Acarreo">Acarreo</option>
                  <option value="Domiciliario">Domiciliario (Moto)</option>
                </select>
              </div>

              {form.tipoPersona === 'persona_natural' ? (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Placa del vehículo *</label>
                  <input
                    type="text"
                    value={form.placa}
                    onChange={(e) => cambiarCampo('placa', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] uppercase"
                    placeholder="Ej: PBX-123"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">NIT de la empresa *</label>
                    <input
                      type="text"
                      value={form.nit}
                      onChange={(e) => cambiarCampo('nit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                      placeholder="Ej: 900.123.456-7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">N° vehículos</label>
                    <input
                      type="number"
                      min="0"
                      value={form.vehiculos}
                      onChange={(e) => cambiarCampo('vehiculos', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                    />
                  </div>
                </>
              )}

              {editandoId != null && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => cambiarCampo('estado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#1D9E75] text-white disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transportadoras
