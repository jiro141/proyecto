import React, { useState } from "react";
import Tables from "../../components/Tables";
import useInventario from "../../hooks/useInvetario";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import { createItem, updateItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";

const columns = [
  { key: "descripcion", label: "Descripción" },
  { key: "unidad", label: "Unidad" },
  { key: "cantidad", label: "Cantidad" },
  { key: "depreciacion_bs_hora", label: "Depreciación (BS/Hora)" },
];

export default function HerramientasLayout() {
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useInventario("herramientas", search);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const herramientasFormStep = [
    {
      fields: [
        { name: "descripcion", label: "Descripción", required: true },
        { name: "unidad", label: "Unidad", required: true, defaultValue: "DIA" },
        { name: "cantidad", label: "Cantidad", type: "number", required: true },
        { name: "depreciacion_bs_hora", label: "Depreciación (BS/Hora)", type: "number", required: true },
      ],
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem("herramientas", editItem.id, formData);
        toast.success("Herramienta actualizada exitosamente");
      } else {
        await createItem("herramientas", formData);
        toast.success("Herramienta creada exitosamente");
      }
      setModalOpen(false);
      setEditItem(null);
      refetch();
    } catch (err) {
      console.error("Error al guardar herramienta:", err);
      toast.error("Error al guardar");
    }
  };

  const handleAddOrEdit = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };

  if (error) return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      <Tables
        columns={columns}
        data={data || []}
        title="Herramientas"
        loading={loading}
        refetch={refetch}
        tipo={"herramientas"}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Editar Herramienta" : "Agregar Herramienta"}
      >
        <StepForm
          steps={herramientasFormStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>
    </div>
  );
}
