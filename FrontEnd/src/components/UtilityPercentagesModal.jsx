import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { patchTazaPorcentajes } from "../api/controllers/Inventario";
import { toast } from "react-toastify";

/**
 * Extrae el mensaje de error de una respuesta de error de DRF (Django REST Framework)
 * DRF retorna errores en varios formatos:
 * 1. Errores de campo específico: {"utilidad_porcentaje_1": ["Este campo no puede ser negativo."]}
 * 2. Errores no específicos de campo: {"detail": "Mensaje de error"}
 * 3. Errores genéricos: {"message": "Mensaje de error"} (algunos endpoints personalizados)
 * 4. Error de red u otros: {message: "Network error"}
 */
const getErrorMessage = (err) => {
  const { response } = err;
  
  if (!response || !response.data) {
    return err.message || "Error desconocido al guardar";
  }
  
  const data = response.data;
  
  // 1. Check for field-specific validation errors
  // Ejemplo: {"utilidad_porcentaje_1": ["No puede ser negativo."]}
  const fieldErrors = [];
  for (const field in data) {
    if (field !== "detail" && field !== "message" && Array.isArray(data[field])) {
      fieldErrors.push(`${field}: ${data[field].join(", ")}`);
    }
  }
  
  if (fieldErrors.length > 0) {
    return fieldErrors.join(". ");
  }
  
  // 2. Check for DRF's non-field error (detail key)
  if (data.detail) {
    return data.detail;
  }
  
  // 3. Check for custom API error (message key)
  if (data.message) {
    return data.message;
  }
  
  // 4. If it's a string, use it directly
  if (typeof data === "string") {
    return data;
  }
  
  // 5. Fallback: try to stringify the error object
  try {
    return JSON.stringify(data);
  } catch {
    return "Error desconocido al guardar";
  }
};

/**
 * Modal para editar los tres porcentajes de utilidad globales
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {() => void} props.onClose - Función para cerrar el modal
 * @param {number|null} props.tazaId - ID del registro Taza_pesos_dolares activo
 * @param {Object} props.currentValues - Valores actuales de porcentajes
 * @param {number} [props.currentValues.utilidad_porcentaje_1] - Primer porcentaje (0-999.99)
 * @param {number} [props.currentValues.utilidad_porcentaje_2] - Segundo porcentaje (0-999.99)
 * @param {number} [props.currentValues.utilidad_porcentaje_3] - Tercer porcentaje (0-999.99)
 * @param {() => void} props.onSaved - Función llamada después de guardar exitosamente (para refetch)
 */
