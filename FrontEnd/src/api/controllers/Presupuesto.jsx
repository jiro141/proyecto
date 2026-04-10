import AuthApi from "../AuthApi";

/**
 * Obtener todos los reportes (con opción de búsqueda)
 */
export const getReportes = async (search = "") => {
  const url = search ? `/reportes/?search=${search}` : "/reportes/";
  const response = await AuthApi.get(url);
  // El backend puede devolver { results: [...] } o un array directo
  return response.data.results || response.data;
};

export const getReporteDetalle = async (id) => {
  const response = await AuthApi.get(`/reportes/${id}/`);
  return response.data;
};

/**
 * Crear un nuevo reporte
 */
export const createReporte = async (payload) => {
  const response = await AuthApi.post(`/reportes/`, payload);
  return response.data;
};

/**
 * Actualizar un reporte existente
 */
export const updateReporte = async (id, payload) => {
  const response = await AuthApi.put(`/reportes/${id}/`, payload);
  return response.data;
};

/**
 * Actualizar solo el estado de un reporte
 */
export const updateReporteEstado = async (id, estado) => {
  const response = await AuthApi.patch(`/reportes/${id}/`, { estado });
  return response.data;
};

/**
 * Eliminar un reporte
 */
export const deleteReporte = async (id) => {
  const response = await AuthApi.delete(`/reportes/${id}/`);
  return response.data;
};

/**
 * Obtener un cliente por su ID
 */
export const getClienteById = async (id) => {
  const response = await AuthApi.get(`/reportes/clientes/${id}/`);
  return response.data;
};

export const updateAPU = async (apuId, data) => {
  try {
    const response = await AuthApi.put(`/reportes/apus/${apuId}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar APU:", error.response?.data || error);
    throw error;
  }
};

export const updateAPUMaterial = async (materialId, data) => {
  try {
    const response = await AuthApi.put(`/reportes/materiales/${materialId}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error actualizando material:", error.response?.data || error);
    throw error;
  }
};

export const updateAPUHerramienta = async (id, data) => {
  try {
    const response = await AuthApi.put(`/reportes/herramientas/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error actualizando herramienta:", error.response?.data || error);
    throw error;
  }
};

export const updateAPUManoObra = async (id, data) => {
  try {
    const response = await AuthApi.put(`/reportes/mano-obra/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error actualizando mano de obra:", error.response?.data || error);
    throw error;
  }
};

export const updateAPULogistica = async (id, data) => {
  try {
    const response = await AuthApi.put(`/reportes/logistica/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error actualizando logistica:", error.response?.data || error);
    throw error;
  }
};

// Crear un APU asociado a un reporte
export const createAPU = async (reporteId, data) => {
  try {
    const payload = { ...data, reporte: reporteId };
    const response = await AuthApi.post(`/reportes/${reporteId}/apus/`, payload);
    return response.data;
  } catch (error) {
    console.error("Error al crear APU:", error.response?.data || error);
    throw error;
  }
};

// Eliminar un APU y todos sus relacionados (materiales, herramientas, etc.)
export const deleteAPU = async (apuId) => {
  try {
    const response = await AuthApi.delete(`/reportes/apus/${apuId}/`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar APU:", error.response?.data || error);
    throw error;
  }
};

// Obtener todos los APUs de un reporte
export const getAPUsByReporte = async (reporteId) => {
  try {
    const response = await AuthApi.get(`/reportes/${reporteId}/apus/`);
    return response.data.results || response.data;
  } catch (error) {
    console.error("Error al obtener APUs:", error.response?.data || error);
    throw error;
  }
};

// Crear material dentro de un APU
export const createAPUMaterial = async (apuId, data) => {
  try {
    const response = await AuthApi.post(`/reportes/apus/${apuId}/materiales/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al agregar material:", error.response?.data || error);
    throw error;
  }
};

// Agregar herramienta
export const createAPUHerramienta = async (apuId, data) => {
  try {
    const response = await AuthApi.post(`/reportes/apus/${apuId}/herramientas/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al agregar herramienta:", error.response?.data || error);
    throw error;
  }
};

// Agregar mano de obra
export const createAPUManoObra = async (apuId, data) => {
  try {
    const response = await AuthApi.post(`/reportes/apus/${apuId}/mano-obra/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al agregar mano de obra:", error.response?.data || error);
    throw error;
  }
};

// Agregar logística
export const createAPULogistica = async (apuId, data) => {
  try {
    const response = await AuthApi.post(`/reportes/apus/${apuId}/logistica/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al agregar logistica:", error.response?.data || error);
    throw error;
  }
};

// =========================
// 📝 NOTAS DEL REPORTE
// =========================

// Obtener notas de un reporte
export const getNotasByReporte = async (reporteId) => {
  try {
    const response = await AuthApi.get(`/reportes/${reporteId}/notas/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener notas:", error.response?.data || error);
    throw error;
  }
};

// Crear una nota para un reporte
export const createNotaReporte = async (reporteId, data) => {
  try {
    const response = await AuthApi.post(`/reportes/${reporteId}/notas/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al crear nota:", error.response?.data || error);
    throw error;
  }
};

// Actualizar una nota
export const updateNotaReporte = async (notaId, data) => {
  try {
    const response = await AuthApi.put(`/reportes/notas/${notaId}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar nota:", error.response?.data || error);
    throw error;
  }
};

// Eliminar una nota
export const deleteNotaReporte = async (notaId) => {
  try {
    const response = await AuthApi.delete(`/reportes/notas/${notaId}/`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar nota:", error.response?.data || error);
    throw error;
  }
};
