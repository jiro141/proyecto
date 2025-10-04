import AuthApi from "../AuthApi";

/**
 * Obtener todos los elementos de EPP
 * @returns {Promise<Array>} Lista de EPPs
 */
export const getEpp = async (search = "") => {
  const response = await AuthApi.get(`/inventario/epp/?search=${search}`);
  return response.data;
};

/**
 * Obtener todos los elementos de Stock
 * @returns {Promise<Array>} Lista de stock
 */
export const getStock = async (search = "") => {
  const response = await AuthApi.get(`/inventario/stock/?search=${search}`);
  return response.data;
};

/**
 * Obtener todos los elementos de Consumibles
 * @returns {Promise<Array>} Lista de consumibles
 */
export const getConsumibles = async (search = "") => {
  const response = await AuthApi.get(
    `/inventario/consumibles/?search=${search}`
  );
  return response.data;
};
export const getMovimientos = async (search = "") => {
  const response = await AuthApi.get(
    `/inventario/movimientos/?search=${search}`
  );
  return response.data;
};
export const getProveedores = async (search = "") => {
  const response = await AuthApi.get(
    `/inventario/proveedores/?search=${search}`
  );
  return response.data;
};

/**
 * Crear un nuevo elemento (genérico)
 * @param {string} tipo - 'epp' | 'stock' | 'consumibles'
 * @param {Object} payload - datos a enviar
 */
export const createItem = async (tipo, payload) => {
  const response = await AuthApi.post(`/inventario/${tipo}/`, payload);
  return response.data;
};

/**
 * Actualizar un elemento por ID
 * @param {string} tipo
 * @param {number|string} id
 * @param {Object} payload
 */
export const updateItem = async (tipo, id, payload) => {
  const response = await AuthApi.put(`/inventario/${tipo}/${id}/`, payload);
  return response.data;
};

/**
 * Eliminar un elemento por ID
 * @param {string} tipo
 * @param {number|string} id
 */
export const deleteItem = async (tipo, id) => {
  const response = await AuthApi.delete(`/inventario/${tipo}/${id}/`);
  return response.data;
};

/**
 * Obtener un solo elemento por ID
 * @param {string} tipo
 * @param {number|string} id
 */
export const getItemById = async (tipo, id) => {
  const response = await AuthApi.get(`/inventario/${tipo}/${id}/`);
  return response.data;
};

/**
 * Obtener proveedores con búsqueda opcional
 * @param {string} search
 */
export const getProveedoresSearch = async (search = "") => {
  const response = await AuthApi.get(
    `/inventario/proveedores/?search=${search}`
  );
  return response.data;
};
