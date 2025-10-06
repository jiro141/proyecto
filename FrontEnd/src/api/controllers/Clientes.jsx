import AuthApi from "../AuthApi";

/**
 * Obtener todos los clientes (con opción de búsqueda)
 * @param {string} search - texto a buscar por nombre, encargado o rif
 */
export const getClientes = async (search = "") => {
  const response = await AuthApi.get(`/reportes/clientes/?search=${search}`);
  return response.data;
};

/**
 * Crear un nuevo cliente
 * @param {Object} payload - datos del cliente
 */
export const createCliente = async (payload) => {
  const response = await AuthApi.post(`/reportes/clientes/`, payload);
  return response.data;
};

/**
 * Actualizar un cliente existente
 * @param {number|string} id - ID del cliente
 * @param {Object} payload - datos a actualizar
 */
export const updateCliente = async (id, payload) => {
  const response = await AuthApi.put(`/reportes/clientes/${id}/`, payload);
  return response.data;
};

/**
 * Eliminar un cliente
 * @param {number|string} id - ID del cliente
 */
export const deleteCliente = async (id) => {
  const response = await AuthApi.delete(`reportes/clientes/${id}/`);
  return response.data;
};

/**
 * Obtener un cliente por su ID
 * @param {number|string} id - ID del cliente
 */
export const getClienteById = async (id) => {
  const response = await AuthApi.get(`/reportes/clientes/${id}/`);
  return response.data;
};
