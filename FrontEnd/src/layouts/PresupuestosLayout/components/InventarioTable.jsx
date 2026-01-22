import { FaTools, FaHammer, FaBoxOpen } from "react-icons/fa";
import { FaHelmetSafety } from "react-icons/fa6";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import Modal from "../../../components/Modal";
import StepForm from "../../../components/StepForm";
import { createItem, updateItem } from "../../../api/controllers/Inventario";
import { toast } from "react-toastify";
import useDepartamentos from "../../../hooks/useDepartamentos";
import useUbicaciones from "../../../hooks/useUbicaciones";
import useLugaresConsumo from "../../../hooks/useLugaresConsumo";
import useProveedores from "../../../hooks/useProveedores";
import React, { useMemo, useState } from "react";
import { useInventarioTableLogic } from "../hooks/useInventarioTableLogic";

export default function InventarioTable(props) {
  const { externalData, tipo, ubicaciones, lugares } = props;

  // === HOOK DEPARTAMENTOS Y PROVEEDORES ===
  const { departamentos, refetch: refetchDepartamentos } = useDepartamentos();
  const { proveedores, refetch: refetchProveedores } = useProveedores();

  // === LÓGICA CENTRAL DE INVENTARIO ===
  const logic = useInventarioTableLogic({
    tipo,
    externalData,
    departamentos,
    proveedores,
    ubicaciones,
    lugares,
    onCantidadChange: props.onCantidadChange,
    onTotalChange: props.onTotalChange,
    refetchDepartamentos,
    refetchProveedores,
  });

  // === ESTADOS DE MODALES ===
  const [editItem, setEditItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeptModalOpen, setDeptModalOpen] = useState(false);
  const [isProvModalOpen, setProvModalOpen] = useState(false);

  const tituloMap = {
    stock: "Ferretería",
    EPP: "E.P.P.",
    consumibles: "Consumible",
  };

  // === OPCIONES MEMOIZADAS ===
  const proveedorOptions = useMemo(
    () => proveedores?.map((p) => ({ label: p.name, value: p.id })) || [],
    [proveedores]
  );
  const deptOptions = useMemo(
    () => departamentos?.map((d) => ({ label: d.name, value: d.id })) || [],
    [departamentos]
  );
  const ubicacionOptions = useMemo(
    () => ubicaciones?.map((u) => ({ label: u.name, value: u.id })) || [],
    [ubicaciones]
  );
  const lugarOptions = useMemo(
    () => lugares?.map((l) => ({ label: l.name, value: l.id })) || [],
    [lugares]
  );

  // === FORMULARIOS ===
  const formStep =
    tipo === "stock"
      ? [
        {
          columns: 3,
          fields: [
            { name: "codigo", label: "Código", required: true },
            { name: "descripcion", label: "Descripción", required: true },

            // 🔹 Proveedor (buscable y cargado desde API)
            {
              name: "proveedor",
              label: "Proveedor",
              type: "select",
              required: true,
              fetchOnSearch: true,
              fetchHook: useProveedores,
              hookKey: "proveedores",
            },

            // 🔹 Departamento (buscable desde API)
            {
              name: "departamento",
              label: "Departamento",
              type: "select",
              required: true,
              fetchOnSearch: true,
              fetchHook: useDepartamentos,
              hookKey: "departamentos",
            },

            { name: "pza", label: "Pieza", required: true },
            { name: "costo_dolares", label: "Costo en dólares" },
            { name: "costo_pesos", label: "Costo en pesos" },
            { name: "envio", label: "Envío o Flete" },
            {
              name: "factor_conversion",
              label: "Relación MTS ML M2",
            },
            {
              name: "costo",
              label: "Costo",
              type: "number",
              disabled: true,
            },
            {
              name: "utilidad_15",
              label: "%15 de Utilidad",
              type: "number",
              disabled: true,
            },
            { name: "mts_ml_m2", label: "MTS ML M2", disabled: true },
          ],
          actions: [
            {
              label: "Nuevo Departamento",
              onClick: () => setDeptModalOpen(true),
            },
            {
              label: "Nuevo Proveedor",
              onClick: () => setProvModalOpen(true),
            },
          ],
        },
      ]
      : [
        {
          actions: [
            {
              label: "Nuevo Departamento",
              onClick: () => setDeptModalOpen(true),
            },
            {
              label: "Nuevo Proveedor",
              onClick: () => setProvModalOpen(true),
            },
          ],
          fields: [
            { name: "codigo", label: "Código", required: true },
            { name: "descripcion", label: "Descripción", required: true },

            // 🔹 Departamento (API + búsqueda)
            {
              name: "departamento",
              label: "Departamento",
              type: "select",
              required: true,
              fetchOnSearch: true,
              fetchHook: useDepartamentos,
              hookKey: "departamentos",
            },

            // 🔹 Proveedor (API + búsqueda)
            {
              name: "proveedor",
              label: "Proveedor",
              type: "select",
              required: true,
              fetchOnSearch: true,
              fetchHook: useProveedores,
              hookKey: "proveedores",
            },

            // 🔹 Ubicación (API)
            {
              name: "ubicacion",
              label: "Ubicación",
              type: "select",
              required: true,
              fetchHook: useUbicaciones,
              hookKey: "ubicaciones",
            },

            // 🔹 Lugar de Consumo (API)
            {
              name: "consumo",
              label: "Lugar de Consumo",
              type: "select",
              required: true,
              fetchHook: useLugaresConsumo,
              hookKey: "lugares",
            },

            { name: "unidad", label: "Pieza", required: true },
            {
              name: "costo",
              label: "Costo",
              type: "number",
              required: true,
            },
          ],
        },
      ];

  // === CRUD ===
  const handleSubmit = async (formData) => {
    try {
      if (editItem && editItem.id) {
        await updateItem(tipo, editItem.id, formData);
        toast.success(`${tituloMap[tipo]} actualizado exitosamente`);
      } else {
        await createItem(tipo, formData);
        toast.success(`${tituloMap[tipo]} creado exitosamente`);
      }
      setModalOpen(false);
      setEditItem(null);
      logic.refetch();
    } catch (err) {
      console.error(`Error al guardar ${tituloMap[tipo]}:`, err);
      toast.error(`Error al guardar ${tituloMap[tipo]}`);
    }
  };

  const handleNewDept = async (formData) => {
    try {
      await createItem("departamentos", formData);
      toast.success("Departamento creado exitosamente");
      refetchDepartamentos();
      setDeptModalOpen(false);
    } catch (err) {
      toast.error("Error al crear departamento");
      console.error(err);
    }
  };

  const handleNewProveedor = async (formData) => {
    try {
      await createItem("proveedores", formData);
      toast.success("Proveedor creado exitosamente");
      refetchProveedores();
      setProvModalOpen(false);
    } catch (err) {
      toast.error("Error al crear proveedor");
      console.error(err);
    }
  };

  const handleAddOrEdit = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };

  // === RENDER ===
  return (
    <>
      <div className="relative flex flex-col h-full">
        <TableHeader query={logic.query} setQuery={logic.setQuery} />

        {logic.loading ? (
          <p className="text-center py-6 text-gray-500">Cargando...</p>
        ) : logic.error ? (
          <p className="text-center py-6 text-red-500">Error al cargar datos</p>
        ) : (
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            <table className="w-full text-left border-collapse min-w-[520px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="pb-2 px-2">Descripción</th>
                  <th className="pb-2 px-2">Unidad</th>
                  <th className="pb-2 px-2 text-center">Cantidad</th>
                  <th className="pb-2 px-2 text-center">Desp</th>
                  {tipo !== "EPP" && (
                    <th className="pb-2 px-2 text-center">Precio Unitario</th>
                  )}
                  <th className="pb-2 px-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {logic.data?.length ? (
                  logic.data.map((item) => (
                    <TableRow
                      key={item.id}
                      item={item}
                      tipo={tipo}
                      cantidad={logic.cantidades[item.id] || 0}
                      desp={logic.depreciaciones[item.id] || 0}
                      onCantidadChange={logic.handleCantidadChange}
                      onDepreciacionChange={logic.handleDepreciacionChange}
                      onDescripcionClick={() => handleAddOrEdit(item)} // ✏️ editar con modal nuevo
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tipo !== "EPP" ? "6" : "5"}
                      className="text-center py-4 text-gray-500 italic"
                    >
                      No hay productos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleAddOrEdit(null)} // 🆕 crear
            className="px-4 py-2 bg-[#0B2C4D] text-white rounded-lg hover:bg-[#15385C] transition"
          >
            + Agregar {tituloMap[tipo] ?? "Item"}
          </button>
        </div>
      </div>

      {/* === MODALES === */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        title={
          editItem
            ? `Editar ${tituloMap[tipo] ?? "Item"}`
            : `Agregar ${tituloMap[tipo] ?? "Item"}`
        }
        width="max-w-2xl"
      >
        <StepForm
          key={editItem ? `edit-${editItem.id}` : "new"}
          steps={formStep}
          onSubmit={handleSubmit}
          initialValues={editItem || {}}
        />
      </Modal>

      {/* === MODAL DEPARTAMENTO === */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Nuevo Departamento"
      >
        <StepForm
          steps={[
            {
              fields: [{ name: "name", label: "Nombre del Departamento", required: true }],
            },
          ]}
          onSubmit={handleNewDept}
          initialValues={{}}
        />
      </Modal>

      {/* === MODAL PROVEEDOR === */}
      <Modal
        isOpen={isProvModalOpen}
        onClose={() => setProvModalOpen(false)}
        title="Nuevo Proveedor"
      >
        <StepForm
          steps={[
            {
              fields: [
                { name: "name", label: "Nombre", required: true },
                { name: "direccion", label: "Dirección", required: true },
                { name: "telefono", label: "Teléfono", required: true },
                { name: "encargado", label: "Encargado" },
              ],
            },
          ]}
          onSubmit={handleNewProveedor}
          initialValues={{}}
        />
      </Modal>
    </>
  );
}
