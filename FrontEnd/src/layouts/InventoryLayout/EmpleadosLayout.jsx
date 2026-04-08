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

export default function EmpleadosLayout() {
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useInventario("empleados", search);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const empleadosFormStep = [
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
        await updateItem("empleados", editItem.id, formData);
        toast.success("Empleado actualizado exitosamente");
      } else {
        await createItem("empleados", formData);
        toast.success("Empleado creado exitosamente");
      }
      setModalOpen(false);
      setEditItem(null);
      refetch();
    } catch (err) {
      console.error("Error al guardar empleado:", err);
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
        title="Empleados / Mano de Obra"
        loading={loading}
        refetch={refetch}
        tipo={"empleados"}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Editar Empleado" : "Agregar Empleado"}
      >
        <StepForm
          steps={empleadosFormStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>
    </div>
  );
}
