import AuthApi from "../AuthApi";

/**
 * Obtener todos los elementos de EPP
 * @param {string} search
 * @param {number} page - número de página (1-indexed)
 */
export const getEpp = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/epp/?${params.toString()}`);
  return response.data;
};

/**
 * Obtener todos los elementos de Stock
 * @param {string} search
 * @param {number} page - número de página (1-indexed)
 */
export const getStock = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/stock/?${params.toString()}`);
  return response.data;
};

export const getTaza = async () => {
  const response = await AuthApi.get(`/inventario/taza/`);
  return response.data;
};

/**
 * Obtener todos los elementos de Consumibles
 * @param {string} search
 * @param {number} page - número de página (1-indexed)
 */
export const getConsumibles = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/consumibles/?${params.toString()}`);
  return response.data;
};

/**
 * Obtener herramientas
 * @param {string} search
 * @param {number} page - número de página (1-indexed)
 */
export const getHerramientas = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/herramientas/?${params.toString()}`);
  return response.data;
};

/**
 * Obtener empleados
 * @param {string} search
 * @param {number} page - número de página (1-indexed)
 */
export const getEmpleados = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/empleados/?${params.toString()}`);
  return response.data;
};

/**
 * Obtener logística
 * @param {string} search
 * @param {number} page - número de página (1-indexed)
 */
export const getLogistica = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/logistica/?${params.toString()}`);
  return response.data;
};

/**
 * Crear herramienta en el backend
 */
export const createHerramienta = async (payload) => {
  const response = await AuthApi.post(`/inventario/herramientas/`, payload);
  return response.data;
};

/**
 * Actualizar herramienta en el backend
 */
export const updateHerramienta = async (id, payload) => {
  const response = await AuthApi.put(`/inventario/herramientas/${id}/`, payload);
  return response.data;
};

/**
 * Crear empleado en el backend
 */
export const createEmpleado = async (payload) => {
  const response = await AuthApi.post(`/inventario/empleados/`, payload);
  return response.data;
};

/**
 * Actualizar empleado en el backend
 */
export const updateEmpleado = async (id, payload) => {
  const response = await AuthApi.put(`/inventario/empleados/${id}/`, payload);
  return response.data;
};

/**
 * Crear logística en el backend
 */
export const createLogistica = async (payload) => {
  const response = await AuthApi.post(`/inventario/logistica/`, payload);
  return response.data;
};

/**
 * Actualizar logística en el backend
 */
export const updateLogistica = async (id, payload) => {
  const response = await AuthApi.put(`/inventario/logistica/${id}/`, payload);
  return response.data;
};
export const getMovimientos = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/movimientos/?${params.toString()}`);
  return response.data;
};

export const getProveedores = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/proveedores/?${params.toString()}`);
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
 * @param {number} page - número de página (1-indexed)
 */
export const getProveedoresSearch = async (search = "", page = 1) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page);
  const response = await AuthApi.get(`/inventario/proveedores/?${params.toString()}`);
  return response.data;
};
