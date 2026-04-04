import React, { useState } from "react";
import Modal from "../../components/Modal";
import ReportesTable from "./components/ReportesTable";
import EstadoHistorial from "./components/EstadoHistorial";
import { FaFilePdf, FaFileExcel, FaEdit } from "react-icons/fa";
import {
  createReporte,
  updateReporte,
  getReporteDetalle,
} from "../../api/controllers/Presupuesto";
import { toast } from "react-toastify";
import useReportes from "../../hooks/useReportes";
import useExcelGenerator from "./hooks/useExcelGenerator";
import usePDFGenerator from "./hooks/usePDFGenerator";
import { usePresupuesto } from "../../context/PresupuestoContext";
import { useNavigate } from "react-router-dom";
import { BounceLoader } from "react-spinners";

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
  const { reportes, loading, error, refetch } = useReportes(search, clienteSeleccionado?.nombre);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { generarExcelAPUs } = useExcelGenerator();
  const { generarPDF } = usePDFGenerator();
  const { hydratePresupuesto } = usePresupuesto();
  const navigate = useNavigate();

  const handleRowClick = async (row) => {
    setLoadingDetalle(true);
    setSelectedReporte(null);
    setModalOpen(true);
    try {
      const detalle = await getReporteDetalle(row.id);
      setSelectedReporte(detalle);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los datos del reporte");
    } finally {
      setLoadingDetalle(false);
    }
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
      const detalle = await getReporteDetalle(row.id);

      const pdfFormData = {
        descripcion: detalle.descripcion,
        presupuesto_estimado: Number(detalle.total_reporte),
        cliente: {
          nombre: detalle.cliente_nombre,
        },
        apus: (detalle.apus || []).map((apu) => ({
          body: {
            descripcion: apu.descripcion,
            unidad: apu.unidad,
            cantidad: Number(apu.cantidad),
            presupuesto_base: Number(apu.presupuesto_base),
          },
        })),
      };

      if (action === "pdf") {
        generarPDF(pdfFormData, detalle.n_presupuesto);
        return;
      }

      if (action === "excel") {
        const adaptedData = {
          id: detalle.id,
          cliente: {
            id: detalle.cliente,
            nombre: detalle.cliente_nombre,
          },
          descripcion: detalle.descripcion,
          apus: (detalle.apus || []).map((apu) => ({
            id: apu.id,
            body: {
              descripcion: apu.descripcion || "",
              rendimiento: Number(apu.rendimiento) || 1,
              unidad: apu.unidad || "UND",
              cantidad: Number(apu.cantidad) || 1,
              depreciacion: Number(apu.depreciacion) || 0,
              presupuesto_base: Number(apu.presupuesto_base) || 0,
            },
            materiales: {
              stock_almacen: (apu.materiales || [])
                .filter((m) => m.stock)
                .map((m) => ({
                  codigo: m.stock.codigo,
                  descripcion: m.descripcion,
                  unidad: m.stock.unidad,
                  cantidad: Number(m.cantidad),
                  costo: Number(m.precio_unitario),
                  desp: Number(m.desperdicio),
                })),
              consumibles: (apu.materiales || [])
                .filter((m) => m.consumible)
                .map((m) => ({
                  descripcion: m.descripcion,
                  cantidad: Number(m.cantidad),
                  costo: Number(m.precio_unitario),
                  desp: Number(m.desperdicio),
                })),
              epps: [],
            },
            herramientas: (apu.herramientas || []).map((h) => ({
              descripcion: h.descripcion,
              unidad: h.unidad,
              cantidad: Number(h.cantidad),
              costo: Number(h.precio_unitario),
            })),
            mano_obra: (apu.manos_obra || []).map((m) => ({
              descripcion: m.descripcion,
              unidad: m.unidad,
              cantidad: Number(m.cantidad),
              precio_unitario: Number(m.precio_unitario),
            })),
            logistica: (apu.logisticas || []).map((l) => ({
              descripcion: l.descripcion,
              unidad: l.unidad,
              cantidad: Number(l.cantidad),
              precio_unitario: Number(l.precio_unitario),
            })),
          })),
        };

        hydratePresupuesto(adaptedData);
        setTimeout(() => {
          generarExcelAPUs(null, detalle.n_presupuesto);
        }, 0);
        return;
      }

      if (action === "edit") {
        const reporte = detalle;

        const adaptedData = {
          id: reporte.id,
          cliente: {
            id: reporte.cliente,
            nombre: reporte.cliente_nombre,
          },
          titulo: "Nota",
          descripcion: reporte.descripcion,
          notas: "",
          fechaCulminacion: new Date(),
          presupuesto_base: Number(reporte.total_reporte),
          presupuesto_estimado: Number(reporte.total_reporte),
          porcentaje_productividad: 1,
          apus: (reporte.apus || []).map((apu) => ({
            id: apu.id,
            body: {
              descripcion: apu.descripcion || "",
              rendimiento: Number(apu.rendimiento) || 1,
              unidad: apu.unidad || "UND",
              cantidad: Number(apu.cantidad) || 1,
              depreciacion: Number(apu.depreciacion) || 0,
              presupuesto_base: Number(apu.presupuesto_base) || 0,
              porcentaje_desp: 0,
            },
            materiales: {
              stock_almacen: (apu.materiales || [])
                .filter((m) => m.stock)
                .map((m) => ({
                  id: m.stock.id,
                  codigo: m.stock.codigo,
                  descripcion: m.descripcion,
                  cantidad: Number(m.cantidad),
                  costo: Number(m.precio_unitario),
                  desp: Number(m.desperdicio),
                })),
              consumibles: (apu.materiales || [])
                .filter((m) => m.consumible)
                .map((m) => ({
                  id: m.consumible.id,
                  descripcion: m.descripcion,
                  cantidad: Number(m.cantidad),
                  costo: Number(m.precio_unitario),
                })),
              epps: [],
            },
            mano_obra: (apu.manos_obra || []).map((mo) => ({ ...mo })),
            herramientas: (apu.herramientas || []).map((h) => ({ ...h })),
            logistica: (apu.logisticas || []).map((l) => ({ ...l })),
          })),
        };

        hydratePresupuesto(adaptedData);
        navigate("/informes/Crear");
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
        data={reportes?.results || []}
        loading={loading}
        onRowClick={handleRowClick}
        onAction={handleAction}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReporte(null);
        }}
        title={selectedReporte ? `Presupuesto ${selectedReporte.n_presupuesto}` : "Cargando..."}
        width="max-w-2xl"
      >
        {loadingDetalle ? (
          <div className="flex justify-center items-center py-12">
            <BounceLoader color="#0b2c4d" size={60} />
          </div>
        ) : selectedReporte ? (
          <EstadoHistorial
            reporte={selectedReporte}
            onEstadoActualizado={handleEstadoActualizado}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudo cargar la informacion del reporte
          </div>
        )}
      </Modal>
    </div>
  );
}
