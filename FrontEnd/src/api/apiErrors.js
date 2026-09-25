import { toast } from "react-toastify";

// Mensajes de respaldo cuando el backend no manda uno propio
const MENSAJES_POR_STATUS = {
  400: "Datos inválidos. Verificá la información ingresada.",
  401: "Sesión expirada. Por favor, iniciá sesión nuevamente.",
  403: "No tenés permiso para realizar esta acción.",
  404: "El recurso solicitado no existe.",
  409: "Conflicto de datos. El registro ya existe o está en uso.",
  413: "El archivo o los datos enviados son demasiado grandes.",
  429: "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.",
  500: "Error interno del servidor.",
  502: "Error de comunicación con el servidor.",
  503: "Servicio temporalmente no disponible.",
  504: "El servidor tardó demasiado en responder.",
};

const esHTML = (texto) => /^\s*</.test(texto);

const formatearCampo = (campo) =>
  campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ");

// Aplana errores de validación de DRF: {campo: ["msg"]} → ["Campo: msg"]
const aplanarErrores = (errores, prefijo = "") => {
  if (errores == null) return [];
  if (typeof errores === "string") {
    return [prefijo ? `${prefijo}: ${errores}` : errores];
  }
  if (Array.isArray(errores)) {
    return errores.flatMap((valor, i) =>
      typeof valor === "object" && valor !== null
        ? aplanarErrores(valor, prefijo ? `${prefijo} #${i + 1}` : `#${i + 1}`)
        : aplanarErrores(valor, prefijo)
    );
  }
  if (typeof errores === "object") {
    return Object.entries(errores).flatMap(([campo, valor]) => {
      const esGeneral = ["non_field_errors", "detail", "__all__"].includes(campo);
      const etiqueta = esGeneral
        ? prefijo
        : prefijo
          ? `${prefijo} → ${formatearCampo(campo)}`
          : formatearCampo(campo);
      return aplanarErrores(valor, etiqueta);
    });
  }
  return [String(errores)];
};

/**
 * Extrae un mensaje legible de un error (axios o JS).
 * Prioridad: message del backend → detail/error → errores de campo → mensaje por status → fallback.
 */
export const getErrorMessage = (error, fallback = "Ocurrió un error inesperado.") => {
  if (!error) return fallback;

  // Error de JS (no HTTP)
  if (!error.isAxiosError && !error.response && !error.request) {
    return fallback;
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED") return "El servidor tardó demasiado en responder.";
    return "No se pudo conectar con el servidor. Verificá tu conexión a internet.";
  }

  const { status, data } = error.response;

  // Formato estándar del backend: {message, code, status, errors?, detalle?}
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (typeof data.message === "string" && data.message) {
      return data.detalle ? `${data.message} (${data.detalle})` : data.message;
    }
    if (typeof data.detail === "string" && data.detail) return data.detail;
    if (typeof data.error === "string" && data.error) return data.error;

    const mensajes = aplanarErrores(data);
    if (mensajes.length) return mensajes.join(" | ");
  }

  if (Array.isArray(data)) {
    const mensajes = aplanarErrores(data);
    if (mensajes.length) return mensajes.join(" | ");
  }

  // Texto plano (nunca mostrar HTML)
  if (typeof data === "string" && data.trim() && !esHTML(data) && data.length < 300) {
    return data;
  }

  return MENSAJES_POR_STATUS[status] || `${fallback} (código ${status})`;
};

/**
 * Muestra un toast de error sin duplicar el que ya mostró el interceptor de AuthApi.
 * Usar en los catch: notifyError(error, "Error al guardar X")
 */
export const notifyError = (error, fallback) => {
  if (error?.toastShown) return;
  const mensaje = getErrorMessage(error, fallback);
  toast.error(mensaje, { toastId: mensaje });
};
