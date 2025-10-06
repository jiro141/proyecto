import React, { useState } from "react";
import Tables from "../../components/Tables";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import useInventario from "../../hooks/useInvetario";
import useDepartamentos from "../../hooks/useDepartamentos";
import useProveedores from "../../hooks/useProveedores";
import { createItem } from "../../api/controllers/Inventario";
import { updateItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";
const columns = [
  { key: "name", label: "Nombre" },
  { key: "modelo", label: "Modelo" },
  { key: "departamento", label: "Departamento" },
  { key: "proveedor", label: "Proveedor" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
];

export default function StockLayout() {
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useInventario("stock", search);
  const { departamentos, refetch: refetchDepartamentos } = useDepartamentos();
  const { proveedores, refetch: refetchProveedores } = useProveedores();
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeptModalOpen, setDeptModalOpen] = useState(false);
  const [isProvModalOpen, setProvModalOpen] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem("stock", editItem.id, formData);
        toast.success("Stock actualizado exitosamente");
      } else {
        await createItem("stock", formData);
        toast.success("Stock creado exitosamente");
      }
      setModalOpen(false);
      setEditItem(null);
      refetch();
    } catch (err) {
      console.error("Error al guardar stock:", err);
      toast.error("Error al guardar stock");
    }
  };

  const handleNewDept = async (formData) => {
    await createItem("departamentos", formData);
    refetchDepartamentos();
    setDeptModalOpen(false);
    toast.success("Departamento creado exitosamente");
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
  const stockFormStep = [
    {
      fields: [
        { name: "name", label: "Nombre", required: true },
        { name: "modelo", label: "Modelo", required: true },
        {
          name: "proveedor",
          label: "Proveedor",
          type: "select",
          options: proveedores.map((p) => ({ label: p.name, value: p.id })),
          required: true,
        },
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
        { label: "Nuevo Proveedor", onClick: () => setProvModalOpen(true) },
      ],
    },
  ];
  const provForm = [
    {
      fields: [
        { name: "name", label: "Nombre", required: true },
        { name: "direccion", label: "Dirección", required: true },
        { name: "telefono", label: "Teléfono", required: true },
        { name: "encargado", label: "Encargado" },
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
        onSearch={setSearch}
      />

      {/* Modal para agregar stock */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editItem
            ? "Editar Ferretería industrial"
            : "Agregar Ferretería industrial"
        }
        width="max-w-2xl"
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
