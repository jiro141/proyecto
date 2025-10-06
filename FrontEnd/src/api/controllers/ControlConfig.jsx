// src/api/controllers/ControlConfig.js
import AuthApi from "../AuthApi";

/**
 * 🔹 Obtener configuración del número de control actual
 * Endpoint: GET /api/reporte/config/
 */
export const getControlConfig = async () => {
  try {
    const response = await AuthApi.get("reportes/reporte/config/");
    console.log(response.data,'data');
    
    return response.data;
  } catch (error) {
    console.error("Error al obtener el número de control:", error);
    throw error;
  }
};

/**
 * 🔹 Crear un nuevo número de control
 * Endpoint: POST /api/reporte/config/
 */
export const createControlConfig = async (data = {}) => {
  try {
    const response = await AuthApi.post("reportes/reporte/config/", data);
    return response.data;
  } catch (error) {
    console.error("Error al crear el número de control:", error);
    throw error;
  }
};

/**
 * 🔹 Actualizar un número de control existente
 * Endpoint: PUT /api/reporte/config/:id/
 */
export const updateControlConfig = async (id, data) => {
  try {
    const response = await AuthApi.put(`reportes/reporte/config/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el número de control:", error);
    throw error;
  }
};
