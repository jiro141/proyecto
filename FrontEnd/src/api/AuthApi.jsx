// src/services/AuthApi.jsx
import axios from "axios";
import { toast } from "react-toastify";

// Base URL de tu backend Django
const BASE_URL = "http://127.0.0.1:8000/api";

// Mensajes de error en español
const getErrorMessage = (error) => {
  if (!error.response) {
    return "Error de conexión. Verifica tu conexión a internet.";
  }

  const status = error.response.status;
  const data = error.response.data;

  switch (status) {
    case 400:
      // Intentar obtener mensaje específico del backend
      if (typeof data === 'string') return data;
      if (data?.detail) return data.detail;
      if (data?.message) return data.message;
      return "Datos inválidos. Verifica la información ingresada.";
    
    case 401:
      return "Sesión expirada. Por favor, inicia sesión nuevamente.";
    
    case 403:
      return "No tienes permiso para realizar esta acción.";
    
    case 404:
      return "El recurso solicitado no existe.";
    
    case 409:
      if (data?.detail) return data.detail;
      return "Conflicto de datos. El registro ya existe o hay un conflicto.";
    
    case 422:
      // Errores de validación de Django REST
      if (data) {
        const messages = [];
        for (const [field, errors] of Object.entries(data)) {
          if (Array.isArray(errors)) {
            messages.push(...errors);
          } else if (typeof errors === 'string') {
            messages.push(errors);
          }
        }
        if (messages.length > 0) {
          return messages.join(', ');
        }
      }
      return "Error de validación. Verifica los datos ingresados.";
    
    case 500:
      return "Error del servidor. Intenta más tarde.";
    
    case 502:
      return "Error de comunicación con el servidor.";
    
    case 503:
      return "Servicio temporalmente no disponible.";
    
    default:
      if (data?.detail) return data.detail;
      return `Error (${status}). Intenta más tarde.`;
  }
};

// Crear instancia de Axios
const AuthApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para incluir token JWT en todas las peticiones
AuthApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // o sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
AuthApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // No mostrar toast para errores de autenticación (401 en login)
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/usuarios/login') || url.includes('/auth/login');
    
    if (error.response?.status === 401 && isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Mostrar toast de error
    const message = getErrorMessage(error);
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default AuthApi;
