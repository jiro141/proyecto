import React, { useState } from "react";
import Tables from "../../components/Tables";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import useInventario from "../../hooks/useInvetario";
import useDepartamentos from "../../hooks/useDepartamentos";
import { createItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";
import useUbicaciones from "../../hooks/useUbicaciones";
import useLugaresConsumo from "../../hooks/useLugaresConsumo";
const columns = [
  { key: "name", label: "Nombre" },
  { key: "modelo", label: "Modelo" },
  { key: "departamento", label: "Departamento" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
  { key: "consumo", label: "Consumo" },
  { key: "ubicacion", label: "Ubicación" },
];

export default function ConsumiblesLayout() {
  const { data, loading, error, refetch } = useInventario("consumibles");
  const { departamentos, refetch: refetchDepartamentos } = useDepartamentos();
  const { ubicaciones, refetch: refetchUbicaciones } = useUbicaciones();
  const { lugares, refetch: refetchLugares } = useLugaresConsumo();
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeptModalOpen, setDeptModalOpen] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      await createItem("consumibles", formData);
      toast.success("Consumible creado con éxito");
      setModalOpen(false);
      refetch();
    } catch {
      toast.error("Error al crear consumible");
    }
  };

  const handleNewDept = async (formData) => {
    try {
      await createItem("departamento", formData);
      toast.success("Departamento creado");
      refetchDepartamentos();
      setDeptModalOpen(false);
    } catch {
      toast.error("Error al crear departamento");
    }
  };
  const handleAddOrEdit = (item = null) => {
    setEditItem(item); // null para nuevo, objeto para editar
    setModalOpen(true);
  };

  const formSteps = [
    {
      actions: [
        { label: "Nuevo Departamento", onClick: () => setDeptModalOpen(true) },
      ],
      fields: [
        { name: "name", label: "Nombre", required: true },
        { name: "modelo", label: "Modelo", required: true },
        {
          name: "departamento",
          label: "Departamento",
          type: "select",
          options: departamentos.map((d) => ({ label: d.name, value: d.id })),
          required: true,
        },
        {
          name: "ubicacion",
          label: "Ubicación",
          type: "select",
          options: ubicaciones.map((u) => ({ label: u.name, value: u.id })),
          required: true,
        },
        {
          name: "consumo",
          label: "Lugar de Consumo",
          type: "select",
          options: lugares.map((l) => ({ label: l.name, value: l.id })),
          required: true,
        },
        { name: "unidades", label: "Unidades", type: "number", required: true },
        { name: "monto", label: "Monto", type: "number", required: true },
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
        columns={columns}
        data={data || []}
        title="Consumibles"
        refetch={refetch}
        tipo={"consumibles"}
        loading={loading}
        onAdd={handleAddOrEdit}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar Consumible"
      >
        <StepForm
          steps={formSteps}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>

      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Nuevo Departamento"
      >
        <StepForm steps={deptForm} onSubmit={handleNewDept} />
      </Modal>
    </div>
  );
}
