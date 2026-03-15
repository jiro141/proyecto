import React, { useState } from "react";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import Tables from "../../components/Tables";
import ReportesTable from "./components/ReportesTable";
import Accordion from "../../components/Accordion";
import { FaFilePdf, FaFileExcel, FaEdit } from "react-icons/fa";
import { FaBoxes, FaTools, FaUserShield, FaStoreAlt } from "react-icons/fa";
import {
  createReporte,
  updateReporte,
} from "../../api/controllers/Presupuesto";
import { toast } from "react-toastify";
import useReportes from "../../hooks/useReportes";
import useExcelGenerator from "./hooks/useExcelGenerator";
import usePDFGenerator from "./hooks/usePDFGenerator";
import { getReporteDetalle } from "../../api/controllers/Presupuesto";
import { usePresupuesto } from "../../context/PresupuestoContext";
import { useNavigate } from "react-router-dom";

export const columns = [
  { key: "n_presupuesto", label: "Presupuesto" },
  { key: "descripcion", label: "Descripción" },
  { key: "fecha_creacion", label: "Fecha" },
  { key: "total_reporte", label: "Monto" },
  { key: "aprobado", label: "Estado" },

  {
    key: "pdf",
    label: "Generar PDF",
    type: "action",
    icon: FaFilePdf,
    action: "pdf",
    hoverColor: "hover:text-red-600",
  },
  {
    key: "excel",
    label: "Generar Excel",
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
    hoverColor: "hover:text-[#0b2c4d]", // azul Hermabe
  },
];

export default function ReportesLayout({ clienteSeleccionado }) {

  const [search, setSearch] = useState("");
  const { reportes, loading, error, refetch } = useReportes(search, clienteSeleccionado?.nombre);
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const { generarExcelAPUs } = useExcelGenerator();
  const { generarPDF } = usePDFGenerator();
  const { hydratePresupuesto } = usePresupuesto();
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateReporte(editItem.id, formData);
        toast.success("Reporte actualizado con éxito");
      } else {
        const newReporte = await createReporte(formData);
        setEditItem(newReporte);
        toast.success("Reporte creado con éxito");
      }
      refetch();
      setModalOpen(false);
      setEditItem(null);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar Reporte");
    }
  };

  const handleAddOrEdit = (item = null) => {

    setEditItem(item);
    setModalOpen(true);
  };

  const formSteps = [
    {
      fields: [
        { name: "n_control", label: "N° de Control", required: true },
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "lugar", label: "Lugar", required: true },
        {
          name: "presupuesto_estimado",
          label: "Presupuesto Estimado",
          type: "number",
          required: true,
        },
        {
          name: "porcentaje_productividad",
          label: "% Productividad",
          type: "number",
        },
        {
          name: "fecha_estimacion_culminacion",
          label: "Fecha Est. Culminación",
          type: "date",
        },
        {
          name: "aprobado",
          label: "Aprobado",
          type: "switch"
        },
        {
          name: "observaciones",
          label: "Observaciones",
          type: "textarea",
        },
      ],
    },
  ];

  const dataSections = [
    {
      key: "stock_almacen",
      label: "Stock en Almacén",
      icon: FaStoreAlt,
    },
    {
      key: "stock_comprar",
      label: "Stock a Comprar",
      icon: FaBoxes,
    },
    {
      key: "consumibles",
      label: "Consumibles",
      icon: FaTools,
    },
    {
      key: "epps",
      label: "EPPs (Equipos de Protección Personal)",
      icon: FaUserShield,
    },
  ];
  const handleAction = async (action, row) => {
    try {
      const detalle = await getReporteDetalle(row.id);

      // 🔹 ADAPTADOR (no rompe nada)
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

        // Esperar un tick para que el contexto actualice
        setTimeout(() => {
          generarExcelAPUs(null, detalle.n_presupuesto);
        }, 0);

        return;
      }


      if (action === "edit") {
        const reporte = detalle;

        const adaptedData = {
          id: reporte.id, // 🔥 importante para PUT luego
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

            mano_obra: (apu.manos_obra || []).map((mo) => ({
              ...mo,
            })),

            herramientas: (apu.herramientas || []).map((h) => ({
              ...h,
            })),

            logistica: (apu.logisticas || []).map((l) => ({
              ...l,
            })),
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
        onRowClick={handleAddOrEdit}
        onAction={handleAction}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Editar Reporte" : "Agregar Reporte"}
        width="max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 items-start">
          {/* 🧾 Formulario principal */}
          <div className="w-full">
            <StepForm
              steps={formSteps}
              onSubmit={handleSubmit}
              initialValues={editItem || {}}
            />
          </div>

          {/* 🧩 Secciones dinámicas */}
          {editItem && (
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
              {dataSections.map(
                ({ key, label, icon: Icon }) =>
                  editItem[key]?.length > 0 && (
                    <Accordion
                      key={key}
                      title={`${label} (${editItem[key].length})`}
                      icon={Icon}
                      data={editItem[key]}
                      filterKeys={["nombre", "cantidad", "precio_unitario"]}
                      defaultOpen
                    >
                      {(filtered) => (
                        <table className="w-full text-sm border-collapse mt-2">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="text-left p-2">Nombre</th>
                              <th className="text-left p-2">Cantidad</th>
                              <th className="text-left p-2">Precio Unitario</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((item, i) => (
                              <tr
                                key={i}
                                className="border-b hover:bg-gray-50 transition"
                              >
                                <td className="p-2">{item.name || "—"}</td>
                                <td className="p-2">{item.unidades || "—"}</td>
                                <td className="p-2">
                                  {item.monto
                                    ? `$ ${item.monto}`
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </Accordion>
                  )
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
