import AuthApi from "../AuthApi";

/**
 * Obtener todos los reporte (con opción de búsqueda)
 * @param {string} search - texto a buscar por nombre, encargado o rif
 */
export const getReporte = async (search = "") => {
  const response = await AuthApi.get(`/reportes/reporte/?search=${search}`);
  return response.data;
};

/**
 * Crear un nuevo cliente
 * @param {Object} payload - datos del cliente
 */
export const createReporte = async (payload) => {
  const response = await AuthApi.post(`/reportes/reporte/`, payload);
  return response.data;
};

/**
 * Actualizar un cliente existente
 * @param {number|string} id - ID del cliente
 * @param {Object} payload - datos a actualizar
 */
export const updateReporte = async (id, payload) => {
  const response = await AuthApi.put(`/reportes/reporte/${id}/`, payload);
  return response.data;
};

/**
 * Eliminar un cliente
 * @param {number|string} id - ID del cliente
 */
export const deleteReporte = async (id) => {
  const response = await AuthApi.delete(`reportes/reporte/${id}/`);
  return response.data;
};

/**
 * Obtener un cliente por su ID
 * @param {number|string} id - ID del cliente
 */
export const getClienteById = async (id) => {
  const response = await AuthApi.get(`/reportes/reporte/${id}/`);
  return response.data;
};
