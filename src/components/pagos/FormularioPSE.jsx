import { useState, useEffect } from 'react';
import { obtenerBancosPSE, crearPagoPSE } from '../../services/pagosApi';
import { useEstadoPago } from '../../hooks/useEstadoDePago';

const ESTADOS_UI = {
  PENDING: 'Redirigiéndote a tu banco...',
  APPROVED: '¡Pago aprobado! 🎉',
  DECLINED: 'Tu pago fue rechazado',
  ERROR: 'Hubo un error con tu pago',
  VOIDED: 'La transacción fue anulada',
};

const TIPOS_DOCUMENTO = ['CC', 'CE', 'NIT', 'PP'];

// Color del texto según el resultado: verde brillante = aprobado, rojo = rechazado/error
function claseTextoEstado(estado) {
  if (estado === 'APPROVED') return 'text-[#2dd4a7]';
  if (estado === 'DECLINED' || estado === 'ERROR' || estado === 'VOIDED') return 'text-[#D85A30]';
  return 'text-white';
}

export function FormularioPSE({ idPedido, documentoGuardado }) {
  // documentoGuardado: { tipoDocumento, numeroDocumento } o null si el cliente no lo tiene guardado
  const [bancos, setBancos] = useState([]);
  const [cargandoBancos, setCargandoBancos] = useState(true);
  const [errorBancos, setErrorBancos] = useState(null);

  const [codigoBanco, setCodigoBanco] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState(documentoGuardado?.tipoDocumento || 'CC');
  const [numeroDocumento, setNumeroDocumento] = useState(documentoGuardado?.numeroDocumento || '');

  const [idTransaccion, setIdTransaccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [redirigiendo, setRedirigiendo] = useState(false);

  const { estado, mensaje, cargando, error, urlBanco } = useEstadoPago(idTransaccion);

  useEffect(() => {
    async function cargarBancos() {
      try {
        const lista = await obtenerBancosPSE();
        setBancos(lista);
      } catch {
        setErrorBancos('No se pudieron cargar los bancos disponibles');
      } finally {
        setCargandoBancos(false);
      }
    }
    cargarBancos();
  }, []);

  // En cuanto el polling encuentra la URL del banco, redirigimos automáticamente
  useEffect(() => {
    if (urlBanco && !redirigiendo) {
      setRedirigiendo(true);
      window.location.href = urlBanco;
    }
  }, [urlBanco, redirigiendo]);

  const necesitaDocumento = !documentoGuardado;
  const formularioValido =
    codigoBanco !== '' &&
    /^\d{6,12}$/.test(numeroDocumento.trim());

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!formularioValido) return;

    setEnviando(true);
    setErrorEnvio(null);

    try {
      const respuesta = await crearPagoPSE(idPedido, {
        codigoBanco,
        tipoDocumento,
        numeroDocumento: numeroDocumento.trim(),
      });
      setIdTransaccion(respuesta.id_transaccion);
    } catch (err) {
      setErrorEnvio(err.response?.data?.mensaje ?? 'No se pudo iniciar el pago con PSE');
    } finally {
      setEnviando(false);
    }
  }

  // Ya se creó la transacción: esperando la URL del banco o el resultado final
  if (idTransaccion) {
    const esFinalNoExitoso = ['DECLINED', 'ERROR', 'VOIDED'].includes(estado);
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        {(cargando || (redirigiendo && estado === 'PENDING')) && (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
        )}
        <p className={`text-lg font-medium ${error ? 'text-[#D85A30]' : claseTextoEstado(estado)}`}>
          {error ?? ESTADOS_UI[estado] ?? 'Verificando el estado del pago...'}
        </p>
        {estado === 'DECLINED' && mensaje && <p className="text-sm text-white/50">{mensaje}</p>}
        {estado === 'PENDING' && !urlBanco && (
          <p className="text-xs text-white/40">Esto puede tardar unos segundos</p>
        )}
        {esFinalNoExitoso && (
        <button
          type="button"
          onClick={() => {
            setIdTransaccion(null);
            setRedirigiendo(false);
            setCodigoBanco('');
          }}
          className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

  if (cargandoBancos) {
    return <p className="p-4 text-sm text-white/60">Cargando bancos disponibles...</p>;
  }

  if (errorBancos) {
    return <p className="p-4 text-sm text-[#D85A30]">{errorBancos}</p>;
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-white/80">Selecciona tu banco</span>
        <div className="relative">
          <select
            value={codigoBanco}
            onChange={(e) => setCodigoBanco(e.target.value)}
            className="appearance-none w-full rounded-lg border border-white/15 bg-[#0d1512] px-3 py-2.5 pr-9 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 [&>option]:bg-[#0d1512] [&>option]:text-white"
          >
            <option value="">-- Elige tu banco --</option>
            {bancos.map((b) => (
              <option key={b.financial_institution_code} value={b.financial_institution_code}>
                {b.financial_institution_name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8l4 4 4-4" />
            </svg>
          </span>
        </div>
      </label>

      {necesitaDocumento && (
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-1 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-white/80">Tipo doc.</span>
            <div className="relative">
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="appearance-none w-full rounded-lg border border-white/15 bg-[#0d1512] px-3 py-2.5 pr-7 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 [&>option]:bg-[#0d1512] [&>option]:text-white"
              >
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8l4 4 4-4" />
                </svg>
              </span>
            </div>
          </label>
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-white/80">Número de documento</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456789"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value.replace(/\D/g, ''))}
              className="rounded-lg border border-white/15 bg-[#0d1512] px-3 py-2.5 text-white placeholder:text-white/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>
        </div>
      )}

      {errorEnvio && <p className="text-sm text-[#D85A30]">{errorEnvio}</p>}

      <button
        type="submit"
        disabled={!formularioValido || enviando}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? 'Iniciando...' : 'Pagar con PSE'}
      </button>
    </form>
  );
}