import React, { useState } from "react";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import Tables from "../../components/Tables";
import Accordion from "../../components/Accordion";
import { FaBoxes, FaTools, FaUserShield, FaStoreAlt } from "react-icons/fa";
import {
  createReporte,
  updateReporte,
} from "../../api/controllers/Presupuesto";
import { toast } from "react-toastify";
import useReportes from "../../hooks/useReportes";

const columns = [
  { key: "n_control", label: "N° Control" },
  { key: "fecha", label: "Fecha" },
  { key: "lugar", label: "Lugar" },
  { key: "presupuesto_estimado", label: "Presupuesto Estimado" },
  { key: "porcentaje_productividad", label: "% Productividad" },
  { key: "aprobado", label: "Aprobado" },
];

export default function ReportesLayout() {
  const [search, setSearch] = useState("");
  const { reportes, loading, error, refetch } = useReportes(search);
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

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

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      <Tables
        columns={columns}
        data={reportes || []}
        title="Reportes"
        refetch={refetch}
        loading={loading}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
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
