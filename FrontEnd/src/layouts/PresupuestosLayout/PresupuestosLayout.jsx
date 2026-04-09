import React, { useState } from "react";
import ReportesTable from "./components/ReportesTable";
import { FaFilePdf, FaFileExcel, FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import useReportes from "../../hooks/useReportes";
import useExcelGenerator from "./hooks/useExcelGenerator";
import usePDFGenerator from "./hooks/usePDFGenerator";
import { usePresupuesto } from "../../context/PresupuestoContext";

// Componentes importados
import ReporteDetalleModal from "./components/ReporteDetalleModal";
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
];

export default function ReportesLayout({ clienteSeleccionado }) {
  const [search, setSearch] = useState("");
  const { reportes, loading, error, refetch } = useReportes(search, clienteSeleccionado?.id);
  const [isModalOpen, setModalOpen] = useState(false);

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
    } catch (err) {
      console.error(err);
      toast.error("Error generando documento");
    }
  };

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
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
    </div>
  );
}