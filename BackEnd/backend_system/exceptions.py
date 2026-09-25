"""
Manejo centralizado de errores de la API.

Toda respuesta de error bajo /api/ tiene el mismo formato JSON:

    {
        "message": "Texto legible que el frontend muestra en el toast",
        "code": "validation_error",
        "status": 400,
        "errors": {"campo": ["detalle", ...]},   # solo en errores de validación
        "detalle": "KeyError: 'x'"               # solo en errores 500 con DEBUG
    }

- `api_exception_handler`: EXCEPTION_HANDLER de DRF (errores dentro de vistas DRF).
- `ApiJsonErrorMiddleware`: red de seguridad para lo que ocurre fuera de DRF
  (rutas inexistentes, errores de middleware) → nunca devuelve HTML en /api/.
"""

import logging

from django.conf import settings
from django.core.exceptions import (
    ObjectDoesNotExist,
    PermissionDenied,
    ValidationError as DjangoValidationError,
)
from django.db import IntegrityError
from django.db.models import ProtectedError, RestrictedError
from django.http import Http404, JsonResponse
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

API_PREFIX = "/api/"

MENSAJES_POR_STATUS = {
    400: "La solicitud tiene datos inválidos.",
    401: "Sesión expirada o credenciales inválidas. Iniciá sesión nuevamente.",
    403: "No tenés permiso para realizar esta acción.",
    404: "El recurso solicitado no existe.",
    405: "Método no permitido para esta ruta.",
    409: "Conflicto con los datos existentes.",
    413: "El archivo o los datos enviados son demasiado grandes.",
    415: "Formato de datos no soportado.",
    429: "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.",
    500: "Error interno del servidor.",
    502: "Error de comunicación con el servidor.",
    503: "Servicio temporalmente no disponible.",
}


# ============================================================
# Helpers
# ============================================================


def _payload(message, code, http_status, errors=None, detalle=None):
    data = {"message": message, "code": code, "status": http_status}
    if errors:
        data["errors"] = errors
    if detalle:
        data["detalle"] = detalle
    return data


def _get_model(view):
    """Modelo asociado a la vista (via queryset o serializer), si existe."""
    if view is None:
        return None
    queryset = getattr(view, "queryset", None)
    if queryset is not None:
        return queryset.model
    try:
        serializer_class = view.get_serializer_class()
        return serializer_class.Meta.model
    except Exception:
        return None


def _field_label(model, field_name):
    """Nombre legible de un campo: verbose_name del modelo o el nombre formateado."""
    if model is not None:
        try:
            return str(model._meta.get_field(field_name).verbose_name).capitalize()
        except Exception:
            pass
    return field_name.replace("_", " ").capitalize()


def _flatten_errors(errors, model=None, prefix=""):
    """
    Convierte la estructura anidada de errores de DRF en una lista de
    mensajes legibles: ["Código: Este campo es requerido.", "Items #2 → Cantidad: ..."]
    """
    mensajes = []

    if isinstance(errors, dict):
        for field, value in errors.items():
            if field in ("non_field_errors", "__all__", "detail"):
                label = prefix
            else:
                field_label = _field_label(model if not prefix else None, field)
                label = f"{prefix} → {field_label}" if prefix else field_label
            mensajes.extend(_flatten_errors(value, model, label))

    elif isinstance(errors, (list, tuple)):
        for index, value in enumerate(errors):
            if isinstance(value, (dict, list, tuple)):
                if not value:
                    continue
                label = f"{prefix} #{index + 1}" if prefix else f"#{index + 1}"
                mensajes.extend(_flatten_errors(value, model, label))
            else:
                mensajes.extend(_flatten_errors(value, model, prefix))

    else:
        texto = str(errors)
        mensajes.append(f"{prefix}: {texto}" if prefix else texto)

    return mensajes


def _request_ref(request):
    if request is None:
        return ""
    return f"{request.method} {request.path}"


def _detalle_tecnico(exc):
    """Detalle técnico del error, solo visible con DEBUG activo."""
    if not settings.DEBUG:
        return None
    return f"{exc.__class__.__name__}: {exc}"


def _protected_message(exc, model):
    """Mensaje para borrados bloqueados por relaciones PROTECT/RESTRICT."""
    objetos = list(getattr(exc, "protected_objects", None) or getattr(exc, "restricted_objects", None) or [])
    nombre = str(model._meta.verbose_name) if model else "el registro"

    if not objetos:
        return f"No se puede eliminar {nombre} porque está siendo usado por otros registros."

    conteo = {}
    for obj in objetos:
        label = str(obj._meta.verbose_name_plural)
        conteo[label] = conteo.get(label, 0) + 1
    usados = ", ".join(f"{cantidad} {label}" for label, cantidad in conteo.items())
    return f"No se puede eliminar {nombre} porque está siendo usado por: {usados}."


def _integrity_message(exc):
    texto = str(exc).lower()
    if "unique" in texto or "duplicate" in texto:
        return "Ya existe un registro con esos datos (valor duplicado)."
    if "foreign key" in texto:
        return "El registro hace referencia a otro que no existe, o está siendo usado por otros registros."
    if "not null" in texto:
        return "Falta un dato obligatorio para guardar el registro."
    return "Los datos no cumplen las reglas de integridad de la base de datos."


