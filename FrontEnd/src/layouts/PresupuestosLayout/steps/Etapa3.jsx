import { usePresupuesto } from "../../../context/PresupuestoContext";
import useReportesActions from "../hooks/useReportesActions";
import TotalesPanel from "../components/TotalesPanel";
import { useState, useEffect } from "react";
import Modal from "../../../components/Modal";
import { FaTrashAlt, FaFilePdf, FaFileExcel } from "react-icons/fa";
import useExcelGenerator from "../hooks/useExcelGenerator";

export default function Etapa3() {
  const {
    formData,
    setFormData,
    currentAPUIndex,
    setCurrentAPUIndex,
    resetPresupuesto,
  } = usePresupuesto();

  const { crearPresupuestoCompleto } = useReportesActions();
  const [isSending, setIsSending] = useState(false);

  // 🔥 Estado de modales
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [apuToDelete, setApuToDelete] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // 📊 Hook para exportar Excel con fórmulas
  const { generarExcelAPUs } = useExcelGenerator();

  const apus = formData.apus || [];

  // 🔁 Recalcula presupuesto estimado automáticamente
  useEffect(() => {
    if (!formData?.apus?.length) return;

    const totalEstimado = formData.apus.reduce((acc, apu) => {
      const valor = Number(apu.body?.presupuesto_base || 0);
      return acc + valor;
    }, 0);

    if (totalEstimado !== formData.presupuesto_estimado) {
      const updatedFormData = structuredClone(formData);
      updatedFormData.presupuesto_estimado = totalEstimado;
      setFormData(updatedFormData);
    }
  }, [formData.apus, setFormData]);

  // ✏️ Cambios en inputs editables
  const handleInputChange = (index, field, value) => {
    const updatedForm = structuredClone(formData);
    updatedForm.apus[index].body[field] =
      field === "unidad" ? value : Number(value) || 0;
    setFormData(updatedForm);
  };

  // 🗑️ Mostrar modal de confirmación
  const handleShowDeleteModal = (index) => {
    setApuToDelete(index);
    setDeleteModalOpen(true);
  };

  // 🧹 Confirmar eliminación
  const handleConfirmDelete = () => {
    if (apuToDelete === null) return;
    const updatedForm = structuredClone(formData);
    updatedForm.apus.splice(apuToDelete, 1);
    setFormData(updatedForm);
    setDeleteModalOpen(false);
    setApuToDelete(null);
  };

  const handleCancelarDelete = () => {
    setDeleteModalOpen(false);
    setApuToDelete(null);
  };

  // 💾 Guardar presupuesto
  const handleGuardar = async () => {
    try {
      setIsSending(true);
      await crearPresupuestoCompleto({ formData });
      setSuccessModalOpen(true); // ✅ Abre el modal de exportación
    } catch (err) {
      console.error("Error al enviar presupuesto:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 📄 Exportar PDF
  const handleGenerarPDF = () => {
    console.log("📄 Generando PDF con formData:", formData);
    // Aquí puedes conectar tu exportador de PDF
  };

  // 📊 Exportar Excel (ya conectado con el hook)
  const handleGenerarExcel = () => {
    if (!formData?.apus?.length) {
      alert("⚠️ No hay APUs disponibles para exportar.");
      return;
    }
    generarExcelAPUs(formData);
  };

  const formatoMoneda = (valor) =>
    valor?.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }) || "$0.00";

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold text-[#0B2C4D] mb-6">
        Resumen Final del Presupuesto
      </h2>

      {/* === Información del Cliente === */}
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
            <strong>Presupuesto Estimado:</strong>{" "}
            {formatoMoneda(formData?.presupuesto_estimado || 0)}
          </p>
          <p>
            <strong>% Productividad:</strong>{" "}
            {formData?.porcentaje_productividad || 1}x
          </p>
        </div>
      </div>

      {/* === ANÁLISIS DE PRESUPUESTO UNITARIO === */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#0B2C4D] mb-6 text-center">
          Análisis de Presupuesto Unitario
        </h3>

        {apus.length === 0 ? (
          <p className="text-gray-500 italic text-center py-10">
            No hay APUs registrados
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {apus.map((apu, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col"
              >
                {/* === Encabezado con ícono de eliminar === */}
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <h4 className="text-lg font-bold text-[#0B2C4D]">
                    APU #{index + 1}
                  </h4>
                  <button
                    onClick={() => handleShowDeleteModal(index)}
                    className="text-red-500 hover:text-red-700 transition-all"
                    title="Eliminar este APU"
                  >
                    <FaTrashAlt />
                  </button>
                </div>

                {/* === Descripción === */}
                <p className="text-sm text-gray-600 mb-2">
                  {apu.body?.descripcion || "Sin descripción"}
                </p>

                {/* === Campos editables === */}
                <div className="text-xs text-gray-600 grid grid-cols-2 gap-y-1 gap-x-4 mt-2">
                  <label className="flex flex-col">
                    <strong>Unidad:</strong>
                    <input
                      type="text"
                      value={apu.body?.unidad || ""}
                      onChange={(e) =>
                        handleInputChange(index, "unidad", e.target.value)
                      }
                      className="border rounded-md px-2 py-1 text-xs mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                      placeholder="Ej: m², kg, m3"
                    />
                  </label>

                  <label className="flex flex-col">
                    <strong>Rendimiento:</strong>
                    <input
                      type="number"
                      value={apu.body?.rendimiento || 0}
                      onChange={(e) =>
                        handleInputChange(index, "rendimiento", e.target.value)
                      }
                      className="border rounded-md px-2 py-1 text-xs mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                      step="0.01"
                    />
                  </label>

                  <label className="flex flex-col">
                    <strong>Cantidad:</strong>
                    <input
                      type="number"
                      value={apu.body?.cantidad || 0}
                      onChange={(e) =>
                        handleInputChange(index, "cantidad", e.target.value)
                      }
                      className="border rounded-md px-2 py-1 text-xs mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                      step="0.01"
                    />
                  </label>

                  <label className="flex flex-col">
                    <strong>% Desp:</strong>
                    <input
                      type="number"
                      value={apu.body?.porcentaje_desp || 0}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "porcentaje_desp",
                          e.target.value
                        )
                      }
                      className="border rounded-md px-2 py-1 text-xs mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                      step="0.01"
                    />
                  </label>

                  <label className="flex flex-col col-span-2">
                    <strong>Presupuesto Base:</strong>
                    <input
                      type="text"
                      readOnly
                      value={formatoMoneda(apu.body?.presupuesto_base || 0)}
                      className="border rounded-md px-2 py-1 text-xs mt-1 bg-gray-100 cursor-not-allowed"
                    />
                  </label>
                </div>

                {/* ✅ Panel independiente */}
                <div className="flex-1 overflow-hidden z-[0]">
                  <TotalesPanel apuIndex={index} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* === Botón de envío === */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleGuardar}
          disabled={isSending}
          className={`px-6 py-3 rounded-lg text-white font-semibold transition-all ${isSending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#0B2C4D] hover:bg-[#15395A]"
            }`}
        >
          {isSending ? "Enviando..." : "Crear"}
        </button>
      </div>

      {/* === MODAL ELIMINAR APU === */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleCancelarDelete}
        title="Eliminar APU"
        width="max-w-md"
      >
        <p className="text-gray-700 text-center mb-6">
          ¿Seguro que deseas eliminar el <strong>APU #{(apuToDelete ?? 0) + 1}</strong>?<br />
          Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleCancelarDelete}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Eliminar
          </button>
        </div>
      </Modal>

      {/* === MODAL ÉXITO: GENERAR PDF / EXCEL === */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Presupuesto Generado"
        width="max-w-md"
      >
        <div className="text-center space-y-6">
          <p className="text-gray-700">
            ✅ El presupuesto se ha guardado correctamente.
          </p>
          <div className="flex justify-center gap-6">
            <button
              onClick={handleGenerarPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <FaFilePdf /> Generar PDF
            </button>
            <button
              onClick={handleGenerarExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <FaFileExcel /> Generar Excel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
