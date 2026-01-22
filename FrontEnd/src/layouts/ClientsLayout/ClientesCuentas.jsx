import React, { useState } from "react";
import Modal from "../../components/Modal";
import StepForm from "../../components/StepForm";
import Tables from "../../components/Tables";
import { createCliente, updateCliente } from "../../api/controllers/Clientes";
import { createItem } from "../../api/controllers/Inventario";
import { toast } from "react-toastify";
import useClientes from "../../hooks/useClientes";

const columns = [
  { key: "nombre", label: "Nombre de la Empresa" },
  { key: "rif", label: "R.I.F" },
  { key: "encargado", label: "Encargado" },
  //   { key: "telefono", label: "Teléfono" },
  //   { key: "direccion", label: "Dirección" },
  //   { key: "correo_electronico", label: "Correo Electronico" },
];

export default function ClientesCuentas() {
  const [search, setSearch] = useState("");
  const { clientes, loading, error, refetch } = useClientes(search);
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);


  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateCliente(editItem.id, formData);
        toast.success("Cliente actualizado con éxito");
      } else {
        // 🧱 1️⃣ Crear el cliente
        const newCliente = await createCliente(formData);

        // 🗺️ 2️⃣ Crear la ubicación (solo requiere name)
        const ubicacionPayload = {
          name: `${formData.direccion}, Cliente ${formData.nombre}`,
        };
        await createItem("ubicaciones", ubicacionPayload);

        // 📍 3️⃣ Crear el lugar (solo requiere name)
        const lugarPayload = {
          name: `${formData.direccion}, Cliente ${formData.nombre}`,
        };
        await createItem("lugares", lugarPayload);

        toast.success("Cliente, ubicación y lugar creados con éxito");
      }

      refetch();
      setModalOpen(false);
      setEditItem(null);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar Cliente");
    }
  };

  const handleAddOrEdit = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const formSteps = [
    {
      fields: [
        { name: "nombre", label: "Nombre de la Empresa", required: true },
        { name: "rif", label: "R.I.F", required: true },
        { name: "encargado", label: "Encargado", required: true },
        { name: "telefono", label: "Teléfono", required: true },
        { name: "direccion", label: "Dirección", required: true },
        {
          name: "correo_electronico",
          label: "Correo Electrónico",
          required: true,
        },
      ],
    },
  ];

  if (error)
    return <div className="p-4 text-red-600">Error al cargar datos</div>;

  return (
    <div className="p-4">
      <Tables
        columns={columns}
        data={clientes || []}
        title="Clientes"
        refetch={refetch}
        loading={loading}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
      />
      {/* 🧩 Modal solo para editar cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem?.nombre}
        width={`${"max-w-3xl"}`}
      >
        <div className={`${"flex flex-col gap-4"}`}>
          {/* 🧾 Formulario principal */}
          <div className="w-full">
            <StepForm
              steps={formSteps}
              onSubmit={handleSubmit}
              initialValues={editItem || {}}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
