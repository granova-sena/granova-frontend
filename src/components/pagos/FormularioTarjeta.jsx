// src/components/pagos/FormularioTarjeta.jsx
import { useState } from 'react';
import { tokenizarTarjeta } from '../../services/wompiFrontend';
import { crearPagoTarjeta } from '../../services/pagosApi';
import { useEstadoPago } from '../../hooks/useEstadoDePago';

const ESTADOS_UI = {
  PENDING: 'Procesando tu pago...',
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

function formatearNumeroTarjeta(valor) {
  const soloDigitos = valor.replace(/\D/g, '').slice(0, 19);
  return soloDigitos.replace(/(.{4})/g, '$1 ').trim();
}

function validarCampo(campo, datos) {
  const numeroLimpio = datos.numero.replace(/\s/g, '');

  switch (campo) {
    case 'numero':
      if (!numeroLimpio) return 'Escribe el número de tu tarjeta';
      if (!/^\d{13,19}$/.test(numeroLimpio)) return 'El número de tarjeta no es válido';
      return null;

    case 'mes':
      if (!datos.mes) return 'Escribe el mes de expiración';
      if (!/^(0[1-9]|1[0-2])$/.test(datos.mes)) return 'Usa un mes entre 01 y 12';
      return null;

    case 'anio': {
      if (!datos.anio) return 'Escribe el año de expiración';
      if (!/^\d{2}$/.test(datos.anio)) return 'Usa 2 dígitos, ej: 29';
      // Validar que no esté vencida (solo si el mes también es válido)
      if (/^(0[1-9]|1[0-2])$/.test(datos.mes)) {
        const ahora = new Date();
        const anioActual2Digitos = ahora.getFullYear() % 100;
        const mesActual = ahora.getMonth() + 1;
        const anioNum = Number(datos.anio);
        const mesNum = Number(datos.mes);
        if (anioNum < anioActual2Digitos || (anioNum === anioActual2Digitos && mesNum < mesActual)) {
          return 'Esta tarjeta ya expiró';
        }
      }
      return null;
    }

    case 'cvc':
      if (!datos.cvc) return 'Escribe el código de seguridad';
      if (!/^\d{3,4}$/.test(datos.cvc)) return 'El CVC debe tener 3 o 4 dígitos';
      return null;

    case 'nombre':
      if (!datos.nombre.trim()) return 'Escribe el nombre del titular';
      if (datos.nombre.trim().length < 5) return 'Escribe el nombre completo';
      return null;

    default:
      return null;
  }
}

export function FormularioTarjeta({ idPedido }) {
  const [datos, setDatos] = useState({ numero: '', cvc: '', mes: '', anio: '', nombre: '', cuotas: 1 });
  const [tocados, setTocados] = useState({});
  const [idTransaccion, setIdTransaccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const { estado, mensaje, cargando, error } = useEstadoPago(idTransaccion);

  const camposAValidar = ['numero', 'mes', 'anio', 'cvc', 'nombre'];
  const errores = Object.fromEntries(camposAValidar.map((c) => [c, validarCampo(c, datos)]));
  const formularioValido = camposAValidar.every((c) => !errores[c]);

  function actualizarCampo(campo, valor) {
    const valorFinal = campo === 'numero' ? formatearNumeroTarjeta(valor) : valor;
    setDatos((prev) => ({ ...prev, [campo]: valorFinal }));
  }

  function marcarTocado(campo) {
    setTocados((prev) => ({ ...prev, [campo]: true }));
  }

  function mostrarError(campo) {
    return tocados[campo] && errores[campo] ? errores[campo] : null;
  }

  const claseInput = (campo) =>
    `rounded-lg border px-3 py-2 focus:outline-none ${
      mostrarError(campo)
        ? 'border-red-400 focus:border-red-500'
        : 'border-gray-300 focus:border-emerald-600'
    }`;

  async function manejarSubmit(e) {
    e.preventDefault();
    setTocados(Object.fromEntries(camposAValidar.map((c) => [c, true]))); // muestra todos los errores si intenta enviar mal
    if (!formularioValido) return;

    setEnviando(true);
    setErrorEnvio(null);

    try {
      const token = await tokenizarTarjeta({
        numero: datos.numero.replace(/\s/g, ''),
        cvc: datos.cvc,
        mesExpiracion: datos.mes,
        anioExpiracion: datos.anio,
        nombreTitular: datos.nombre.trim(),
      });

      const transaccion = await crearPagoTarjeta(idPedido, token.id, Number(datos.cuotas));
      setIdTransaccion(transaccion.id_transaccion);
    } catch (err) {
      const mensajeWompi = err.response?.data?.error?.messages
        ? Object.values(err.response.data.error.messages).flat().join(', ')
        : null;
      const mensajeBackend = err.response?.data?.mensaje;
      setErrorEnvio(mensajeWompi || mensajeBackend || 'No se pudo procesar el pago con tarjeta');
    } finally {
      setEnviando(false);
    }
  }

  if (idTransaccion) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        {cargando && (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
        )}
        <p className={`text-lg font-medium ${error ? 'text-[#D85A30]' : claseTextoEstado(estado)}`}>
          {error ?? ESTADOS_UI[estado] ?? 'Verificando el estado del pago...'}
        </p>
        {estado === 'DECLINED' && mensaje && <p className="text-sm text-gray-500">{mensaje}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4 p-4" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Número de tarjeta</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={23} // 19 dígitos + 4 espacios
          placeholder="4242 4242 4242 4242"
          value={datos.numero}
          onChange={(e) => actualizarCampo('numero', e.target.value)}
          onBlur={() => marcarTocado('numero')}
          className={claseInput('numero')}
        />
        {mostrarError('numero') && <span className="text-xs text-red-500">{mostrarError('numero')}</span>}
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Mes</span>
          <input type="text" inputMode="numeric" maxLength={2} placeholder="12"
            value={datos.mes}
            onChange={(e) => actualizarCampo('mes', e.target.value.replace(/\D/g, ''))}
            onBlur={() => marcarTocado('mes')}
            className={claseInput('mes')} />
          {mostrarError('mes') && <span className="text-xs text-red-500">{mostrarError('mes')}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Año</span>
          <input type="text" inputMode="numeric" maxLength={2} placeholder="29"
            value={datos.anio}
            onChange={(e) => actualizarCampo('anio', e.target.value.replace(/\D/g, ''))}
            onBlur={() => marcarTocado('anio')}
            className={claseInput('anio')} />
          {mostrarError('anio') && <span className="text-xs text-red-500">{mostrarError('anio')}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">CVC</span>
          <input type="text" inputMode="numeric" maxLength={4} placeholder="123"
            value={datos.cvc}
            onChange={(e) => actualizarCampo('cvc', e.target.value.replace(/\D/g, ''))}
            onBlur={() => marcarTocado('cvc')}
            className={claseInput('cvc')} />
          {mostrarError('cvc') && <span className="text-xs text-red-500">{mostrarError('cvc')}</span>}
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Nombre del titular</span>
        <input type="text" placeholder="Como aparece en la tarjeta"
          value={datos.nombre}
          onChange={(e) => actualizarCampo('nombre', e.target.value)}
          onBlur={() => marcarTocado('nombre')}
          className={claseInput('nombre')} />
        {mostrarError('nombre') && <span className="text-xs text-red-500">{mostrarError('nombre')}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Cuotas</span>
        <select value={datos.cuotas} onChange={(e) => actualizarCampo('cuotas', e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 focus:border-emerald-600 focus:outline-none">
          {[1, 2, 3, 6, 12].map((n) => (
            <option key={n} value={n} className="bg-white text-gray-800">{n === 1 ? 'Pago único' : `${n} cuotas`}</option>
          ))}
        </select>
      </label>

      {errorEnvio && <p className="text-sm text-red-500">{errorEnvio}</p>}

      <button type="submit" disabled={enviando}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50">
        {enviando ? 'Procesando...' : 'Pagar con tarjeta'}
      </button>
    </form>
  );
}