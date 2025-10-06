import React, { useEffect, useState } from "react";
import Tables from "../../components/Tables";
import Modal from "../../components/Modal";
import useClientes from "../../hooks/useClientes";
import useReportes from "../../hooks/useReportes";
import useInventario from "../../hooks/useInvetario";
import { createReporte } from "../../api/controllers/Presupuesto";
import {
  getControlConfig,
  createControlConfig,
} from "../../api/controllers/ControlConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CrearPresupuestoLayout() {
  const {
    clientes,
    loading: loadingClientes,
    refetch: refetchClientes,
  } = useClientes();
  const { refetch: refetchReportes } = useReportes();
  const { data: stock, loading: loadingStock } = useInventario("stock");
  const { data: epp, loading: loadingEpp } = useInventario("epp");

  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [numeroControl, setNumeroControl] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [lockModal, setLockModal] = useState(false); // 🚫 Bloquea cierre del modal

// === 1️⃣ Consultar número de control existente ===
useEffect(() => {
  const fetchNumeroControl = async () => {
    try {
      const data = await getControlConfig();

      if (data?.punto_inicio) {
        // ✅ Si existe en backend
        setNumeroControl(data.punto_inicio);
        setModalOpen(false);
        setLockModal(false);
      } else {
        // ⚠️ Si no hay número definido en la base
        setModalOpen(true);
        setLockModal(true);
        toast.warning("No existe un número de control configurado. Ingréselo manualmente.");
      }
    } catch (error) {
      console.error("Error al obtener el número de control:", error);

      // ✅ Detecta el 404 específico del backend ("No existe configuración de reportes.")
      if (error.response && error.response.status === 404) {
        toast.warning("No existe un número de control configurado. Ingréselo manualmente.");
        setModalOpen(true);
        setLockModal(true);
      } else {
        // 🚨 Cualquier otro error (red, backend caído, etc.)
        toast.error("Error al conectar con el servidor. Intente más tarde.");
        setModalOpen(true);
        setLockModal(true);
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  fetchNumeroControl();
}, []);


  const handleAddOrEdit = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleCreateReporte = async () => {
    if (!numeroControl) {
      toast.error("Debe agregar un número de control para continuar.");
      return;
    }
    if (!editItem) {
      toast.error("Debe seleccionar o crear un cliente.");
      return;
    }

    try {
      const payload = {
        n_control: numeroControl,
        cliente: editItem.id,
        lugar: "Sin definir",
        observaciones: "Nuevo presupuesto",
      };
      await createReporte(payload);
      refetchReportes();
      toast.success("Reporte creado correctamente ");
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al crear el reporte ");
    }
  };

  const handleModalClose = () => {
    if (lockModal) {
      toast.warning("No puede cerrar esta ventana sin un número de control.");
      return;
    }
    setModalOpen(false);
  };

  const handleManualControl = async () => {
    if (!numeroControl) {
      toast.error("Debe ingresar un número válido.");
      return;
    }

    try {
      await createControlConfig({ punto_inicio: numeroControl });
      toast.success("Número de control guardado correctamente ");
      setLockModal(false);
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el número de control en el servidor ");
    }
  };

  const columns = [
    { Header: "Nombre", accessor: "nombre" },
    { Header: "RIF", accessor: "rif" },
    { Header: "Encargado", accessor: "encargado" },
    { Header: "Teléfono", accessor: "telefono" },
    { Header: "Correo", accessor: "correo_electronico" },
  ];

  if (loadingConfig) return <p className="p-6">Cargando configuración...</p>;

  return (
    <div className="relative p-6 grid grid-cols-2 gap-6">
      {/* === TOASTIFY CONTAINER === */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      {/* === NÚMERO DE CONTROL EN HEADER === */}
      {numeroControl && (
        <div className="absolute top-4 right-6 bg-blue-100 text-blue-800 px-4 py-1 rounded-lg shadow">
          Control N° {numeroControl}
        </div>
      )}

      {/* === MODAL DE NÚMERO DE CONTROL === */}
      <Modal
        isOpen={isModalOpen && (!numeroControl || lockModal)}
        onClose={handleModalClose}
        title="Asignar Número de Control"
        width="max-w-3xl"
      >
        <div className="p-4">
          <p className="mb-3 text-gray-600">
            {lockModal
              ? "No se pudo crear automáticamente el número de control. Ingréselo manualmente."
              : "Ingrese el número de control manualmente si no se pudo obtener del servidor."}
          </p>

          <input
            type="number"
            className="border p-2 rounded w-full"
            placeholder="Ej: 101"
            value={numeroControl}
            onChange={(e) => setNumeroControl(e.target.value)}
          />

          <div className="flex justify-end mt-4">
            <button
              onClick={handleManualControl}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* === TABLAS === */}
      {/* <Tables
        columns={columns}
        data={clientes || []}
        title="Clientes"
        refetch={refetchClientes}
        loading={loadingClientes}
        onAdd={handleAddOrEdit}
        onSearch={setSearch}
      />

      <Tables
        columns={[
          { Header: "Producto", accessor: "nombre" },
          { Header: "Cantidad", accessor: "cantidad" },
          { Header: "Unidad", accessor: "unidad" },
        ]}
        data={stock || []}
        title="Stock Almacén"
        loading={loadingStock}
      />

      <Tables
        columns={[
          { Header: "Elemento", accessor: "nombre" },
          { Header: "Categoría", accessor: "categoria" },
          { Header: "Cantidad", accessor: "cantidad" },
        ]}
        data={epp || []}
        title="Equipos de Protección Personal"
        loading={loadingEpp}
      /> */}
    </div>
  );
}
