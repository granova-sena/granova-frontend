import api from './api';

export async function obtenerBancosPSE(){
  const {data} = await api.get('wompi/pse/bancos');
  return data.data;
}
export async function crearPagoPSE(idPedido, datosPSE) {
  const { data } = await api.post('/wompi/pse', {
    id_pedido: idPedido,
    financial_institution_code: datosPSE.codigoBanco,
    tipo_documento: datosPSE.tipoDocumento,
    numero_documento: datosPSE.numeroDocumento,
  });
  return data;
}
export async function crearPagoNequi(idPedido, numeroCelular) {
  const { data } = await api.post('/wompi/nequi', { id_pedido: idPedido, numero_celular: numeroCelular });
  return data.data ?? data;
}

export async function crearPagoTarjeta(idPedido, tokenTarjeta, cuotas = 1) {
  const { data } = await api.post('/wompi/tarjeta', { id_pedido: idPedido, token_tarjeta: tokenTarjeta, cuotas });
  return data.data ?? data;
}

export async function consultarEstadoPago(idTransaccion) {
  const { data } = await api.get(`/wompi/transaccion/${idTransaccion}`);
  return data.data ?? data;
}