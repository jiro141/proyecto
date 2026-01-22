import React, { useMemo, useState, useEffect } from "react";
import { BounceLoader } from "react-spinners";
import { useLocation } from "react-router-dom";
import { FaSearch, FaSave, FaSyncAlt } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import useDepartamentos from "../hooks/useDepartamentos";
import useUbicaciones from "../hooks/useUbicaciones";
import useLugaresConsumo from "../hooks/useLugaresConsumo";
import useProveedores from "../hooks/useProveedores";
import Modal from "./Modal";
import { deleteItem } from "../api/controllers/Inventario";
import { createItem } from "../api/controllers/Inventario";
import { toast } from "react-toastify";

const Tables = ({
  columns,
  data = [],
  loading,
  title,
  onAdd,
  onSearch,
  tipo,
  refetch,
  taza,
  tazaLoading,
  tazaRefetch,
}) => {
  const location = useLocation();

  const isSubInventario =
    (
      location.pathname === "/clientes/Cuentas");

  const { departamentos = [] } = useDepartamentos();
  const { ubicaciones = [] } = useUbicaciones();
  const { lugares = [] } = useLugaresConsumo();
  const { proveedores = [] } = useProveedores();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [editando, setEditando] = useState(false);
  const [valorTaza, setValorTaza] = useState("");

  useEffect(() => {
    if (taza?.valor !== undefined && taza?.valor !== null) {
      // Convertir el string del backend ("3650.0000") a número real
      setValorTaza(parseFloat(taza.valor));
    }
  }, [taza]);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!onSearch) return;
    const delay = setTimeout(() => onSearch(query), 500);
    return () => clearTimeout(delay);
  }, [query, onSearch]);

  const idToName = useMemo(
    () => ({
      departamento: (id) =>
        departamentos.find((d) => d.id === id)?.name || `ID: ${id}`,
      ubicacion: (id) =>
        ubicaciones.find((u) => u.id === id)?.name || `ID: ${id}`,
      consumo: (id) => lugares.find((l) => l.id === id)?.name || `ID: ${id}`,
      proveedor: (id) =>
        proveedores.find((p) => p.id === id)?.name || `ID: ${id}`,
    }),
    [departamentos, ubicaciones, lugares, proveedores]
  );

  const handleDeleteClick = (id, name) => {
    setSelectedItemId(id);
    setSelectedItemName(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteItem(tipo, selectedItemId);
      refetch && refetch();
    } catch (err) {
      console.error("Error eliminando:", err);
    } finally {
      setDeleteModalOpen(false);
      setSelectedItemId(null);
    }
  };

  const handleGuardar = async () => {
    try {
      // Construir payload según tu API
      const payload = { valor: valorTaza.toString() };

      // Hacer la petición PUT al endpoint /inventario/taza/1/
      await createItem("taza", payload);

      // Refrescar datos en pantalla si el hook lo permite
      if (tazaRefetch) await tazaRefetch();
      if (refetch) await refetch();
      setTimeout(() => setEditando(false), 100);
      // Mostrar éxito visual
      toast.success("Valor de taza actualizado correctamente");

      // Salir del modo edición
      setEditando(false);
    } catch (error) {
      console.error("❌ Error al actualizar la taza:", error);
      toast.error("Error al actualizar el valor de taza");
    }
  };

  const formatDisplayValue = (value, colKey) => {
    // 1️⃣ Resolver ID → texto
    const resolver = idToName[colKey];
    const resolvedValue = resolver ? resolver(value) : value;

    // 2️⃣ Evitar errores de objetos
    if (typeof resolvedValue === "object" && resolvedValue !== null)
      return JSON.stringify(resolvedValue);

    // 3️⃣ Truncar texto largo
    const displayText =
      typeof resolvedValue === "string" && resolvedValue.length > 15
        ? resolvedValue.slice(0, 15) + "..."
        : resolvedValue ?? "—";

    const isMonetaryColumn =
      colKey === "costo" ||
      colKey === "utilidad_15" ||
      (colKey === "mts_ml_m2" && resolvedValue !== null);

    return isMonetaryColumn ? `$${resolvedValue}` : displayText;
  };

  // 👉 Nuevo handler para controlar el click en la celda
  const handleCellClick = (col, row) => {
    const value = row[col.key];

    // Si la columna es "telefono", abrir WhatsApp
    if (col.key === "telefono" && value) {
      const phone = String(value).replace(/\D/g, ""); // limpiar a solo números
      if (!phone) return;

      const url = `https://wa.me/${phone}`;
      window.open(url, "_blank");
      return;
    }

    // De resto, comportamiento normal: abrir modal con onAdd
    if (onAdd) {
      onAdd(row);
    }
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      {/* HEADER */}
      <div className="px-6 py-4 bg-[#0b2c4d] border-b flex justify-between items-center">
        <h2
          className={`text-lg font-semibold text-white ${isSubInventario ? "w-full text-center" : ""
            }`}
        >
          {title}
        </h2>

        {/* CAMPO DE TAZA */}
        {tazaLoading ? (
          <p className="text-gray-300 text-sm">Cargando taza...</p>
        ) : taza ? (
          <div className="flex flex-col gap-2 text-white">
            <div className="flex items-center gap-2">
              <h2 className={`text-m font-semibold text-white `}>Taza:</h2>
              <input
                type="number"
                step="0.0001"
                disabled={!editando}
                value={valorTaza}
                onChange={(e) => setValorTaza(e.target.value)}
                className={`border rounded-lg px-3 py-2 w-28 text-gray-900 ${editando
                  ? "focus:outline-none focus:ring-2 focus:ring-blue-300 border-blue-300"
                  : "bg-gray-100 cursor-not-allowed"
                  }`}
              />
              <h2 className={`text-m font-semibold text-white `}>$</h2>
              {editando ? (
                <button
                  onClick={handleGuardar}
                  className="bg-[#FC3B3C] hover:bg-[#c12c2c] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <FaSave size={14} /> Guardar
                </button>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-[#0B2C4D] hover:bg-[#143d65] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <FaSyncAlt size={14} /> Editar
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* BUSCADOR Y BOTÓN */}
        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="relative">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
              />
            </div>
          )}
          {!isSubInventario && (
            <button
              className="bg-[#e53935] hover:bg-[#c2302d] text-white font-medium py-2 px-4 rounded"
              onClick={() => onAdd && onAdd(null)}
            >
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* TABLA */}
      <table className="w-full text-sm text-left text-gray-900">
        <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-6 py-3">
                {col.label}
              </th>
            ))}
            {!isSubInventario && (
              <th className="px-6 py-3 text-right">Acción</th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (!isSubInventario ? 1 : 0)}
                className="px-6 py-8"
              >
                <div className="flex justify-center items-center w-full h-full">
                  <BounceLoader color="#0b2c4d" size={80} />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (!isSubInventario ? 1 : 0)}
                className="text-center py-6 text-gray-500"
              >
                No hay registros disponibles
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="bg-white border-b hover:bg-gray-50 transition"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    onClick={() => handleCellClick(col, row)}
                    className={`px-6 py-4 text-gray-800 cursor-pointer hover:underline ${colIndex === 0 ? "font-medium whitespace-nowrap" : ""
                      }`}
                  >
                    {formatDisplayValue(row[col.key], col.key)}
                  </td>
                ))}

                {!isSubInventario && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        handleDeleteClick(row.id, row.name || row.descripcion)
                      }
                      className="font-medium text-[#e53935] hover:underline"
                    >
                      <FaRegTrashCan color="#e53935" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* MODAL CONFIRMACIÓN */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de eliminar{" "}
            <span className="font-bold text-red-700">{selectedItemName}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tables;
