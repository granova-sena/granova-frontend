import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PageHeader, PanelCard, PanelSkeleton, EmptyState } from '../components/ui/panel/PanelKit'

const DESCRIPCIONES = {
  descuento_empresa_pct: 'Descuento automático para cuentas empresariales (personas jurídicas). Se aplica con el "mayor gana" en pedidos, carrito, simulador y catálogo.',
  margen_venta_mayorista_pct: 'Margen de venta al por mayor: costo del café + este % = precio sugerido mayorista.',
  margen_minimo_mayorista_publico_pct: 'Margen mínimo entre el precio mayorista y el precio público (evita vender a menor precio que a mayoristas).',
  merma_cereza_pergamino_pct: 'Pérdida esperada al convertir café cereza en pergamino seco (%).',
  merma_pergamino_tostado_pct: 'Pérdida esperada al tostar pergamino (%).',
}

const DESC_POR_DEFECTO = 'Valor en porcentaje (%) usado por el negocio.'

function ParametrosAdmin() {
  const [parametros, setParametros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null)
  const [valor, setValor] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true
    api.get('/inventario/parametros')
      .then(res => activo && setParametros(res.data.parametros || []))
      .catch(() => activo && toast.error('No se pudieron cargar los parámetros'))
      .finally(() => activo && setCargando(false))
    return () => { activo = false }
  }, [])

  const abrirEdicion = (p) => {
    setEditando(p)
    setValor(String(p.valor ?? ''))
  }

  const guardar = async (e) => {
    e.preventDefault()
    const numero = Number(valor)
    if (!Number.isFinite(numero) || numero < 0 || numero > 100) {
      toast.error('El valor debe ser un número entre 0 y 100')
      return
    }
    setGuardando(true)
    try {
      await api.patch(`/inventario/parametros/${editando.clave}`, { valor: numero })
      setParametros(prev => prev.map(p => p.clave === editando.clave ? { ...p, valor: numero } : p))
      toast.success('Parámetro actualizado')
      setEditando(null)
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setGuardando(false)
    }
  }

  const cambiar = () => {
    setCargando(true)
    api.get('/inventario/parametros')
      .then(res => setParametros(res.data.parametros || []))
      .catch(() => toast.error('No se pudieron recargar los parámetros'))
      .finally(() => setCargando(false))
  }

  return (
    <div>
      <PageHeader
        titulo="Parámetros de negocio"
        subtitulo="Valores globales que usan el catálogo, el simulador y los cálculos internos. Aquí se edita, por ejemplo, el % de descuento para cuentas empresariales."
        acciones={
          <button
            type="button"
            onClick={cambiar}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            ↻ Recargar
          </button>
        }
      />

      {cargando ? (
        <PanelSkeleton filas={6} columnas={3} />
      ) : parametros.length === 0 ? (
        <EmptyState icono="⚙️" titulo="Sin parámetros" descripcion="Aún no hay parámetros registrados en parametros_cafe." />
      ) : (
        <PanelCard>
          <div className="divide-y divide-gray-100">
            {parametros.map((p) => (
              <div key={p.clave} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-admin-heading font-mono">{p.clave}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {DESCRIPCIONES[p.clave] || DESC_POR_DEFECTO}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Valor actual: <span className="font-semibold text-admin-heading">{Number(p.valor ?? 0)}%</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => abrirEdicion(p)}
                  className="shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  ✏️ Editar
                </button>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={guardar} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">{editando.clave}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{DESCRIPCIONES[editando.clave] || DESC_POR_DEFECTO}</p>
            </div>
            <label className="block">
              <span className="text-sm text-gray-600">Nuevo valor (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6FA98C]"
                required
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[#6FA98C] text-white hover:bg-[#4F8A70] transition disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ParametrosAdmin