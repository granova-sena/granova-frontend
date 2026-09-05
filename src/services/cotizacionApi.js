import api from './api';

export async function guardarCotizacion({ items, subtotal, descuentoMonto, total, descuentoPct, descuentoFuente }) {
  const { data } = await api.post('/cotizaciones', {
    productos: items.map((p) => ({
      id_producto: p.id,
      id_formato: p.id_formato ?? null,
      nombre: p.nombre,
      presentacion: p.presentacion ?? null,
      etiqueta_formato: p.etiqueta_formato ?? null,
      precio_unitario: p.precio,
      cantidad: p.cantidad ?? p.cant ?? 1,
      peso_kg: p.peso_kg ?? null,
      promo_pct: p.promo_pct ?? null,
      iva_pct: p.iva_pct ?? null,
    })),
    subtotal,
    descuento: descuentoMonto,
    total,
    descuento_pct: descuentoPct,
    descuento_fuente: descuentoFuente,
  });
  return data.data;
}
export async function listarCotizaciones(page = 1, limit = 10) {
  const { data } = await api.get('/cotizaciones', { params: { page, limit } });
  return { data: data.data, paginacion: data.paginacion };
}
export async function obtenerCotizacion(id) {
  const { data } = await api.get(`/cotizaciones/${id}`);
  return data.data;
}
export async function comprarCotizacion(idCotizacion, datosCompra) {

  const { data } = await api.post(`/cotizaciones/${idCotizacion}/comprar`, datosCompra);
  return data.data;

}
export async function eliminarCotizacion(id) {
  const { data } = await api.delete(`/cotizaciones/${id}`);
  return data;
}