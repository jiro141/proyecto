import React, { useState } from "react";
import Tables from "../../components/Tables";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import useInventario from "../../hooks/useInvetario";
import useDepartamentos from "../../hooks/useDepartamentos";
import useUbicaciones from "../../hooks/useUbicaciones";
import useLugaresConsumo from "../../hooks/useLugaresConsumo";
import useProveedores from "../../hooks/useProveedores";
import { createItem, updateItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";

const columns = [
  { key: "codigo", label: "Codigo" },
  { key: "descripcion", label: "Descripcion" },
  { key: "departamento", label: "Departamento" },
  { key: "proveedor", label: "Proveedor" },
  { key: "unidad", label: "Unidades" },
  { key: "costo", label: "Costo" },
  { key: "consumo", label: "Consumo" },
  { key: "ubicacion", label: "Ubicación" },
];

export default function ConsumiblesLayout() {
  const [search, setSearch] = useState("");
  const [searchDept, setSearchDept] = useState(""); // ✅ Mueve esto arriba
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeptModalOpen, setDeptModalOpen] = useState(false);
  const [isProvModalOpen, setProvModalOpen] = useState(false);

  const { data, loading, error, refetch } = useInventario("consumibles", search);
  const { departamentos, loading: loadingDept, refetch: refetchDepartamentos } = useDepartamentos(searchDept);
  const { ubicaciones, refetch: refetchUbicaciones } = useUbicaciones();
  const { lugares, refetch: refetchLugares } = useLugaresConsumo();
  const { proveedores, refetch: refetchProveedores } = useProveedores();

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem("consumibles", editItem.id, formData);
        toast.success("Consumible actualizado con éxito");
      } else {
        await createItem("consumibles", formData);
        toast.success("Consumible creado con éxito");
      }
      setModalOpen(false);
      setEditItem(null);
      refetch();
    } catch (err) {
      console.error("Error al guardar consumible:", err);
      toast.error("Error al guardar consumible");
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
    setEditItem(item);
    setModalOpen(true);
  };

  const formSteps = [
    {
      actions: [
        { label: "Nuevo Departamento", onClick: () => setDeptModalOpen(true) },
        { label: "Nuevo Proveedor", onClick: () => setProvModalOpen(true) },
      ],
      fields: [
        { name: "codigo", label: "Codigo", required: true },
        { name: "descripcion", label: "Descripcion", required: true },
        {
          name: "departamento",
          label: "Departamento",
          type: "select",
          options: departamentos.map((d) => ({ label: d.name, value: d.id })),
          required: true,
          loading: loadingDept,
          // 🔹 cada vez que el usuario escribe, se actualiza el searchTerm
          onSearch: (query) => setSearchDept(query),
        },
        {
          name: "proveedor",
          label: "Proveedor",
          type: "select",
          options: proveedores.map((p) => ({ label: p.name, value: p.id })),
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
        { name: "unidad", label: "Pieza", required: true },
        { name: "costo", label: "Costo", type: "number", required: true },
      ],
    },
  ];

  const deptForm = [
    {
      fields: [{ name: "name", label: "Nombre", required: true }],
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
        onSearch={setSearch}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Editar Consumibles" : "Agregar Consumibles"}
        width="max-w-2xl"
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
          initialValues={editItem || {}}
        />
      </Modal>
    </div>
  );
}
