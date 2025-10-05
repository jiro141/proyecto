import React, { useMemo, useState, useEffect } from "react";
import { BounceLoader } from "react-spinners";
import { useLocation } from "react-router-dom";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import useDepartamentos from "../hooks/useDepartamentos";
import useUbicaciones from "../hooks/useUbicaciones";
import useLugaresConsumo from "../hooks/useLugaresConsumo";
import Modal from "./Modal";
import { deleteItem } from "../api/controllers/Inventario";

const Tables = ({
  columns,
  data,
  loading,
  title,
  onAdd,
  onSearch,
  tipo,
  refetch,
  
}) => {
  const location = useLocation();
  const isSubInventario =
    (location.pathname.startsWith("/inventario/") &&
      location.pathname !== "/inventario") ||
    location.pathname === "/Proveedores";

  const { departamentos } = useDepartamentos();
  const { ubicaciones } = useUbicaciones();
  const { lugares } = useLugaresConsumo();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState("");

  // 🔎 Estado del buscador
  const [query, setQuery] = useState("");

  // 🔎 Debounce para onSearch
  useEffect(() => {
    if (!onSearch) return;
    const delay = setTimeout(() => {
      onSearch(query);
    }, 500); // medio segundo
    return () => clearTimeout(delay);
  }, [query, onSearch]);

  const idToName = useMemo(() => {
    return {
      departamento: (id) =>
        departamentos.find((d) => d.id === id)?.name || `ID: ${id}`,
      ubicacion: (id) =>
        ubicaciones.find((u) => u.id === id)?.name || `ID: ${id}`,
      consumo: (id) => lugares.find((l) => l.id === id)?.name || `ID: ${id}`,
    };
  }, [departamentos, ubicaciones, lugares]);

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

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 bg-[#0b2c4d] border-b flex justify-between items-center">
        <h2
          className={`text-lg font-semibold text-white ${
            !isSubInventario ? "w-full text-center" : ""
          }`}
        >
          {title}
        </h2>

        <div className="flex items-center gap-3">
          {/* 🔎 Buscador (opcional) */}
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
                className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fff] text-black"
              />
            </div>
          )}

          {/* Botón Agregar */}
          {isSubInventario && (
            <button
              className="bg-[#e53935] hover:bg-[#c2302d] text-white font-medium py-2 px-4 rounded"
              onClick={() => onAdd && onAdd(null)}
            >
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <table className="w-full text-sm text-left text-gray-200 dark:text-gray-200 ">
        <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-6 py-3">
                {col.label}
              </th>
            ))}
            {isSubInventario && (
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Acción</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (isSubInventario ? 1 : 0)}
                className="px-6 py-8"
              >
                <div className="flex justify-center items-center w-full h-full">
                  <BounceLoader color="#0b2c4d" size={80} />
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="bg-white border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-200"
              >
                {columns.map((col, colIndex) => {
                  const value = row[col.key];
                  const resolver = idToName[col.key];
                  const displayValue = resolver ? resolver(value) : value;

                  return (
                    <td
                      key={col.key}
                      onClick={() => onAdd && onAdd(row)}
                      className={`px-6 py-4 text-gray-900 cursor-pointer hover:underline ${
                        colIndex === 0 ? "font-medium whitespace-nowrap" : ""
                      }`}
                    >
                      {displayValue}
                    </td>
                  );
                })}
                {isSubInventario && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteClick(row.id, row.name)}
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

      {/* Modal de confirmación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que deseas eliminar{" "}
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
