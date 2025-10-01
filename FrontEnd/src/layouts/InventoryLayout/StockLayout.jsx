import React, { useState } from "react";
import Tables from "../../components/Tables";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import useInventario from "../../hooks/useInvetario";
import useDepartamentos from "../../hooks/useDepartamentos";
import { createItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";
const columns = [
  { key: "name", label: "Nombre" },
  { key: "modelo", label: "Modelo" },
  { key: "departamento", label: "Departamento" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
];

export default function StockLayout() {
  const { data, loading, error, refetch } = useInventario("stock");
  const { departamentos, refetch: refetchDepartamentos } = useDepartamentos();
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeptModalOpen, setDeptModalOpen] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      await createItem("stock", formData);
      toast.success("Stock creado exitosamente");
      setModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el stock");
    }
  };

  const handleNewDept = async (formData) => {
    await createItem("departamentos", formData);
    refetchDepartamentos();
    setDeptModalOpen(false);
    toast.success("Departamento creado exitosamente");
  };
  const handleAddOrEdit = (item = null) => {
    setEditItem(item); // null para nuevo, objeto para editar
    setModalOpen(true);
  };
  const stockFormStep = [
    {
      fields: [
        { name: "name", label: "Nombre", required: true },
        { name: "modelo", label: "Modelo", required: true },
        {
          name: "departamento",
          label: "Departamento",
          type: "select",
          required: true,
          options: departamentos.map((d) => ({ label: d.name, value: d.id })),
        },
        { name: "unidades", label: "Unidades", type: "number", required: true },
        { name: "monto", label: "Monto", type: "number", required: true },
      ],
      actions: [
        {
          label: "Nuevo Departamento",
          onClick: () => setDeptModalOpen(true),
        },
      ],
    },
  ];

  const deptForm = [
    {
      fields: [{ name: "name", label: "Nombre", required: true }],
    },
  ];

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      <Tables
        title="Ferretería industrial"
        columns={columns}
        data={data || []}
        refetch={refetch}
        tipo={"departamentos"}
        loading={loading}
        onAdd={handleAddOrEdit}
      />

      {/* Modal para agregar stock */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar Stock"
      >
        <StepForm
          steps={stockFormStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>

      {/* Modal para nuevo departamento */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Nuevo Departamento"
      >
        <StepForm
          steps={deptForm}
          onSubmit={handleNewDept}
          initialValues={editItem || {}}
        />
      </Modal>
    </div>
  );
}