const UtilityPercentagesModal = ({
  isOpen,
  onClose,
  tazaId,
  currentValues = {},
  onSaved,
}) => {
  // Estado para los valores del formulario
  const [valores, setValores] = useState({
    utilidad_porcentaje_1: "",
    utilidad_porcentaje_2: "",
    utilidad_porcentaje_3: "",
  });

  // Estado para loading y error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar formulario con valores actuales cuando se abre el modal
  useEffect(() => {
    if (isOpen && currentValues) {
      setValores({
        utilidad_porcentaje_1: currentValues.utilidad_porcentaje_1?.toString() || "0",
        utilidad_porcentaje_2: currentValues.utilidad_porcentaje_2?.toString() || "0",
        utilidad_porcentaje_3: currentValues.utilidad_porcentaje_3?.toString() || "0",
      });
      setError(null);
    }
  }, [isOpen, currentValues]);

  // Validar un valor de porcentaje
  const validarPorcentaje = (valor) => {
    if (valor === "") return { valido: true, valor: 0 }; // Vacío = 0
    const num = parseFloat(valor);
    if (isNaN(num)) return { valido: false, mensaje: "Debe ser un número" };
    if (num < 0) return { valido: false, mensaje: "No puede ser negativo" };
    if (num > 999.99) return { valido: false, mensaje: "No puede ser mayor a 999.99" };
    return { valido: true, valor: num };
  };

  // Validar todos los campos
  const validarFormulario = () => {
    const errores = [];
    
    const p1 = validarPorcentaje(valores.utilidad_porcentaje_1);
    const p2 = validarPorcentaje(valores.utilidad_porcentaje_2);
    const p3 = validarPorcentaje(valores.utilidad_porcentaje_3);
    
    if (!p1.valido) errores.push(`Porcentaje 1: ${p1.mensaje}`);
    if (!p2.valido) errores.push(`Porcentaje 2: ${p2.mensaje}`);
    if (!p3.valido) errores.push(`Porcentaje 3: ${p3.mensaje}`);
    
    return errores;
  };

  // Manejar cambio en un campo
  const handleChange = (campo, valor) => {
    // Permitir vacío o números con hasta 2 decimales (hasta 999.99 máximo)
    if (valor === "" || /^\d*\.?\d{0,2}$/.test(valor)) {
      setValores(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  // Manejar guardar
  const handleGuardar = async () => {
    if (!tazaId) {
      setError("No se puede guardar: ID de taza no disponible");
      return;
    }

    // Validar
    const errores = validarFormulario();
    if (errores.length > 0) {
      setError(errores.join(". "));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar payload: convertir strings vacíos a 0
      const payload = {
        utilidad_porcentaje_1: valores.utilidad_porcentaje_1 === "" ? 0 : parseFloat(valores.utilidad_porcentaje_1),
        utilidad_porcentaje_2: valores.utilidad_porcentaje_2 === "" ? 0 : parseFloat(valores.utilidad_porcentaje_2),
        utilidad_porcentaje_3: valores.utilidad_porcentaje_3 === "" ? 0 : parseFloat(valores.utilidad_porcentaje_3),
      };

      // Enviar PATCH
      await patchTazaPorcentajes(tazaId, payload);
      
      // Éxito
      toast.success("Porcentajes de utilidad actualizados correctamente");
      
      // Llamar onSaved para refetch
      if (onSaved) onSaved();
      
      // Cerrar modal
      onClose();
      
    } catch (err) {
      console.error("❌ Error al actualizar porcentajes de utilidad:", err);
      
      // Improved error extraction for DRF (Django REST Framework) error format
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      toast.error("Error al actualizar los porcentajes de utilidad");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cancelar
  const handleCancelar = () => {
    onClose();
  };

  // Renderizar campo de porcentaje
  const renderCampoPorcentaje = (campo, etiqueta, descripcion) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          type="text"
          value={valores[campo]}
          onChange={(e) => handleChange(campo, e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          placeholder="0.00"
          disabled={loading}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          %
        </div>
      </div>
      {descripcion && (
        <p className="text-xs text-gray-500 mt-1">{descripcion}</p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Porcentajes de Utilidad"
      width="max-w-md"
    >
      <div className="space-y-4">
        <div className="mb-2">
          <p className="text-sm text-gray-600">
            Estos porcentajes se aplican globalmente a todos los items de stock. 
            Un valor de 0% muestra el costo base sin margen de utilidad.
          </p>
        </div>

        {/* Campos de porcentaje */}
        {renderCampoPorcentaje(
          "utilidad_porcentaje_1",
          "Porcentaje de Utilidad 1",
          "Primer nivel de utilidad (principal)"
        )}
        
        {renderCampoPorcentaje(
          "utilidad_porcentaje_2",
          "Porcentaje de Utilidad 2",
          "Segundo nivel de utilidad"
        )}
        
        {renderCampoPorcentaje(
          "utilidad_porcentaje_3",
          "Porcentaje de Utilidad 3",
          "Tercer nivel de utilidad"
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancelar}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0B2C4D] border border-transparent rounded-lg hover:bg-[#143d65] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Guardando...
              </>
            ) : (
              "Guardar Porcentajes"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UtilityPercentagesModal;