import { useState } from 'react';
import { crearPagoNequi } from '../../services/pagosApi';
import { useEstadoPago } from '../../hooks/useEstadoDePago';

const ESTADOS_UI = {
  PENDING: 'Procesando tu pago... revisa la notificación en tu app Nequi',
  APPROVED: '¡Pago aprobado! 🎉',
  DECLINED: 'Tu pago fue rechazado',
  ERROR: 'Hubo un error con tu pago',
  VOIDED: 'La transacción fue anulada',
};

// Color del texto según el resultado: verde brillante = aprobado, rojo = rechazado/error
function claseTextoEstado(estado) {
  if (estado === 'APPROVED') return 'text-[#2dd4a7]';
  if (estado === 'DECLINED' || estado === 'ERROR' || estado === 'VOIDED') return 'text-[#D85A30]';
  return 'text-gray-800';
}

export function FormularioNequi({ idPedido }) {
  const [numeroCelular, setNumeroCelular] = useState('');
  const [idTransaccion, setIdTransaccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const { estado, mensaje, cargando, error } = useEstadoPago(idTransaccion);

  const celularValido = /^3\d{9}$/.test(numeroCelular);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!celularValido) return;

    setEnviando(true);
    setErrorEnvio(null);

    try {
      const transaccion = await crearPagoNequi(idPedido, numeroCelular);
      setIdTransaccion(transaccion.id_transaccion ?? transaccion.idTransaccion);
    } catch (err) {
      setErrorEnvio(err.response?.data?.mensaje ?? 'No se pudo iniciar el pago con Nequi');
    } finally {
      setEnviando(false);
    }
  }

  // Ya se creó la transacción: mostramos el seguimiento, no el formulario
  if (idTransaccion) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        {cargando && (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
        )}
        <p className={`text-lg font-medium ${error ? 'text-[#D85A30]' : claseTextoEstado(estado)}`}>
          {error ?? ESTADOS_UI[estado] ?? 'Verificando el estado del pago...'}
        </p>
        {estado === 'DECLINED' && mensaje && (
          <p className="text-sm text-gray-500">{mensaje}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Número de celular Nequi</span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="3001234567"
          value={numeroCelular}
          onChange={(e) => setNumeroCelular(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-600 focus:outline-none"
        />
        {numeroCelular && !celularValido && (
          <span className="text-xs text-red-500">Debe tener 10 dígitos y empezar por 3</span>
        )}
      </label>

      {errorEnvio && <p className="text-sm text-red-500">{errorEnvio}</p>}

      <button
        type="submit"
        disabled={!celularValido || enviando}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Pagar con Nequi'}
      </button>
    </form>
  );
}