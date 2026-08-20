import AuthApi from "../AuthApi";

/**
 * Obtener todas las facturas (con opción de búsqueda)
 * @param {string} search - busca por n_factura, cliente o rif
 * @param {number|null} reporteId - filtra por presupuesto
 */
export const getFacturas = async (search = "", reporteId = null) => {
  let url = "/facturas/";
  const params = [];
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (reporteId) params.push(`reporte_id=${encodeURIComponent(reporteId)}`);
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  const response = await AuthApi.get(url);
  return response.data.results || response.data;
};

/**
 * Obtener el detalle de una factura
 */
export const getFacturaDetalle = async (id) => {
  const response = await AuthApi.get(`/facturas/${id}/`);
  return response.data;
};

/**
 * Crear una nueva factura
 * @param {Object} payload - { reporte, fecha, moneda, tasa_bs_usd, fecha_tasa,
 *   porcentaje_descuento, monto_iva, items: [{apu_id, apu_descripcion, unidad, cantidad, precio_unitario}] }
 */
export const createFactura = async (payload) => {
  const response = await AuthApi.post(`/facturas/`, payload);
  return response.data;
};

/**
 * Actualizar una factura EMITIDA (items reemplazables)
 */
export const updateFactura = async (id, payload) => {
  const response = await AuthApi.put(`/facturas/${id}/`, payload);
  return response.data;
};

/**
 * Anular una factura (EMITIDA → ANULADA, libera el pendiente)
 */
export const anularFactura = async (id) => {
  const response = await AuthApi.post(`/facturas/${id}/anular/`);
  return response.data;
};

/**
 * Presupuestos EJECUTADO disponibles para facturar (con pendiente > 0)
 */
export const getPresupuestosDisponibles = async () => {
  const response = await AuthApi.get(`/facturas/presupuestos-disponibles/`);
  return response.data;
};

/**
 * APUs de un presupuesto con cantidad, cantidad facturada y pendiente
 */
export const getPendienteFactura = async (reporteId) => {
  const response = await AuthApi.get(`/facturas/presupuestos/${reporteId}/pendiente/`);
  return response.data;
};

/**
 * Configuración de facturas (serie + siguiente n_factura)
 */
export const getFacturaConfig = async () => {
  const response = await AuthApi.get(`/facturas/config/`);
  return response.data;
};

/**
 * Tasa oficial del dólar (Banco Central) desde la misma API del Dashboard.
 * Devuelve { promedio, fechaActualizacion } de la fuente "oficial".
 */
export const getTasaBCV = async () => {
  const res = await fetch("https://ve.dolarapi.com/v1/dolares");
  const json = await res.json();
  const oficial = (json || []).find((item) => item.fuente === "oficial");
  if (!oficial) {
    throw new Error("No se encontró la tasa oficial del BCV");
  }
  return {
    promedio: oficial.promedio,
    fechaActualizacion: oficial.fechaActualizacion,
  };
};