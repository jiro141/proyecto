// src/services/AuthApi.jsx
import axios from "axios";
import { toast } from "react-toastify";
import { getErrorMessage } from "./apiErrors";

// Base URL de tu backend Django.
// Se puede sobreescribir en local con la variable VITE_API_URL (ver .env.local)
const BASE_URL = import.meta.env.VITE_API_URL || "https://hermabe.cloud/api";

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

    // Petición cancelada a propósito → no es un error para el usuario
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // 401 fuera del login = token vencido; el mensaje del backend es técnico
    const message =
      error.response?.status === 401
        ? "Sesión expirada. Por favor, iniciá sesión nuevamente."
        : getErrorMessage(error);

    // toastId evita toasts repetidos cuando fallan varias peticiones iguales
    toast.error(message, { toastId: message });

    // Los catch de los componentes usan notifyError() y no vuelven a mostrarlo
    error.toastShown = true;
    error.userMessage = message;

    return Promise.reject(error);
  }
);

export default AuthApi;
