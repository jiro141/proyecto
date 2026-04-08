// src/api/controllers/ControlConfig.js
import AuthApi from "../AuthApi";

/**
 * 🔹 Obtener configuración del número de control actual
 * Endpoint: GET /api/reportes/config/
 */
export const getControlConfig = async () => {
  try {
    const response = await AuthApi.get("reportes/config/");
    
    return response.data;
  } catch (error) {
    console.error("Error al obtener el número de control:", error);
    throw error;
  }
};

/**
 * 🔹 Crear un nuevo número de control
 * Endpoint: POST /api/reportes/config/
 */
export const createControlConfig = async (data = {}) => {
  try {
    const response = await AuthApi.post("reportes/config/", data);
    return response.data;
  } catch (error) {
    console.error("Error al crear el número de control:", error);
    throw error;
  }
};

/**
 * 🔹 Actualizar un número de control existente
 * Endpoint: PUT /api/reportes/config/:id/
 */
export const updateControlConfig = async (id, data) => {
  try {
    const response = await AuthApi.put(`reportes/config/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el número de control:", error);
    throw error;
  }
};
