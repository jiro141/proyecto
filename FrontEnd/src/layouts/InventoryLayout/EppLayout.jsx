import React, { useState } from "react";
import Tables from "../../components/Tables";
import useInventario from "../../hooks/useInvetario";
import useProveedores from "../../hooks/useProveedores";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import { createItem, updateItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";
const columns = [
  { key: "name", label: "Nombre" },
  { key: "proveedor", label: "Proveedor" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
];

export default function EppLayout() {
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useInventario("epp", search);
  const { proveedores, refetch: refetchProveedores } = useProveedores();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isProvModalOpen, setProvModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Formulario de una sola etapa con múltiples campos
  const eppFormStep = [
    {
      actions: [
        { label: "Nuevo Proveedor", onClick: () => setProvModalOpen(true) },
      ],
      fields: [
        { name: "name", label: "Nombre", required: true },
        {
          name: "proveedor",
          label: "Proveedor",
          type: "select",
          options: proveedores.map((p) => ({ label: p.name, value: p.id })),
          required: true,
        },
        { name: "unidades", label: "Unidades", type: "number", required: true },
        { name: "monto", label: "Monto", type: "number", required: true },
      ],
    },
  ];
  const provForm = [
    {
      fields: [
        { name: "name", label: "Nombre de la Empresa", required: true },
        { name: "direccion", label: "Dirección", required: true },
        { name: "telefono", label: "Teléfono", required: true },
        { name: "encargado", label: "Encargado" },
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

  const handleNewProveedor = async (formData) => {
    try {
      await createItem("proveedores", formData);
      toast.success("Proveedor creado exitosamente");
      refetchProveedores();
      setProvModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Error al crear proveedor:", err);
      toast.error("Error al crear proveedor");
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
        title={editItem ? "Editar EPP" : "Agregar EPP"}
      >
        <StepForm
          steps={eppFormStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>
      {/* 🧩 Modal para nuevo proveedor */}
      <Modal
        isOpen={isProvModalOpen}
        onClose={() => setProvModalOpen(false)}
        title="Nuevo Proveedor"
      >
        <StepForm
          steps={provForm}
          onSubmit={handleNewProveedor}
          initialValues={{}}
        />
      </Modal>
    </div>
  );
}
