import api from './api';

export async function crearPedido(datosPedido) {
  const { data } = await api.post('/pedidos', datosPedido);
  return data.data; // { id_pedido, estado, estado_pago, total, ... }
}

export async function obtenerPedidosCliente(idCliente, page = 1, limit = 10) {
  const { data } = await api.get(`/pedidos/cliente/${idCliente}`, { params: { page, limit } });
  return data;
}

export async function obtenerPedido(idPedido) {
  const { data } = await api.get(`/pedidos/${idPedido}`);
  return data.data;
}