import React, { useState } from "react";
import Tables from "../../components/Tables";
import useInventario from "../../hooks/useInvetario";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import { createItem, updateItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";
const columns = [
  { key: "name", label: "Nombre" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
];

export default function EppLayout() {
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useInventario("epp",search);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Formulario de una sola etapa con múltiples campos
  const eppFormStep = [
    {
      fields: [
        { name: "name", label: "Nombre", required: true },
        { name: "unidades", label: "Unidades", type: "number", required: true },
        { name: "monto", label: "Monto", type: "number", required: true },
      ],
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem("epp", editItem.id, formData);
        toast.success("Equipo actualizado exitosamente");
      } else {
        await createItem("epp", formData);
        toast.success("Equipo creado exitosamente");
      }
      setModalOpen(false);
      setEditItem(null); // IMPORTANTE: Resetea modo edición
      refetch();
    } catch (err) {
      console.error("Error al guardar EPP:", err);
      alert("No se pudo guardar el EPP.");
    }
  };

  const handleAddOrEdit = (item = null) => {
    setEditItem(item); // null para nuevo, objeto para editar
    setModalOpen(true);
  };
  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      <Tables
        columns={columns}
        data={data || []}
        title="EPP Inventario"
        loading={loading}
        refetch={refetch}
        tipo={"epp"}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
        
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar nuevo EPP"
      >
        <StepForm
          steps={eppFormStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>
    </div>
  );
}
