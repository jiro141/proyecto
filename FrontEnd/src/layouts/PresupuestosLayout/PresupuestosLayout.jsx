import React, { useState } from "react";
import ReportesTable from "./components/ReportesTable";
import { FaFilePdf, FaFileExcel, FaEdit, FaTruck, FaSearch, FaCopy } from "react-icons/fa";
import { toast } from "react-toastify";
import useReportes from "../../hooks/useReportes";
import useExcelGenerator from "./hooks/useExcelGenerator";
import usePDFGenerator from "./hooks/usePDFGenerator";
import { usePresupuesto } from "../../context/PresupuestoContext";
import { duplicarReporte } from "../../api/controllers/Presupuesto";

// Componentes importados
import Modal from "../../components/Modal";
import ReporteDetalleModal from "./components/ReporteDetalleModal";
import NotaEntregaModal from "./components/NotaEntregaModal";
import useReporteActions from "./hooks/useReporteActions";

export const columns = [
  { key: "n_presupuesto", label: "Presupuesto" },
  { key: "descripcion", label: "Descripcion" },
  { key: "fecha_creacion", label: "Fecha" },
  { key: "total_reporte", label: "Monto" },
  { key: "estado_display", label: "Estado" },
  {
    key: "pdf",
    label: "PDF",
    type: "action",
    icon: FaFilePdf,
    action: "pdf",
    hoverColor: "hover:text-red-600",
  },
  {
    key: "excel",
    label: "Excel",
    type: "action",
    icon: FaFileExcel,
    action: "excel",
    hoverColor: "hover:text-green-600",
  },
  {
    key: "edit",
    label: "Editar",
    type: "action",
    icon: FaEdit,
    action: "edit",
    hoverColor: "hover:text-[#0b2c4d]",
  },
  {
    key: "notas_entrega",
    label: "Entrega",
    type: "action",
    icon: FaTruck,
    action: "notas_entrega",
    hoverColor: "hover:text-orange-600",
  },
  {
    key: "duplicar",
    label: "Duplicar",
    type: "action",
    icon: FaCopy,
    action: "duplicate",
    hoverColor: "hover:text-purple-600",
  },
];

export default function ReportesLayout({ clienteSeleccionado }) {
  const [search, setSearch] = useState("");
  const { reportes, loading, error, refetch } = useReportes(search, clienteSeleccionado?.id);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEntregaModalOpen, setEntregaModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [pendingReporte, setPendingReporte] = useState(null);

  const { generarExcelAPUs } = useExcelGenerator();
  const { generarPDF } = usePDFGenerator();
  const { hydratePresupuesto } = usePresupuesto();
  
  const {
    selectedReporte,
    setSelectedReporte,
    loadingDetalle,
    loadReporteDetalle,
    prepareEditData,
    prepareExcelData,
    preparePDFData,
  } = useReporteActions();

  const handleRowClick = async (row) => {
    await loadReporteDetalle(row, setModalOpen);
  };

  const handleEstadoActualizado = (reporteActualizado) => {
    setSelectedReporte((prev) => ({
      ...prev,
      estado: reporteActualizado.estado,
      estado_display: reporteActualizado.estado_display,
    }));
    refetch();
  };

  const handleAction = async (action, row) => {
    try {
      // Obtener el detalle completo del reporte
      const detalle = row;
      
      if (action === "pdf") {
        const pdfData = await preparePDFData(detalle);
        generarPDF(pdfData, detalle.n_presupuesto);
        return;
      }

      if (action === "excel") {
        const excelData = prepareExcelData(detalle);
        hydratePresupuesto(excelData);
        setTimeout(() => {
          generarExcelAPUs(null, detalle.n_presupuesto);
        }, 0);
        return;
      }

      if (action === "edit") {
        await prepareEditData(detalle);
        return;
      }

      if (action === "notas_entrega") {
        setSelectedReporte(detalle);
        setEntregaModalOpen(true);
        return;
      }

      if (action === "duplicate") {
        setPendingReporte({ id: detalle.id, n_presupuesto: detalle.n_presupuesto });
        setConfirmOpen(true);
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al duplicar presupuesto");
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!pendingReporte) return;
    try {
      const nuevoReporte = await duplicarReporte(pendingReporte.id);
      toast.success(`Presupuesto #${nuevoReporte.n_presupuesto} duplicado correctamente`);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Error al duplicar presupuesto");
    } finally {
      setConfirmOpen(false);
      setPendingReporte(null);
    }
  };

  const handleCancelDuplicate = () => {
    setConfirmOpen(false);
    setPendingReporte(null);
  };

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Buscador de Presupuestos */}
      <div className="w-full">
        <div className="relative w-full">
          <FaSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por n° presupuesto o descripción..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2c4d] text-sm text-gray-800 bg-gray-50/50 shadow-sm"
          />
        </div>
      </div>

      <ReportesTable
        columns={columns}
        data={reportes}
        loading={loading}
        onRowClick={handleRowClick}
        onAction={handleAction}
      />

      <ReporteDetalleModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReporte(null);
        }}
        reporte={selectedReporte}
        loading={loadingDetalle}
      />

      <NotaEntregaModal
        isOpen={isEntregaModalOpen}
        onClose={() => setEntregaModalOpen(false)}
        reporte={selectedReporte}
      />

      {/* MODAL CONFIRMACIÓN DUPLICAR */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={handleCancelDuplicate}
        title="Duplicar presupuesto"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que querés duplicar el presupuesto{" "}
            <span className="font-bold text-purple-700">
              #{pendingReporte?.n_presupuesto}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelDuplicate}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDuplicate}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded"
            >
              Sí, duplicar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}