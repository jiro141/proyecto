import React, { useState } from "react";
import Tables from "../components/Tables";
import Modal from "../components/Modal";
import StepForm from "../components/StepForm";
import { createItem, updateItem } from "../api/controllers/Inventario";
import { toast } from "react-toastify";
import useProveedores from "../hooks/useProveedores";

const columns = [
  { key: "name", label: "Nombre" },
  { key: "direccion", label: "Dirección" },
  { key: "telefono", label: "Teléfono" },
  { key: "encargado", label: "Encargado" },
];

const eppColumns = [
  { key: "name", label: "Nombre" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
];

const stockColumns = [
  { key: "name", label: "Nombre" },
  { key: "modelo", label: "Modelo" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
];

const consumibleColumns = [
  { key: "name", label: "Nombre" },
  { key: "modelo", label: "Modelo" },
  { key: "unidades", label: "Unidades" },
  { key: "monto", label: "Monto" },
];

export default function ProveedoresHome() {
  const [search, setSearch] = useState("");
  const { proveedores, loading, error, refetch } = useProveedores(search);
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem("proveedores", editItem.id, formData);
        toast.success("Proveedor actualizado con éxito");
      } else {
        await createItem("proveedores", formData);
        toast.success("Proveedor creado con éxito");
      }
      setModalOpen(false);
      setEditItem(null);
      refetch();
    } catch (err) {
      console.error("Error al guardar proveedor:", err);
      toast.error("Error al guardar proveedor");
    }
  };

  const handleAddOrEdit = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const formSteps = [
    {
      fields: [
        { name: "name", label: "Nombre", required: true },
        { name: "direccion", label: "Dirección", required: true },
        { name: "telefono", label: "Teléfono", required: true },
        { name: "encargado", label: "Encargado", required: true },
      ],
    },
  ];

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      {/* Tabla de proveedores */}
      <Tables
        columns={columns}
        data={proveedores || []}
        title="Proveedores"
        refetch={refetch}
        tipo="proveedores"
        loading={loading}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
      />

      {/* Modal de agregar/editar proveedor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Editar Proveedor" : "Agregar Proveedor"}
        width="max-w-5xl"
      >
        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Formulario */}
          <div>
            <StepForm
              steps={formSteps}
              onSubmit={handleSubmit}
              initialValues={editItem || {}}
            />
          </div>

          {/* Columna Derecha: Tablas de artículos */}
          {editItem && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {editItem.epps?.length > 0 && (
                <Tables
                  columns={eppColumns}
                  data={editItem.epps}
                  title="Equipos de Protección Personal (EPPs)"
                  tipo="epps"
                />
              )}

              {editItem.stocks?.length > 0 && (
                <Tables
                  columns={stockColumns}
                  data={editItem.stocks}
                  title="Ferreteria "
                  tipo="stocks"
                />
              )}

              {editItem.consumibles?.length > 0 && (
                <Tables
                  columns={consumibleColumns}
                  data={editItem.consumibles}
                  title="Consumibles "
                  tipo="consumibles"
                />
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
