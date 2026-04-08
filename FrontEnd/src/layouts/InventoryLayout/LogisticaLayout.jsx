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
  { key: "precio_unitario", label: "Precio Unitario" },
];

export default function LogisticaLayout() {
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useInventario("logistica", search);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const logisticaFormStep = [
    {
      fields: [
        { name: "descripcion", label: "Descripción", required: true },
        { name: "unidad", label: "Unidad", required: true, defaultValue: "DIA" },
        { name: "cantidad", label: "Cantidad", type: "number", required: true },
        { name: "precio_unitario", label: "Precio Unitario", type: "number", required: true },
      ],
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem("logistica", editItem.id, formData);
        toast.success("Logística actualizada exitosamente");
      } else {
        await createItem("logistica", formData);
        toast.success("Logística creada exitosamente");
      }
      setModalOpen(false);
      setEditItem(null);
      refetch();
    } catch (err) {
      console.error("Error al guardar logística:", err);
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
        title="Logística"
        loading={loading}
        refetch={refetch}
        tipo={"logistica"}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Editar Logística" : "Agregar Logística"}
      >
        <StepForm
          steps={logisticaFormStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>
    </div>
  );
}
