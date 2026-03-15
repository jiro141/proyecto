import AuthApi from "../AuthApi";

/**
 * Obtener todos los reporte (con opción de búsqueda)
 * @param {string} search - texto a buscar por nombre, encargado o rif
 */
export const getReportes = async (search = "") => {
  const response = await AuthApi.get(`/reportes/reportes/?search=${search}`);
  return response.data;
};
export const getReporteDetalle = async (id) => {
  
  const response = await AuthApi.get(`/reportes/reportes/${id}/`);
  console.log(response,'data detallada');
  
  return response.data;
};
/**
 * Crear un nuevo cliente
 * @param {Object} payload - datos del cliente
 */
export const createReporte = async (payload) => {
  const response = await AuthApi.post(`/reportes/reportes/`, payload);
  return response.data;
};

/**
 * Actualizar un cliente existente
 * @param {number|string} id - ID del cliente
 * @param {Object} payload - datos a actualizar
 */
export const updateReporte = async (id, payload) => {
  const response = await AuthApi.put(`/reportes/reportes/${id}/`, payload);
  return response.data;
};

/**
 * Eliminar un cliente
 * @param {number|string} id - ID del cliente
 */
export const deleteReporte = async (id) => {
  const response = await AuthApi.delete(`reportes/reportes/${id}/`);
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

export const updateAPU = async (apuId, data) => {
  try {
    const response = await AuthApi.put(`/reportes/apus/${apuId}/`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al actualizar APU:", error.response?.data || error);
    throw error;
  }
};
export const updateAPUMaterial = async (materialId, data) => {
  try {
    const response = await AuthApi.put(`/reportes/materiales/${materialId}/`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error actualizando material:", error.response?.data || error);
    throw error;
  }
};
export const updateAPUHerramienta = async (id, data) => {
  try {
    const response = await AuthApi.put(`/reportes/herramientas/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error actualizando herramienta:", error.response?.data || error);
    throw error;
  }
};
export const updateAPUManoObra = async (id, data) => {
  try {
    const response = await AuthApi.put(`/reportes/mano-obra/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error actualizando mano de obra:", error.response?.data || error);
    throw error;
  }
};
export const updateAPULogistica = async (id, data) => {
  try {
    const response = await AuthApi.put(`/reportes/logistica/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error actualizando logística:", error.response?.data || error);
    throw error;
  }
};





// 🏗️ Crear un APU asociado a un reporte
export const createAPU = async (reporteId, data) => {
  try {
    const payload = { ...data, reporte: reporteId };

    const response = await AuthApi.post(`/reportes/reportes/${reporteId}/apus/`, payload);


    return response.data;
  } catch (error) {
    console.error("❌ Error al crear APU:", error.response?.data || error);
    throw error;
  }
};

// 🧱 Crear material dentro de un APU
export const createAPUMaterial = async (apuId, data) => {
  try {

    const response = await AuthApi.post(`/reportes/apus/${apuId}/materiales/`, data);


    return response.data;
  } catch (error) {
    console.error("❌ Error al agregar material:", error.response?.data || error);
    throw error;
  }
};

// ⚒️ Agregar herramienta
export const createAPUHerramienta = async (apuId, data) => {
  try {

    const response = await AuthApi.post(`/reportes/apus/${apuId}/herramientas/`, data);


    return response.data;
  } catch (error) {
    console.error("❌ Error al agregar herramienta:", error.response?.data || error);
    throw error;
  }
};

// 👷 Agregar mano de obra
export const createAPUManoObra = async (apuId, data) => {
  try {

    const response = await AuthApi.post(`/reportes/apus/${apuId}/mano-obra/`, data);


    return response.data;
  } catch (error) {
    console.error("❌ Error al agregar mano de obra:", error.response?.data || error);
    throw error;
  }
};

// 🚚 Agregar logística
export const createAPULogistica = async (apuId, data) => {
  try {

    const response = await AuthApi.post(`/reportes/apus/${apuId}/logistica/`, data);


    return response.data;
  } catch (error) {
    console.error("❌ Error al agregar logística:", error.response?.data || error);
    throw error;
  }
};

