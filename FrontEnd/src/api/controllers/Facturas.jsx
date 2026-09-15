import AuthApi from "../AuthApi";

/**
 * Obtener todas las facturas (con opción de búsqueda y paginación)
 * @param {string} search - busca por n_factura, cliente o rif
 * @param {number|null} reporteId - filtra por presupuesto
 * @param {number} page - número de página (1-indexed)
 */
export const getFacturas = async (search = "", reporteId = null, page = 1) => {
  let url = "/facturas/";
  const params = [];
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (reporteId) params.push(`reporte_id=${encodeURIComponent(reporteId)}`);
  params.push(`page=${page}`);
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  const response = await AuthApi.get(url);
  return response.data;
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
 * Anular una factura (EMITIDA → ANULADA, genera NC o ND automáticamente)
 * @param {number} id - ID de la factura
 * @param {string} motivo - Motivo de la anulación
 * @param {string} tipo_nota - "credito" o "debito" (default: "credito")
 */
export const anularFactura = async (id, motivo = "", tipo_nota = "credito") => {
  const response = await AuthApi.post(`/facturas/${id}/anular/`, {
    motivo,
    tipo_nota,
  });
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

// ============================================================
// 📄 NOTAS DE CRÉDITO
// ============================================================

/**
 * Obtener todas las notas de crédito
 */
export const getNotasCredito = async (search = "", page = 1) => {
  let url = "/facturas/notas-credito/";
  const params = [];
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  params.push(`page=${page}`);
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  const response = await AuthApi.get(url);
  return response.data;
};

/**
 * Obtener el detalle de una nota de crédito
 */
export const getNotaCreditoDetalle = async (id) => {
  const response = await AuthApi.get(`/facturas/notas-credito/${id}/`);
  return response.data;
};

/**
 * Crear una nota de crédito manual
 */
export const createNotaCredito = async (payload) => {
  const response = await AuthApi.post("/facturas/notas-credito/", payload);
  return response.data;
};

/**
 * Anular una nota de crédito
 */
export const anularNotaCredito = async (id) => {
  const response = await AuthApi.delete(`/facturas/notas-credito/${id}/`);
  return response.data;
};

// ============================================================
// 📄 NOTAS DE DÉBITO
// ============================================================

/**
 * Obtener todas las notas de débito
 */
export const getNotasDebito = async (search = "", page = 1) => {
  let url = "/facturas/notas-debito/";
  const params = [];
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  params.push(`page=${page}`);
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  const response = await AuthApi.get(url);
  return response.data;
};

/**
 * Obtener el detalle de una nota de débito
 */
export const getNotaDebitoDetalle = async (id) => {
  const response = await AuthApi.get(`/facturas/notas-debito/${id}/`);
  return response.data;
};

/**
 * Crear una nota de débito
 */
export const createNotaDebito = async (payload) => {
  const response = await AuthApi.post("/facturas/notas-debito/", payload);
  return response.data;
};

/**
 * Anular una nota de débito
 */
export const anularNotaDebito = async (id) => {
  const response = await AuthApi.delete(`/facturas/notas-debito/${id}/`);
  return response.data;
};

/**
 * Configuración de notas de crédito (serie + siguiente n_nota)
 */
export const getNotaCreditoConfig = async () => {
  const response = await AuthApi.get("/facturas/notas-credito/config/");
  return response.data;
};

/**
 * Configuración de notas de débito (serie + siguiente n_nota)
 */
export const getNotaDebitoConfig = async () => {
  const response = await AuthApi.get("/facturas/notas-debito/config/");
  return response.data;
};