# ============================================================
# EXCEPTION_HANDLER de DRF
# ============================================================


def api_exception_handler(exc, context):
    view = context.get("view")
    request = context.get("request")
    model = _get_model(view)

    # --- 404: indicar exactamente qué no se encontró ---
    if isinstance(exc, (Http404, ObjectDoesNotExist)):
        nombre = str(model._meta.verbose_name) if model else "recurso"
        pk = (getattr(view, "kwargs", None) or {}).get("pk")
        message = f"No se encontró {nombre}"
        message += f" con id {pk}." if pk else "."
        return Response(
            _payload(message, "not_found", 404), status=status.HTTP_404_NOT_FOUND
        )

    # --- Validaciones de modelo (full_clean / clean) ---
    if isinstance(exc, DjangoValidationError):
        errors = exc.message_dict if hasattr(exc, "error_dict") else {"non_field_errors": exc.messages}
        mensajes = _flatten_errors(errors, model)
        return Response(
            _payload(" | ".join(mensajes) or MENSAJES_POR_STATUS[400], "validation_error", 400, errors),
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()

    # --- Borrado bloqueado por relaciones ---
    if isinstance(exc, (ProtectedError, RestrictedError)):
        return Response(
            _payload(_protected_message(exc, model), "protected", 409),
            status=status.HTTP_409_CONFLICT,
        )

    # --- Restricciones de base de datos ---
    if isinstance(exc, IntegrityError):
        logger.warning("IntegrityError en %s: %s", _request_ref(request), exc)
        return Response(
            _payload(_integrity_message(exc), "integrity_error", 409, detalle=_detalle_tecnico(exc)),
            status=status.HTTP_409_CONFLICT,
        )

    # --- Excepciones propias de DRF ---
    response = drf_exception_handler(exc, context)
    if response is not None:
        http_status = response.status_code
        data = response.data

        if isinstance(exc, exceptions.ValidationError):
            mensajes = _flatten_errors(data, model)
            message = " | ".join(mensajes) or MENSAJES_POR_STATUS[400]
            errors = data if isinstance(data, dict) else {"non_field_errors": data}
            response.data = _payload(message, "validation_error", http_status, errors)
        else:
            detail = data.get("detail") if isinstance(data, dict) else data
            message = str(detail) if detail else MENSAJES_POR_STATUS.get(http_status, "Error en la solicitud.")
            code = getattr(detail, "code", None) or getattr(exc, "default_code", "error")
            response.data = _payload(message, code, http_status)

        return response

    # --- Cualquier otra excepción: 500 JSON (nunca HTML) ---
    logger.exception("Error no controlado en %s", _request_ref(request))
    message = f"Error interno del servidor al procesar {_request_ref(request)}."
    return Response(
        _payload(message, "server_error", 500, detalle=_detalle_tecnico(exc)),
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# ============================================================
# Middleware: garantiza JSON en /api/ fuera de las vistas DRF
# ============================================================


class ApiJsonErrorMiddleware:
    """
    - Excepciones en vistas no-DRF bajo /api/ → JSON.
    - Respuestas de error HTML bajo /api/ (404 de rutas inexistentes, páginas
      de debug de Django, errores de middleware) → se reemplazan por JSON.

    Debe ir DESPUÉS de CorsMiddleware para que las respuestas JSON reciban
    las cabeceras CORS.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if not request.path.startswith(API_PREFIX) or response.status_code < 400:
            return response

        content_type = response.get("Content-Type", "")
        if "application/json" in content_type:
            return response

        return self._json_error(request, response.status_code)

    def process_exception(self, request, exception):
        if not request.path.startswith(API_PREFIX):
            return None

        if isinstance(exception, Http404):
            return self._json_error(request, 404)
        if isinstance(exception, PermissionDenied):
            return self._json_error(request, 403)

        logger.exception("Error no controlado en %s", _request_ref(request))
        return self._json_error(request, 500, detalle=_detalle_tecnico(exception))

    def _json_error(self, request, http_status, detalle=None):
        ref = _request_ref(request)
        if http_status == 404:
            message = f"La ruta {ref} no existe en el servidor."
            code = "not_found"
        elif (
            http_status == 500
            and request.method in ("POST", "PUT", "PATCH", "DELETE")
            and not request.path.endswith("/")
        ):
            # APPEND_SLASH no puede redirigir un POST/PUT → RuntimeError de Django
            message = f"La ruta {ref} debe terminar en '/'."
            code = "missing_trailing_slash"
        elif http_status >= 500:
            message = f"Error interno del servidor al procesar {ref}."
            code = "server_error"
        else:
            message = MENSAJES_POR_STATUS.get(http_status, f"Error ({http_status}) al procesar {ref}.")
            code = "error"

        return JsonResponse(
            _payload(message, code, http_status, detalle=detalle),
            status=http_status,
            json_dumps_params={"ensure_ascii": False},
        )
