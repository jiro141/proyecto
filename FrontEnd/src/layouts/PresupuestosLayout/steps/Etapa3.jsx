import { usePresupuesto } from "../../../context/PresupuestoContext";
import useReportesActions from "../hooks/useReportesActions";
import { useState, useEffect } from "react";
import useExcelGenerator from "../hooks/useExcelGenerator";
import usePDFGenerator from "../hooks/usePDFGenerator";

// Componentes importados
import ClienteInfo from "../components/Etapa3ClienteInfo";
import Etapa3APUCard from "../components/Etapa3APUCard";
import Etapa3Modals from "../components/Etapa3Modals";

export default function Etapa3() {
  const {
    formData,
    resetPresupuesto,
    updatePresupuestoField,
    updateAPU,
    deleteAPU,
  } = usePresupuesto();

  const { guardarPresupuesto } = useReportesActions();

  const [isSending, setIsSending] = useState(false);
  const [nPresupuesto, setNPresupuesto] = useState();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [apuToDelete, setApuToDelete] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [isReportGenerated, setIsReportGenerated] = useState(false);

  const { generarExcelAPUs } = useExcelGenerator();
  const { generarPDF } = usePDFGenerator();

  const apus = formData.apus || [];

  // Obtener el primer APU (ya que cada APU tiene su propio presupuesto_base)
  const primerAPU = apus[0];
  const presupuestoEstimadoMostrado = primerAPU 
    ? Number(primerAPU.body?.presupuesto_base || 0) 
    : 0;

  // Mantener internamente la suma para compatibilidad pero mostrar solo el primero
  useEffect(() => {
    if (!formData?.apus?.length) return;

    const totalEstimado = formData.apus.reduce((acc, apu) => {
      const presupuestoBase = Number(apu.body?.presupuesto_base || 0);
      return acc + presupuestoBase;
    }, 0);

    if (totalEstimado !== formData.presupuesto_estimado) {
      updatePresupuestoField("presupuesto_estimado", totalEstimado);
    }
  }, [formData.apus, formData.presupuesto_estimado, updatePresupuestoField]);

  // ✏️ Cambios en inputs editables
  const handleInputChange = (index, field, value) => {
    updateAPU(index, {
      body: {
        ...formData.apus[index].body,
        [field]: field === "unidad" ? value : Number(value) || 0,
      },
    });
  };

  // 🗑️ Mostrar modal de confirmación
  const handleShowDeleteModal = (index) => {
    setApuToDelete(index);
    setDeleteModalOpen(true);
  };

  // 🧹 Confirmar eliminación
  const handleConfirmDelete = () => {
    if (apuToDelete === null) return;
    deleteAPU(apuToDelete);
    setDeleteModalOpen(false);
    setApuToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setApuToDelete(null);
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
    setIsReportGenerated(false);
    setNPresupuesto(undefined);
    resetPresupuesto();
    window.location.reload();
  };

  // 💾 Guardar presupuesto
  const handleGuardar = async () => {
    try {
      setIsSending(true);
      const res = await guardarPresupuesto({ formData });
      setNPresupuesto(res.reporte.n_presupuesto);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error("Error al enviar presupuesto:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 📄 Exportar PDF
  const handleGenerarPDF = () => {
    generarPDF(formData, nPresupuesto);
    setIsReportGenerated(true);
  };

  const handleGenerarExcel = () => {
    if (!formData?.apus?.length) {
      alert("⚠️ No hay APUs disponibles para exportar.");
      return;
    }
    generarExcelAPUs(formData, nPresupuesto);
    setIsReportGenerated(true);
  };

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold text-[#0B2C4D] mb-6">
        Resumen Final del Presupuesto
      </h2>

      {/* === Información del Cliente === */}
      <ClienteInfo 
        formData={formData} 
        presupuestoEstimado={presupuestoEstimadoMostrado}
      />

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
              <Etapa3APUCard
                key={index}
                apu={apu}
                index={index}
                onInputChange={handleInputChange}
                onShowDeleteModal={handleShowDeleteModal}
                deleteAPU={deleteAPU}
              />
            ))}
          </div>
        )}
      </section>

      {/* === Botón de envío === */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleGuardar}
          disabled={isSending}
          className={`px-6 py-3 rounded-lg text-white font-semibold transition-all ${
            isSending ? "bg-gray-400 cursor-not-allowed" : "bg-[#0B2C4D] hover:bg-[#15395A]"
          }`}
        >
          {isSending ? "Enviando..." : "Crear"}
        </button>
      </div>

      {/* === MODALES === */}
      <Etapa3Modals
        deleteModalOpen={deleteModalOpen}
        apuToDelete={apuToDelete}
        successModalOpen={successModalOpen}
        isReportGenerated={isReportGenerated}
        onCancelDelete={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
        onCloseSuccessModal={handleCloseSuccessModal}
        onGenerarPDF={handleGenerarPDF}
        onGenerarExcel={handleGenerarExcel}
      />
    </div>
  );
}