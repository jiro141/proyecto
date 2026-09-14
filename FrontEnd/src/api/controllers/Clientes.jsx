import AuthApi from "../AuthApi";

/**
 * Obtener todos los clientes (con opción de búsqueda y paginación)
 * @param {string} search - texto a buscar por nombre, encargado o rif
 * @param {number} page - número de página (1-indexed)
 */
export const getClientes = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/reportes/clientes/?${params.toString()}`);
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
