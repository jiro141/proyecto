import React, { useState } from "react";
import Modal from "../../../components/Modal";
import { usePresupuesto } from "../../../context/PresupuestoContext";
import { updateReportePartial } from "../../../api/controllers/Presupuesto";
import { toast } from "react-toastify";

const formatoMoneda = (valor) =>
  valor?.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }) || "$0.00";

export const ClienteInfo = ({ formData, presupuestoEstimado }) => {
  const { updatePresupuestoField } = usePresupuesto();

  const [modalOpen, setModalOpen] = useState(false);
  const [porcentajeInput, setPorcentajeInput] = useState(
    formData?.porcentaje_descuento ?? 0
  );
  const [descripcionInput, setDescripcionInput] = useState(
    formData?.descripcion_descuento ?? ""
  );
  const [guardando, setGuardando] = useState(false);

  const abrirModal = () => {
    setPorcentajeInput(formData?.porcentaje_descuento ?? 0);
    setDescripcionInput(formData?.descripcion_descuento ?? "");
    setModalOpen(true);
  };

  const guardarDescuento = async () => {
    const nuevoPorcentaje = Math.max(
      0,
      Math.min(99, Number(porcentajeInput) || 0)
    );
    const nuevaDescripcion = descripcionInput.trim() || "";

    // 1️⃣ Guardar en contexto (y localStorage automáticamente)
    updatePresupuestoField("porcentaje_descuento", nuevoPorcentaje);
    updatePresupuestoField("descripcion_descuento", nuevaDescripcion);

    // 2️⃣ Si el reporte ya existe en backend, persistir
    if (formData?.id) {
      setGuardando(true);
      try {
        await updateReportePartial(formData.id, {
          porcentaje_descuento: nuevoPorcentaje,
          descripcion_descuento: nuevaDescripcion,
        });
        toast.success(`Descuento actualizado a ${nuevoPorcentaje}%`);
      } catch (error) {
        toast.error("Error al guardar en el servidor");
      } finally {
        setGuardando(false);
      }
    } else {
      toast.success(`Descuento actualizado a ${nuevoPorcentaje}%`);
    }

    setModalOpen(false);
  };

  const porcentajeDesc = formData?.porcentaje_descuento ?? 0;
  const totalConDescuento =
    porcentajeDesc > 0
      ? (presupuestoEstimado || 0) * (1 - porcentajeDesc / 100)
      : presupuestoEstimado || 0;

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-5 border border-gray-200">
        <h3 className="text-lg font-semibold text-[#0B2C4D] mb-3">
          Información del Cliente
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <p>
            <strong>Cliente:</strong> {formData?.cliente?.nombre || "—"}
          </p>
          <p>
            <strong>RIF:</strong> {formData?.cliente?.rif || "—"}
          </p>
          <p>
            <strong>Encargado:</strong> {formData?.cliente?.encargado || "—"}
          </p>

          <p>
            <strong>Fecha de Culminación:</strong>{" "}
            {new Date(formData?.fechaCulminacion).toLocaleDateString()}
          </p>
          <p>
            <strong>Presupuesto Base:</strong>{" "}
            {formatoMoneda(presupuestoEstimado || 0)}
          </p>

          {/* Descuento clickeable */}
          <p>
            <strong>Descuento:</strong>{" "}
            <span
              className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition-colors"
              onClick={abrirModal}
              title="Haz clic para editar el descuento"
            >
              {porcentajeDesc > 0
                ? `${porcentajeDesc}%`
                : "Sin descuento"}
            </span>
            {formData?.descripcion_descuento && porcentajeDesc > 0 && (
              <span className="text-gray-500 ml-1">
                ({formData.descripcion_descuento})
              </span>
            )}
          </p>

          {/* Total con descuento */}
          <p className="font-semibold text-[#0B2C4D]">
            <strong>Total con Descuento:</strong>{" "}
            {formatoMoneda(totalConDescuento)}
          </p>
        </div>
      </div>

      {/* Modal para editar descuento */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar Descuento"
        width="max-w-sm"
      >
        <div className="space-y-4 p-2">
          <p className="text-sm text-gray-600">
            Define un descuento porcentual sobre el total del presupuesto
            (máximo 99%).
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porcentaje de descuento (%)
            </label>
            <input
              type="number"
              min="0"
              max="99"
              step="0.01"
              value={porcentajeInput}
              onChange={(e) => setPorcentajeInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-center text-lg font-bold"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcionInput}
              onChange={(e) => setDescripcionInput(e.target.value)}
              placeholder="Ej: Descuento por pronto pago"
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={guardarDescuento}
              disabled={guardando}
              className="bg-[#0B2C4D] hover:bg-[#143D68] text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClienteInfo;
